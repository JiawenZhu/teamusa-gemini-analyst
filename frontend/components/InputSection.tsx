"use client";
import { motion } from "framer-motion";

type Mode = "olympic" | "paralympic";

export function InputSection({
  h, setH, w, setW, age, setAge,
  matching, doMatch,
  mode, setMode,
}: {
  h: string; setH: (v: string) => void;
  w: string; setW: (v: string) => void;
  age: string; setAge: (v: string) => void;
  matching: boolean; doMatch: () => void;
  mode: Mode; setMode: (m: Mode) => void;
}) {
  const isOlympic = mode === "olympic";
  const accent = isOlympic ? "#C9A227" : "#818CF8"; // gold vs purple-blue for para

  return (
    <section id="mirror" style={{ maxWidth: 640, margin: "0 auto", padding: "0 24px 64px" }}>
      <div style={{ textAlign: "center", marginBottom: 32 }}>
        <div style={{ display: "inline-block", background: "#B2223418", border: "1px solid #B2223440", borderRadius: 99, padding: "5px 14px", fontSize: 11, fontWeight: 700, letterSpacing: "0.2em", color: "#EF4444", marginBottom: 14 }}>
          YOUR DIGITAL MIRROR
        </div>
        <h2 style={{ fontSize: 28, fontWeight: 800, marginBottom: 8 }}>
          Find Your Place in <span style={{ color: accent }}>Team USA History</span>
        </h2>
        <p style={{ color: "var(--text-sub)", fontSize: 14 }}>
          Enter your body measurements — we'll match you to 120 years of real {isOlympic ? "Olympic" : "Paralympic"} athlete profiles.
        </p>
      </div>

      {/* ── Mode Toggle ─────────────────────────────────────────────────── */}
      <div style={{ display: "flex", justifyContent: "center", marginBottom: 24 }}>
        <div style={{
          display: "flex", background: "var(--bg-card)", border: "1px solid #1E293B",
          borderRadius: 12, padding: 4, gap: 4, position: "relative",
        }}>
          {(["olympic", "paralympic"] as Mode[]).map((m) => {
            const active = mode === m;
            return (
              <button
                key={m}
                onClick={() => setMode(m)}
                style={{
                  padding: "8px 20px", borderRadius: 9, border: "none",
                  cursor: "pointer", fontSize: 13, fontWeight: 700,
                  transition: "all 0.2s",
                  background: active
                    ? m === "olympic" ? "linear-gradient(135deg, #C9A227, #B8860B)" : "linear-gradient(135deg, #818CF8, #6366F1)"
                    : "transparent",
                  color: active ? (m === "olympic" ? "#020817" : "#fff") : "var(--text-sub)",
                  boxShadow: active ? `0 2px 10px ${m === "olympic" ? "#C9A22740" : "#818CF840"}` : "none",
                }}
              >
                {m === "olympic" ? "🏅 Olympic" : "♿ Paralympic"}
              </button>
            );
          })}
        </div>
      </div>

      {/* Mode context banner */}
      {!isOlympic && (
        <motion.div
          initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }}
          style={{
            marginBottom: 20, padding: "10px 16px",
            background: "rgba(129,140,248,0.08)", border: "1px solid rgba(129,140,248,0.25)",
            borderRadius: 10, fontSize: 13, color: "#a5b4fc", lineHeight: 1.5,
          }}
        >
          <strong style={{ color: "#818CF8" }}>♿ Paralympic Mode</strong> — Your measurements will be matched against Paralympic athlete profiles across 13 sports. LA 2028 will host both the Olympic and Paralympic Games.
        </motion.div>
      )}

      <div style={{ background: "var(--bg-card)", border: `1px solid ${isOlympic ? "#1E293B" : "rgba(129,140,248,0.2)"}`, borderRadius: 20, padding: 32, transition: "border-color 0.3s" }}>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 12, marginBottom: 20 }}>
          {[
            { label: "Height (cm)", val: h, set: setH, placeholder: "e.g. 178", id: "input-h" },
            { label: "Weight (kg)", val: w, set: setW, placeholder: "e.g. 75",  id: "input-w" },
            { label: "Age (opt.)",  val: age, set: setAge, placeholder: "e.g. 28", id: "input-a" },
          ].map(({ label, val, set, placeholder, id }) => (
            <div key={id}>
              <label htmlFor={id} style={{ display: "block", fontSize: 11, color: "var(--text-sub)", fontWeight: 700, letterSpacing: "0.08em", marginBottom: 6 }}>{label.toUpperCase()}</label>
              <input id={id} type="number" value={val}
                onChange={e => set(e.target.value)}
                placeholder={placeholder}
                style={{ width: "100%", background: "var(--bg-main)", border: "1px solid #1E293B", borderRadius: 10, padding: "10px 14px", color: "var(--text-main)", fontSize: 15, outline: "none" }}
              />
            </div>
          ))}
        </div>
        <button
          id="match-btn"
          onClick={doMatch}
          disabled={matching || !h || !w}
          style={{
            width: "100%", padding: "14px 0", borderRadius: 12, fontWeight: 800, fontSize: 16,
            background: matching || !h || !w
              ? "var(--border-color)"
              : isOlympic
                ? "linear-gradient(135deg, #C9A227, #B8860B)"
                : "linear-gradient(135deg, #818CF8, #6366F1)",
            color: matching || !h || !w ? "var(--text-sub)" : isOlympic ? "var(--bg-main)" : "#fff",
            border: "none",
            cursor: matching || !h || !w ? "not-allowed" : "pointer",
            transition: "all 0.2s",
            boxShadow: matching || !h || !w ? "none" : `0 4px 14px ${isOlympic ? "rgba(201,162,39,0.4)" : "rgba(129,140,248,0.4)"}`,
          }}
          onMouseDown={e => { if (!matching && h && w) e.currentTarget.style.transform = "scale(0.98)" }}
          onMouseUp={e => e.currentTarget.style.transform = "scale(1)"}
          onMouseLeave={e => e.currentTarget.style.transform = "scale(1)"}
        >
          {matching
            ? `Matching across ${isOlympic ? "120" : "100+"} years…`
            : isOlympic
              ? "🔍 Find My Olympic Archetype →"
              : "♿ Find My Paralympic Archetype →"}
        </button>
      </div>
    </section>
  );
}
