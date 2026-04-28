import { NextRequest, NextResponse } from "next/server";

const API = "http://127.0.0.1:8000";

export async function POST(req: NextRequest) {
  const { text } = await req.json();

  if (!text || typeof text !== "string") {
    return NextResponse.json({ error: "text is required" }, { status: 400 });
  }

  try {
    // Delegate synthesis to the FastAPI backend which uses gemini-3.1-flash-tts-preview.
    // The backend returns { audio: "<base64 WAV>" } or { audio: null } on failure.
    const res = await fetch(`${API}/api/tts`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ text }),
      // 12 s hard timeout — Gemini TTS is fast but we allow for retries
      signal: AbortSignal.timeout(12_000),
    });

    if (!res.ok) {
      console.error("Backend TTS error:", res.status);
      return NextResponse.json({ audio: null });
    }

    const data = await res.json();
    return NextResponse.json({ audio: data.audio ?? null });
  } catch (e) {
    console.error("TTS proxy error:", e);
    return NextResponse.json({ audio: null });
  }
}
