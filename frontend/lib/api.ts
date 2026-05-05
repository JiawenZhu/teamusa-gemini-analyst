// lib/api.ts — TeamUSA Digital Mirror API client

export const API = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:8000";

export interface ArchetypeProfile {
  id: string; label: string; icon: string; color: string;
  description: string;
  olympic_sports: string[]; paralympic_sports: string[];
  athlete_count?: number; unique_athletes?: number;
  avg_height?: number; avg_weight?: number; avg_bmi?: number;
  std_height?: number; std_weight?: number;
  medal_rate?: number; year_min?: number; year_max?: number;
  top_sports?: { Sport: string; count: number; medals: number }[];
}
export interface DatasetStats {
  total_records: number; unique_athletes: number;
  sports_count: number; events_count: number;
  year_min: number; year_max: number;
  total_medals: number; gold_medals: number;
  data_source: string;
  archetype_counts: Record<string, number>;
}
export interface MatchResult {
  archetype_id: string;
  archetype: ArchetypeProfile;
  user_bmi: number;
  closest_athletes: { Sport: string; Year: number; Height: number; Weight: number; Sex: string; Medal: string }[];
  percentile_note: string;
}
export interface TimelinePoint {
  Year: number; Height: number; Weight: number; BMI: number;
  Sport: string; archetype: string; Sex: string; has_medal: number;
}
export interface LocationData {
  city: string;
  lat: number;
  lng: number;
  distance_km: number;
  distance_miles: number;
}


export async function fetchStats(): Promise<DatasetStats> {
  return fetch(`${API}/api/stats`).then(r => r.json());
}
export async function fetchArchetypes(): Promise<ArchetypeProfile[]> {
  return fetch(`${API}/api/archetypes`).then(r => r.json()).then(d => d.archetypes);
}
export async function matchBiometrics(height_cm: number, weight_kg: number, age?: number, mode: "olympic" | "paralympic" = "olympic"): Promise<MatchResult> {
  return fetch(`${API}/api/match`, {
    method: "POST", headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ height_cm, weight_kg, age, mode }),
  }).then(r => r.json());
}
export async function registerLocation(city_name: string, session_id?: string): Promise<LocationData> {
  const res = await fetch(`${API}/api/location`, {
    method: "POST", headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ city_name, session_id }),
  });
  if (!res.ok) {
    const error = await res.json();
    throw new Error(error.detail || "Location lookup failed");
  }
  return res.json();
}
export async function fetchTimeline(): Promise<TimelinePoint[]> {
  return fetch(`${API}/api/timeline`).then(r => r.json()).then(d => d.athletes || []);
}
export async function sendChat(
  message: string,
  archetype_id: string,
  history: { role: string; text: string }[] = []
): Promise<{ text: string; mapTrigger?: { city: string; lat: number; lng: number } }> {
  const d = await fetch(`${API}/api/chat`, {
    method: "POST", headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ message, archetype_id, history }),
  }).then(r => r.json());
  return { text: d.response || "", mapTrigger: d.mapTrigger };
}

/**
 * Streaming version of sendChat — calls /api/chat-stream (SSE).
 *
 * The backend now embeds pre-synthesized Gemini TTS audio inside each SSE event
 * using progressive grouping:
 *   Group 0: 1 sentence  → audio ready almost immediately (min TTFA)
 *   Group 1: 2 sentences → arrives while group 0 is playing
 *   Group 2+:3 sentences → background; plays after previous group finishes
 *
 * onChunk(text, audiob64|null, index) — fires per group as it arrives from SSE.
 * onDone(fullText) — fires when the stream completes.
 */
export async function sendChatStream(
  message: string,
  archetype_id: string,
  history: { role: string; text: string }[],
  onChunk: (text: string, audio: string | null, index: number) => void,
  onDone: (fullText: string) => void,
  signal?: AbortSignal,
  onMapTrigger?: (city: string, lat: number, lng: number) => void,
): Promise<void> {
  const res = await fetch(`${API}/api/chat-stream`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ message, archetype_id, history }),
    signal,
  });

  if (!res.ok || !res.body) {
    throw new Error(`Stream failed: ${res.status}`);
  }

  const reader  = res.body.getReader();
  const decoder = new TextDecoder();
  let buffer = "";
  const collected: string[] = [];

  while (true) {
    const { done, value } = await reader.read();
    if (done) break;

    buffer += decoder.decode(value, { stream: true });
    const lines = buffer.split("\n\n");
    buffer = lines.pop() ?? "";

    for (const line of lines) {
      const dataLine = line.trim();
      if (!dataLine.startsWith("data:")) continue;
      try {
        const payload = JSON.parse(dataLine.slice(5).trim()) as {
          text: string; audio: string | null; index: number; done: boolean;
          mapTrigger?: { city: string; lat: number; lng: number };
        };
        // Feature B: handle globe city trigger events
        if (payload.mapTrigger && onMapTrigger) {
          onMapTrigger(payload.mapTrigger.city, payload.mapTrigger.lat, payload.mapTrigger.lng);
        }
        if (payload.done) {
          onDone(collected.join(" "));
          return;
        }
        if (payload.text) {
          collected.push(payload.text);
          onChunk(payload.text, payload.audio ?? null, payload.index);
        }
      } catch {
        // Malformed SSE line — skip
      }
    }
  }

  onDone(collected.join(" "));
}

export async function fetchParaClassificationExplainer(
  archetype_id: string,
  sport?: string,
  user_height_cm?: number,
  user_weight_kg?: number,
): Promise<{ explainer: string; archetype: ArchetypeProfile }> {
  return fetch(`${API}/api/para-classification-explainer`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      archetype_id,
      sport: sport ?? "",
      user_height_cm: user_height_cm ?? 0,
      user_weight_kg: user_weight_kg ?? 0,
    }),
  }).then(r => r.json());
}
