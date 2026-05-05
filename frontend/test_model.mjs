import { GoogleGenAI, Modality } from "@google/genai";
import * as dotenv from "dotenv";
import * as path from "path";
dotenv.config({ path: path.join(process.cwd(), ".env.local") });

async function run() {
  const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY, httpOptions: { apiVersion: "v1alpha" }});
  
  const session = await ai.live.connect({
    model: "gemini-2.0-flash-exp",
    config: {
      responseModalities: [Modality.AUDIO],
      systemInstruction: { parts: [{ text: "You must always greet the user" }] }
    },
    callbacks: {
      onopen: () => console.log("✅ connected"),
      onmessage: (msg) => {
        if (msg.serverContent) console.log("Got response!");
        if (msg.serverContent?.modelTurn) console.log("Got model turn with audio!");
      }
    }
  });

  await session.sendClientContent({ turns: "Say hi loudly", turnComplete: true });
  console.log("Sent client content");
  
  setTimeout(() => process.exit(0), 5000);
}
run();
