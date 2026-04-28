// lib/api.ts — TeamUSA Digital Mirror API client

export const API = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";

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
 * Invokes onChunk(sentence, index) for each sentence as it arrives,
 * then onDone(fullText) when the stream completes.
 * Use this when voice is enabled to start TTS immediately per chunk.
 */
export async function sendChatStream(
  message: string,
  archetype_id: string,
  history: { role: string; text: string }[],
  onChunk: (sentence: string, index: number) => void,
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

  const reader = res.body.getReader();
  const decoder = new TextDecoder();
  let buffer = "";
  const collected: string[] = [];

  while (true) {
    const { done, value } = await reader.read();
    if (done) break;

    buffer += decoder.decode(value, { stream: true });
    const lines = buffer.split("\n\n");
    buffer = lines.pop() ?? "";  // keep incomplete last chunk

    for (const line of lines) {
      const dataLine = line.trim();
      if (!dataLine.startsWith("data:")) continue;
      try {
        const payload = JSON.parse(dataLine.slice(5).trim()) as {
          chunk: string; index: number; done: boolean;
        };
        if (payload.done) {
          onDone(collected.join(" "));
          return;
        }
        if (payload.chunk) {
          collected.push(payload.chunk);
          onChunk(payload.chunk, payload.index);
        }
      } catch {
        // Malformed SSE line — skip
      }
    }
  }

  // Fallback if stream ended without a done event
  onDone(collected.join(" "));
}
