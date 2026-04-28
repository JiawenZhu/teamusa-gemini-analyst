# Team USA × Google Cloud: AI Performance Analyst

**Hackathon:** [Team USA x Google Cloud Hackathon: Become a Team USA Analyst with Gemini](https://vibecodeforgoldwithgoogle.devpost.com/)

## 🥇 Project Concept: Gemini AI Coach (Medalytics)

**Medalytics** is an AI-powered tactical coaching assistant built for the "Become a Team USA Analyst with Gemini" hackathon. It leverages the lightning-fast multimodal video-processing capabilities of **Gemini 3.1 Flash** and the scalable infrastructure of **Google Cloud** to analyze athlete performance videos and deliver actionable, data-driven coaching insights.

### 🎯 The Problem
Elite sports require meticulous analysis of biomechanics, strategy, and execution. Historically, only top-tier programs with teams of human analysts could break down video frame-by-frame to find micro-adjustments. 

### 💡 The Solution
We empower athletes and coaches at all levels with an AI-powered Team USA Analyst. Users upload their practice footage, and the Gemini model acts as an elite coaching analyst—providing instant feedback on form, pacing, and strategy compared to historical Team USA standards.

## ✨ Key Features

1. **Multimodal Video Analysis:** 
   - Upload training footage directly to the platform.
   - **Gemini 3.1 Flash** natively watches the video and analyzes key moments (e.g., release angle in shot put, entry splash in diving, stride length in sprinting) with incredibly low latency.
2. **"Medal Strategy" Reports:** 
   - Generates a detailed breakdown of strengths, areas for improvement, and a step-by-step action plan.
3. **Interactive AI Coach Chat:** 
   - A conversational interface powered by Gemini to ask specific questions about the uploaded video (e.g., "At what timestamp did my posture break?").
4. **Historical Context:**
   - Grounded in a Google Cloud BigQuery dataset of historical Team USA performances to provide benchmark comparisons.

## 🛠️ Proposed Tech Stack

*   **Frontend:** Next.js (React), Tailwind CSS, Framer Motion
*   **Backend API:** Python (FastAPI) running on **Google Cloud Run**
*   **AI Engine:** **Gemini 3.1 Flash** (`gemini-3.1-flash-lite-preview` / `gemini-3.1-flash`) via the new google-genai SDK for ultra-fast, deep video analysis and real-time generation.
*   **Storage:** **Google Cloud Storage (GCS)** for securely hosting user-uploaded practice videos.
*   **Database:** **Firebase Firestore** to store analyst reports and user chat history.

## 🚀 Why This Fits the Hackathon

- **Theme Alignment:** Directly addresses the prompt to "Become a Team USA Analyst with Gemini."
- **Google Cloud Usage:** Heavily utilizes Cloud Storage, Cloud Run, and Firebase.
- **Gemini Capabilities:** Showcases Gemini 3.1 Flash's massive context window, low latency, and native video understanding (multimodal), which is a huge competitive edge over text-only AI projects.

## 📝 Next Steps for Development

1. Set up a fresh Google Cloud Project and enable Vertex AI/Gemini APIs.
2. Build the Next.js UI with a drag-and-drop video upload zone.
3. Create the backend endpoint to receive videos, upload to GCS, and pass the GCS URI to Gemini 3.1 Flash.
4. Prompt Engineer the "Team USA Analyst" persona for Gemini to ensure responses are formatted as professional sports coaching feedback.
