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
      onmessage: (msg) => { 
        if (msg.serverContent && msg.serverContent.modelTurn) {
          const textPart = msg.serverContent.modelTurn.parts.find(p => p.text);
          if (textPart) console.log("Gemini TEXT:", textPart.text); 
          const audioPart = msg.serverContent.modelTurn.parts.find(p => p.inlineData);
          if (audioPart) console.log("Gemini: [Audio Received]"); 
        }
      }
    }
  });

  // Wait 1 second
  setTimeout(async () => {
     console.log("Sending audio...");
     const pcm = new Int16Array(16000 * 2);
     for(let i=0; i<pcm.length; i++) pcm[i] = Math.sin(i * 0.1) * 10000;
     const base64 = Buffer.from(pcm.buffer).toString("base64");
     await session.sendRealtimeInput({ audio: { mimeType: "audio/pcm", data: base64 }});
  }, 1000);
  
  // Wait 2 seconds, send end of audio stream
  setTimeout(async () => {
     console.log("Sending audioStreamEnd...");
     await session.sendRealtimeInput({ audioStreamEnd: true });
  }, 3000);
  
  setTimeout(() => process.exit(0), 10000);
}
run();
