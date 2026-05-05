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
          if (textPart) console.log("Gemini:", textPart.text); 
          const audioPart = msg.serverContent.modelTurn.parts.find(p => p.inlineData);
          if (audioPart) console.log("Gemini: [Audio Received]"); 
        }
      }
    }
  });

  await session.sendRealtimeInput({ text: "I am going to send you some audio noise. Tell me if you hear it!" });
  
  const pcm = new Int16Array(16000 * 3);
  for(let i=0; i<pcm.length; i++) pcm[i] = (Math.random() - 0.5) * 32767;
  const base64 = Buffer.from(pcm.buffer).toString("base64");
  
  setTimeout(async () => {
     console.log("Sending mediaChunks audio");
     await session.sendRealtimeInput({ mediaChunks: [{ mimeType: "audio/pcm", data: base64 }]});
  }, 2000);
  
  setTimeout(async () => {
     console.log("Sending text: Did you hear anything?");
     await session.sendRealtimeInput({ text: "Did you hear anything? It was static noise." });
  }, 5000);
  
  setTimeout(() => process.exit(0), 10000);
}
run();
