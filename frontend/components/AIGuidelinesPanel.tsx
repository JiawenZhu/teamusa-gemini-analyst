"use client";
import { useState } from "react";

const RULES = [
  {
    icon: "🗣️",
    title: "Conditional language only",
    detail: 'Uses "historically associated with", "aggregate patterns suggest" — never deterministic predictions.',
  },
  {
    icon: "🔒",
    title: "No individual athlete profiles",
    detail: "AI is prohibited from naming, profiling, or quoting any specific athlete living or deceased.",
  },
  {
    icon: "📊",
    title: "Aggregate data only",
    detail: "All insights are drawn from population-level statistics across 271,116 historical records — never individual rows.",
  },
  {
    icon: "🏅",
    title: "Olympic / Paralympic clearly separated",
    detail: "The two K-means models are independent. Paralympic analysis always carries the proxy-sports disclaimer.",
  },
  {
    icon: "📅",
    title: "Historical scope: 1896 – 2016",
    detail: "AI is scoped to the Kaggle dataset. Post-2016 claims are not grounded and will be declined.",
  },
];

export function AIGuidelinesPanel() {
  const [open, setOpen] = useState(false);

  return (
    <div style={{ margin: "4px 0 8px 0" }}>
      {/* Toggle button */}
      <button
        onClick={() => setOpen(o => !o)}
        style={{
          display: "flex",
          alignItems: "center",
          gap: 6,
          background: "transparent",
          border: "1px solid rgba(201,162,39,0.25)",
          borderRadius: 8,
          padding: "5px 10px",
          cursor: "pointer",
          color: "var(--text-sub, #94a3b8)",
          fontSize: 11,
          fontWeight: 600,
          letterSpacing: "0.04em",
          transition: "border-color 0.2s, color 0.2s",
        }}
        onMouseEnter={e => {
          (e.currentTarget as HTMLButtonElement).style.borderColor = "rgba(201,162,39,0.6)";
          (e.currentTarget as HTMLButtonElement).style.color = "#C9A227";
        }}
        onMouseLeave={e => {
          (e.currentTarget as HTMLButtonElement).style.borderColor = "rgba(201,162,39,0.25)";
          (e.currentTarget as HTMLButtonElement).style.color = "var(--text-sub, #94a3b8)";
        }}
        aria-expanded={open}
        aria-controls="ai-guidelines-panel"
      >
        <span>🛡</span>
        <span>AI Guidelines</span>
        <span style={{
          display: "inline-block",
          transform: open ? "rotate(180deg)" : "rotate(0deg)",
          transition: "transform 0.2s",
          fontSize: 9,
        }}>▼</span>
      </button>

      {/* Expandable panel */}
      <div
        id="ai-guidelines-panel"
        role="region"
        aria-label="AI Responsible Use Guidelines"
        style={{
          maxHeight: open ? 500 : 0,
          overflow: "hidden",
          transition: "max-height 0.35s cubic-bezier(0.4,0,0.2,1)",
        }}
      >
        <div style={{
          marginTop: 8,
          background: "rgba(15,23,42,0.7)",
          border: "1px solid rgba(201,162,39,0.2)",
          borderRadius: 10,
          padding: "12px 14px",
          backdropFilter: "blur(8px)",
        }}>
          <p style={{ fontSize: 10, color: "var(--text-sub, #94a3b8)", marginBottom: 10, lineHeight: 1.5 }}>
            All Gemini responses are governed by explicit system instructions to ensure responsible AI use.
          </p>
          <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
            {RULES.map((rule, i) => (
              <div key={i} style={{ display: "flex", gap: 10, alignItems: "flex-start" }}>
                <span style={{ fontSize: 14, flexShrink: 0, marginTop: 1 }}>{rule.icon}</span>
                <div>
                  <div style={{ fontSize: 11, fontWeight: 700, color: "#C9A227", marginBottom: 2 }}>
                    {rule.title}
                  </div>
                  <div style={{ fontSize: 11, color: "var(--text-muted, #64748b)", lineHeight: 1.5 }}>
                    {rule.detail}
                  </div>
                </div>
              </div>
            ))}
          </div>
          <p style={{ fontSize: 9, color: "var(--text-muted, #64748b)", marginTop: 10, borderTop: "1px solid rgba(255,255,255,0.06)", paddingTop: 8 }}>
            Data: 120 Years of Olympic History (Kaggle, 1896–2016). All analysis is educational and aggregate only.
          </p>
        </div>
      </div>
    </div>
  );
}
