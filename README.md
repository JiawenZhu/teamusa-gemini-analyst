# 🏅 Team USA Digital Mirror

> **Built for the [Team USA × Google Cloud Hackathon](https://vibecodeforgoldwithgoogle.devpost.com/) — Challenge 4: The Athlete Archetype Agent**

[![Apache 2.0 License](https://img.shields.io/badge/License-Apache%202.0-blue.svg)](LICENSE)
[![Google Cloud](https://img.shields.io/badge/Google%20Cloud-Run%20%7C%20SQL%20%7C%20Gemini-4285F4?logo=google-cloud)](https://cloud.google.com)
[![Next.js](https://img.shields.io/badge/Next.js-16-black?logo=next.js)](https://nextjs.org)
[![FastAPI](https://img.shields.io/badge/FastAPI-0.115-009688?logo=fastapi)](https://fastapi.tiangolo.com)

---

## What It Does

**Team USA Digital Mirror** is an AI-powered sports analytics platform that finds your Olympic and Paralympic athlete archetype based on your biometrics — then lets you explore 120 years of Team USA history through a premium 3D interactive globe.

### Core Experience

1. **Enter your height, weight, and age** — our real K-means ML model instantly matches you to one of 6 Olympic *or* 6 Paralympic athlete archetypes drawn from 271,116 rows of verified historical data
2. **See your archetype** — a detailed profile card showing which Team USA legends share your build, your top sports, medal rates, and a personalized "Why you match" insight
3. **Chat with the AI analyst** — Gemini (powered by function calling against a live PostgreSQL DB) answers any question about Olympic history with grounded, data-verified answers
4. **Watch the globe fly** — when Gemini mentions a host city, the 3D Earth automatically rotates to face it
5. **Track your distance to LA 2028** — enter your hometown and see how far you are from the 2028 Los Angeles Olympics, visualized on the globe
6. **Share your DNA** — a shareable URL encodes your biometrics so friends can see your exact archetype result

---

## 🌟 Key Features

| Feature | Description |
|---|---|
| **🏅 Olympic / ♿ Paralympic Toggle** | Switch between two independent K-means models — Olympic or Paralympic — to find your archetype in either Games. LA 2028 hosts both. |
| **🌍 3D Interactive Globe** | NASA-textured Earth with atmosphere glow, starfield, sonar city markers, and animated flight arcs — built with Three.js + react-three-fiber |
| **🤖 Gemini AI Analyst** | Real function-calling agent with 10 tools that query a live 271k-row PostgreSQL database. Never hallucinates — all answers are grounded in data. |
| **🎤 Voice Assistant** | Full voice I/O — speak your question, hear the answer via browser-native Web Speech API (SpeechSynthesis + SpeechRecognition) |
| **🖐️ Hand Gesture Control** | Uses MediaPipe to detect gestures via webcam. Point to hover, pinch to select, open palm to rotate/zoom, and rock to close panels. |
| **🔗 Shareable Links** | `?h=175&w=70&age=25` URL params auto-run the match and show a shared-result banner |
| **🗺️ Globe City Control** | Gemini automatically flies the globe to any Olympic host city mentioned in the conversation |
| **📍 LA 2028 Distance Tracker** | Geocodes your city and calculates the great-circle distance to the Coliseum in Los Angeles |
| **📡 SSE Streaming** | Chat responses stream progressively via Server-Sent Events for a real-time feel |

---

## 🏗️ Architecture

```
┌──────────────────────────────────────────────────────────────────────┐
│                     teamusa-8b1ba.web.app  (Firebase CDN)            │
└───────────────────────────────┬──────────────────────────────────────┘
                                │
              ┌─────────────────▼──────────────────┐
              │   Next.js 16  (Cloud Run)           │
              │   - 3D Globe (Three.js + R3F)       │
              │   - Biometric input + archetype UI  │
              │   - Gemini chat panel               │
              │   - Olympic/Paralympic toggle       │
              │   - Voice TTS & MediaPipe Gestures  │
              └──────────────┬─────────────────────┘
                             │  REST + SSE
              ┌──────────────▼─────────────────────┐
              │   FastAPI  (Cloud Run)              │
              │   /api/match   → K-means (Olympic)  │
              │   /api/match   → K-means (Para)     │
              │   /api/chat    → Gemini agent       │
              │   /api/chat-stream → SSE chunks     │
              │   /api/location → Geocode + Haversine│
              │   trigger_map_view() → Nominatim    │
              └──────────────┬─────────────────────┘
                             │  10 SQL tools + custom SQL
              ┌──────────────▼─────────────────────┐
              │   Cloud SQL PostgreSQL              │
              │   271,116 rows · 6 tables           │
              │   View: v_results_full              │
              └────────────────────────────────────┘
```

### Olympic & Paralympic Models

Both models use the famous [120 Years of Olympic History Kaggle Dataset](https://www.kaggle.com/datasets/heesoo37/120-years-of-olympic-history-athletes-and-results) (271,116 rows), which was originally scraped from Sports-Reference. The data is filtered and clustered separately:

> [!NOTE]
> **Data Discrepancy Disclaimer:** Because this dataset preserves the original historical records from Sports-Reference, you may notice minor discrepancies compared to modern IOC databases. For example, in the chaotic 1900 Paris Games, this dataset contains 32 women (9 from Team USA) while the modern IOC retroactively recognizes only 22. This is because the IOC later "de-certified" many 1900 events, but this dataset preserves the broader, more inclusive historical record of everyone who competed!

| Model | Athletes | Archetypes |
|---|---|---|
| **Olympic** | 8,108 USA Summer athletes with biometrics | Powerhouse · Aerobic Engine · Explosive Athlete · Precision Maestro · Aquatic Titan · Agile Competitor |
| **Paralympic** | USA athletes across 13 Paralympic-proxy sports | Para Powerhouse · Para Endurance Engine · Para Sprinter · Para Precision Maestro · Para Aquatics Titan · Para Team Competitor |

---

## 🚀 Quick Start

### Prerequisites
- Python 3.11+, Node.js 20+
- Google Cloud SDK (`gcloud`)
- Cloud SQL Auth Proxy (local dev only)

### Clone & Install

```bash
git clone https://github.com/JiawenZhu/teamusa-oracle.git
cd teamusa-oracle
npm install          # installs concurrently for the dev script
cd frontend && npm install && cd ..
cd backend && python3 -m venv .venv && source .venv/bin/activate && pip install -r requirements.txt && cd ..
```

### Environment Variables

**Backend** (`backend/.env`):
```env
GEMINI_API_KEY=your_gemini_api_key
DATABASE_URL=postgresql://postgres:password@localhost:5433/teamusa-database
```

**Frontend** (`frontend/.env.local`):
```env
NEXT_PUBLIC_API_URL=https://teamusa-oracle-api-789615763226.us-central1.run.app
```

### Run Locally

```bash
npm run dev   # starts Cloud SQL proxy + FastAPI backend + Next.js frontend
```

Open **http://localhost:3000**

---

## ✅ Reproducible Testing

> **No login credentials required.** The live demo is fully open — just visit the URL and start exploring.

### Automated Backend Tests

The backend ships with a **37-test pytest suite** that runs entirely offline (no database or Gemini API key needed). Tests cover all core API endpoints, the K-means ML matching logic, the Haversine distance calculator, and the SSE sentence chunker.

```bash
cd backend
source .venv/bin/activate          # activate the virtual environment
pip install pytest httpx           # install test dependencies (one-time)
pytest test_api.py -v              # run all 37 tests
```

Expected output: `37 passed in ~4s`

### Manual Feature Verification

Open **https://teamusa-8b1ba.web.app** and follow these steps:

#### 1. Biometric Matching (Olympic)
- Enter **Height: 178 cm**, **Weight: 72 kg**, **Age: 25**
- Click **"Find My Archetype"**
- ✅ Expect: a named archetype card appears with medal rate, top sports, and closest historical athletes

#### 2. Paralympic Mode
- Toggle the **Paralympic** switch (top of the page)
- Re-run the same biometrics
- ✅ Expect: a distinct `para_*` archetype is returned (e.g., "Para Endurance Engine")

#### 3. AI Analyst (Gemini Chat)
- Type: `"Which Team USA sports have the tallest average athletes, and how has that changed over time?"`
- ✅ Expect: Gemini dynamically queries the historical data to calculate average height by sport and era.
- Type: `"For Team USA, does BMI correlate more strongly with medal success in strength sports or endurance sports?"`
- ✅ Expect: Gemini analyzes BMI distribution among medalists in different sports using its SQL tools.
- Type: `"How have Team USA women’s participation rates changed across Summer Olympic history?"`
- ✅ Expect: Gemini calculates the gender breakdown over time to show the historical trend.
- Type: `"What is the average age of Team USA medalists by sport, and which sports favor younger or older athletes?"`
- ✅ Expect: Gemini queries age distribution stats to provide a data-backed comparison across sports.

#### 4. Globe Auto-Fly
- The globe should animate to any Olympic host city Gemini mentions — no button click needed
- ✅ Verify by asking about multiple different cities in succession

#### 5. Voice Assistant
- Click the **microphone** icon and speak a question
- ✅ Expect: the response is spoken aloud via TTS after the text streams in

#### 6. LA 2028 Distance Tracker
- Enter your hometown (e.g., `"Chicago, IL"`)
- ✅ Expect: a distance in km/miles to the LA28 Coliseum, with a globe pin

#### 7. Shareable Link
- After matching, copy the URL — it should contain `?h=178&w=72&age=25`
- Open the URL in a new private/incognito tab
- ✅ Expect: the archetype result auto-loads without re-entering biometrics

#### 8. Hand Gesture Control (MediaPipe)
Ensure your webcam is active and permissions are granted. Test the following gestures:
- **Point (Index Finger Up)**: Moves the glowing cursor over the globe to hover over cities.
- **Air Tap (Pinch)**: Pinch your index and thumb together while hovering over a city to select it.
- **3D Control (Open Palm)**: Swipe your open hand to rotate the globe, or move your hand closer/further to zoom in/out.
- **Rock (Closed Fist)**: Automatically closes the right-side chat panel.
- **Victory Sign (Index & Middle Up)**: Cycles to the next available city.
- ✅ Expect: The globe and UI to respond fluidly to your physical gestures without needing a mouse or keyboard.

#### 9. Mobile Responsiveness
- Resize your browser window to a mobile width (or open on a mobile device).
- Enter a long, multi-line question into the chat input.
- ✅ Expect: the chat input text stacks properly when one line is full, and all archetype cards/UI elements scale without horizontal scrolling.

### Verifying the API Directly

The backend API has interactive Swagger docs at:
**https://teamusa-oracle-api-789615763226.us-central1.run.app/docs**

Test the match endpoint directly:
```bash
curl -X POST https://teamusa-oracle-api-789615763226.us-central1.run.app/api/match \
  -H "Content-Type: application/json" \
  -d '{"height_cm": 178, "weight_kg": 72, "age": 25, "mode": "olympic"}'
```

Expected response includes `archetype_id`, `user_bmi`, and `closest_athletes`.

---

## 📡 API Reference

| Endpoint | Method | Description |
|---|---|---|
| `/api/stats` | GET | Dataset statistics |
| `/api/archetypes` | GET | All 6 Olympic archetypes |
| `/api/para-archetypes` | GET | All 6 Paralympic archetypes |
| `/api/match` | POST | Biometric → archetype (Olympic or Paralympic) |
| `/api/chat` | POST | Gemini agent chat (full JSON) |
| `/api/chat-stream` | POST | Gemini agent chat (SSE stream) |
| `/api/location` | POST | Geocode city + calculate distance to LA |
| `/api/timeline` | GET | 600-point scatter data for visualization |
| `/health` | GET | Health check |

**Match request:**
```json
{
  "height_cm": 178,
  "weight_kg": 72,
  "age": 25,
  "mode": "olympic"
}
```

---

## 🗄️ Database Schema

```sql
-- 6 normalized tables
athletes  (id, name, sex, height_cm, weight_kg)
nations   (noc PK, team_name)
games     (id, year, season, city)
sports    (id, name)
events    (id, sport_id FK, name)
results   (id, athlete_id FK, noc FK, games_id FK, event_id FK, age, medal)

-- Primary query surface for the Gemini agent:
VIEW v_results_full → 271,116 rows
  columns: id, name, sex, age, height_cm, weight_kg,
           noc, team_name, year, season, city, sport, event, medal
  medal values: 'Gold' | 'Silver' | 'Bronze' | NULL
```

---

## 🤖 Gemini Agent Tools

The agent has 11 function-calling tools:

| Tool | Purpose |
|---|---|
| `get_medal_stats` | Count medals by country, year, sport |
| `get_athlete_biometrics` | Average height/weight by sport or nation |
| `get_sport_breakdown` | Top sports by medal count |
| `get_top_nations` | Leaderboard by medal count |
| `get_athlete_age_stats` | Age distribution stats |
| `get_gender_breakdown` | Male/Female athlete counts |
| `get_games_summary` | Host city stats for a given Games |
| `get_sport_history` | When a sport was first/last contested |
| `get_bmi_by_sport` | Average BMI grouped by sport |
| `get_custom_sql_data` | Execute any SELECT against `v_results_full` |
| `trigger_map_view` | **Fly the 3D globe to any Olympic host city** |

---

## 🌐 Deployed URLs

| Service | URL |
|---|---|
| **Live App** | https://teamusa-8b1ba.web.app |
| **Backend API** | https://teamusa-oracle-api-789615763226.us-central1.run.app |
| **API Docs** | https://teamusa-oracle-api-789615763226.us-central1.run.app/docs |

---

## 📊 Key Design Decisions

| Decision | Rationale |
|---|---|
| **K-means in memory, not Gemini** | Matching needs <5ms latency; Gemini is reserved for grounded narrative where latency is acceptable |
| **Separate Olympic + Paralympic models** | Different biometric distributions require independent clustering; same source data, different filters |
| **SSE streaming for chat** | Progressive rendering feels live; no spinner waiting for a 5-second full response |
| **trigger_map_view tool** | Bridges AI conversation and 3D visualization automatically — no button click required |
| **Shareable URL params** | Deep-links encode `?h=&w=&age=` so any result can be shared and auto-reproduced |
| **Firebase Hosting → Cloud Run** | Global CDN edge, zero cold-start penalty, automatic HTTPS |

---

## 📄 License

Apache License 2.0 — see [LICENSE](LICENSE)

---

## 🏆 Hackathon

Built for the **[Vibe Code for Gold with Google Hackathon](https://vibecodeforgoldwithgoogle.devpost.com/)** — Challenge 4: The Athlete Archetype Agent.

*Data: [Olympic History 1896–2016](https://github.com/rgriff23/Olympic_history) (MIT License). All data is aggregate and historical.*
