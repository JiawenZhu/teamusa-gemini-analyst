import { GoogleGenAI } from "@google/genai";
const ai = new GoogleGenAI({ apiKey: "test" });
console.log(ai.live.connect.toString().substring(0, 500));
