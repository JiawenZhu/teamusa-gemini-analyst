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
      onmessage: (msg) => {
        if (msg.serverContent) {
           console.log("Got serverContent");
           if (msg.serverContent.modelTurn) {
             const parts = msg.serverContent.modelTurn.parts;
             parts.forEach(p => {
               if (p.inlineData) console.log("Audio data length:", p.inlineData.data.length);
               if (p.text) console.log("Text:", p.text);
             });
           }
        }
      },
      onerror: (e) => console.log("❌ error", e)
    }
  });

  console.log("Sending greeting...");
  await session.sendClientContent({
    turns: [{ role: "user", parts: [{ text: "Hello! Say hi." }] }],
    turnComplete: true
  });
  
  setTimeout(() => {
    session.close();
    process.exit(0);
  }, 5000);
}
run();
