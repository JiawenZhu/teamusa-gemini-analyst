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

  const pcm = new Int16Array(16000);
  for(let i=0; i<pcm.length; i++) pcm[i] = (Math.random() - 0.5) * 32767;
  await session.sendRealtimeInput([{
    mimeType: "audio/pcm;rate=16000",
    data: Buffer.from(pcm.buffer).toString("base64")
  }]);
  
  await session.sendRealtimeInput({
    mediaChunks: [{
      mimeType: "audio/pcm;rate=16000",
      data: Buffer.from(pcm.buffer).toString("base64")
    }]
  });
  console.log("Sent audio");
  
  setTimeout(() => process.exit(0), 5000);
}
run();
