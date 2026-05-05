"""
gemini_tts.py — Gemini TTS engine for the TeamUSA backend.

Mirrors the architecture from the CareerVivid CLI tts.ts:
  • Model:   gemini-3.1-flash-tts-preview  (Zephyr voice by default)
  • Output:  PCM (raw 16-bit LE, 24 kHz mono) → wrapped in WAV header
  • Retry:   up to 3 attempts with exponential back-off (model can 500)
  • Chunks:  splits text at sentence boundaries before synthesizing
             so long responses never hit the TTS context limit

Returns base64-encoded WAV bytes, ready for browser AudioContext decoding.
"""
import asyncio
import base64
import os
import re
import struct
import time
from typing import Optional

from google import genai
from google.genai import types
from dotenv import load_dotenv

load_dotenv()

# ── Config ─────────────────────────────────────────────────────────────────────
TTS_MODEL  = "gemini-3.1-flash-tts-preview"
TTS_VOICE  = "Zephyr"   # Bright, energetic — good for sports commentary
MAX_CHUNK  = 800        # chars per TTS call (matches CLI behaviour)
MAX_RETRY  = 3
RETRY_BASE = 0.8        # seconds (multiplied by attempt number)

# ── WAV header builder (identical to CLI buildWavHeader) ──────────────────────
def _build_wav_header(pcm_len: int, sample_rate=24000, channels=1, bits=16) -> bytes:
    byte_rate   = sample_rate * channels * bits // 8
    block_align = channels * bits // 8
    header = bytearray(44)
    struct.pack_into("<4sI4s4sIHHIIHH4sI", header, 0,
        b"RIFF", 36 + pcm_len, b"WAVE",
        b"fmt ", 16, 1, channels, sample_rate,
        byte_rate, block_align, bits,
        b"data", pcm_len)
    return bytes(header)

# ── Text cleaning (strip markdown before sending to TTS) ─────────────────────
_MD_PATTERNS = [
    (re.compile(r"```[\s\S]*?```"), ""),    # code blocks
    (re.compile(r"`[^`]+`"),        ""),    # inline code
    (re.compile(r"\*\*(.*?)\*\*"),  r"\1"),  # bold
    (re.compile(r"\*(.*?)\*"),      r"\1"),  # italic
    (re.compile(r"^#{1,6}\s+", re.M), ""), # headings
    (re.compile(r"^[>•\-*]\s*", re.M), ""), # bullets
    (re.compile(r"\[([^\]]+)\]\([^)]+\)"), r"\1"), # links
    (re.compile(r"\s+"),            " "),   # normalise whitespace
]

def _clean(text: str) -> str:
    for pattern, repl in _MD_PATTERNS:
        text = pattern.sub(repl, text)
    return text.strip()

# ── Sentence-boundary chunker ─────────────────────────────────────────────────
_SENT_RE = re.compile(r"[^.!?]+[.!?]+(?:\s|$)|[^.!?]+$")

def _split_chunks(text: str) -> list[str]:
    """Split text into ≤MAX_CHUNK-char chunks at sentence boundaries."""
    if len(text) <= MAX_CHUNK:
        return [text]
    sentences = _SENT_RE.findall(text) or [text]
    chunks: list[str] = []
    buf = ""
    for s in sentences:
        if buf and len(buf) + len(s) > MAX_CHUNK:
            chunks.append(buf.strip())
            buf = s
        else:
            buf += s
    if buf.strip():
        chunks.append(buf.strip())
    return chunks or [text]

# ── Single-chunk synthesis with retry ────────────────────────────────────────
async def _synthesize_chunk(client: genai.Client, text: str, attempt: int = 0) -> Optional[bytes]:
    """Synthesize one text chunk → raw PCM bytes, or None on failure."""
    try:
        response = await asyncio.to_thread(
            client.models.generate_content,
            model=TTS_MODEL,
            contents=text,
            config=types.GenerateContentConfig(
                response_modalities=["AUDIO"],
                speech_config=types.SpeechConfig(
                    voice_config=types.VoiceConfig(
                        prebuilt_voice_config=types.PrebuiltVoiceConfig(
                            voice_name=TTS_VOICE,
                        )
                    )
                ),
            ),
        )
        parts = response.candidates[0].content.parts if response.candidates else []
        pcm_parts = []
        for part in parts:
            if hasattr(part, "inline_data") and part.inline_data and part.inline_data.data:
                pcm_parts.append(base64.b64decode(part.inline_data.data))
        return b"".join(pcm_parts) if pcm_parts else None

    except Exception as e:
        msg = str(e)
        is_retryable = "500" in msg or "INTERNAL" in msg or "503" in msg
        if is_retryable and attempt < MAX_RETRY:
            await asyncio.sleep(RETRY_BASE * (attempt + 1))
            return await _synthesize_chunk(client, text, attempt + 1)
        return None

# ── Public API ────────────────────────────────────────────────────────────────

async def synthesize_text_to_wav_b64(text: str) -> Optional[str]:
    """
    Full pipeline: clean → chunk → synthesize (with retry) → WAV → base64.
    Returns a base64-encoded WAV string, or None if synthesis failed.
    """
    if not text.strip():
        return None

    cleaned = _clean(text)
    if not cleaned:
        return None

    client = genai.Client(vertexai=True, project="teamusa-8b1ba", location="global")
    chunks  = _split_chunks(cleaned)

    pcm_parts: list[bytes] = []
    for chunk in chunks:
        pcm = await _synthesize_chunk(client, chunk)
        if pcm:
            pcm_parts.append(pcm)

    if not pcm_parts:
        return None

    all_pcm = b"".join(pcm_parts)
    wav     = _build_wav_header(len(all_pcm)) + all_pcm
    return base64.b64encode(wav).decode("ascii")


async def synthesize_sentence_to_wav_b64(sentence: str) -> Optional[str]:
    """
    Synthesize a single pre-chunked sentence → base64 WAV.
    Used by /api/chat-stream to start playing the first sentence immediately.
    """
    if not sentence.strip():
        return None

    cleaned = _clean(sentence)
    if not cleaned:
        return None

    client = genai.Client(vertexai=True, project="teamusa-8b1ba", location="global")
    pcm = await _synthesize_chunk(client, cleaned)
    if not pcm:
        return None

    wav = _build_wav_header(len(pcm)) + pcm
    return base64.b64encode(wav).decode("ascii")
