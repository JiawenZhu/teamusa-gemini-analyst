import { GoogleGenAI, Modality } from "@google/genai";
import * as dotenv from "dotenv";
import * as path from "path";
dotenv.config({ path: path.join(process.cwd(), ".env.local") });

async function run() {
  const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY, httpOptions: { apiVersion: "v1alpha" }});
  const session = await ai.live.connect({
    model: "gemini-3.1-flash-live-preview",
    config: { responseModalities: [Modality.AUDIO] },
    callbacks: {
      onmessage: (msg) => { if (msg.serverContent) console.log("Response!"); }
    }
  });

  const pcm = new Int16Array(16000);
  for(let i=0; i<pcm.length; i++) pcm[i] = (Math.random() - 0.5) * 32767;
  await session.sendRealtimeInput({ mediaChunks: [{ mimeType: "audio/pcm", data: Buffer.from(pcm.buffer).toString("base64") }]});
  
  await session.sendClientContent({ turnComplete: true });
  console.log("Sent turnComplete");
}
run();
