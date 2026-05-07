"use client";
import { motion } from "framer-motion";

export type StepId = 1 | 2 | 3;

const STEPS: { n: StepId; label: string; icon: string; anchor: string }[] = [
  { n: 1, label: "Match",    icon: "🏅", anchor: "mirror-main"      },
  { n: 2, label: "Chat",     icon: "💬", anchor: "chat-panel"       },
  { n: 3, label: "Discover", icon: "🌍", anchor: "globe-section"    },
];

export function StepNav({ step }: { step: StepId }) {
  const handleClick = (anchor: string, n: StepId) => {
    if (n > step) {
      // Gently bounce back to the current action
      document.getElementById("mirror-main")?.scrollIntoView({ behavior: "smooth", block: "center" });
      return;
    }
    document.getElementById(anchor)?.scrollIntoView({ behavior: "smooth", block: "start" });
  };

  return (
    <div
      role="navigation"
      aria-label="Journey progress"
      style={{
        position: "sticky",
        top: 0,
        zIndex: 100,
        backdropFilter: "blur(28px)",
        WebkitBackdropFilter: "blur(28px)",
        background: "rgba(2, 8, 23, 0.85)",
        borderBottom: "1px solid rgba(201,162,39,0.14)",
        boxShadow: "0 1px 0 rgba(201,162,39,0.07), 0 4px 40px rgba(0,0,0,0.5)",
      }}
    >
      <div
        style={{
          maxWidth: 560,
          margin: "0 auto",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          padding: "10px 20px",
          gap: 0,
        }}
      >
        {STEPS.map((s, i) => {
          const active = step === s.n;
          const done   = step >  s.n;
          const locked = step <  s.n;

          return (
            <div key={s.n} style={{ display: "flex", alignItems: "center" }}>
              {/* ── Step pill ─────────────────────────────────────── */}
              <motion.button
                onClick={() => handleClick(s.anchor, s.n)}
                whileHover={!locked ? { scale: 1.04, y: -1 } : {}}
                whileTap={!locked ? { scale: 0.96 } : {}}
                transition={{ type: "spring", stiffness: 400, damping: 25 }}
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: 9,
                  padding: "7px 18px",
                  borderRadius: 99,
                  border: active
                    ? "1.5px solid rgba(201,162,39,0.55)"
                    : done
                    ? "1px solid rgba(201,162,39,0.18)"
                    : "1px solid rgba(255,255,255,0.04)",
                  background: active
                    ? "linear-gradient(135deg, rgba(201,162,39,0.22) 0%, rgba(184,134,11,0.12) 100%)"
                    : done
                    ? "rgba(201,162,39,0.07)"
                    : "transparent",
                  color: active ? "#F5C842" : done ? "#C9A227" : "#475569",
                  fontWeight: active ? 800 : done ? 600 : 500,
                  fontSize: 13,
                  cursor: locked ? "not-allowed" : "pointer",
                  opacity: locked ? 0.32 : 1,
                  letterSpacing: active ? "-0.01em" : "normal",
                  boxShadow: active
                    ? "0 0 18px rgba(201,162,39,0.18), inset 0 1px 0 rgba(255,255,255,0.06)"
                    : "none",
                  transition: "background 0.3s, color 0.3s, border-color 0.3s, box-shadow 0.3s",
                  whiteSpace: "nowrap",
                  position: "relative",
                }}
              >
                {/* Number/check badge */}
                <div
                  style={{
                    width: 21,
                    height: 21,
                    borderRadius: "50%",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    fontSize: done ? 11 : 10,
                    fontWeight: 800,
                    flexShrink: 0,
                    background: active
                      ? "rgba(201,162,39,0.28)"
                      : done
                      ? "rgba(201,162,39,0.14)"
                      : "rgba(255,255,255,0.04)",
                    border: active
                      ? "1px solid rgba(201,162,39,0.5)"
                      : "1px solid transparent",
                    color: active ? "#F5C842" : done ? "#C9A227" : "#475569",
                    transition: "all 0.3s",
                  }}
                >
                  {done ? "✓" : s.n}
                </div>
                <span>{s.label}</span>

                {/* Active glow dot */}
                {active && (
                  <motion.div
                    animate={{ opacity: [0.6, 1, 0.6] }}
                    transition={{ repeat: Infinity, duration: 1.8, ease: "easeInOut" }}
                    style={{
                      width: 5,
                      height: 5,
                      borderRadius: "50%",
                      background: "#F5C842",
                      boxShadow: "0 0 6px #F5C842",
                      marginLeft: 2,
                      flexShrink: 0,
                    }}
                  />
                )}
              </motion.button>

              {/* ── Connector line ───────────────────────────────── */}
              {i < 2 && (
                <div
                  style={{
                    width: 32,
                    height: 2,
                    margin: "0 4px",
                    borderRadius: 2,
                    background: done
                      ? "linear-gradient(90deg, rgba(201,162,39,0.65), rgba(201,162,39,0.25))"
                      : "rgba(255,255,255,0.07)",
                    transition: "background 0.5s ease",
                  }}
                />
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
