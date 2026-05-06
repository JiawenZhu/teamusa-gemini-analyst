"use client";

import { useSearchParams } from "next/navigation";
import Link from "next/link";
import { motion } from "framer-motion";
import { ChevronRight, Download, Trophy } from "lucide-react";

export default function CardClient() {
  const searchParams = useSearchParams();
  
  const arch = searchParams.get("arch") ?? "Olympic Archetype";
  const _icon = searchParams.get("icon") ?? "🏅";
  const color = searchParams.get("color") ?? "#C9A227";
  
  const ogImageUrl = `/api/og?${searchParams.toString()}`;

  return (
    <main style={{ 
      background: "var(--navy)", 
      minHeight: "100vh", 
      display: "flex", 
      flexDirection: "column", 
      alignItems: "center", 
      justifyContent: "center",
      padding: "40px 24px",
      color: "var(--text-main)",
      position: "relative",
      overflow: "hidden"
    }}>
      {/* Background Glow */}
      <div style={{
        position: "fixed", top: 0, left: 0, right: 0, bottom: 0,
        background: `radial-gradient(circle at 50% 50%, ${color}15, transparent 70%)`,
        pointerEvents: "none", zIndex: 0
      }} />

      <div style={{ position: "relative", zIndex: 1, width: "100%", maxWidth: "900px", textAlign: "center" }}>
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
        >
          <div style={{ display: "inline-flex", alignItems: "center", gap: 8, background: "#C9A22718", border: "1px solid #C9A22740", borderRadius: 99, padding: "6px 16px", marginBottom: 32 }}>
            <Trophy className="w-4 h-4 text-[#C9A227]" />
            <span style={{ fontSize: 12, fontWeight: 700, letterSpacing: "0.1em", color: "#C9A227" }}>ARCHETYPE PROFILE CARD</span>
          </div>

          <h1 style={{ fontSize: "clamp(32px, 5vw, 48px)", fontWeight: 900, marginBottom: 40, letterSpacing: "-1px" }}>
            Gemini has spoken.<br />
            Meet your <span style={{ color }}>{arch}</span> build.
          </h1>

          {/* The Card Image */}
          <div style={{ 
            boxShadow: `0 20px 80px ${color}30`, 
            borderRadius: "24px", 
            overflow: "hidden",
            border: `1px solid ${color}30`,
            marginBottom: 48,
            aspectRatio: "1200 / 630",
            background: "var(--bg-card)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            position: "relative"
          }}>
             {/* eslint-disable-next-line @next/next/no-img-element */}
             <img 
               src={ogImageUrl} 
               alt={`${arch} Archetype Profile Card`}
               style={{ width: "100%", height: "100%", objectFit: "cover" }}
             />
          </div>

          {/* Actions */}
          <div style={{ display: "flex", gap: 16, justifyContent: "center", flexWrap: "wrap" }}>
            <Link href="/" style={{
              background: `linear-gradient(135deg, ${color}, ${color}DD)`,
              color: "white",
              padding: "16px 32px",
              borderRadius: "16px",
              fontWeight: 800,
              fontSize: "18px",
              display: "flex",
              alignItems: "center",
              gap: 8,
              textDecoration: "none",
              boxShadow: `0 10px 30px ${color}40`,
              transition: "transform 0.2s"
            }}
              onMouseEnter={(e) => e.currentTarget.style.transform = "translateY(-2px)"}
              onMouseLeave={(e) => e.currentTarget.style.transform = "translateY(0)"}
            >
              Get Your Own Profile <ChevronRight className="w-5 h-5" />
            </Link>

            <a 
              href={ogImageUrl} 
              download={`TeamUSA-Gemini-Analyst-${arch.replace(/\s+/g, '-')}.png`}
              style={{
                background: "rgba(255,255,255,0.05)",
                border: "1px solid rgba(255,255,255,0.1)",
                color: "white",
                padding: "16px 24px",
                borderRadius: "16px",
                fontWeight: 700,
                fontSize: "16px",
                display: "flex",
                alignItems: "center",
                gap: 8,
                textDecoration: "none",
                transition: "background 0.2s"
              }}
              onMouseEnter={(e) => e.currentTarget.style.background = "rgba(255,255,255,0.1)"}
              onMouseLeave={(e) => e.currentTarget.style.background = "rgba(255,255,255,0.05)"}
            >
              <Download className="w-5 h-5" /> Download PNG
            </a>
          </div>
          
          <p style={{ marginTop: 40, color: "var(--text-sub)", fontSize: "14px" }}>
            Based on 120 years of Team USA Olympic & Paralympic data patterns.
          </p>
        </motion.div>
      </div>
    </main>
  );
}
