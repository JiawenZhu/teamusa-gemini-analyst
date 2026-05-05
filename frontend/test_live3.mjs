import { GoogleGenAI, Modality } from "@google/genai";
import * as dotenv from "dotenv";
import * as path from "path";
dotenv.config({ path: path.join(process.cwd(), ".env.local") });

async function run() {
  const ai = new GoogleGenAI({ 
    apiKey: process.env.GEMINI_API_KEY,
    httpOptions: { apiVersion: "v1alpha" }
  });
  
  const session = await ai.live.connect({
    model: "gemini-3.1-flash-live-preview",
    config: {
      responseModalities: [Modality.AUDIO],
      speechConfig: { voiceConfig: { prebuiltVoiceConfig: { voiceName: "Aoede" } } }
    },
    callbacks: {
      onopen: () => console.log("✅ connected"),
      onmessage: (msg) => console.log("msg keys:", Object.keys(msg)),
      onerror: (e) => console.log("❌ error", e)
    }
  });

  console.log("Session methods:", Object.getOwnPropertyNames(Object.getPrototypeOf(session)));
  
  try {
     await session.send({
        clientContent: { turns: [{ role: "user", parts: [{ text: "Hello! Say hi." }] }], turnComplete: true }
     });
     console.log("Sent via send()");
  } catch (e) {
     console.log("send() error:", e.message);
  }

  setTimeout(() => {
    session.close();
    process.exit(0);
  }, 5000);
}
run();
