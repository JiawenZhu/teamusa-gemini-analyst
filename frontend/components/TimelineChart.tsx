"use client";
import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import type { TimelinePoint, ArchetypeProfile, MatchResult } from "@/lib/api";

const W = 600, H = 260, PAD = 40;
const minY = 140, maxY = 220, minX = 1890, maxX = 2020;
const sx = (year: number) => PAD + ((year - minX) / (maxX - minX)) * (W - PAD * 2);
const sy = (ht: number) => H - PAD - ((ht - minY) / (maxY - minY)) * (H - PAD * 2);

const archColor: Record<string, string> = {
  powerhouse: "#EF4444", aerobic_engine: "#3B82F6", explosive_athlete: "#F59E0B",
  precision_maestro: "#8B5CF6", aquatic_titan: "#06B6D4", agile_competitor: "#10B981",
};

export function TimelineChart({
  timeline,
  archetypes,
  result,
  h,
  accent,
}: {
  timeline: TimelinePoint[];
  archetypes: ArchetypeProfile[];
  result: MatchResult | null;
  h: string;
  accent: string;
}) {
  const [open, setOpen] = useState(false);
  if (timeline.length === 0) return null;

  return (
    <motion.section
      initial={{ opacity: 0, y: 30 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: "-50px" }}
      transition={{ duration: 0.6 }}
      style={{ maxWidth: 1100, margin: "0 auto", padding: "0 24px 64px" }}
    >
      {/* Collapsible header */}
      <button
        onClick={() => setOpen(v => !v)}
        style={{
          display: "flex", alignItems: "center", gap: 12, width: "100%",
          background: "var(--bg-card)", border: "1px solid var(--border-color)",
          borderRadius: open ? "16px 16px 0 0" : 16,
          padding: "18px 24px", cursor: "pointer",
          transition: "border-radius 0.2s, background 0.2s",
          textAlign: "left", color: "var(--text-main)",
        }}
        onMouseEnter={e => (e.currentTarget as HTMLButtonElement).style.background = "var(--bg-main)"}
        onMouseLeave={e => (e.currentTarget as HTMLButtonElement).style.background = "var(--bg-card)"}
      >
        <span style={{ fontSize: 20 }}>📈</span>
        <div style={{ flex: 1 }}>
          <div style={{ fontSize: 16, fontWeight: 800 }}>120-Year Athlete Timeline</div>
          <div style={{ fontSize: 12, color: "var(--text-sub)", marginTop: 2 }}>Height distribution of Team USA athletes 1896–2016, colored by archetype</div>
        </div>
        <motion.span
          animate={{ rotate: open ? 180 : 0 }}
          transition={{ duration: 0.2 }}
          style={{ fontSize: 13, color: "var(--text-sub)", fontWeight: 600, display: "inline-block" }}
        >▼</motion.span>
      </button>

      <AnimatePresence initial={false}>
        {open && (
          <motion.div
            key="timeline-body"
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.35, ease: "easeInOut" }}
            style={{ overflow: "hidden" }}
          >
            <div style={{ background: "var(--bg-card)", border: "1px solid var(--border-color)", borderTop: "none", borderRadius: "0 0 16px 16px", padding: 16, overflowX: "auto" }}>
              <svg viewBox={`0 0 ${W} ${H}`} style={{ width: "100%", maxHeight: 260 }}>
                <line x1={PAD} y1={H - PAD} x2={W - PAD} y2={H - PAD} stroke="var(--border-color)" />
                <line x1={PAD} y1={PAD} x2={PAD} y2={H - PAD} stroke="var(--border-color)" />
                {[1900, 1920, 1940, 1960, 1980, 2000, 2016].map(yr => (
                  <text key={yr} x={sx(yr)} y={H - PAD + 14} textAnchor="middle" fontSize={9} fill="var(--text-sub)">{yr}</text>
                ))}
                {[150, 160, 170, 180, 190, 200, 210].map(ht => (
                  <text key={ht} x={PAD - 4} y={sy(ht) + 3} textAnchor="end" fontSize={9} fill="var(--text-sub)">{ht}</text>
                ))}
                {timeline.map((pt, i) => (
                  <circle key={i}
                    cx={sx(pt.Year)} cy={sy(pt.Height)}
                    r={pt.has_medal ? 3.5 : 2}
                    fill={archColor[pt.archetype] || "var(--text-sub)"}
                    opacity={pt.has_medal ? 0.9 : 0.4}
                  />
                ))}
                {result && (
                  <circle cx={sx(2024)} cy={sy(parseFloat(h))} r={7} fill="white" stroke={accent} strokeWidth={2.5} />
                )}
              </svg>
              <div style={{ display: "flex", flexWrap: "wrap", gap: "8px 16px", marginTop: 8, paddingLeft: 40 }}>
                {Object.entries(archColor).map(([id, col]) => {
                  const a = archetypes.find(x => x.id === id);
                  return a ? (
                    <div key={id} style={{ display: "flex", alignItems: "center", gap: 5, fontSize: 11, color: "var(--text-sub)" }}>
                      <div style={{ width: 8, height: 8, borderRadius: "50%", background: col }} />
                      {a.label.replace("The ", "")}
                    </div>
                  ) : null;
                })}
                <div style={{ display: "flex", alignItems: "center", gap: 5, fontSize: 11, color: "var(--text-muted)" }}>
                  <div style={{ width: 8, height: 8, borderRadius: "50%", background: "var(--text-main)" }} />
                  You (2026)
                </div>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.section>
  );
}
