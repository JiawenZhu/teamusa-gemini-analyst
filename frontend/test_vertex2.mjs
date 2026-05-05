import { GoogleGenAI } from '@google/genai';
import * as dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });

async function test() {
  const ai = new GoogleGenAI({
    apiKey: process.env.NEXT_PUBLIC_GEMINI_API_KEY,
    vertexai: true,
  });
  console.log("Client created successfully with Express Mode");
  try {
    const res = await ai.models.generateContent({
      model: "gemini-2.5-flash",
      contents: "Hello, this is a test"
    });
    console.log("Response:", res.text);
  } catch (e) {
    console.error("Error:", e);
  }
}
test();
