"""
main.py — TeamUSA Digital Mirror API

Endpoints:
  GET  /api/stats          — real dataset stats (athlete count, years, medals)
  GET  /api/archetypes     — all 6 archetypes with cluster stats
  POST /api/match          — instant biometric match (pure Python K-means)
  GET  /api/timeline       — scatter data for 120-year visualization
  POST /api/chat           — Gemini chat, full JSON (100/day rate limit per IP)
  POST /api/chat-stream    — Gemini chat, SSE sentence chunks for real-time TTS
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


# ── Sentence chunker ─────────────────────────────────────────────────────────
_SENTENCE_RE = re.compile(r'(?<=[.!?])\s+')

def _split_sentences(text: str, min_chars: int = 40) -> list[str]:
    """
    Split text into sentence chunks for streaming TTS.
    Merges very short fragments (< min_chars) with the next sentence
    so TTS doesn't synthesize tiny incomplete phrases.
    """
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


@app.post("/api/chat-stream")
@limiter.limit("100/day")
async def chat_stream(request: Request, req: ChatRequest):
    """
    Streaming SSE version of /api/chat.
    Phase 1: Run Gemini agent with tools (grounded, accurate).
    Phase 2: Stream the final answer as sentence chunks via SSE so the
             frontend can pipe each sentence to TTS immediately — audio
             starts playing before the full response finishes rendering.

    SSE event format:
      data: {"chunk": "<sentence>", "index": 0, "done": false}\n\n
      data: {"chunk": "", "index": -1, "done": true}\n\n
    """
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

    # Phase 1: run agent with full tool-calling (synchronous — tools must complete
    # before we can stream, since function calling is not streamable)
    full_response = await asyncio.to_thread(ask_gemini, req.message, context, req.history)

    # Phase 2: stream sentence chunks via SSE
    async def generate():
        sentences = _split_sentences(full_response)
        for i, sentence in enumerate(sentences):
            payload = json.dumps({"chunk": sentence, "index": i, "done": False})
            yield f"data: {payload}\n\n"
            # Small yield gap so the client can begin TTS before next chunk arrives
            await asyncio.sleep(0.01)
        yield f"data: {json.dumps({'chunk': '', 'index': -1, 'done': True})}\n\n"

    return StreamingResponse(
        generate(),
        media_type="text/event-stream",
        headers={
            "Cache-Control": "no-cache",
            "X-Accel-Buffering": "no",   # Disable nginx buffering on Cloud Run
        },
    )
