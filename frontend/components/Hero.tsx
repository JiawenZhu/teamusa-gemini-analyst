"use client";
import { AnimCount } from "./AnimCount";
import type { DatasetStats } from "@/lib/api";

export function Hero({ stats }: { stats: DatasetStats | null }) {
  return (
    <section style={{
      position: "relative", padding: "80px 24px 64px", textAlign: "center",
      background: "radial-gradient(ellipse 90% 60% at 50% -5%, #C9A22718, transparent)",
      borderBottom: "1px solid #C9A22720",
    }}>
      <div style={{ display: "inline-flex", alignItems: "center", gap: 8, background: "#C9A22718", border: "1px solid #C9A22740", borderRadius: 99, padding: "6px 16px", marginBottom: 20 }}>
        <span>🏅</span>
        <span style={{ fontSize: 11, fontWeight: 700, letterSpacing: "0.25em", color: "#C9A227" }}>TEAM USA × GOOGLE CLOUD · HACKATHON 2026</span>
      </div>
      <h1 style={{ fontSize: "clamp(36px,6vw,72px)", fontWeight: 900, lineHeight: 1.08, marginBottom: 16, letterSpacing: "-1px" }}>
        TeamUSA<br />
        <span style={{ color: "#C9A227" }}>Digital Mirror</span>
      </h1>
      <p style={{ fontSize: 18, color: "var(--text-muted)", maxWidth: 560, margin: "0 auto 40px", lineHeight: 1.65 }}>
        120 years of Olympic history reflected through your body profile. Discover which athlete archetype could align with your build — spanning both Olympic and Paralympic sports.
      </p>

      {/* STATS TICKER */}
      {stats && (
        <div style={{ display: "flex", gap: 12, justifyContent: "center", flexWrap: "wrap" }}>
          {[
            { label: "USA Athletes", val: stats.unique_athletes },
            { label: "Sports", val: stats.sports_count },
            { label: "Gold Medals", val: stats.gold_medals },
            { label: "Years of Data", val: stats.year_max - stats.year_min },
          ].map(({ label, val }) => (
            <div key={label} style={{ background: "var(--bg-card)", border: "1px solid #C9A22730", borderRadius: 12, padding: "14px 22px", minWidth: 120 }}>
              <div style={{ fontSize: 28, fontWeight: 900, color: "#C9A227" }}>
                <AnimCount target={val} />
              </div>
              <div style={{ fontSize: 12, color: "var(--text-sub)", fontWeight: 600, marginTop: 2, letterSpacing: "0.05em" }}>{label.toUpperCase()}</div>
            </div>
          ))}
        </div>
      )}

    </section>
  );
}
