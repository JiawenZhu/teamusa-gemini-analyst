"use client";
import { motion } from "framer-motion";
import { Check, Share2, Download } from "lucide-react";
import type { ArchetypeProfile, MatchResult } from "@/lib/api";
import { Bar } from "./Bar";

export function MatchResultPanel({
  result,
  glitchArch,
  resultRef,
  shareDna,
  copied,
}: {
  result: MatchResult | null;
  glitchArch: ArchetypeProfile | null;
  resultRef: React.RefObject<HTMLDivElement | null>;
  shareDna: () => void;
  copied: boolean;
}) {
  const displayArch = glitchArch || result?.archetype;
  if (!displayArch) return null;

  return (
    <section ref={resultRef} style={{ maxWidth: 900, margin: "0 auto", padding: "0 24px 80px" }}>
      {/* Archetype reveal */}
      <motion.div 
        initial={{ opacity: 0, scale: 0.95, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        transition={{ type: "spring" }}
        style={{
        background: `linear-gradient(135deg, ${displayArch.color}, #0F172A)`,
        borderRadius: 24, padding: 40, textAlign: "center", marginBottom: 24,
        boxShadow: glitchArch ? `0 0 40px ${displayArch.color}20` : `0 20px 40px ${displayArch.color}40`,
        transition: "all 0.1s ease", position: "relative", overflow: "hidden"
      }}>
        <div style={{ position: "absolute", top: "-50%", left: "-50%", width: "200%", height: "200%", background: `radial-gradient(circle, ${displayArch.color}20, transparent 60%)`, pointerEvents: "none" }} />
        <div style={{ fontSize: 72, marginBottom: 12, filter: glitchArch ? "blur(2px)" : "drop-shadow(0 0 20px rgba(255,255,255,0.4))", transition: "filter 0.1s", position: "relative", zIndex: 1 }}>{displayArch.icon}</div>
        <h2 style={{ fontSize: 40, fontWeight: 900, color: "#FFFFFF", marginBottom: 10, opacity: glitchArch ? 0.8 : 1, textShadow: "0 2px 10px rgba(0,0,0,0.3)", position: "relative", zIndex: 1 }}>{displayArch.label}</h2>
        <p style={{ color: "rgba(255,255,255,0.9)", maxWidth: 540, margin: "0 auto 28px", fontSize: 16, lineHeight: 1.6, opacity: glitchArch ? 0.5 : 1, position: "relative", zIndex: 1 }}>
          {glitchArch ? "Searching databank patterns..." : displayArch.description}
        </p>
        
        <div style={{ display: "flex", gap: 16, justifyContent: "center", flexWrap: "wrap", opacity: glitchArch ? 0.3 : 1, transition: "opacity 0.2s", position: "relative", zIndex: 1 }}>
          {[
            { label: "Your BMI", val: result?.user_bmi.toFixed(1) || "--" },
            { label: "Avg Height", val: `${displayArch.avg_height} cm` },
            { label: "Avg Weight", val: `${displayArch.avg_weight} kg` },
            { label: "Medal Rate", val: `${displayArch.medal_rate}%` },
          ].map(({ label, val }) => (
            <div key={label} style={{ background: "rgba(255,255,255,0.15)", backdropFilter: "blur(12px)", WebkitBackdropFilter: "blur(12px)", border: "1px solid rgba(255,255,255,0.2)", borderRadius: 16, padding: "14px 22px", boxShadow: "0 8px 32px rgba(0,0,0,0.1)" }}>
              <div style={{ fontWeight: 800, fontSize: 20, color: "#FFFFFF" }}>{val}</div>
              <div style={{ fontSize: 12, color: "rgba(255,255,255,0.7)", fontWeight: 600, marginTop: 2, letterSpacing: "0.05em" }}>{label.toUpperCase()}</div>
            </div>
          ))}
        </div>

        {/* Share / Download Actions */}
        {result && !glitchArch && (
          <motion.div 
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.5 }}
            style={{ display: "flex", gap: 12, justifyContent: "center", marginTop: 32, position: "relative", zIndex: 1 }}
          >
            <button onClick={shareDna} style={{
              background: "rgba(255,255,255,1)",
              color: "#0A1628",
              padding: "12px 24px",
              borderRadius: "14px",
              fontWeight: 800,
              fontSize: "14px",
              display: "flex",
              alignItems: "center",
              gap: 8,
              border: "none",
              cursor: "pointer",
              boxShadow: "0 10px 20px rgba(0,0,0,0.2)",
              transition: "all 0.2s"
            }}
              onMouseDown={e => e.currentTarget.style.transform = "scale(0.96)"}
              onMouseUp={e => e.currentTarget.style.transform = "scale(1)"}
            >
              {copied ? <Check className="w-4 h-4" /> : <Share2 className="w-4 h-4" />}
              {copied ? "Link Copied!" : "Share My DNA Card"}
            </button>

            <a 
              href={`/api/og?arch=${result.archetype.label}&icon=${result.archetype.icon}&color=${result.archetype.color.replace('#','%23')}&bmi=${result.user_bmi.toFixed(1)}&sports=${result.archetype.olympic_sports.slice(0, 3).join(", ")}&matches=847`}
              download={`TeamUSA-Gemini-Analyst-${result.archetype.label.replace(/\s+/g, '-')}.png`}
              style={{
                background: "rgba(255,255,255,0.15)",
                backdropFilter: "blur(12px)",
                border: "1px solid rgba(255,255,255,0.2)",
                color: "white",
                padding: "12px 20px",
                borderRadius: "14px",
                fontWeight: 700,
                fontSize: "14px",
                display: "flex",
                alignItems: "center",
                gap: 8,
                textDecoration: "none",
                boxShadow: "0 10px 20px rgba(0,0,0,0.1)",
                transition: "all 0.2s"
              }}
              onMouseEnter={e => e.currentTarget.style.background = "rgba(255,255,255,0.25)"}
              onMouseLeave={e => e.currentTarget.style.background = "rgba(255,255,255,0.15)"}
            >
              <Download className="w-4 h-4" /> Download
            </a>
          </motion.div>
        )}

        {result?.percentile_note && (
          <p style={{ marginTop: 24, fontSize: 13, color: "rgba(255,255,255,0.6)", fontStyle: "italic", position: "relative", zIndex: 1 }}>📊 {result.percentile_note}</p>
        )}
      </motion.div>

      {/* Olympic + Paralympic alignment */}
      {result && (
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }} style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16, marginBottom: 24 }}>
        <div style={{ background: "var(--bg-card)", border: "1px solid var(--border-color)", borderRadius: 20, padding: 32, boxShadow: "0 10px 30px rgba(0,0,0,0.05)" }}>
          <h3 style={{ fontWeight: 800, marginBottom: 24, fontSize: 18, display: "flex", alignItems: "center", gap: 8 }}>🏅 Olympic Sport Alignment</h3>
          {displayArch.olympic_sports?.slice(0, 5).map((s, i) => (
            <Bar key={s} label={s} pct={95 - i * 8} color={displayArch.color || "#C9A227"} />
          ))}
        </div>
        <div style={{ background: "var(--bg-card)", border: "1px solid rgba(124, 58, 237, 0.2)", borderRadius: 20, padding: 32, boxShadow: "0 10px 30px rgba(0,0,0,0.05)" }}>
          <h3 style={{ fontWeight: 800, marginBottom: 24, fontSize: 18, display: "flex", alignItems: "center", gap: 8 }}>♿ Paralympic Alignment</h3>
          {displayArch.paralympic_sports?.map((s, i) => (
            <Bar key={s} label={s} pct={90 - i * 10} color="#7C3AED" />
          ))}
          <p style={{ fontSize: 11, color: "var(--text-sub)", marginTop: 14, lineHeight: 1.5 }}>
            Paralympic sport alignment is based on biometric archetype patterns. Individual classification depends on IPC medical assessment.
          </p>
        </div>
      </motion.div>
      )}

      {/* Closest historical records */}
      {result && result.closest_athletes.length > 0 && (
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }} style={{ background: "var(--bg-card)", border: "1px solid var(--border-color)", borderRadius: 20, padding: "32px", marginBottom: 24, boxShadow: "0 10px 30px rgba(0,0,0,0.05)" }}>
          <h3 style={{ fontWeight: 800, marginBottom: 8, fontSize: 18, display: "flex", alignItems: "center", gap: 8 }}>📚 Closest Historical Records in Dataset</h3>
          <p style={{ fontSize: 13, color: "var(--text-sub)", marginBottom: 24 }}>Aggregate records matching your biometric profile — no individuals identified.</p>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill,minmax(180px,1fr))", gap: 16 }}>
            {result.closest_athletes.slice(0, 6).map((a, i) => {
              const medalColors = { Gold: "#C9A227", Silver: "#94A3B8", Bronze: "#CD7F32" };
              const mc = a.Medal ? medalColors[a.Medal as keyof typeof medalColors] : "transparent";
              return (
                <motion.div whileHover={{ scale: 1.03, y: -2 }} key={i} style={{ background: "var(--bg-main)", border: `1px solid ${a.Medal ? mc + '40' : 'var(--border-color)'}`, borderRadius: 16, padding: "20px", boxShadow: a.Medal ? `0 8px 24px ${mc}15` : "0 4px 12px rgba(0,0,0,0.03)", cursor: "default", position: "relative", overflow: "hidden" }}>
                  {a.Medal && <div style={{ position: "absolute", top: 0, left: 0, width: "100%", height: 4, background: mc }} />}
                  <div style={{ fontWeight: 800, fontSize: 15, color: "var(--text-main)" }}>{a.Sport}</div>
                  <div style={{ color: "var(--text-sub)", fontSize: 13, marginTop: 4, fontWeight: 500 }}>{a.Year} · {a.Height}cm / {a.Weight}kg</div>
                  {a.Medal && <div style={{ marginTop: 12, fontSize: 12, fontWeight: 800, color: mc, display: "inline-flex", alignItems: "center", gap: 6, background: `${mc}15`, padding: "4px 10px", borderRadius: 8 }}>{a.Medal === 'Gold' ? '🥇' : a.Medal === 'Silver' ? '🥈' : '🥉'} {a.Medal}</div>}
                </motion.div>
              )
            })}
          </div>
        </motion.div>
      )}
    </section>
  );
}
