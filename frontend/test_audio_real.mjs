import { GoogleGenAI, Modality } from "@google/genai";
import * as dotenv from "dotenv";
import * as path from "path";
import fs from "fs";
dotenv.config({ path: path.join(process.cwd(), ".env.local") });

async function run() {
  const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY, httpOptions: { apiVersion: "v1alpha" }});
  const session = await ai.live.connect({
    model: "gemini-3.1-flash-live-preview",
    config: { responseModalities: [Modality.TEXT] },
    callbacks: {
      onmessage: (msg) => { 
        if (msg.serverContent && msg.serverContent.modelTurn) {
          console.log("Gemini:", msg.serverContent.modelTurn.parts[0].text); 
        }
      }
    }
  });

  // Generate a fake audio buffer or just say "Hello" in base64 if we had it.
  // Instead of a real audio file, let's send text first to get its attention, then send audio chunks.
  
  await session.sendRealtimeInput({ text: "I am going to send you some audio noise. Tell me if you receive any audio data!" });
  
  const pcm = new Int16Array(16000 * 3); // 3 seconds of noise
  for(let i=0; i<pcm.length; i++) pcm[i] = (Math.random() - 0.5) * 32767;
  const base64 = Buffer.from(pcm.buffer).toString("base64");
  
  setTimeout(async () => {
     console.log("Sending mediaChunks audio");
     await session.sendRealtimeInput({ mediaChunks: [{ mimeType: "audio/pcm", data: base64 }]});
  }, 2000);
  
  setTimeout(async () => {
     console.log("Sending audio audio");
     await session.sendRealtimeInput({ audio: { mimeType: "audio/pcm", data: base64 }});
  }, 5000);

  setTimeout(async () => {
     await session.sendRealtimeInput({ text: "Did you hear anything?" });
  }, 8000);
}
run();
