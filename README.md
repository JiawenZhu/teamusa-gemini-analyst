<div align="center">

# 🏅 Team USA Digital Mirror

### **An AI-powered sports analytics platform that finds your Olympic DNA.**
*Enter your biometrics. Discover your athlete archetype. Explore 120 years of Team USA history.*

<br />

[![Live App](https://img.shields.io/badge/🌐%20Live%20App-teamusa--8b1ba.web.app-C9A227?style=for-the-badge&labelColor=0f172a)](https://teamusa-8b1ba.web.app) 
[![API Docs](https://img.shields.io/badge/📡%20API%20Docs-Swagger%20UI-009688?style=for-the-badge&labelColor=0f172a)](https://teamusa-oracle-api-789615763226.us-central1.run.app/docs) 
[![Hackathon](https://img.shields.io/badge/🏆%20Vibe%20Code%20for%20Gold-Google%20Cloud-4285F4?style=for-the-badge&labelColor=0f172a)](https://vibecodeforgoldwithgoogle.devpost.com/)

<br />

![Apache 2.0](https://img.shields.io/badge/License-Apache%202.0-blue.svg?style=flat-square)
![CI](https://github.com/JiawenZhu/teamusa-gemini-analyst/actions/workflows/ci.yml/badge.svg)
![Next.js 16](https://img.shields.io/badge/Next.js-16-black?style=flat-square&logo=next.js)
![FastAPI](https://img.shields.io/badge/FastAPI-0.115-009688?style=flat-square&logo=fastapi)
![Google Cloud](https://img.shields.io/badge/Google%20Cloud-Run%20·%20SQL%20·%20Gemini-4285F4?style=flat-square&logo=google-cloud)

---

</div>

## 🎯 What Is This?

**Team USA Digital Mirror** connects *your* body to 120 years of Olympic history. Our K-means ML model maps your height, weight, and age onto 8,108 verified historical athlete profiles — then unlocks a full AI analyst, interactive 3D globe, and voice assistant to let you explore every dimension of Team USA's story.

> **Data:** 271,116 global Olympic records (1896–2016), filtered to 8,108 USA Summer athletes with biometrics. Built on the public [120 Years of Olympic History](https://www.kaggle.com/datasets/heesoo37/120-years-of-olympic-history-athletes-and-results) Kaggle dataset.

---

## ✨ The 3-Step Journey

```
╔══════════════════════════════════════════════════════════════════════════╗
║                                                                          ║
║   STEP 1 · MATCH          STEP 2 · CHAT           STEP 3 · DISCOVER     ║
║   ─────────────────        ─────────────────        ─────────────────    ║
║   Enter height, weight,    Ask the AI Analyst       Explore all 6        ║
║   and age. K-means ML      anything about Team       archetypes, Para     ║
║   finds your Olympic or    USA Olympic history.      data, and 120 yrs   ║
║   Paralympic archetype     Globe flies to every      of timeline charts. ║
║   in under 50ms.           city Gemini mentions.                         ║
║                                                                          ║
╚══════════════════════════════════════════════════════════════════════════╝
```

---

## 🌟 Feature Showcase

<table>
<tr>
<td width="50%">

### 🏅 Biometric Archetype Matching
K-means clustering across **6 Olympic** and **6 Paralympic** archetypes. Enter height + weight + age and receive a profile card with your top sports, historical medal rates, and a "Why you match" insight — all grounded in verified data.

</td>
<td width="50%">

### 🌍 Live 3D Interactive Globe
NASA-textured Earth built with **Three.js + react-three-fiber**. Features atmosphere glow, starfield, sonar city markers, and animated flight arcs. When Gemini mentions an Olympic host city, the globe **automatically flies there**.

</td>
</tr>
<tr>
<td>

### 🤖 Gemini AI Analyst (Function Calling)
A full **agentic AI** with 11 SQL-backed tools that query 271k rows of live PostgreSQL data. Every answer is grounded — no hallucination. Supports streaming SSE and a parallel **Live Voice** mode with real-time audio transcription.

</td>
<td>

### 🎤 Voice Assistant (Live API)
Speak your question, hear the answer. Powered by **Gemini Live API** (`gemini-live-2.5-flash-native-audio`) with full duplex audio. The backend uses a hybrid architecture — SQL-grounded answers injected back for Gemini to speak.

</td>
</tr>
<tr>
<td>

### 🖐️ Hand Gesture Control
**MediaPipe Hands** via webcam. Point to hover, pinch to select, open palm to rotate/zoom, fist to close panels. No mouse or keyboard required for globe navigation.

</td>
<td>

### 📍 LA28 Games Distance Tracker
Geocode any city and calculate the great-circle distance to the **LA28 Coliseum** using the Haversine formula. Your city pin appears on the globe with a flight arc to Los Angeles.

</td>
</tr>
<tr>
<td>

### 🔗 Shareable Deep Links
`?h=178&w=72&age=25` URL params auto-run the match and display a shared-result banner. Send your archetype to anyone — they see your exact result without re-entering anything.

</td>
<td>

### 📡 SSE Streaming Chat
Chat responses stream progressively via **Server-Sent Events** — text appears word by word in real time. No spinner waiting for a 5-second full response.

</td>
</tr>
</table>

---

## 🏗️ Architecture

```
┌─────────────────────────────────────────────────────────────────────────┐
│                   teamusa-8b1ba.web.app  (Firebase Hosting CDN)         │
└────────────────────────────────┬────────────────────────────────────────┘
                                 │  HTTPS
               ┌─────────────────▼───────────────────┐
               │   Next.js 16  (Firebase App Hosting) │
               │                                       │
               │   • 3D Globe (Three.js + R3F)         │
               │   • Biometric input + archetype UI    │
               │   • Gemini AI chat panel              │
               │   • Olympic / Paralympic toggle       │
               │   • Voice TTS + MediaPipe Gestures    │
               │   • StepNav: Match → Chat → Discover  │
               └──────────────┬──────────────────────┘
                              │  REST + SSE + WebSocket
               ┌──────────────▼──────────────────────┐
               │   FastAPI  (Cloud Run, us-central1)  │
               │                                       │
               │   POST /api/match   → K-means        │
               │   POST /api/chat    → Gemini agent   │
               │   POST /api/chat-stream → SSE        │
               │   WS   /api/voice-chat-live          │
               │   POST /api/location → Haversine     │
               │   GET  /api/timeline, /api/stats     │
               └──────────────┬──────────────────────┘
                              │  11 SQL tools + dynamic SQL
               ┌──────────────▼──────────────────────┐
               │   Cloud SQL  PostgreSQL              │
               │                                       │
               │   271,116 rows · 6 normalized tables │
               │   View: v_results_full               │
               │   Columns: id, name, sex, age,       │
               │     height_cm, weight_kg, noc,       │
               │     year, season, city, sport,       │
               │     event, medal                     │
               └─────────────────────────────────────┘
```

This prevents the native Live model from hallucinating stats while keeping the voice experience fully real-time.

### Voice Hybrid Architecture

The Live Voice assistant uses a **two-lane hybrid** design to ensure every answer is data-grounded:

```
User speaks → Gemini Live API (transcription only)
                    ↓ full question detected
              SQL-backed ask_gemini() in background thread
                    ↓ verified DB answer
              → sent to browser as live_text (shown in chat)
              → injected back into Gemini session as text
              → Gemini speaks the grounded answer via audio
```

---

## 🔬 Technical Foundation

### **K-Means Biometric Clustering**
Our engine uses a multi-dimensional K-means clustering algorithm to map user inputs. The distance $d$ between a user's biometric profile $P$ and an archetype centroid $C$ is calculated using the weighted Euclidean distance:

$$ d(P, C) = \sqrt{ \sum_{i=1}^{n} w_i (P_i - C_i)^2 } $$

Where:
*   **$w_i$**: Feature weights (prioritizing Height and Weight over Age).
*   **$P_i$**: User's normalized biometric values.
*   **$C_i$**: Archetype centroid coordinates derived from 120 years of Team USA data.

### **Grounded Retrieval (RAG)**
The Gemini Analyst uses a **ReAct (Reasoning and Acting)** pattern to interact with the PostgreSQL database. Instead of relying on internal knowledge, it follows a strict protocol:
1.  **Analyze**: Understand the user's intent (e.g., "Tallest athletes in 1996").
2.  **Act**: Select and execute the appropriate SQL tool (e.g., `get_athlete_biometrics`).
3.  **Synthesize**: Generate a natural language response grounded *only* in the returned dataset.

### **MediaPipe Gesture Mapping**
The 3D globe supports touchless navigation via **MediaPipe Hands**. We map hand landmarks to camera controls in a Three.js environment:
*   **Index Point**: Raycasts to the globe surface for city selection.
*   **Pinch (Index + Thumb)**: Triggers a "click" event on the target location.
*   **Open Palm**: Initiates rotation based on the hand's vector $V_{hand}$ relative to the screen center.
*   **Fist**: Global "cancel" or "close panel" signal.

---

## 🧬 The Athlete Archetypes

| # | Olympic Archetype | Description |
|---|---|---|
| 1 | **Powerhouse** | High mass, high strength — weightlifting, wrestling, throwing |
| 2 | **Aerobic Engine** | Lean, efficient — distance running, cycling, triathlon |
| 3 | **Explosive Athlete** | Fast-twitch power — sprinting, jumping, throwing |
| 4 | **Precision Maestro** | Technical accuracy — archery, shooting, fencing, gymnastics |
| 5 | **Aquatic Titan** | Tall, broad — swimming, water polo, rowing |
| 6 | **Agile Competitor** | Balanced all-rounder — team sports, combat sports |

> **Paralympic archetypes** mirror these six clusters using Olympic sports that share functional movement patterns with Paralympic classifications. All Paralympic data is clearly marked as exploratory and educational — the underlying dataset covers Olympic Games only.

---

## 🤖 Gemini Agent Tools

The AI analyst has **11 function-calling tools** that query the live database:

| Tool | What It Does |
|---|---|
| `get_medal_stats` | Count medals by country, year, sport, or range |
| `get_athlete_biometrics` | Average height/weight by sport or nation |
| `get_sport_breakdown` | Top sports by medal count |
| `get_top_nations` | Global leaderboard by medal count |
| `get_athlete_age_stats` | Min/max/avg age by sport and year |
| `get_gender_breakdown` | Male vs Female athlete counts by team and year |
| `get_games_summary` | Host city stats for any Games (athletes, nations, events) |
| `get_sport_history` | First/last year a sport appeared, total medals awarded |
| `get_bmi_by_sport` | Average BMI grouped by sport |
| `get_custom_sql_data` | Execute any aggregate SELECT against `v_results_full` |
| `trigger_map_view` | **Flies the 3D globe** to any Olympic host city mentioned |

---

## 🚀 Quick Start

### Prerequisites
- **Python 3.11+** and **Node.js 20+**
- **Google Cloud SDK** (`gcloud auth application-default login`)
- **Cloud SQL Auth Proxy** (local dev only)

### 1. Clone & Install

```bash
git clone https://github.com/JiawenZhu/teamusa-gemini-analyst.git
cd teamusa-gemini-analyst

# Root dev dependencies
npm install

# Frontend
cd frontend && npm install && cd ..

# Backend
cd backend && python3 -m venv .venv && source .venv/bin/activate \
  && pip install -r requirements.txt && cd ..
```

### 2. Configure Environment

**`backend/.env`**
```env
# Vertex AI (preferred — no API key needed, uses gcloud credentials)
DATABASE_URL=postgresql://postgres:password@localhost:5433/teamusa-database
```

**`frontend/.env.local`**
```env
NEXT_PUBLIC_API_URL=https://teamusa-oracle-api-789615763226.us-central1.run.app
```

### 3. Run Locally

```bash
npm run dev
# Starts: Cloud SQL Proxy → FastAPI (port 8000) → Next.js (port 3000)
```

Open **[http://localhost:3000](http://localhost:3000)**

---

## ✅ Reproducibility & Testing

> **No login required.** The live demo is fully public — visit [teamusa-8b1ba.web.app](https://teamusa-8b1ba.web.app) and start exploring.

### Automated Backend Tests

A **37-test pytest suite** runs fully offline (no DB or API key needed). Covers all endpoints, K-means logic, Haversine distance, and SSE chunker.

```bash
cd backend
source .venv/bin/activate
pip install pytest httpx   # one-time
pytest test_api.py -v
# Expected: 37 passed in ~4s
```

### Manual Verification Checklist

| Step | Action | Expected Result |
|---|---|---|
| **1. Olympic Match** | Height 178cm, Weight 72kg, Age 25 → "Find My Archetype" | Named archetype card with medal rate, top sports, closest anonymized historical records |
| **2. Paralympic Toggle** | Switch to Paralympic → re-run same biometrics | Distinct `para_*` archetype (e.g., "Para Endurance Engine") |
| **3. AI Chat** | Ask: *"Which Team USA sports have the tallest athletes?"* | Gemini queries DB, returns heights by sport with historical trend |
| **4. Globe Auto-Fly** | Ask about multiple different Olympic cities | Globe animates to each city automatically |
| **5. Voice Mode** | Click mic → speak a question | Answer streamed as text + spoken via TTS |
| **6. LA28 Tracker** | Enter hometown (e.g., "Chicago, IL") | Distance in km/miles + globe pin + flight arc to LA |
| **7. Shareable Link** | Copy URL after match → open in incognito tab | Archetype auto-loads from `?h=178&w=72&age=25` params |
| **8. Hand Gestures** | Enable webcam → test pinch, palm, point | Globe responds to gestures without mouse |

### API Verification

```bash
BASE=https://teamusa-oracle-api-789615763226.us-central1.run.app

# Health check
curl $BASE/health
# → {"status":"ok"}

# Olympic biometric match
curl -X POST $BASE/api/match \
  -H "Content-Type: application/json" \
  -d '{"height_cm": 178, "weight_kg": 72, "age": 25, "mode": "olympic"}'
# → {"archetype_id": "aerobic_engine", "user_bmi": 22.7, ...}

# Paralympic match
curl -X POST $BASE/api/match \
  -H "Content-Type: application/json" \
  -d '{"height_cm": 178, "weight_kg": 72, "age": 25, "mode": "paralympic"}'
# → {"archetype_id": "para_endurance_engine", ...}

# Dataset stats
curl $BASE/api/stats
# → {"total_records": 271116, "unique_athletes": 8108, ...}
```

> **Cold-start note:** First request after inactivity may take 5–10s as Cloud Run spins up. Subsequent requests respond in under 50ms.

Interactive Swagger UI: **[teamusa-oracle-api-789615763226.us-central1.run.app/docs](https://teamusa-oracle-api-789615763226.us-central1.run.app/docs)**

---

## 📡 API Reference

| Endpoint | Method | Description |
|---|---|---|
| `/health` | `GET` | Health check → `{"status":"ok"}` |
| `/api/stats` | `GET` | Dataset statistics (total records, athletes, years) |
| `/api/archetypes` | `GET` | All 6 Olympic archetypes with biometric profiles |
| `/api/para-archetypes` | `GET` | All 6 Paralympic archetypes |
| `/api/match` | `POST` | Biometric → archetype (Olympic or Paralympic) |
| `/api/chat` | `POST` | Gemini agent — full JSON response |
| `/api/chat-stream` | `POST` | Gemini agent — SSE streaming response |
| `/api/voice-chat-live` | `WebSocket` | Live voice session with audio I/O |
| `/api/location` | `POST` | Geocode city + great-circle distance to LA28 |
| `/api/timeline` | `GET` | 600-point scatter data for visualization |
| `/api/olympic-cities` | `GET` | All host cities with coordinates and medal counts |

**Match request body:**
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

-- Primary query surface (271,116 rows):
VIEW v_results_full
  Columns: id, name, sex, age, height_cm, weight_kg,
           noc, team_name, year, season, city, sport, event, medal
  medal values: 'Gold' | 'Silver' | 'Bronze' | NULL
```

> [!NOTE]
> **Historical data note:** This dataset preserves original Sports-Reference records. Minor discrepancies vs. modern IOC databases may exist (e.g., the 1900 Paris Games shows 32 women where the IOC retroactively recognizes 22, because some events were later de-certified). We intentionally preserve the more inclusive historical record.

---

## 🏆 Design Decisions

| Decision | Rationale |
|---|---|
| **K-means in-memory, not Gemini** | Archetype matching needs <5ms latency. Gemini is reserved for grounded narrative where latency is acceptable. |
| **Separate Olympic + Paralympic models** | Different biometric distributions require independent clustering. Same source data, different filters and centroids. |
| **Vertex AI (no API key)** | Authentication via `gcloud` ADC — no key rotation risk, works with both Cloud Run and local dev. |
| **SSE streaming for chat** | Progressive rendering feels live. No spinner waiting for a 5-second full response. |
| **Live Voice hybrid architecture** | Native Live model is great for voice I/O but doesn't reliably invoke SQL tools. DB-grounded answer is injected back for Gemini to speak. |
| **`trigger_map_view` tool** | Bridges AI conversation → 3D visualization automatically. No button click required. |
| **Shareable URL params** | `?h=&w=&age=` deep links encode any result so it can be shared and auto-reproduced. |
| **Firebase Hosting + Cloud Run** | Global CDN edge for the frontend; auto-scaling serverless backend. Zero cold-start penalty on the frontend. |

---

## 🛡️ Responsible AI

All AI responses are governed by explicit system instructions:

| Principle | Enforcement |
|---|---|
| **Conditional language only** | Responses use *"historically associated with"*, *"aggregate patterns suggest"* — never deterministic claims about individuals |
| **No individual athlete profiles** | AI is prohibited from naming, profiling, or predicting outcomes for specific athletes |
| **Aggregate data only** | All insights are drawn from population-level statistics, never individual records |
| **Olympic / Paralympic separated** | The two models are independent; Paralympic analysis always carries the proxy-sports disclaimer |
| **Historical scope enforced** | AI is scoped to the 1896–2016 dataset; post-2016 questions are explicitly declined |

### ✅ Data-Scope Compliance Attestation

This project explicitly meets the following responsible data-use requirements:

- ✅ **Filtered to US / Team USA scope only** — All biometric clustering, AI analysis, and fan-facing outputs are restricted to historical Team USA (NOC = `USA`) records. No global athlete data is surfaced to end users.
- ✅ **No finish times or specific scoring results** — The database schema and all 11 Gemini agent tools operate exclusively on biometric fields (`height_cm`, `weight_kg`, `age`), medal outcomes (`Gold/Silver/Bronze/NULL`), and demographic metadata. No race times, scores, or performance rankings are stored or queried.
- ✅ **No athlete names, images, or likenesses output** — The AI system prompt explicitly prohibits returning individual athlete names or identifiable information. Archetype illustrations are AI-generated representations of body types, not likenesses of real people.
- ✅ **Fan-facing results are aggregate and conditional** — All outputs presented to users are population-level averages with explicit conditional framing (e.g., *"athletes in this cluster historically showed…"*). No result is presented as a prediction or guarantee about any individual.

---

## 📊 Tech Stack

<table>
<tr><th>Layer</th><th>Technology</th></tr>
<tr><td>Frontend Framework</td><td>Next.js 16 (App Router, TypeScript)</td></tr>
<tr><td>3D Visualization</td><td>Three.js + react-three-fiber + @react-three/drei</td></tr>
<tr><td>AI / LLM</td><td>Google Gemini (Vertex AI) — function calling + Live API</td></tr>
<tr><td>Backend</td><td>FastAPI + Python 3.11 + Uvicorn</td></tr>
<tr><td>Database</td><td>Cloud SQL for PostgreSQL (271k rows)</td></tr>
<tr><td>ML Clustering</td><td>scikit-learn K-means (in-memory, <50ms inference)</td></tr>
<tr><td>Hosting (Frontend)</td><td>Firebase Hosting + Firebase App Hosting (Cloud Run)</td></tr>
<tr><td>Hosting (Backend)</td><td>Google Cloud Run (us-central1)</td></tr>
<tr><td>Geocoding</td><td>OpenStreetMap Nominatim (no API key)</td></tr>
<tr><td>Gesture Control</td><td>MediaPipe Hands (browser WebGL)</td></tr>
<tr><td>Animations</td><td>Framer Motion</td></tr>
<tr><td>Testing</td><td>pytest + httpx (37 tests, fully offline)</td></tr>
</table>

---

## 📄 License

Apache License 2.0 — see [LICENSE](LICENSE).

*Data: [Olympic History 1896–2016 Kaggle Dataset](https://www.kaggle.com/datasets/heesoo37/120-years-of-olympic-history-athletes-and-results) (CC0). All user-facing insights are aggregate, anonymized, and conditional.*

---

<div align="center">

**Built for the [Vibe Code for Gold with Google Hackathon](https://vibecodeforgoldwithgoogle.devpost.com/)**  
*Challenge 4: The Athlete Archetype Agent*

<br/>

*Powered by Google Cloud · Gemini API · Next.js · FastAPI · K-means*

</div>
