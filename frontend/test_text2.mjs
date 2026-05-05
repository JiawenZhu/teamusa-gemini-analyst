import { GoogleGenAI, Modality } from "@google/genai";
import * as dotenv from "dotenv";
import * as path from "path";
dotenv.config({ path: path.join(process.cwd(), ".env.local") });

async function run() {
  const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY, httpOptions: { apiVersion: "v1alpha" }});
  
  const session = await ai.live.connect({
    model: "gemini-3.1-flash-live-preview",
    config: {
      responseModalities: [Modality.AUDIO],
    },
    callbacks: {
      onopen: () => console.log("✅ connected"),
      onmessage: (msg) => {
        if (msg.serverContent) console.log("Got response:", msg.serverContent.modelTurn ? "modelTurn" : "other");
      }
    }
  });

  setTimeout(async () => {
     await session.sendClientContent({ 
       turns: [{ role: "user", parts: [{ text: "Hello! Say hi." }] }], 
       turnComplete: true 
     });
     console.log("Sent client content correctly");
  }, 1000);
  
  setTimeout(() => process.exit(0), 5000);
}
run();
