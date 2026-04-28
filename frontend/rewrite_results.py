import re

with open('app/page.tsx', 'r') as f:
    code = f.read()

# 1. Update Bar component
bar_old = """function Bar({ label, pct: p, color }: { label: string; pct: number; color: string }) {
  return (
    <div style={{ marginBottom: 10 }}>
      <div style={{ display: "flex", justifyContent: "space-between", fontSize: 13, marginBottom: 4 }}>
        <span style={{ color: "var(--text-muted)" }}>{label}</span>
        <span style={{ color: "var(--text-muted)" }}>{pct(p)}</span>
      </div>
      <div style={{ height: 6, borderRadius: 99, background: "var(--border-color)" }}>
        <div style={{ height: "100%", borderRadius: 99, background: color, width: `${p}%`, transition: "width 0.9s ease" }} />
      </div>
    </div>
  );
}"""

bar_new = """function Bar({ label, pct: p, color }: { label: string; pct: number; color: string }) {
  const [w, setW] = useState(0);
  useEffect(() => { const timer = setTimeout(() => setW(p), 100); return () => clearTimeout(timer); }, [p]);
  return (
    <div style={{ marginBottom: 16 }}>
      <div style={{ display: "flex", justifyContent: "space-between", fontSize: 13, marginBottom: 6, fontWeight: 600 }}>
        <span style={{ color: "var(--text-main)" }}>{label}</span>
        <span style={{ color: color }}>{pct(p)}</span>
      </div>
      <div style={{ height: 8, borderRadius: 99, background: "var(--border-color)", overflow: "hidden", boxShadow: "inset 0 1px 3px rgba(0,0,0,0.05)" }}>
        <div style={{ height: "100%", borderRadius: 99, background: `linear-gradient(90deg, ${color}99, ${color})`, width: `${w}%`, transition: "width 1.2s cubic-bezier(0.2, 0.8, 0.2, 1)", boxShadow: `0 0 10px ${color}80` }} />
      </div>
    </div>
  );
}"""
code = code.replace(bar_old, bar_new)

# 2. Update Match Button
btn_old = """          <button id="match-btn" onClick={doMatch} disabled={matching || !h || !w}
            style={{
              width: "100%", padding: "14px 0", borderRadius: 12, fontWeight: 800, fontSize: 16,
              background: matching || !h || !w ? "var(--border-color)" : "linear-gradient(135deg, #C9A227, #B8860B)",
              color: matching || !h || !w ? "var(--text-sub)" : "var(--bg-main)",
              border: "none", cursor: matching || !h || !w ? "not-allowed" : "pointer",
              transition: "all 0.2s",
            }}>
            {matching ? "Matching across 120 years…" : "🔍 Find My Archetype →"}
          </button>"""
btn_new = """          <button id="match-btn" onClick={doMatch} disabled={matching || !h || !w}
            style={{
              width: "100%", padding: "14px 0", borderRadius: 12, fontWeight: 800, fontSize: 16,
              background: matching || !h || !w ? "var(--border-color)" : "linear-gradient(135deg, #C9A227, #B8860B)",
              color: matching || !h || !w ? "var(--text-sub)" : "var(--bg-main)",
              border: "none", cursor: matching || !h || !w ? "not-allowed" : "pointer",
              transition: "all 0.2s",
              boxShadow: matching || !h || !w ? "none" : "0 4px 14px rgba(201, 162, 39, 0.4)",
            }}
            onMouseDown={e => { if(!matching && h && w) e.currentTarget.style.transform = "scale(0.98)" }}
            onMouseUp={e => e.currentTarget.style.transform = "scale(1)"}
            onMouseLeave={e => e.currentTarget.style.transform = "scale(1)"}
            >
            {matching ? "Matching across 120 years…" : "🔍 Find My Archetype →"}
          </button>"""
code = code.replace(btn_old, btn_new)

# 3. Update Archetype Reveal Card
reveal_old = """          <motion.div 
            initial={{ opacity: 0, scale: 0.95, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            transition={{ type: "spring" }}
            style={{
            background: `linear-gradient(135deg, ${displayArch.color}14, #0A1628)`,
            border: `1px solid ${displayArch.color}50`,
            borderRadius: 20, padding: 36, textAlign: "center", marginBottom: 24,
            boxShadow: glitchArch ? `0 0 40px ${displayArch.color}20` : `0 10px 40px ${displayArch.color}20`,
            transition: "all 0.1s ease"
          }}>
            <div style={{ fontSize: 64, marginBottom: 8, filter: glitchArch ? "blur(1px)" : "none", transition: "filter 0.1s" }}>{displayArch.icon}</div>
            <h2 style={{ fontSize: 36, fontWeight: 900, color: displayArch.color, marginBottom: 6, opacity: glitchArch ? 0.8 : 1 }}>{displayArch.label}</h2>
            <p style={{ color: "var(--text-muted)", maxWidth: 500, margin: "0 auto 20px", fontSize: 15, lineHeight: 1.6, opacity: glitchArch ? 0.5 : 1 }}>
              {glitchArch ? "Searching databank patterns..." : displayArch.description}
            </p>
            
            <div style={{ display: "flex", gap: 12, justifyContent: "center", flexWrap: "wrap", opacity: glitchArch ? 0.3 : 1, transition: "opacity 0.2s" }}>
              {[
                { label: "Your BMI", val: result?.user_bmi.toFixed(1) || "--" },
                { label: "Avg Height", val: `${displayArch.avg_height} cm` },
                { label: "Avg Weight", val: `${displayArch.avg_weight} kg` },
                { label: "Medal Rate", val: `${displayArch.medal_rate}%` },
              ].map(({ label, val }) => (
                <div key={label} style={{ background: "var(--bg-main)", borderRadius: 10, padding: "10px 18px" }}>
                  <div style={{ fontWeight: 700, fontSize: 18, color: "var(--text-main)" }}>{val}</div>
                  <div style={{ fontSize: 11, color: "var(--text-sub)" }}>{label}</div>
                </div>
              ))}
            </div>
            {result?.percentile_note && (
              <p style={{ marginTop: 16, fontSize: 12, color: "var(--text-sub)", fontStyle: "italic" }}>📊 {result.percentile_note}</p>
            )}
          </motion.div>"""
reveal_new = """          <motion.div 
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
            {result?.percentile_note && (
              <p style={{ marginTop: 24, fontSize: 13, color: "rgba(255,255,255,0.6)", fontStyle: "italic", position: "relative", zIndex: 1 }}>📊 {result.percentile_note}</p>
            )}
          </motion.div>"""
code = code.replace(reveal_old, reveal_new)

# 4. Update Closest Historical Records
hist_old = """          {/* Closest historical records */}
          {result && result.closest_athletes.length > 0 && (
            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }} style={{ background: "var(--bg-card)", border: "1px solid #1E293B", borderRadius: 16, padding: 24, marginBottom: 24 }}>
              <h3 style={{ fontWeight: 700, marginBottom: 16, fontSize: 15 }}>📚 Closest Historical Records in Dataset</h3>
              <p style={{ fontSize: 12, color: "var(--text-sub)", marginBottom: 14 }}>Aggregate records matching your biometric profile — no individuals identified.</p>
              <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill,minmax(180px,1fr))", gap: 10 }}>
                {result.closest_athletes.slice(0, 6).map((a, i) => (
                  <div key={i} style={{ background: "var(--bg-main)", borderRadius: 10, padding: "12px 14px" }}>
                    <div style={{ fontWeight: 600, fontSize: 13 }}>{a.Sport}</div>
                    <div style={{ color: "var(--text-sub)", fontSize: 12, marginTop: 3 }}>{a.Year} · {a.Height}cm / {a.Weight}kg</div>
                    {a.Medal && <div style={{ marginTop: 4, fontSize: 11, color: a.Medal === "Gold" ? "#C9A227" : a.Medal === "Silver" ? "var(--text-muted)" : "#CD7F32" }}>🥇 {a.Medal}</div>}
                  </div>
                ))}
              </div>
            </motion.div>
          )}"""

hist_new = """          {/* Closest historical records */}
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
          )}"""
code = code.replace(hist_old, hist_new)

# Also update the title styling of Olympic Sport Alignment and Paralympic Alignment to match the new H3 style
align_old = """<div style={{ background: "var(--bg-card)", border: "1px solid #1E293B", borderRadius: 16, padding: 24 }}>
              <h3 style={{ fontWeight: 700, marginBottom: 16, fontSize: 15 }}>🏅 Olympic Sport Alignment</h3>"""
align_new = """<div style={{ background: "var(--bg-card)", border: "1px solid var(--border-color)", borderRadius: 20, padding: 32, boxShadow: "0 10px 30px rgba(0,0,0,0.05)" }}>
              <h3 style={{ fontWeight: 800, marginBottom: 24, fontSize: 18, display: "flex", alignItems: "center", gap: 8 }}>🏅 Olympic Sport Alignment</h3>"""
code = code.replace(align_old, align_new)

para_old = """<div style={{ background: "var(--bg-card)", border: "1px solid #7C3AED30", borderRadius: 16, padding: 24 }}>
              <h3 style={{ fontWeight: 700, marginBottom: 16, fontSize: 15 }}>♿ Paralympic Alignment</h3>"""
para_new = """<div style={{ background: "var(--bg-card)", border: "1px solid rgba(124, 58, 237, 0.2)", borderRadius: 20, padding: 32, boxShadow: "0 10px 30px rgba(0,0,0,0.05)" }}>
              <h3 style={{ fontWeight: 800, marginBottom: 24, fontSize: 18, display: "flex", alignItems: "center", gap: 8 }}>♿ Paralympic Alignment</h3>"""
code = code.replace(para_old, para_new)

with open('app/page.tsx', 'w') as f:
    f.write(code)

