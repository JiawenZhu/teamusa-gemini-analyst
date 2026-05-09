# NEURIX — Technical Analysis & Learnings for Team USA Digital Mirror

> **Source Repo:** [github.com/yuyamei310/NEURIX-](https://github.com/yuyamei310/NEURIX-)
> **Live Demo:** `https://neurix-1012984487516.us-east1.run.app`
> **Category:** Google Cloud Hackathon Challenge 4 — Gemini-powered ethical AI archetype system
> **Last Analyzed:** 2026-05-08

---

## 1. Project Overview

NEURIX is a Next.js 14 application that answers: *"Where could your body belong in the story of Team USA?"* The user enters height, weight, age, and activity habits, then Gemini classifies them into one of four athletic archetypes (`power`, `endurance`, `technical`, `hybrid`) and generates a multi-perspective AI debrief across three "agent modes": **Advisor**, **Coach**, and **Mentor**.

Both NEURIX and Team USA Digital Mirror compete in the same hackathon space — both are Gemini-powered, Cloud Run–deployed, Olympics-themed AI classifiers — making this analysis especially valuable.

---

## 2. Architecture at a Glance

```
User (browser)
   │
   ▼
Next.js 14 App Router (frontend + API routes in one container)
   │
   ├── /api/analyze        → Streaming SSE: archetype + advisor + soul twins + reflection
   ├── /api/agent-mode     → Lazy-load: coach or mentor lens on demand
   └── /api/voice-parse    → Extract biometrics from free-form voice transcript
   │
   ▼
core/gemini.ts → @google/generative-ai (Gemini Developer API, NOT Vertex AI)
   │
   ▼
core/prompts.ts → Structured JSON-only prompt contracts
   │
   ▼
core/syntheticArchive.ts → Fallback (complete demo data if Gemini fails)
```

**Key architectural choice**: NEURIX uses a **fully integrated Next.js monolith** — no separate Python backend, no WebSockets, no Cloud SQL. Everything is TypeScript, server-side API routes with SSE streaming, and the Gemini Developer API (`@google/generative-ai`). This is significantly simpler than Team USA's Python + FastAPI + PostgreSQL + Vertex AI architecture.

---

## 3. Directory Structure

```
NEURIX/
├── app/
│   ├── api/
│   │   ├── agent-mode/route.ts     # Coach + Mentor Gemini calls
│   │   ├── analyze/route.ts        # Main SSE streaming pipeline
│   │   └── voice-parse/route.ts    # Voice transcript → biometrics
│   ├── onboarding/page.tsx         # Intro flow
│   ├── scan/page.tsx               # Biometric input UI
│   ├── thinking/page.tsx           # AI working animation page
│   ├── results/page.tsx            # Full debrief output
│   └── data-provenance/page.tsx    # Ethics/data transparency page
│
├── core/                           # AI + data logic (pure TypeScript)
│   ├── classifier.ts               # LOCAL deterministic BMI/habit classifier
│   ├── gemini.ts                   # Thin Gemini client wrapper
│   ├── prompts.ts                  # All prompt builder functions
│   ├── publicArchive.ts            # Reads generated aggregate clusters
│   ├── syntheticArchive.ts         # Deterministic fallback debrief data
│   └── dnaExport.ts                # html2canvas → shareable card
│
├── store/neurixStore.ts            # Zustand with localStorage persistence
├── types/neurix.ts                 # Comprehensive shared type contracts
├── data/
│   ├── raw/sample-team-usa-public.csv
│   └── processed/team-usa-archetype-clusters.json
├── scripts/build-public-archive.mjs  # CSV → anonymous aggregate clusters
├── skills/
│   ├── advisor.md
│   ├── coach.md
│   └── mentor.md
└── docs/screenshots/               # Devpost screenshots
```

---

## 4. Tech Stack Comparison

| Dimension | NEURIX | Team USA Digital Mirror |
|---|---|---|
| **Framework** | Next.js 14 (monolith) | Next.js 14 (frontend) + FastAPI (backend) |
| **Language** | TypeScript only | TypeScript + Python |
| **AI SDK** | `@google/generative-ai` (Developer API) | `google-genai` (Vertex AI SDK) |
| **AI Model** | `gemini-3-flash-preview` | `gemini-3.1-flash-lite-preview` (text) + `gemini-live-2.5-flash-native-audio` (voice) |
| **Live/Voice** | Web Speech API (browser transcript only) | Gemini Live API (real-time streaming) |
| **State** | Zustand + localStorage persistence | React useState (lost on refresh) |
| **3D Visual** | Spline iframe + Three.js | Three.js Globe (custom WebGL) |
| **Data** | CSV → anonymous JSON clusters | PostgreSQL via Cloud SQL (150k+ real records) |
| **Streaming** | SSE via ReadableStream | SSE via FastAPI StreamingResponse |
| **Deployment** | Cloud Run (single container) | Cloud Run (2 containers: API + frontend) |
| **Export** | html2canvas → DNA card image | None currently |

---

## 5. Notable Patterns & Learnings

### 5.1 The Streaming Pipeline Pattern

NEURIX's `/api/analyze` route uses a single streaming `ReadableStream` to sequentially push multiple structured SSE events:

```typescript
// One stream, many typed events, parallel AI calls
const [archetypeRaw, advisorRaw] = await Promise.all([
  callGemini(buildArchetypePrompt(bio)),   // parallel!
  callGemini(buildAdvisorPrompt(bio)),
])
send({ type: 'archetype', data: archetypeResult })
send({ type: 'advisor', data: advisorResult })
send({ type: 'insight_peek', data: firstSentence })  // stream first sentence early
send({ type: 'soul_twins', data: twins })
send({ type: 'reflection', data: reflection })
send({ type: 'done', data: null })
```

**Takeaway for Team USA:** Fire archetype + advisor analyses in parallel (`Promise.all`) rather than sequentially. For Python: `asyncio.gather()`.

---

### 5.2 The Timeout Wrapper

Every Gemini call is wrapped in a shared timeout utility with labeled error messages:

```typescript
async function withTimeout<T>(promise: Promise<T>, label: string, timeoutMs = 12000): Promise<T> {
  const timeout = new Promise<never>((_, reject) =>
    setTimeout(() => reject(new Error(`${label} timed out after ${timeoutMs}ms`)), timeoutMs)
  )
  return await Promise.race([promise, timeout])
}
```

**Takeaway for Team USA:** Our `ask_gemini()` has no timeout guard. Add `asyncio.wait_for(coro, timeout=15.0)` to all Gemini calls in `olympic_agent.py`.

---

### 5.3 The Graceful Fallback Architecture

NEURIX degrades gracefully at every AI boundary:

```typescript
} catch (err) {
  const fallback = buildDemoFallbackAnalysis(bio)  // complete synthetic data
  send({ type: 'archetype', data: fallback.archetype })
  send({ type: 'advisor', data: fallback.advisor })
  send({ type: 'soul_twins', data: fallback.soul_twins })
  send({ type: 'done', data: { fallback: true, reason: String(err) } })
}
```

`syntheticArchive.ts` pre-bakes complete, realistic response objects for every archetype. The app runs a full demo without a live API key.

**Takeaway for Team USA:** Pre-bake a `DEMO_FALLBACK_RESPONSES` dict in Python with impressive-looking analytical responses. Demos should never fail visibly at a hackathon.

---

### 5.4 The Local Pre-Classifier Pattern

NEURIX runs a **deterministic local classifier** *before* calling Gemini, giving instant feedback:

```typescript
export function localClassify(height, weight, age, habits): LocalClassification {
  const bmi = weight / Math.pow(height / 100, 2)
  if (bmi > 24 && hasStrength && !hasEndurance) return { archetype: 'power', confidence: 0.85 }
  if (bmi < 22 && hasEndurance && !hasStrength) return { archetype: 'endurance', confidence: 0.82 }
  if (bmi < 21 && (hasGymnastics || hasRacket)) return { archetype: 'technical', confidence: 0.79 }
  return { archetype: 'hybrid', confidence: 0.65 }
}
```

The scan HUD shows the local classification instantly while Gemini processes in the background. A "drift label" appears if Gemini's result differs from the local prediction.

**Takeaway for Team USA:** Expose a lightweight BMI + sport scoring preview on the frontend that updates instantly as the user drags sliders, before the API call returns.

---

### 5.5 Structured JSON-Only Prompt Contracts

Every prompt enforces `"return JSON only, no markdown, no preamble"`:

```typescript
`Return JSON only:
{
  "archetype": "power | endurance | technical | hybrid",
  "confidence": 0.0–1.0,
  "reasoning": "2–3 sentence explanation using conditional phrasing",
  "ethics_note": "${ETHICS_NOTE}"
}`
```

And a robust parser extracts JSON even from malformed responses:

```typescript
export function parseGeminiJSON<T>(text: string): T {
  const cleaned = text.replace(/^```(?:json)?\s*/i, '').replace(/\s*```$/, '').trim()
  try {
    return JSON.parse(cleaned) as T
  } catch {
    const start = cleaned.search(/[{[]/)
    const end = Math.max(cleaned.lastIndexOf('}'), cleaned.lastIndexOf(']'))
    if (start !== -1 && end > start) return JSON.parse(cleaned.slice(start, end + 1)) as T
    throw new Error(...)
  }
}
```

**Takeaway for Team USA:** Enforce JSON-schema contracts in our prompts and add a Python equivalent JSON extractor for structured results.

---

### 5.6 Agent Mode System (3 AI Personas)

Three distinct AI lenses on the same biometric input:

| Agent Mode | Persona | Key Output Fields |
|---|---|---|
| **Advisor** | Analytical — *why* this archetype? | `key_factors[]`, `historical_context`, `confidence_explanation` |
| **Coach** | Action-oriented — *what sport*? | `sport_recommendations[]` (≥2 Paralympic), `training_phases[]` |
| **Mentor** | Story-driven — *where in 4 years to LA28*? | `timeline[]` (4 phases), `la28_connection`, `soul_message` |

The Coach always includes ≥2 Paralympic picks by prompt contract. The Mentor always builds a 4-phase timeline ending at LA28.

**Takeaway for Team USA:** Apply NEURIX's agent persona pattern to differentiate chat response styles based on user intent ("Show me data" / "Inspire me" / "Train me").

---

### 5.7 "Soul Twins" — Historical Archive Echoes

Instead of naming real athletes, NEURIX generates 2-3 **anonymous synthetic archive nodes** from different eras:

```typescript
{
  "era": "1948 · London",
  "archetype_label": "anonymous power archive node",  // never a real name
  "sport": "shot put",
  "games_type": "Olympic",
  "similarity_note": "Similar power-to-weight ratio and strength background...",
}
```

At least one soul twin must be Paralympic — enforced by a runtime parity check that adds a synthetic fallback if Gemini doesn't include one.

**Takeaway for Team USA:** Add historical era storytelling to our ArchetypeCard. "Athletes with similar builds have historically appeared in [sport] at [era]" creates emotional resonance without naming real people.

---

### 5.8 Ethics Infrastructure — Built-In, Not Bolted On

A shared `ETHICS_NOTE` constant is injected into **every** Gemini response field:

```typescript
const ETHICS_NOTE = "This analysis uses a synthetic, anonymized, Team USA-inspired archetype archive. Not real athlete data, not a performance guarantee, not official Team USA material."
```

There's also a dedicated `/data-provenance` page explaining data sources, anonymization, and Olympic/Paralympic parity commitment.

**Takeaway for Team USA:** Create a `/provenance` route explaining our 1896–2016 Kaggle dataset, NOC filtering, K-means clustering, and why we never expose individual athlete records. Judges notice responsible AI evidence.

---

### 5.9 Zustand State with Persistent User Memory

Zustand + `persist` middleware keeps state across sessions AND deliberately preserves `userProfile` through `reset()`:

```typescript
setResult: (r) => {
  // Automatically saves to persistent user memory
  set({
    result: r,
    userProfile: { height, weight, archetype, lastUpdated: new Date().toISOString() }
  })
},
reset: () => set({
  ...defaults,
  userProfile: state.userProfile  // INTENTIONALLY preserved — long-term memory
})
```

The stored `userProfile` is injected into future Gemini prompts for personalization.

**Takeaway for Team USA:** Add Zustand with persist. Preserve the user's archetype match between page navigations and chat sessions.

---

### 5.10 Shareable DNA Export Card

```typescript
import html2canvas from 'html2canvas'

export async function exportDNACard(elementId: string): Promise<void> {
  const element = document.getElementById(elementId)
  const canvas = await html2canvas(element, { backgroundColor: '#0a0a0a' })
  const link = document.createElement('a')
  link.download = 'neurix-dna-card.png'
  link.href = canvas.toDataURL('image/png')
  link.click()
}
```

**Takeaway for Team USA:** A shareable "Team USA Match Card" (archetype, top sports, biometrics, 3D globe thumbnail) would be a strong viral differentiator on Devpost.

---

### 5.11 Voice Input → Structured Biometrics via Gemini

NEURIX's voice pipeline: browser Web Speech API → transcript string → Gemini semantic parser:

```
Browser Web Speech API → raw transcript
  → POST /api/voice-parse
  → Gemini extracts { height, weight, age, habits, confirmation_message }
  → UI populates sliders
```

This is different from our Gemini Live approach — it uses Gemini as a **natural language parser** rather than a real-time streaming voice agent.

**Takeaway for Team USA:** Useful pattern for future features where you need structured extraction from voice without the complexity of a full Live session.

---

## 6. Key Differentiators

### Where NEURIX Excels

| Feature | NEURIX Advantage |
|---|---|
| **Fallback Resilience** | Complete synthetic debrief — demos never break |
| **Shareable Artifact** | DNA card export creates a viral moment |
| **Ethics Page** | Dedicated provenance page signals responsible AI |
| **Multi-Persona AI** | Advisor/Coach/Mentor → richer personalization |
| **Soul Twins** | Emotional historical connection without legal risk |
| **State Persistence** | Zustand memory → app "knows" returning users |
| **Simpler Stack** | Single TypeScript monolith → easier to deploy/debug |

### Where Team USA Digital Mirror Excels

| Feature | Our Advantage |
|---|---|
| **Real Data** | Live PostgreSQL with 150k+ real Olympic records (1896–2016) |
| **Real-Time Voice** | Gemini Live API with native audio — not just transcript parsing |
| **Interactive Globe** | 3D WebGL globe with city fly-to and medal visualization |
| **Deeper Analytics** | SQL tool-calling agent answers any factual Olympic question |
| **Production Auth** | Vertex AI with service accounts — not API key auth |
| **Live Streaming Chat** | Full conversation history with real data grounding |

---

## 7. Immediately Actionable Improvements

| Priority | Feature | Effort |
|---|---|---|
| **P1** | Add demo fallback responses to `olympic_agent.py` | Low |
| **P2** | Add `asyncio.wait_for()` timeouts to all Gemini calls | Low |
| **P3** | Add parallel AI calls with `asyncio.gather()` | Low |
| **P4** | Enforce JSON-schema prompt contracts + robust parser | Medium |
| **P5** | Add Zustand + localStorage state persistence | Medium |
| **P6** | Create `/provenance` ethics page | Medium |
| **P7** | Add `html2canvas` shareable Match Card export | Medium |
| **P8** | Add local instant archetype preview as sliders change | Medium |
| **P9** | Add "Soul Twins" historical echo section to results | High |
| **P10** | Implement Advisor/Coach/Mentor response personas in Chat | High |

---

## 8. References

- **Source Repository**: https://github.com/yuyamei310/NEURIX-
- **Live Demo**: https://neurix-1012984487516.us-east1.run.app
- **Key Files Analyzed**:
  - `core/prompts.ts` — prompt engineering contracts
  - `core/gemini.ts` — Gemini client + JSON parser
  - `app/api/analyze/route.ts` — SSE streaming pipeline
  - `store/neurixStore.ts` — Zustand state management
  - `core/classifier.ts` — local BMI classifier
  - `types/neurix.ts` — TypeScript type contracts
  - `ARCHITECTURE.md` — system design
  - `PROMPTS.md` — prompt documentation
  - `Dockerfile` — Cloud Run container setup
