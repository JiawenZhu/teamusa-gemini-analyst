# 🏅 Team USA x Google Cloud Hackathon — Compliance Checklist

This document maps every official hackathon rule to a specific, verifiable implementation detail in this project.

---

## 🤖 AI & Media Guidelines

### Q: Can I use GenAI to create images?

> **Rule:** All GenAI Media MUST be animations ONLY (no real people/athletes). Strict prohibition on athlete Name, Image, or Likeness (NIL). Output must not be at the individual level.

| Requirement | Status | Implementation |
|---|---|---|
| No real people/athletes in generated images | ✅ | All 6 archetype illustrations are AI-generated abstract body-type representations (e.g., silhouettes and motion blur). No real athlete faces or likenesses. |
| No NIL output from AI | ✅ | Gemini system prompt explicitly states: *"Never name, profile, or output information that could identify a specific athlete."* |
| Output not at individual level | ✅ | All fan-facing results are K-means cluster averages across hundreds of historical records, not individual athlete data. |

---

### Q: Can I use other GenAI tools (like ChatGPT)?

> **Rule:** Only Google Cloud Generative AI tools are permitted. Project must primarily leverage Google Cloud products.

| Requirement | Status | Implementation |
|---|---|---|
| Only Google Cloud AI used | ✅ | All AI is powered by **Gemini via Vertex AI** (`google-cloud-aiplatform` SDK). No OpenAI, Anthropic, or other providers are called. |
| Primarily Google Cloud products | ✅ | Stack: **Cloud Run** (backend API), **Firebase Hosting + App Hosting** (frontend), **Cloud SQL for PostgreSQL** (data), **Vertex AI** (Gemini). 100% GCP. |

---

## 📊 Data & Intellectual Property

### Q: Which Datasets can I use?

> **Rule:** Publicly available Team USA datasets only. Finish placement and medals are permitted. Finish times and specific scoring are prohibited. US scope only.

| Requirement | Status | Implementation |
|---|---|---|
| Publicly available datasets only | ✅ | Uses the [120 Years of Olympic History — Kaggle CC0 Dataset](https://www.kaggle.com/datasets/heesoo37/120-years-of-olympic-history-athletes-and-results). Fully public, CC0 licensed. |
| Official Team USA website / open-source repos | ✅ | Data sourced from the referenced Kaggle open-source repository of historical Olympic performance. |
| Finish placement and medals are permitted | ✅ | The schema stores `medal` as `Gold / Silver / Bronze / NULL`. Used for medal rate analysis. |
| **No finish times or specific scoring results** | ✅ | The database schema contains **no timing columns** (`height_cm`, `weight_kg`, `age`, `medal` only). None of the 11 Gemini SQL tools query or return race times, lap splits, or scores. |
| US scope only — no international data surfaced | ✅ | All 11 Gemini agent tools apply a hard `WHERE noc = 'USA'` clause. The K-means models were trained exclusively on USA records. International rows exist in the raw DB but are **never surfaced** to end users. |
| No Team USA multimedia (NIL) | ✅ | No photos, videos, or audio of real athletes anywhere in the project. |

---

### Q: Can I use any Olympics / IOC Content?

> **Rule:** No IOC or USOPC IP. No five-ring logo. No Olympic torch. No athlete names/photos/video. Avoid "Olympic Games" as app title. No Games footage, unlicensed music, or restricted terminology.

| Requirement | Status | Implementation |
|---|---|---|
| No five-ring logo | ✅ | No Olympic rings appear anywhere in the UI, README, or assets. |
| No Olympic torch imagery | ✅ | No torch imagery used. Hero section uses a generic athlete silhouette background image. |
| No athlete names, photos, or video | ✅ | Archetype cards use AI-generated abstract illustrations. The AI system prompt prohibits naming individuals. |
| App title avoids "Olympic Games" | ✅ | App title is **"Team USA Digital Mirror"** — no "Olympic Games" in the product name. |
| No Games footage | ✅ | No video content in the project whatsoever. |
| No unlicensed music | ✅ | No audio/music assets in the project. |
| No restricted terminology in app title | ✅ | Confirmed — title is "Team USA Digital Mirror." |

---

### Q: Can I use Olympic terminology?

> **Rule:** No restricted terminology. Use approved references for Games. Never use "former" or "past" Olympian. Use official sport names, not NGB names.

| Requirement | Status | Implementation |
|---|---|---|
| No banned Games terminology | ✅ | UI and README use *"Olympic Games [City] [Year]"* format when referencing historical events. |
| LA28 references use "LA28 Games" | ✅ | The LA28 Distance Tracker feature uses the label **"LA28 Games"** throughout. |
| Never "former" or "past" Olympian | ✅ | No such language appears anywhere in the UI or AI responses. The system prompt does not use these terms. |
| Official sport names (not NGB names) | ✅ | Sport names are pulled directly from the dataset (e.g., `Swimming`, not `USA Swimming`; `Athletics`, not `USATF`). |

---

## ⚙️ Technical Requirements & Deployment

### Q: Which tools and technologies are required?

> **Rule:** Must use Gemini API and Google Cloud deployment. App must have a live, accessible URL.

| Requirement | Status | Implementation |
|---|---|---|
| Gemini API powers core logic | ✅ | **Gemini 1.5 Pro** (via Vertex AI) is the agentic analyst engine with 11 SQL-backed function-calling tools. **Gemini Live API** powers real-time voice. |
| Deployed and hosted on Google Cloud | ✅ | Backend: **Cloud Run** (`teamusa-oracle-api-789615763226.us-central1.run.app`). Frontend: **Firebase App Hosting + Firebase Hosting** (`teamusa-8b1ba.web.app`). |
| Live, working URL accessible to judges | ✅ | **[teamusa-8b1ba.web.app](https://teamusa-8b1ba.web.app)** — fully public, no login required. |

---

### Q: What type of URL is expected?

> **Rule:** Hosted project such as web UI, Chrome Extension, or mobile app. Highly encouraged.

| Requirement | Status | Implementation |
|---|---|---|
| Hosted web UI | ✅ | Full Next.js 16 web application live at `teamusa-8b1ba.web.app`. |

---

### Q: Does "Public Code Repository" mean open-source?

> **Rule:** Yes. Repository must be public. README must include clear testing instructions.

| Requirement | Status | Implementation |
|---|---|---|
| Public repository | ✅ | [github.com/JiawenZhu/teamusa-gemini-analyst](https://github.com/JiawenZhu/teamusa-gemini-analyst) — fully public. |
| README includes testing instructions | ✅ | README contains a full **37-test pytest suite** (`pytest test_api.py -v`) and an 8-step **Manual Verification Checklist** with exact inputs and expected outputs. |

---

### Q: How do I prove the project is running on Google Cloud?

> **Rule:** Screen recording of GCP console OR link to code file demonstrating Google Cloud API usage.

| Requirement | Status | Implementation |
|---|---|---|
| Code demonstrating GCP usage | ✅ | [`backend/main.py`](./backend/main.py) — uses `google.cloud.aiplatform` for Vertex AI Gemini calls. [`deploy.sh`](./deploy.sh) — `gcloud run deploy` commands show Cloud Run deployment. |
| Live Cloud Run service URL | ✅ | [teamusa-oracle-api-789615763226.us-central1.run.app/docs](https://teamusa-oracle-api-789615763226.us-central1.run.app/docs) — Swagger UI confirming live GCP backend. |

---

## 📢 Submissions & Judging

### Q: How can I share my project with the judges?

| Requirement | Status | Implementation |
|---|---|---|
| Public live demo URL provided | ✅ | **[teamusa-8b1ba.web.app](https://teamusa-8b1ba.web.app)** — no login required. |
| No private login credentials needed | ✅ | App is fully public. |

---

### Q: Can I share my project on social media?

> **Rule:** CANNOT share on any social media (LinkedIn, X, YouTube) without express Sponsor permission. Restricted Content rules apply.

| Requirement | Status |
|---|---|
| Not shared on LinkedIn | ✅ |
| Not shared on X / Twitter | ✅ |
| Not shared on YouTube (public) | ✅ |
| No public promotion of participation | ✅ |

---

## 🔍 Summary

| Category | Compliant |
|---|---|
| AI & Media (GenAI images, tools) | ✅ |
| Dataset sourcing (public, CC0) | ✅ |
| Data prohibitions (no times, no NIL) | ✅ |
| US-scope enforcement | ✅ |
| IOC / USOPC IP restrictions | ✅ |
| Olympic terminology | ✅ |
| Technical requirements (Gemini + GCP) | ✅ |
| Public repository + testing docs | ✅ |
| Social media restrictions | ✅ |

**All rules confirmed compliant as of submission date.**
