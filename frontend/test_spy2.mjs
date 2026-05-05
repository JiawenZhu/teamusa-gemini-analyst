import { GoogleGenAI, Modality } from "@google/genai";
import * as dotenv from "dotenv";
import * as path from "path";
import ws from "ws";
dotenv.config({ path: path.join(process.cwd(), ".env.local") });

// Spy on WebSocket
const originalSend = ws.prototype.send;
ws.prototype.send = function(data) {
  console.log("WebSocket sending:", data.substring ? data.substring(0, 100) : "binary data");
  originalSend.apply(this, arguments);
};

async function run() {
  const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY, httpOptions: { apiVersion: "v1alpha" }});
  
  const session = await ai.live.connect({
    model: "gemini-3.1-flash-live-preview",
    config: {
      responseModalities: [Modality.AUDIO],
    },
    callbacks: {
      onopen: () => console.log("✅ connected"),
      onmessage: () => {}
    }
  });

  setTimeout(async () => {
     await session.sendRealtimeInput([{ mimeType: "audio/pcm", data: "abcd" }]);
     await session.sendRealtimeInput({ mediaChunks: [{ mimeType: "audio/pcm", data: "abcd" }] });
  }, 1000);
  
  setTimeout(() => process.exit(0), 3000);
}
run();
