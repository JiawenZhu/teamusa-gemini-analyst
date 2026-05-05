import { GoogleGenAI, Modality } from "@google/genai";
import * as dotenv from "dotenv";
import * as path from "path";
dotenv.config({ path: path.join(process.cwd(), ".env.local") });

async function run() {
  const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY, httpOptions: { apiVersion: "v1alpha" }});
  const session = await ai.live.connect({
    model: "gemini-3.1-flash-live-preview",
    config: { responseModalities: [Modality.TEXT] },
    callbacks: {
      onmessage: (msg) => { 
        if (msg.serverContent && msg.serverContent.modelTurn) {
          const textPart = msg.serverContent.modelTurn.parts.find(p => p.text);
          if (textPart) console.log("Gemini:", textPart.text); 
        }
      }
    }
  });

  const pcm = new Int16Array(16000 * 2);
  for(let i=0; i<pcm.length; i++) pcm[i] = (Math.random() - 0.5) * 32767;
  const base64 = Buffer.from(pcm.buffer).toString("base64");
  
  await session.sendRealtimeInput({ mediaChunks: [{ mimeType: "audio/pcm", data: base64 }]});
  
  setTimeout(async () => {
     await session.sendRealtimeInput({ audioStreamEnd: true });
     console.log("Sent audioStreamEnd");
  }, 1000);
  
  setTimeout(() => process.exit(0), 5000);
}
run();
