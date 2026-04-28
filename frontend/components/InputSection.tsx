"use client";
export function InputSection({
  h, setH,
  w, setW,
  age, setAge,
  matching, doMatch,
}: {
  h: string; setH: (v: string) => void;
  w: string; setW: (v: string) => void;
  age: string; setAge: (v: string) => void;
  matching: boolean; doMatch: () => void;
}) {
  return (
    <section id="mirror" style={{ maxWidth: 640, margin: "0 auto", padding: "0 24px 64px" }}>
      <div style={{ textAlign: "center", marginBottom: 32 }}>
        <div style={{ display: "inline-block", background: "#B2223418", border: "1px solid #B2223440", borderRadius: 99, padding: "5px 14px", fontSize: 11, fontWeight: 700, letterSpacing: "0.2em", color: "#EF4444", marginBottom: 14 }}>
          YOUR DIGITAL MIRROR
        </div>
        <h2 style={{ fontSize: 28, fontWeight: 800, marginBottom: 8 }}>Find Your Place in <span style={{ color: "#C9A227" }}>Team USA History</span></h2>
        <p style={{ color: "var(--text-sub)", fontSize: 14 }}>Enter your body measurements — we'll match you to 120 years of real Olympic &amp; Paralympic athlete profiles.</p>
      </div>

      <div style={{ background: "var(--bg-card)", border: "1px solid #1E293B", borderRadius: 20, padding: 32 }}>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 12, marginBottom: 20 }}>
          {[
            { label: "Height (cm)", val: h, set: setH, placeholder: "e.g. 178", id: "input-h" },
            { label: "Weight (kg)", val: w, set: setW, placeholder: "e.g. 75", id: "input-w" },
            { label: "Age (opt.)", val: age, set: setAge, placeholder: "e.g. 28", id: "input-a" },
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
        <button id="match-btn" onClick={doMatch} disabled={matching || !h || !w}
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
        </button>
      </div>
    </section>
  );
}
