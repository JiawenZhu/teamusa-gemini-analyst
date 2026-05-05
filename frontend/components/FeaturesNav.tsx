"use client";
import { useState } from "react";
import { motion } from "framer-motion";

const features = [
  {
    id: "map",
    title: "Olympic World Map",
    desc: "Interactive 3D globe charting the geographic history of Team USA across the globe.",
    emoji: "🌍",
  },
  {
    id: "chat",
    title: "Find Your Place in Team USA",
    desc: "Match your unique biometrics to historical records and chat with our Gemini-powered AI guide.",
    emoji: "🏅",
  },
  {
    id: "archetypes",
    title: "The 6 Archetypes of Team USA",
    desc: "K-means clustering of 8,108 athlete biometric records (1896–2016).",
    emoji: "⚡",
  },
  {
    id: "paralympic",
    title: "Paralympic Deep-Dive",
    desc: "Gemini-powered IPC classification explainer: class codes, functional profiles, and Team USA legacy.",
    emoji: "♿",
  },
];

export function FeaturesNav({ onOpenModal, onOpenFullscreenMap }: { onOpenModal: () => void, onOpenFullscreenMap: () => void }) {
  const [hovered, setHovered] = useState<string | null>(null);

  const handleClick = (id: string) => {
    if (id === "map") {
      onOpenFullscreenMap();
    } else if (id === "chat") {
      onOpenModal();
    } else if (id === "archetypes") {
      document.getElementById("archetypes-section")?.scrollIntoView({ behavior: "smooth" });
    } else if (id === "paralympic") {
      document.getElementById("paralympic-section")?.scrollIntoView({ behavior: "smooth" });
    }
  };

  return (
    <section style={{ maxWidth: 1100, margin: "0 auto", padding: "0 16px 56px" }}>
      {/* auto-fill grid: 2 col on mobile ≥ 320px, 4 col on ≥ 900px */}
      <div style={{
        display: "grid",
        gridTemplateColumns: "repeat(auto-fill, minmax(min(220px, 100%), 1fr))",
        gap: 14,
      }}>
        {features.map((f, i) => {
          const isHovered = hovered === f.id;
          return (
            <motion.div
              key={f.id}
              initial={{ opacity: 0, y: 24 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.45, delay: i * 0.08 }}
              onMouseEnter={() => setHovered(f.id)}
              onMouseLeave={() => setHovered(null)}
              onClick={() => handleClick(f.id)}
              whileTap={{ scale: 0.97 }}
              style={{
                cursor: "pointer",
                background: isHovered ? "#FFFFFF" : "#FAFAF8",
                border: isHovered ? "1.5px solid #C9A227" : "1.5px solid #E8E4DC",
                borderRadius: 20,
                padding: "20px 20px 18px",
                position: "relative",
                overflow: "hidden",
                transition: "background 0.25s, border-color 0.25s, box-shadow 0.25s",
                display: "flex",
                flexDirection: "column",
                minHeight: 160,
                boxShadow: isHovered
                  ? "0 8px 32px rgba(201,162,39,0.14), 0 2px 8px rgba(0,0,0,0.06)"
                  : "0 2px 12px rgba(0,0,0,0.06)",
              }}
            >
              {/* macOS traffic-light dots */}
              <div style={{ display: "flex", gap: 6, marginBottom: 16 }}>
                <div style={{ width: 11, height: 11, borderRadius: "50%", background: "#FF5F57" }} />
                <div style={{ width: 11, height: 11, borderRadius: "50%", background: "#FEBC2E" }} />
                <div style={{ width: 11, height: 11, borderRadius: "50%", background: "#28C840" }} />
              </div>

              <h3 style={{
                fontSize: 14.5,
                fontWeight: 700,
                color: "#1A1A2E",
                marginBottom: 8,
                lineHeight: 1.3,
                letterSpacing: "-0.01em",
              }}>
                {f.title}
              </h3>

              <p style={{
                fontSize: 12.5,
                color: "#6B7280",
                lineHeight: 1.55,
                flex: 1,
              }}>
                {f.desc}
              </p>

              <motion.div
                animate={{ opacity: isHovered ? 1 : 0.45 }}
                transition={{ duration: 0.2 }}
                style={{
                  marginTop: 14,
                  fontSize: 12,
                  color: "#C9A227",
                  fontWeight: 600,
                  fontStyle: "italic",
                  letterSpacing: "0.01em",
                }}
              >
                Tap to explore →
              </motion.div>
            </motion.div>
          );
        })}
      </div>
    </section>
  );
}
