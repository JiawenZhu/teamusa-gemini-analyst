import { GoogleGenAI, Modality } from "@google/genai";
import * as dotenv from "dotenv";
import * as path from "path";
dotenv.config({ path: path.join(process.cwd(), ".env.local") });

async function run() {
  const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY, httpOptions: { apiVersion: "v1alpha" }});
  const session = await ai.live.connect({
    model: "gemini-3.1-flash-live-preview",
    callbacks: {
      onclose: (e) => console.log("Connection closed!", e.code, e.reason)
    }
  });

  await session.sendRealtimeInput({ text: "Hello" });

  const pcm = new Int16Array(16000 * 2);
  const base64 = Buffer.from(pcm.buffer).toString("base64");
  
  await session.sendRealtimeInput({ audio: { mimeType: "audio/pcm", data: base64 }});
  console.log("Sent audio");
  
  setTimeout(() => process.exit(0), 2000);
}
run();
