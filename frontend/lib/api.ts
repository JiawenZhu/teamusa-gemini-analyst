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
