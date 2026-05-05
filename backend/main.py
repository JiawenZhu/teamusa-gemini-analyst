"""
main.py — TeamUSA Digital Mirror API

Endpoints:
  GET  /api/stats          — real dataset stats
  GET  /api/archetypes     — all 6 archetypes with cluster stats
  POST /api/match          — instant biometric match (K-means)
  GET  /api/timeline       — scatter data for visualization
  POST /api/chat           — Gemini chat, full JSON (rate-limited)
  POST /api/chat-stream    — SSE progressive stream with inline Gemini TTS audio
  POST /api/tts            — Gemini TTS synthesis endpoint
  GET  /health
"""
import os, json, asyncio, re, math, httpx
from contextlib import asynccontextmanager
from fastapi import FastAPI, HTTPException, Request, WebSocket, WebSocketDisconnect
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse, StreamingResponse
from pydantic import BaseModel, Field
from dotenv import load_dotenv
from slowapi import Limiter, _rate_limit_exceeded_handler
from slowapi.util import get_remote_address
from slowapi.errors import RateLimitExceeded

from data.public_data import load_data, get_dataset_stats, get_all_archetypes, match_biometrics, get_timeline_data, match_para_biometrics, get_para_archetypes
from db import api_routes, public_api
from agents.olympic_agent import ask_gemini
from agents.gemini_tts import synthesize_text_to_wav_b64, synthesize_sentence_to_wav_b64

load_dotenv()


@asynccontextmanager
async def lifespan(app: FastAPI):
    # Download + cluster the real Olympic data on startup
    await asyncio.to_thread(load_data)
    yield


# ── Rate Limiter ───────────────────────────────────────────────────────────────
# Cloud Run sits behind a Google load balancer — the real client IP is in
# X-Forwarded-For. We read that header first before falling back to direct IP.
def get_client_ip(request: Request) -> str:
    forwarded_for = request.headers.get("X-Forwarded-For")
    if forwarded_for:
        return forwarded_for.split(",")[0].strip()
    return get_remote_address(request)


limiter = Limiter(key_func=get_client_ip)

app = FastAPI(title="TeamUSA Digital Mirror API", version="3.0.0", lifespan=lifespan)

# Register slowapi's 429 handler so we return clean JSON instead of a 500 error
app.state.limiter = limiter
app.add_exception_handler(RateLimitExceeded, _rate_limit_exceeded_handler)


# ── CORS — locked to our Firebase Hosting origins only ────────────────────────
ALLOWED_ORIGINS = [
    "https://teamusa-8b1ba.web.app",
    "https://teamusa-8b1ba.firebaseapp.com",
    "https://teamusa-oracle-frontend-789615763226.us-central1.run.app",
    # Local development
    "http://localhost:3000",
    "http://127.0.0.1:3000",
]

app.add_middleware(
    CORSMiddleware,
    allow_origins=ALLOWED_ORIGINS,
    allow_methods=["GET", "POST"],
    allow_headers=["Content-Type"],
)

app.include_router(api_routes.router)
app.include_router(public_api.router)


# ── Models ────────────────────────────────────────────────────────────────────

class MatchRequest(BaseModel):
    height_cm: float = Field(..., ge=120, le=230)
    weight_kg: float = Field(..., ge=30,  le=200)
    age: int | None  = Field(None, ge=10, le=80)
    mode: str = "olympic"  # "olympic" | "paralympic"

class LocationRequest(BaseModel):
    city_name: str
    session_id: str | None = None


class ChatMessage(BaseModel):
    role: str
    text: str


class ChatRequest(BaseModel):
    message:      str
    archetype_id: str
    history: list[ChatMessage] = []


# ── Routes ────────────────────────────────────────────────────────────────────

@app.get("/health")
def health():
    return {"status": "ok"}


@app.get("/api/stats")
def stats():
    """Real dataset statistics — athlete count, years, medals, sports."""
    return get_dataset_stats()


@app.get("/api/archetypes")
def archetypes():
    """All 6 archetypes with full cluster stats from the real dataset."""
    return {"archetypes": get_all_archetypes()}


@app.post("/api/match")
def match(req: MatchRequest):
    """Instant biometric matching — routes to Olympic or Paralympic K-means model."""
    if req.mode == "paralympic":
        return match_para_biometrics(req.height_cm, req.weight_kg, req.age)
    return match_biometrics(req.height_cm, req.weight_kg, req.age)


@app.get("/api/para-archetypes")
def para_archetypes():
    """All 6 Paralympic archetypes with cluster stats."""
    return {"archetypes": get_para_archetypes()}


class ParaClassificationRequest(BaseModel):
    archetype_id: str          # e.g. "para_sprinter"
    sport: str = ""            # optional — narrow to a specific sport
    user_height_cm: float = 0  # optional biometrics for personalisation
    user_weight_kg: float = 0


@app.post("/api/para-classification-explainer")
async def para_classification_explainer(req: ParaClassificationRequest):
    """
    Gemini-powered deep-dive into the IPC classification system for a given
    Paralympic archetype and optional sport.  Returns structured markdown.
    """
    from google import genai
    from data.public_data import get_para_archetypes, PARALYMPIC_PROFILES

    archetypes = {a["id"]: a for a in get_para_archetypes()}
    arch = archetypes.get(req.archetype_id, {})
    if not arch:
        profile = next((p for p in PARALYMPIC_PROFILES if p["id"] == req.archetype_id), {})
        arch = profile

    sport_focus = f"with a specific focus on **{req.sport}**" if req.sport else ""
    biometric_note = (
        f"The user has provided their biometrics: {req.user_height_cm} cm / {req.user_weight_kg} kg. "
        "Map these to likely functional class ranges where relevant."
        if req.user_height_cm > 0 else ""
    )

    prompt = f"""You are an expert IPC classification educator. The user is exploring the {arch.get('label', req.archetype_id)} Paralympic archetype.

DISCLAIMER (include briefly at the start of your response): This is educational analysis based on publicly documented IPC classification guidelines. It is not official IPC classification, medical assessment, or performance prediction for any specific individual.

DATA NOTE: All Team USA statistics refer to the 1896-2016 public historical Olympic dataset (Kaggle). Do not reference post-2016 results.

{biometric_note}

Write a structured explainer covering ALL of the following sections.
Do NOT use markdown headers (no ##, ###) or bold markers (**). Use plain section labels followed by a colon and a line break instead.
Do NOT name or profile any specific athlete. Refer only to aggregate Team USA performance trends, sport eras, and anonymized historical patterns.

Section 1 - Classification System Overview:
- Explain the IPC functional classification system (impairment types: physical, visual, intellectual)
- Clarify the difference between T (track), F (field), S/SB/SM (swimming), B (boccia), WH (wheelchair fencing) class codes
- Give 2-3 concrete class code examples with what they mean (e.g., T54 = full arm/trunk function, wheelchair; T44 = leg impairment, ambulatory)

Section 2 - Classes for This Archetype:
- List the most relevant IPC class codes for the {arch.get('label', '')} archetype (e.g., {', '.join(arch.get('paralympic_sports', [])[:4])})
- Explain what functional capabilities define each class
- Describe how classification is assessed (medical evaluation, technical observation)

Section 3 - Biometric and Performance Profile:
- Typical height/weight ranges that have historically performed well in this archetype
- How the physical profile described as {arch.get('description', '')} translates into competitive advantage at the Paralympic level
- Compare aggregate average biometrics to Olympic counterparts in similar disciplines

Section 4 - Team USA Legacy in This Archetype:
- Describe 2-3 historical eras or milestones where Team USA performed strongly in this archetype (e.g., Atlanta 1996, Athens 2004, Tokyo 2020)
- Reference aggregate medal count trends across eras
- Do NOT name any specific individual athlete

Section 5 - Training and Functional Demands:
- Key physical attributes required
- How classification rules shape training strategy (what is allowed, what is restricted)
- Equipment adaptations (racing chair specs, prosthetic rules, etc.)

Keep the tone expert but accessible. Be specific with class codes, medal count trends, and year ranges.
"""

    try:
        client = genai.Client(vertexai=True, project="teamusa-8b1ba", location="global")
        response = client.models.generate_content(
            model="gemini-3.1-flash-lite-preview",
            contents=prompt,
        )
        return {"explainer": response.text, "archetype": arch}
    except Exception as e:
        print("Gemini error in para-classification-explainer:", e)
        # Fallback: return structured static content
        return {
            "explainer": f"## {arch.get('label', 'Paralympic Archetype')}\n\n{arch.get('description', '')}\n\n**Classification systems** are determined by the IPC based on functional impairment. Sports like Para Athletics use T/F codes (T = track, F = field) with numbers indicating the class (e.g., T53 = minimal trunk function, wheelchair; T44 = leg impairment, ambulatory).\n\nFor {', '.join(arch.get('paralympic_sports', [])[:3])}, athletes are evaluated by trained classifiers before competition.",
            "archetype": arch,
        }




@app.get("/api/timeline")
def timeline():
    """600-point sample of real athlete data for the scatter visualization."""
    return {"athletes": get_timeline_data()}


# ── Olympic host cities with medal counts ─────────────────────────────────────
# Pre-geocoded coordinates for all Olympic host cities (avoids Nominatim latency)
_OLYMPIC_CITY_COORDS: dict[str, dict] = {
    "Athens":          {"lat": 37.9838,  "lng": 23.7275},
    "Paris":           {"lat": 48.8566,  "lng": 2.3522},
    "St. Louis":       {"lat": 38.6270,  "lng": -90.1994},
    "London":          {"lat": 51.5074,  "lng": -0.1278},
    "Stockholm":       {"lat": 59.3293,  "lng": 18.0686},
    "Antwerp":         {"lat": 51.2194,  "lng": 4.4025},
    "Amsterdam":       {"lat": 52.3676,  "lng": 4.9041},
    "Los Angeles":     {"lat": 34.0522,  "lng": -118.2437},
    "Berlin":          {"lat": 52.5200,  "lng": 13.4050},
    "Helsinki":        {"lat": 60.1699,  "lng": 24.9384},
    "Melbourne":       {"lat": -37.8136, "lng": 144.9631},
    "Rome":            {"lat": 41.9028,  "lng": 12.4964},
    "Tokyo":           {"lat": 35.6762,  "lng": 139.6503},
    "Mexico City":     {"lat": 19.4326,  "lng": -99.1332},
    "Munich":          {"lat": 48.1351,  "lng": 11.5820},
    "Montreal":        {"lat": 45.5017,  "lng": -73.5673},
    "Moscow":          {"lat": 55.7558,  "lng": 37.6173},
    "Seoul":           {"lat": 37.5665,  "lng": 126.9780},
    "Barcelona":       {"lat": 41.3851,  "lng": 2.1734},
    "Atlanta":         {"lat": 33.7490,  "lng": -84.3880},
    "Sydney":          {"lat": -33.8688, "lng": 151.2093},
    "Beijing":         {"lat": 39.9042,  "lng": 116.4074},
    "Rio de Janeiro":  {"lat": -22.9068, "lng": -43.1729},
    "Sarajevo":        {"lat": 43.8563,  "lng": 18.4131},
    "Calgary":         {"lat": 51.0447,  "lng": -114.0719},
    "Albertville":     {"lat": 45.6756,  "lng": 6.3921},
    "Lillehammer":     {"lat": 61.1151,  "lng": 10.4662},
    "Nagano":          {"lat": 36.6513,  "lng": 138.1810},
    "Salt Lake City":  {"lat": 40.7608,  "lng": -111.8910},
    "Turin":           {"lat": 45.0703,  "lng": 7.6869},
    "Vancouver":       {"lat": 49.2827,  "lng": -123.1207},
    "Sochi":           {"lat": 43.5855,  "lng": 39.7231},
}

@app.get("/api/olympic-cities")
def olympic_cities():
    """All Olympic host cities with USA medal counts (from DB) and coordinates."""
    from db.queries import execute_dynamic_query
    sql = """
        SELECT city, year, season,
               COUNT(CASE WHEN noc='USA' AND medal IS NOT NULL THEN 1 END) as usa_medals,
               COUNT(CASE WHEN medal IS NOT NULL THEN 1 END) as total_medals
        FROM v_results_full
        GROUP BY city, year, season
        ORDER BY year ASC
    """
    rows = execute_dynamic_query(sql)
    if isinstance(rows, dict) and "error" in rows:
        return {"cities": []}

    result = []
    seen: dict[str, dict] = {}
    for row in rows:
        city = row.get("city", "")
        coords = _OLYMPIC_CITY_COORDS.get(city)
        if not coords:
            continue
        if city not in seen:
            seen[city] = {
                "city": city,
                "lat": coords["lat"],
                "lng": coords["lng"],
                "years": [],
                "usa_medals": 0,
                "total_medals": 0,
                "season": row.get("season", "Summer"),
            }
        seen[city]["years"].append(int(row["year"]))
        seen[city]["usa_medals"] += int(row.get("usa_medals") or 0)
        seen[city]["total_medals"] += int(row.get("total_medals") or 0)

    result = sorted(seen.values(), key=lambda x: min(x["years"]))
    return {"cities": result}



@app.post("/api/location")
async def register_location(req: LocationRequest):
    """Geocode a city, calculate distance to LA, and save to DB."""
    # 1. Geocode with Nominatim (OpenStreetMap) for zero-setup ease
    async with httpx.AsyncClient() as client:
        res = await client.get(
            "https://nominatim.openstreetmap.org/search",
            params={"q": req.city_name, "format": "json", "limit": 1},
            headers={"User-Agent": "TeamUSA-Oracle/3.0"}
        )
        data = res.json()
    
    if not data:
        raise HTTPException(status_code=404, detail="City not found. Please try a different city name.")
        
    lat = float(data[0]["lat"])
    lng = float(data[0]["lon"])
    name = data[0]["display_name"].split(',')[0] # Get the first part of the name
    
    # 2. Haversine distance to LA (34.0522, -118.2437)
    la_lat, la_lng = 34.0522, -118.2437
    r = 6371 # Earth radius in km
    dlat = math.radians(la_lat - lat)
    dlng = math.radians(la_lng - lng)
    a = math.sin(dlat/2)**2 + math.cos(math.radians(lat)) * math.cos(math.radians(la_lat)) * math.sin(dlng/2)**2
    c = 2 * math.atan2(math.sqrt(a), math.sqrt(1-a))
    distance_km = int(r * c)
    distance_miles = int(distance_km * 0.621371)
    
    # 3. Save to database
    from db.queries import get_db_connection
    try:
        with get_db_connection() as conn:
            with conn.cursor() as cur:
                cur.execute("""
                    INSERT INTO olympic_fans_geo (session_id, hometown_name, latitude, longitude, distance_to_la_km)
                    VALUES (%s, %s, %s, %s, %s)
                """, (req.session_id, name, lat, lng, distance_km))
                conn.commit()
    except Exception as e:
        print("Failed to save location to DB:", e)
        
    return {
        "city": name,
        "lat": lat,
        "lng": lng,
        "distance_km": distance_km,
        "distance_miles": distance_miles
    }


class CityHighlightRequest(BaseModel):
    city: str
    season: str
    years: list[int]
    usa_medals: int
    archetype_id: str


@app.post("/api/city-highlights")
def city_highlights(req: CityHighlightRequest):
    """Generate 1-2 sentence aggregate highlight for a city using Gemini."""
    from google import genai
    from db.queries import execute_dynamic_query

    # Top sports by Team USA medal count in this city
    sports_sql = """
        SELECT sport, COUNT(medal) as medal_count
        FROM v_results_full
        WHERE noc='USA' AND city=%s AND medal IS NOT NULL
        GROUP BY sport
        ORDER BY medal_count DESC
        LIMIT 3
    """
    sports_data = execute_dynamic_query(sports_sql, [req.city])
    top_sports = ", ".join([f"{s['sport']} ({s['medal_count']} medals)" for s in sports_data]) if isinstance(sports_data, list) else "Data unavailable"

    # Top events by Team USA gold count in this city (aggregate, no names)
    events_sql = """
        SELECT event, COUNT(medal) as golds
        FROM v_results_full
        WHERE noc='USA' AND city=%s AND medal='Gold'
        GROUP BY event
        ORDER BY golds DESC
        LIMIT 3
    """
    events_data = execute_dynamic_query(events_sql, [req.city])
    top_events = ", ".join([f"{e['event']} ({e['golds']} Golds)" for e in events_data]) if isinstance(events_data, list) else "Data unavailable"

    client = genai.Client(vertexai=True, project="teamusa-8b1ba", location="global")

    prompt = f"""You are an educational analyst for the Team USA Olympic Digital Mirror (1896-2016 public Kaggle dataset).
The user is exploring the Olympic city of {req.city} ({req.season}, {', '.join(map(str, req.years))}).
Team USA won {req.usa_medals} medals here in total.

Aggregate data for {req.city}:
- Team USA's most dominant sports: {top_sports}
- Top gold-medal events: {top_events}

Write exactly 2 sentences summarizing Team USA's aggregate performance in {req.city}.
Rules you MUST follow:
- Do NOT name any specific athlete. Refer only to sports, events, medal counts, and eras.
- Use conditional, editorial language: "historically", "Team USA athletes tended to", "the record shows".
- Use **bold** to highlight 2-3 key terms — only sports names, event names, or descriptive adjectives. NEVER bold an athlete name.
- Do NOT use ## headers. Plain prose only.
- Keep it factual and concise. End with one specific sport or event stat from the data above.
"""

    try:
        response = client.models.generate_content(
            model='gemini-3.1-flash-lite-preview',
            contents=prompt,
        )
        return {"highlights": response.text}
    except Exception as e:
        print("Gemini error in city-highlights:", e)
        return {"highlights": f"Team USA won {req.usa_medals} medals in {req.city} across {len(req.years)} Games. (Extended highlights unavailable.)"}


@app.post("/api/chat")
@limiter.limit("100/day")
async def chat(request: Request, req: ChatRequest):
    """Gemini Gemini endpoint — rate-limited to 100 requests per IP per day."""
    from data.public_data import get_all_archetypes
    archs = {a["id"]: a for a in get_all_archetypes()}
    arch = archs.get(req.archetype_id, {})

    context = ""
    if arch:
        context = f"""USER BIOMETRIC CONTEXT (1896-2016 public historical dataset):
The user's biometric profile aligns with the aggregate cluster labeled: {arch.get('label', req.archetype_id)} ({arch.get('description', '')})
Historically associated sports for this body-type cluster: {', '.join(arch.get('olympic_sports', [])[:4])}
Paralympic sport alignment: {', '.join(arch.get('paralympic_sports', [])[:3])}
IMPORTANT: Use conditional phrasing only — e.g., "athletes with similar builds have historically tended to..."
Do NOT name or profile any specific athlete. Do NOT imply this user's performance will match any individual.
"""

    response, map_trigger = ask_gemini(req.message, context, req.history)
    result = {"response": response}
    if map_trigger:
        result["mapTrigger"] = map_trigger
    return result



# ── Gemini TTS endpoint ───────────────────────────────────────────────────────────
class TTSRequest(BaseModel):
    text: str

@app.post("/api/tts")
async def tts(req: TTSRequest):
    """
    Synthesize text → Gemini TTS (gemini-3.1-flash-tts-preview, Zephyr voice).
    Returns { audio: "<base64 WAV>" } or { audio: null } if synthesis fails.
    The WAV is 24 kHz mono 16-bit PCM — decodable by browser AudioContext.
    """
    audio_b64 = await synthesize_text_to_wav_b64(req.text)
    return {"audio": audio_b64}


# ── Sentence chunker (asymmetric) ─────────────────────────────────────────────────────
_SENTENCE_RE = re.compile(r"(?<=[.!?])\s+")

def _split_sentences(text: str, min_chars: int = 40) -> list[str]:
    raw = _SENTENCE_RE.split(text.strip())
    chunks: list[str] = []
    buf = ""
    for part in raw:
        part = part.strip()
        if not part:
            continue
        buf = (buf + " " + part).strip() if buf else part
        if len(buf) >= min_chars:
            chunks.append(buf)
            buf = ""
    if buf:
        chunks.append(buf)
    return chunks or [text.strip()]


def _progressive_groups(sentences: list[str]) -> list[list[str]]:
    """
    Asymmetric grouping for progressive TTFA optimisation:
      Group 0 (first):  exactly 1 sentence  → smallest possible TTFA
      Group 1:          2 sentences          → plays while group 0 audio plays
      Group 2+:         3 sentences each     → background synthesis
    This mirrors the /speak strategy in the CareerVivid CLI.
    """
    if not sentences:
        return []
    groups: list[list[str]] = []
    i = 0
    while i < len(sentences):
        if len(groups) == 0:
            groups.append([sentences[i]]); i += 1          # first: 1 sentence
        elif len(groups) == 1:
            groups.append(sentences[i:i+2]); i += 2        # second: up to 2
        else:
            groups.append(sentences[i:i+3]); i += 3        # rest: up to 3
    return groups


@app.post("/api/chat-stream")
@limiter.limit("100/day")
async def chat_stream(request: Request, req: ChatRequest):
    """
    Progressive SSE streaming with inline Gemini TTS audio.

    Phase 1 — Agent: run ask_gemini() with full tool-calling (grounded).
    Phase 2 — Stream: split response into progressive groups:
        Group 0: 1 sentence  → synthesize immediately → emit {text, audio}
        Group 1: 2 sentences → synthesize while group 0 audio plays
        Group 2+:3 sentences → background synthesis

    Each SSE event:
        data: {"text": "<sentence(s)>", "audio": "<base64 WAV|null>",
               "index": 0, "done": false}
    Final event:
        data: {"text": "", "audio": null, "index": -1, "done": true}

    Frontend decodes WAV via AudioContext for gapless playback.
    """
    from data.public_data import get_all_archetypes
    archs = {a["id"]: a for a in get_all_archetypes()}
    arch  = archs.get(req.archetype_id, {})

    context = ""
    if arch:
        context = f"""USER BIOMETRIC CONTEXT (1896-2016 public historical dataset):
The user's biometric profile aligns with the aggregate cluster labeled: {arch.get('label', req.archetype_id)} ({arch.get('description', '')})
Historically associated sports for this body-type cluster: {', '.join(arch.get('olympic_sports', [])[:4])}
Paralympic sport alignment: {', '.join(arch.get('paralympic_sports', [])[:3])}
IMPORTANT: Use conditional phrasing only — e.g., "athletes with similar builds have historically tended to..."
Do NOT name or profile any specific athlete. Do NOT imply this user's performance will match any individual.
"""

    # Phase 1: agent runs (tools complete, grounded answer ready)
    full_response, map_trigger = await asyncio.to_thread(ask_gemini, req.message, context, req.history)

    # Phase 2: progressive chunked SSE
    async def generate():
        # Feature B: if Gemini triggered a map view, emit it first as a special event
        if map_trigger:
            yield f"data: {json.dumps({'mapTrigger': map_trigger, 'text': '', 'audio': None, 'index': -1, 'done': False})}\n\n"

        sentences = _split_sentences(full_response)
        groups    = _progressive_groups(sentences)

        for i, group in enumerate(groups):
            group_text = " ".join(group)
            audio_b64 = None

            payload = json.dumps({
                "text":  group_text,
                "audio": audio_b64,
                "index": i,
                "done":  False,
            })
            yield f"data: {payload}\n\n"

        yield f"data: {json.dumps({'text': '', 'audio': None, 'index': -1, 'done': True})}\n\n"

    return StreamingResponse(
        generate(),
        media_type="text/event-stream",
        headers={
            "Cache-Control": "no-cache",
            "X-Accel-Buffering": "no",
        },
    )


@app.websocket("/api/voice-chat-live")
async def voice_chat_live(websocket: WebSocket):
    await websocket.accept()
    # Feature: pass user archetype context to the live session
    archetype_id = websocket.query_params.get("archetype_id")
    from agents.olympic_agent import handle_live_session
    try:
        await handle_live_session(websocket, archetype_id=archetype_id)
    except WebSocketDisconnect:
        print(f"Live API WebSocket disconnected (archetype: {archetype_id})")
