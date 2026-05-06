"use client";
import { motion } from "framer-motion";

type Mode = "olympic" | "paralympic";

export function InputSection({
  h, setH, w, setW, age, setAge,
  matching, doMatch,
  mode, setMode, hideHeader, id
}: {
  h: string; setH: (v: string) => void;
  w: string; setW: (v: string) => void;
  age: string; setAge: (v: string) => void;
  matching: boolean; doMatch: () => void;
  mode: Mode; setMode: (m: Mode) => void;
  hideHeader?: boolean;
  id?: string;
}) {
  const isOlympic = mode === "olympic";
  const accent = isOlympic ? "#C9A227" : "#818CF8"; // gold vs purple-blue for para

  const hNum = Number(h);
  const wNum = Number(w);
  const aNum = Number(age);
  const isInvalidH = h !== "" && (hNum < 120 || hNum > 250);
  const isInvalidW = w !== "" && (wNum < 30 || wNum > 200);
  const isInvalidA = age !== "" && (aNum < 12 || aNum > 100);
  const hasErrors = isInvalidH || isInvalidW || isInvalidA;

  return (
    <section id={id || "mirror-input"} style={{ maxWidth: 640, margin: "0 auto", padding: "0 24px 64px" }}>
      {!hideHeader && (
        <div style={{ textAlign: "center", marginBottom: 32 }}>
          <div style={{ display: "inline-block", background: "#B2223418", border: "1px solid #B2223440", borderRadius: 99, padding: "5px 14px", fontSize: 11, fontWeight: 700, letterSpacing: "0.2em", color: "#EF4444", marginBottom: 14 }}>
            YOUR DIGITAL MIRROR
          </div>
          <h2 style={{ fontSize: 28, fontWeight: 800, marginBottom: 8 }}>
            Find Your Place in <span style={{ color: accent }}>Team USA History</span>
          </h2>
          <p style={{ color: "var(--text-sub)", fontSize: 14 }}>
            Enter your body measurements — we&apos;ll match you to 120 years of real {isOlympic ? "Olympic" : "Paralympic"} athlete profiles.
          </p>
        </div>
      )}

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
          <strong style={{ color: "#818CF8" }}>♿ Paralympic Mode</strong> — Your measurements will be matched against Paralympic athlete profiles across 13 sports. The LA28 Games will host both the Olympic and Paralympic Games.
        </motion.div>
      )}

      <div style={{ background: "var(--bg-card)", border: `1px solid ${isOlympic ? "#1E293B" : "rgba(129,140,248,0.2)"}`, borderRadius: 20, padding: 32, transition: "border-color 0.3s" }}>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 12, marginBottom: 8 }}>
          {[
            { label: "Height (cm)", val: h, set: setH, placeholder: "e.g. 178", id: "input-h", error: isInvalidH, errMsg: "120-250cm" },
            { label: "Weight (kg)", val: w, set: setW, placeholder: "e.g. 75",  id: "input-w", error: isInvalidW, errMsg: "30-200kg" },
            { label: "Age (opt.)",  val: age, set: setAge, placeholder: "e.g. 28", id: "input-a", error: isInvalidA, errMsg: "12-100yrs" },
          ].map(({ label, val, set, placeholder, id, error, errMsg }) => (
            <div key={id}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", marginBottom: 6 }}>
                <label htmlFor={id} style={{ fontSize: 11, color: "var(--text-sub)", fontWeight: 700, letterSpacing: "0.08em" }}>{label.toUpperCase()}</label>
                {error && <span style={{ fontSize: 10, color: "#EF4444", fontWeight: 700 }}>{errMsg}</span>}
              </div>
              <input id={id} type="number" value={val}
                onChange={e => set(e.target.value)}
                placeholder={placeholder}
                style={{ 
                  width: "100%", background: "var(--bg-main)", 
                  border: `1px solid ${error ? "#EF4444" : "#1E293B"}`, 
                  borderRadius: 10, padding: "10px 14px", 
                  color: error ? "#EF4444" : "var(--text-main)", 
                  fontSize: 15, outline: "none",
                  transition: "border-color 0.2s"
                }}
              />
            </div>
          ))}
        </div>
        
        {hasErrors && (
          <div style={{ fontSize: 12, color: "#EF4444", textAlign: "center", marginBottom: 12, fontWeight: 600 }}>
            Please enter values within realistic ranges to ensure accurate database matching.
          </div>
        )}
        {!hasErrors && <div style={{ height: 26 }} />} {/* Spacer */}

        <button
          id="match-btn"
          onClick={doMatch}
          disabled={matching || !h || !w || hasErrors}
          style={{
            width: "100%", padding: "14px 0", borderRadius: 12, fontWeight: 800, fontSize: 16,
            background: matching || !h || !w || hasErrors
              ? "var(--border-color)"
              : isOlympic
                ? "linear-gradient(135deg, #C9A227, #B8860B)"
                : "linear-gradient(135deg, #818CF8, #6366F1)",
            color: matching || !h || !w || hasErrors ? "var(--text-sub)" : isOlympic ? "var(--bg-main)" : "#fff",
            border: "none",
            cursor: matching || !h || !w || hasErrors ? "not-allowed" : "pointer",
            transition: "all 0.2s",
            boxShadow: matching || !h || !w || hasErrors ? "none" : `0 4px 14px ${isOlympic ? "rgba(201,162,39,0.4)" : "rgba(129,140,248,0.4)"}`,
          }}
          onMouseDown={e => { if (!matching && h && w && !hasErrors) e.currentTarget.style.transform = "scale(0.98)" }}
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
