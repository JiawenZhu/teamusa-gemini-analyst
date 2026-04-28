import { NextRequest, NextResponse } from "next/server";

export async function POST(req: NextRequest) {
  const { text } = await req.json();

  if (!text || typeof text !== "string") {
    return NextResponse.json({ error: "text is required" }, { status: 400 });
  }

  const apiKey = process.env.GEMINI_API_KEY;

  if (!apiKey) {
    // Graceful degradation — return null so client falls back to browser TTS
    return NextResponse.json({ audio: null });
  }

  try {
    // Trim text to 2000 chars max to avoid large TTS costs
    const trimmed = text.replace(/(\*\*|__)/g, "").slice(0, 2000);

    const response = await fetch(
      `https://texttospeech.googleapis.com/v1/text:synthesize?key=${apiKey}`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          input: { text: trimmed },
          voice: {
            languageCode: "en-US",
            name: "en-US-Journey-D",   // Deep, authoritative male voice
            ssmlGender: "MALE",
          },
          audioConfig: {
            audioEncoding: "MP3",
            speakingRate: 0.9,         // Slightly slower = more "authoritative"
            pitch: -2.0,               // Lower pitch for gravitas
            volumeGainDb: 2.0,
            effectsProfileId: ["headphone-class-device"],
          },
        }),
      }
    );

    if (!response.ok) {
      const err = await response.text();
      console.error("Google TTS error:", err);
      return NextResponse.json({ audio: null }); // graceful degradation
    }

    const data = await response.json();
    return NextResponse.json({ audio: data.audioContent }); // base64 MP3
  } catch (e) {
    console.error("TTS route error:", e);
    return NextResponse.json({ audio: null });
  }
}
