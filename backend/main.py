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
import os, json, asyncio, re
from contextlib import asynccontextmanager
from fastapi import FastAPI, HTTPException, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse, StreamingResponse
from pydantic import BaseModel, Field
from dotenv import load_dotenv
from slowapi import Limiter, _rate_limit_exceeded_handler
from slowapi.util import get_remote_address
from slowapi.errors import RateLimitExceeded

from data.public_data import load_data, get_dataset_stats, get_all_archetypes, match_biometrics, get_timeline_data
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
    """Instant biometric matching — pure Python K-means, zero latency."""
    result = match_biometrics(req.height_cm, req.weight_kg, req.age)
    return result


@app.get("/api/timeline")
def timeline():
    """600-point sample of real athlete data for the scatter visualization."""
    return {"athletes": get_timeline_data()}


@app.post("/api/chat")
@limiter.limit("100/day")
async def chat(request: Request, req: ChatRequest):
    """Gemini Gemini endpoint — rate-limited to 100 requests per IP per day."""
    from data.public_data import get_all_archetypes
    archs = {a["id"]: a for a in get_all_archetypes()}
    arch = archs.get(req.archetype_id, {})

    context = ""
    if arch:
        context = f"""
The user's current biometric match: {arch.get('label', req.archetype_id)} ({arch.get('description', '')})
Top olympic sports for this build: {', '.join(arch.get('olympic_sports', [])[:4])}
Paralympic alignment: {', '.join(arch.get('paralympic_sports', [])[:3])}
"""

    response = ask_gemini(req.message, context, req.history)
    return {"response": response}


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
        context = f"""
The user's current biometric match: {arch.get('label', req.archetype_id)} ({arch.get('description', '')})
Top olympic sports for this build: {', '.join(arch.get('olympic_sports', [])[:4])}
Paralympic alignment: {', '.join(arch.get('paralympic_sports', [])[:3])}
"""

    # Phase 1: agent runs (tools complete, grounded answer ready)
    full_response = await asyncio.to_thread(ask_gemini, req.message, context, req.history)

    # Phase 2: progressive chunked SSE
    async def generate():
        sentences = _split_sentences(full_response)
        groups    = _progressive_groups(sentences)

        for i, group in enumerate(groups):
            group_text = " ".join(group)

            # Synthesize this group via Gemini TTS
            # Group 0 is tiny (1 sentence) so this returns in ~1s → minimum TTFA
            audio_b64 = await synthesize_sentence_to_wav_b64(group_text)

            payload = json.dumps({
                "text":  group_text,
                "audio": audio_b64,   # base64 WAV or null (client falls back)
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
