// lib/api.ts — TeamUSA Digital Mirror API client

export const API = "http://127.0.0.1:8000";

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

export async function fetchStats(): Promise<DatasetStats> {
  return fetch(`${API}/api/stats`).then(r => r.json());
}
export async function fetchArchetypes(): Promise<ArchetypeProfile[]> {
  return fetch(`${API}/api/archetypes`).then(r => r.json()).then(d => d.archetypes);
}
export async function matchBiometrics(height_cm: number, weight_kg: number, age?: number): Promise<MatchResult> {
  return fetch(`${API}/api/match`, {
    method: "POST", headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ height_cm, weight_kg, age }),
  }).then(r => r.json());
}
export async function fetchTimeline(): Promise<TimelinePoint[]> {
  return fetch(`${API}/api/timeline`).then(r => r.json()).then(d => d.athletes || []);
}
export async function sendChat(message: string, archetype_id: string, history: {role: string, text: string}[] = []): Promise<string> {
  const d = await fetch(`${API}/api/chat`, {
    method: "POST", headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ message, archetype_id, history }),
  }).then(r => r.json());
  return d.response || "";
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
        };
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
