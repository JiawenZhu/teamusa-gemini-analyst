"use client";
import { motion } from "framer-motion";
import type { ArchetypeProfile, DatasetStats } from "@/lib/api";

const fmt = (n: number) => n.toLocaleString();

export function ArchetypeExplorer({
  archetypes,
  stats,
  selected,
  setSelected,
}: {
  archetypes: ArchetypeProfile[];
  stats: DatasetStats | null;
  selected: ArchetypeProfile | null;
  setSelected: (arch: ArchetypeProfile | null) => void;
}) {
  return (
    <section id="archetypes-section" style={{ maxWidth: 1100, margin: "0 auto", padding: "56px 16px" }}>
      <h2 style={{ textAlign: "center", fontSize: 28, fontWeight: 800, marginBottom: 8 }}>
        The 6 Archetypes of <span style={{ color: "#C9A227" }}>Team USA</span>
      </h2>
      <p style={{ textAlign: "center", color: "var(--text-sub)", marginBottom: 40, fontSize: 14 }}>
        K-means clustering of {fmt(stats?.total_records || 0)} athlete biometric records · 1896–2016
      </p>
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill,minmax(min(240px,100%),1fr))", gap: 16 }}>
        {archetypes.map((a, i) => (
          <motion.button 
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: "-50px" }}
            transition={{ duration: 0.5, delay: i * 0.1 }}
            key={a.id} className="card-hover" onClick={() => setSelected(selected?.id === a.id ? null : a)}
            style={{
              background: selected?.id === a.id ? `${a.color}18` : "var(--bg-card)",
              border: `1px solid ${selected?.id === a.id ? a.color + "80" : "var(--border-color)"}`,
              borderRadius: 16, padding: 24, textAlign: "left", cursor: "pointer",
              color: "var(--text-main)",
            }}>
            <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 12 }}>
              <span style={{ fontSize: 32 }}>{a.icon}</span>
              <div>
                <div style={{ fontWeight: 700, fontSize: 15, color: a.color }}>{a.label}</div>
                <div style={{ fontSize: 12, color: "var(--text-sub)" }}>{fmt(a.athlete_count || 0)} athletes</div>
              </div>
            </div>
            <p style={{ fontSize: 13, color: "var(--text-muted)", lineHeight: 1.55, marginBottom: 14 }}>{a.description}</p>
            <div style={{ display: "flex", gap: 8, marginBottom: 12 }}>
              <div style={{ background: "var(--border-color)", borderRadius: 8, padding: "6px 10px", flex: 1, textAlign: "center" }}>
                <div style={{ fontSize: 16, fontWeight: 700 }}>{a.avg_height}</div>
                <div style={{ fontSize: 10, color: "var(--text-sub)" }}>AVG CM</div>
              </div>
              <div style={{ background: "var(--border-color)", borderRadius: 8, padding: "6px 10px", flex: 1, textAlign: "center" }}>
                <div style={{ fontSize: 16, fontWeight: 700 }}>{a.avg_weight}</div>
                <div style={{ fontSize: 10, color: "var(--text-sub)" }}>AVG KG</div>
              </div>
              <div style={{ background: "var(--border-color)", borderRadius: 8, padding: "6px 10px", flex: 1, textAlign: "center" }}>
                <div style={{ fontSize: 16, fontWeight: 700, color: "#C9A227" }}>{a.medal_rate}%</div>
                <div style={{ fontSize: 10, color: "var(--text-sub)" }}>MEDAL RATE</div>
              </div>
            </div>
            {selected?.id === a.id && a.top_sports && (
              <div style={{ borderTop: "1px solid #1E293B", paddingTop: 14 }}>
                <div style={{ fontSize: 11, color: "var(--text-sub)", fontWeight: 700, marginBottom: 8, letterSpacing: "0.08em" }}>TOP SPORTS (OLYMPIC)</div>
                {a.top_sports.slice(0, 5).map(s => (
                  <div key={s.Sport} style={{ display: "flex", justifyContent: "space-between", fontSize: 12, color: "var(--text-muted)", marginBottom: 4 }}>
                    <span>{s.Sport}</span>
                    <span style={{ color: "#C9A227" }}>{s.medals} 🥇</span>
                  </div>
                ))}
                <div style={{ marginTop: 10, fontSize: 11, color: "var(--text-sub)", fontWeight: 700, letterSpacing: "0.08em" }}>PARALYMPIC ALIGNMENT</div>
                {a.paralympic_sports.map(s => (
                  <div key={s} style={{ fontSize: 12, color: "#7C3AED", marginTop: 4 }}>♿ {s}</div>
                ))}
              </div>
            )}
          </motion.button>
        ))}
      </div>
    </section>
  );
}
