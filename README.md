# TeamUSA Gemini Analyst
<!-- Apache License 2.0 — see LICENSE file -->

**[Team USA × Google Cloud Hackathon 2026](https://vibecodeforgoldwithgoogle.devpost.com/)**

> A fan-facing AI system powered by **Gemini 2.5 Flash** that matches your body metrics to 120 years of Olympic and Paralympic Team USA athletes — then lets you chat with a Gemini agent grounded in a real PostgreSQL database of 271,116 athlete records. Built with FastAPI, Next.js, and Google Cloud Run.

[![License](https://img.shields.io/badge/License-Apache_2.0-blue.svg)](LICENSE)
[![Google Cloud](https://img.shields.io/badge/Google%20Cloud-Run-4285F4?logo=googlecloud)](https://cloud.google.com/run)
[![Gemini](https://img.shields.io/badge/Gemini-2.5%20Flash-8E75B2?logo=google)](https://ai.google.dev/)

---

## What It Does

1. **Enter your height, weight, and age** — the app computes your BMI and biometric profile
2. **Instant K-means matching** — scikit-learn clusters 8,108 real USA athlete records to find your archetype (pure Python, zero AI latency)
3. **Explore your archetype** — see which Olympic and Paralympic sports historically align with your body type, with percentile stats against real Team USA athletes
4. **Chat with Gemini** — a multi-turn Gemini 2.5 Flash agent with 10 SQL tools grounded in a real Cloud SQL PostgreSQL database; ask anything about Olympic history

## The 6 Archetypes

| Archetype | Description |
|---|---|
| 💪 The Powerhouse | High mass, strength events — Shot put, Wheelchair Rugby |
| 🏃 The Aerobic Engine | Lean endurance — Marathon, Para-Triathlon |
| ⚡ The Explosive Athlete | Fast-twitch speed — Sprints, Para-Sprint |
| 🎯 The Precision Maestro | Accuracy and focus — Archery, Boccia |
| 🏊 The Aquatic Titan | Long limbs, broad shoulders — Swimming, Para-Swimming |
| 🧠 The Agile Competitor | Court awareness — Basketball, Wheelchair Basketball |

## Tech Stack

| Layer | Technology |
|---|---|
| **AI** | Gemini 2.5 Flash (`gemini-2.5-flash`) · Gemini Function Calling (10 SQL tools) · `google-genai` SDK |
| **Backend** | Python 3.13 · FastAPI · scikit-learn (K-means) · psycopg2 · slowapi |
| **Frontend** | Next.js 16 · TypeScript · Tailwind CSS · Web Speech API (voice input) · Google TTS (voice output) |
| **Database** | Cloud SQL PostgreSQL · 271,116 rows · 6 normalized tables · `v_results_full` view |
| **Deployment** | Google Cloud Run (frontend + backend) · Firebase Hosting (CDN proxy) · Artifact Registry |
| **Analytics** | Google Analytics GA4 (Firebase) |

## Architecture

```
┌─────────────────────────────────────────────────────────────────────┐
│                         USER (Browser)                              │
│  Height / Weight / Age input  ·  Voice input (Web Speech API)       │
└───────────────────┬────────────────────────┬────────────────────────┘
                    │                        │
                    ▼                        ▼
        ┌───────────────────┐    ┌───────────────────────┐
        │  Firebase Hosting │    │  Firebase Hosting     │
        │  (CDN proxy)      │    │  (CDN proxy)          │
        └────────┬──────────┘    └──────────┬────────────┘
                 │                          │
                 ▼                          ▼
   ┌─────────────────────────┐  ┌──────────────────────────┐
   │  Next.js 16 Frontend    │  │  FastAPI Backend          │
   │  Cloud Run              │  │  Cloud Run               │
   │                         │  │                          │
   │  • Biometric form       │  │  GET  /api/stats         │
   │  • Archetype result     │  │  GET  /api/archetypes    │
   │  • Chat UI              │◄─┤  POST /api/match         │
   │  • Voice I/O            │  │  GET  /api/timeline      │
   │  • GA4 analytics        │  │  POST /api/chat          │
   │  • /api/og  (OG image)  │  │                          │
   │  • /api/tts (voice)     │  └──────────────────────────┘
   └─────────────────────────┘           │         │
                                         │         │
                          ┌──────────────┘         └─────────────┐
                          ▼                                       ▼
           ┌──────────────────────────┐        ┌─────────────────────────────┐
           │  In-Memory Data Layer    │        │  Gemini 2.5 Flash Agent     │
           │  (loaded at startup)     │        │  (POST /api/chat only)      │
           │                          │        │                             │
           │  • Olympic CSV download  │        │  System prompt + 10 tools:  │
           │    (rgriff23/Olympic_     │        │  ├─ get_medal_stats         │
           │     history, MIT)         │        │  ├─ get_athlete_biometrics  │
           │  • Filter: USA + Summer  │        │  ├─ get_sport_breakdown      │
           │  • scikit-learn KMeans   │        │  ├─ get_top_nations          │
           │    (6 clusters, 8,108    │        │  ├─ get_athlete_age_stats    │
           │     athlete records)      │        │  ├─ get_gender_breakdown    │
           │  • Instant /api/match    │        │  ├─ get_games_summary       │
           │    → archetype_id +      │        │  ├─ get_sport_history       │
           │      percentile stats     │        │  ├─ get_bmi_by_sport        │
           └──────────────────────────┘        │  └─ get_custom_sql_data     │
                                               │     (dynamic SELECT)        │
                                               └──────────────┬──────────────┘
                                                              │
                                                              ▼ (all tools call)
                                          ┌───────────────────────────────────┐
                                          │  Cloud SQL PostgreSQL             │
                                          │  (teamusa-8b1ba:us-central1)      │
                                          │                                   │
                                          │  Tables:                          │
                                          │  ├─ athletes  (id, name, sex,     │
                                          │  │             height_cm,         │
                                          │  │             weight_kg)         │
                                          │  ├─ nations   (noc, team_name)    │
                                          │  ├─ games     (year, season, city)│
                                          │  ├─ sports    (name)              │
                                          │  ├─ events    (sport_id, name)    │
                                          │  └─ results   (athlete_id, noc,   │
                                          │                games_id,          │
                                          │                event_id, age,     │
                                          │                medal)             │
                                          │                                   │
                                          │  View: v_results_full             │
                                          │  (271,116 rows · 1896–2016        │
                                          │   id, name, sex, age, height_cm,  │
                                          │   weight_kg, noc, team_name,      │
                                          │   games, year, season, city,      │
                                          │   sport, event, medal)            │
                                          └───────────────────────────────────┘
```

## Key Design Decisions

| Decision | Rationale |
|---|---|
| **K-means in memory, not Gemini** | Biometric matching needs <100ms latency; Gemini is only used for the chat agent where latency is acceptable |
| **10 SQL tools + `get_custom_sql_data`** | Structured tools handle common queries fast; the dynamic SQL tool gives Gemini full flexibility for any question |
| **Name-split ILIKE rule** | Athletes have middle names in DB (e.g., "LeBron Raymone James"); agent must use `AND name ILIKE '%LeBron%' AND name ILIKE '%James%'` |
| **View `v_results_full`** | Joins 6 normalized tables into a single flat view — agent always queries this, never raw tables |
| **Cloud Run for both services** | Zero cold-start penalty at scale; Cloud SQL connects via Unix socket (no proxy needed in prod) |
| **Firebase Hosting as CDN proxy** | Routes all traffic through `teamusa-8b1ba.web.app` with a global CDN edge layer |

## Quick Start

### Prerequisites

- Python 3.11+, Node.js 20+
- Google Cloud SDK (`gcloud`)
- Cloud SQL Auth Proxy (local dev only)

### Backend

```bash
cd backend
python3 -m venv .venv && source .venv/bin/activate
pip install -r requirements.txt
cp .env.example .env
# Add your GEMINI_API_KEY and DATABASE_URL to .env
uvicorn main:app --reload --port 8000
```

### Frontend

```bash
cd frontend
npm install
# NEXT_PUBLIC_API_URL=http://localhost:8000 is in .env.local
npm run dev
```

### Run everything locally (frontend + backend + Cloud SQL proxy)

```bash
npm run dev   # from the root teamusa-oracle/ directory
```

Open http://localhost:3000

## Environment Variables

### Backend (`backend/.env`)
```
GEMINI_API_KEY=your_key_here
DATABASE_URL=postgresql://postgres:password@localhost:5433/teamusa-database
```

### Frontend (`frontend/.env.local`)
```
NEXT_PUBLIC_API_URL=https://teamusa-oracle-api-789615763226.us-central1.run.app
GEMINI_API_KEY=your_key_here
```

## Database Schema

```sql
-- 6 normalized tables, queried via v_results_full view
athletes  (id, name, sex, height_cm, weight_kg)
nations   (noc PK, team_name)
games     (id, year, season, city)
sports    (id, name)
events    (id, sport_id FK, name)
results   (id, athlete_id FK, noc FK, games_id FK, event_id FK, age, medal)

-- Primary query surface for Gemini agent:
VIEW v_results_full → 271,116 rows, 1896–2016
  columns: id, name, sex, age, height_cm, weight_kg,
           noc, team_name, year, season, city,
           sport, event, medal
```

## Data Sources

- **Olympic athletes (1896–2016):** [`rgriff23/Olympic_history`](https://github.com/rgriff23/Olympic_history) (MIT License), filtered to USA Summer athletes only
- **In-memory cluster data:** 8,108 USA athlete records with valid biometrics, K-means clustered into 6 archetypes

*All data is aggregate and historical. No individual athlete photos or finish times are used. Output is at the archetype level, not the individual level.*

## Deployed URLs

| Service | URL |
|---|---|
| **Public app** | https://teamusa-8b1ba.web.app |
| **Frontend (Cloud Run)** | https://teamusa-oracle-frontend-789615763226.us-central1.run.app |
| **Backend API (Cloud Run)** | https://teamusa-oracle-api-789615763226.us-central1.run.app |
| **API Docs (Swagger)** | https://teamusa-oracle-api-789615763226.us-central1.run.app/docs |

## License

Apache License 2.0 — see [LICENSE](LICENSE) file.

## Hackathon

Built for the [Team USA × Google Cloud Hackathon](https://vibecodeforgoldwithgoogle.devpost.com/) — **Challenge 4: The Athlete Archetype Agent**.
