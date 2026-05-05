import { GoogleGenAI } from '@google/genai';

async function test() {
  const ai = new GoogleGenAI({
    vertexai: { project: "teamusa-8b1ba", location: "us-central1" }
  });
  console.log("Client created successfully");
  try {
    const res = await ai.models.generateContent({
      model: "gemini-2.5-flash",
      contents: "Hello"
    });
    console.log(res.text);
  } catch (e) {
    console.error(e);
  }
}
test();
