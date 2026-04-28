# TeamUSA Archetype Oracle
<!-- Apache License 2.0 — see LICENSE file -->

**[Team USA × Google Cloud Hackathon 2026](https://vibecodeforgoldwithgoogle.devpost.com/)**

> A fan-facing AI system powered by a **4-agent Gemini pipeline** that matches your body metrics to 120 years of Olympic and Paralympic Team USA athletes — then streams a personalized archetype narrative. Built with Gemini 2.0 Flash, FastAPI, Next.js, and Firebase on Google Cloud Run.

[![License](https://img.shields.io/badge/License-Apache_2.0-blue.svg)](LICENSE)
[![Google Cloud](https://img.shields.io/badge/Google%20Cloud-Run-4285F4?logo=googlecloud)](https://cloud.google.com/run)
[![Gemini](https://img.shields.io/badge/Gemini-2.0%20Flash-8E75B2?logo=google)](https://ai.google.dev/)

---

## What It Does

1. **Enter your height, weight, and age** — the app computes your BMI and biometric profile
2. **4-Agent Gemini Pipeline runs:**
   - **Agent 1 (Data Gatherer)** — finds your K-means cluster among 3,500+ US athletes via Gemini Function Calling
   - **Agent 2 (Validator)** — cross-checks every AI-generated fact against the real dataset, logging and correcting hallucinations
   - **Agent 3 (Narrator)** — streams a personalized 3-paragraph story with equal Olympic + Paralympic athlete references
   - **Agent 4 (LA28 Predictor)** — maps your archetype to LA28 sports with historical affinity scores
3. **Results persisted to Firebase Firestore** — with community stats ("31% of visitors share your archetype")
4. **Chat with the Oracle** — multi-turn Gemini agent grounded in your saved archetype context

## The 6 Archetypes

| Archetype | Description |
|---|---|
| 💪 The Powerhouse | High mass, strength events — Shot put, Wheelchair Rugby |
| 🏃 The Aerobic Engine | Lean endurance — Marathon, Para-Triathlon |
| ⚡ The Explosive Athlete | Fast-twitch speed — Sprints, Para-Sprint |
| 🎯 The Precision Maestro | Accuracy and focus — Archery, Boccia |
| 🏊 The Aquatic Specialist | Long limbs, broad shoulders — Swimming, Para-Swimming |
| 🧠 The Agile Tactician | Court awareness — Basketball, Wheelchair Basketball |

## Tech Stack

| Layer | Technology |
|---|---|
| **AI** | Gemini 2.0 Flash (google-genai SDK) · Gemini Function Calling |
| **Backend** | Python 3.11 · FastAPI · scikit-learn · SSE streaming |
| **Frontend** | Next.js 14 · TypeScript · Tailwind CSS · Framer Motion · Recharts |
| **Persistence** | Firebase Firestore (CareerVivid Firebase project) |
| **Deployment** | Google Cloud Run · Artifact Registry · Cloud Storage |

## Architecture

```
User → Next.js Frontend → FastAPI Orchestrator
                               │
         ┌─────────────────────┼─────────────────────┐
         ▼                     ▼                     ▼
    Agent 1              Agent 2              Agent 3 + 4
  Data Gatherer         Validator            Narrator + LA28
  (Function Calling)   (Hallucination       (SSE Stream)
                        correction)
         └─────────────────────┼─────────────────────┘
                               ▼
                      Firebase Firestore
```

## Quick Start

### Backend

```bash
cd backend
python3 -m venv .venv && source .venv/bin/activate
pip install -r requirements.txt
cp .env.example .env
# Add your GEMINI_API_KEY to .env
uvicorn main:app --reload --port 8000
```

### Frontend

```bash
cd frontend
npm install
# NEXT_PUBLIC_API_URL=http://localhost:8000 is already set in .env.local
npm run dev
```

Open http://localhost:3000

## Environment Variables

### Backend (`backend/.env`)
```
GEMINI_API_KEY=your_key_here
FIREBASE_CREDENTIALS_PATH=./firebase-service-account.json
```

### Frontend (`frontend/.env.local`)
```
NEXT_PUBLIC_API_URL=http://localhost:8000
```

## Data Sources

- **Olympic athletes (1896–2024):** Kaggle "120 years of Olympic history" dataset, filtered to US athletes
- **Paralympic athletes:** IPC public results archive supplement
- **LA28 sports:** la28.org confirmed sport list

*All data is aggregate and historical. No individual athlete names or photos are used in the UI.*

## License

Apache License 2.0 — see [LICENSE](LICENSE) file.

## Hackathon

Built for the [Team USA × Google Cloud Hackathon](https://vibecodeforgoldwithgoogle.devpost.com/) — Challenge 4: The Athlete Archetype Agent.
