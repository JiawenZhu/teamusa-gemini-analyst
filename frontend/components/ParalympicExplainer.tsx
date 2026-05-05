"use client";
import { useState, useCallback, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import type { ArchetypeProfile } from "@/lib/api";
import { fetchParaClassificationExplainer } from "@/lib/api";

// ── Design tokens ─────────────────────────────────────────────────────────────
const C = {
  bg: "#FAF9F6",
  card: "#FFFFFF",
  border: "#E8E3D8",
  borderActive: "#1E3A5F",   // navy blue for selected card (matches screenshot 1)
  bgActive: "#F0F6FF",       // very light blue tint on selected card
  gold: "#9A6F00",           // darker gold for text readability
  goldAccent: "#C9A227",     // lighter gold for decorative use
  navy: "#0F1B2D",           // deep navy for primary text
  bodyText: "#374151",       // body copy
  sub: "#6B7280",            // secondary / subtitle
  muted: "#9CA3AF",          // placeholder / labels
  tagBg: "#EFF6FF",          // light blue pill background
  tagBorder: "#BFDBFE",      // light blue pill border
  tagText: "#1D4ED8",        // blue pill text
  tabBg: "#F3F4F6",
  tabBgActive: "#FFFFFF",
  tabActive: "#0F1B2D",
  tabInactive: "#9CA3AF",
};

// ── Rotating loading copy ─────────────────────────────────────────────────────
const LOADING_PHRASES = [
  "Consulting the IPC classification database…",
  "Analyzing functional impairment profiles…",
  "Cross-referencing Team USA Paralympic results…",
  "Mapping biometric data to class codes…",
  "Synthesizing legacy performance statistics…",
];

function LoadingState({ color }: { color: string }) {
  const [phraseIdx, setPhraseIdx] = useState(0);
  useEffect(() => {
    const t = setInterval(() => setPhraseIdx(p => (p + 1) % LOADING_PHRASES.length), 2400);
    return () => clearInterval(t);
  }, []);
  return (
    <div style={{ padding: "36px 0 24px", display: "flex", flexDirection: "column", alignItems: "center", gap: 16 }}>
      {/* Animated ring */}
      <div style={{ position: "relative", width: 44, height: 44 }}>
        <div style={{
          position: "absolute", inset: 0, borderRadius: "50%",
          border: `3px solid ${color}20`,
        }} />
        <div style={{
          position: "absolute", inset: 0, borderRadius: "50%",
          border: `3px solid transparent`,
          borderTopColor: color,
          animation: "paraRingSpin 0.75s linear infinite",
        }} />
        <div style={{
          position: "absolute", inset: 6, borderRadius: "50%",
          background: `${color}12`,
          display: "flex", alignItems: "center", justifyContent: "center",
          fontSize: 14,
        }}>✨</div>
      </div>
      {/* Cycling microcopy */}
      <AnimatePresence mode="wait">
        <motion.p
          key={phraseIdx}
          initial={{ opacity: 0, y: 6 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -6 }}
          transition={{ duration: 0.35 }}
          style={{
            fontSize: 13.5, color: C.sub, fontWeight: 500,
            letterSpacing: "0.01em", textAlign: "center", maxWidth: 320,
          }}
        >
          {LOADING_PHRASES[phraseIdx]}
        </motion.p>
      </AnimatePresence>
      <style>{`@keyframes paraRingSpin{to{transform:rotate(360deg)}}`}</style>
    </div>
  );
}

// ── Markdown renderer — pixel-accurate to Screenshot 2 ────────────────────────
function inlineBold(text: string): string {
  return text.replace(/\*\*(.+?)\*\*/g, `<strong style="color:${C.navy};font-weight:700">$1</strong>`);
}

function Markdown({ text }: { text: string }) {
  // Strip Gemini separator lines (---)
  const lines = text.split("\n").filter(l => !/^---+$/.test(l.trim()));

  return (
    <div style={{ fontFamily: "inherit", lineHeight: 1.75, color: C.bodyText }}>
      {lines.map((line, i) => {
        // H2 section heading — black bold + short gold underline bar
        if (line.startsWith("## ")) {
          return (
            <div key={i} style={{ marginTop: i === 0 ? 0 : 28, marginBottom: 12 }}>
              <h3 style={{
                fontSize: 15, fontWeight: 800, color: C.navy,
                letterSpacing: "-0.01em", margin: 0, lineHeight: 1.3,
              }}>
                {line.slice(3)}
              </h3>
              {/* Short gold underline bar */}
              <div style={{
                marginTop: 6, height: 2.5, width: 36,
                background: `linear-gradient(90deg, ${C.goldAccent}, ${C.goldAccent}00)`,
                borderRadius: 2,
              }} />
            </div>
          );
        }
        // H3 sub-heading — smaller, gold
        if (line.startsWith("### ")) {
          return (
            <h4 key={i} style={{
              fontSize: 13, fontWeight: 700, color: C.gold,
              margin: "16px 0 5px", letterSpacing: "0.01em",
            }}>
              {line.slice(4)}
            </h4>
          );
        }
        // Top-level bullet (- or *)
        if (/^[-*]\s/.test(line)) {
          const content = line.replace(/^[-*]\s/, "");
          return (
            <div key={i} style={{ display: "flex", gap: 10, marginBottom: 7, alignItems: "flex-start" }}>
              <span style={{
                color: C.goldAccent, flexShrink: 0, fontWeight: 900,
                fontSize: 13, lineHeight: "22px",
              }}>›</span>
              <span
                style={{ fontSize: 13.5, color: C.bodyText, lineHeight: 1.65, flex: 1 }}
                dangerouslySetInnerHTML={{ __html: inlineBold(content) }}
              />
            </div>
          );
        }
        // Nested bullet (* followed by space inside a bullet context)
        if (/^\s{2,}[*-]\s/.test(line)) {
          const content = line.replace(/^\s+[*-]\s/, "");
          return (
            <div key={i} style={{ display: "flex", gap: 8, marginLeft: 22, marginBottom: 5, alignItems: "flex-start" }}>
              <span style={{ color: C.muted, flexShrink: 0, fontSize: 13, lineHeight: "20px" }}>·</span>
              <span
                style={{ fontSize: 13, color: C.sub, lineHeight: 1.6 }}
                dangerouslySetInnerHTML={{ __html: inlineBold(content) }}
              />
            </div>
          );
        }
        // Blank line → spacing
        if (line.trim() === "") return <div key={i} style={{ height: 10 }} />;
        // Paragraph
        return (
          <p key={i}
            style={{ fontSize: 13.5, color: C.bodyText, marginBottom: 9, lineHeight: 1.7 }}
            dangerouslySetInnerHTML={{ __html: inlineBold(line) }}
          />
        );
      })}
    </div>
  );
}

// ── IPC Quick-Reference table ─────────────────────────────────────────────────
const IPC_CLASSES = [
  { code: "T11–T13", sport: "Athletics Track", desc: "Visual impairment. T11 = total blindness; T13 = partial sight." },
  { code: "T33–T34", sport: "Athletics Track", desc: "Cerebral palsy / brain injury, wheelchair. Limited trunk control." },
  { code: "T43–T44", sport: "Athletics Track", desc: "Leg impairment, ambulatory. Single or double below-knee absence." },
  { code: "T51–T54", sport: "Athletics Track", desc: "Wheelchair. T51 = limited hand function; T54 = full arm function." },
  { code: "F11–F38", sport: "Athletics Field", desc: "Field events mirror T-class impairment types by number." },
  { code: "S1–S14", sport: "Para Swimming", desc: "S1 = lowest function; S14 = intellectual impairment. SB/SM = stroke variants." },
  { code: "BC1–BC4", sport: "Boccia", desc: "Severe cerebral palsy or equivalent. BC3 uses an assistive ramp." },
  { code: "H1–H5", sport: "Handcycle", desc: "H1–H2 = limited/no trunk; H5 = leg impairment only." },
  { code: "B (VIS)", sport: "Cycling / Tri", desc: "Visual impairment. Tandem bike with a sighted pilot." },
  { code: "WH1–WH2", sport: "Wheelchair Fencing", desc: "WH1 = trunk impairment; WH2 = full trunk function." },
];

interface Props {
  paraArchetypes: ArchetypeProfile[];
  userHeight?: number;
  userWeight?: number;
}

const TABS = [
  { id: "overview", label: "Overview" },
  { id: "classes",  label: "Class Codes" },
  { id: "legacy",   label: "Team USA Legacy" },
] as const;

export function ParalympicExplainer({ paraArchetypes, userHeight, userWeight }: Props) {
  const [selected, setSelected]   = useState<ArchetypeProfile | null>(null);
  const [explainer, setExplainer] = useState<string>("");
  const [loading, setLoading]     = useState(false);
  const [activeTab, setActiveTab] = useState<"overview" | "classes" | "legacy">("overview");
  const panelRef = useRef<HTMLDivElement>(null);

  const loadExplainer = useCallback(async (arch: ArchetypeProfile) => {
    if (selected?.id === arch.id) { setSelected(null); setExplainer(""); return; }
    setSelected(arch);
    setExplainer("");
    setLoading(true);
    setActiveTab("overview");
    // Scroll to panel after it mounts (give AnimatePresence ~350ms to render)
    setTimeout(() => {
      panelRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
    }, 360);
    try {
      const data = await fetchParaClassificationExplainer(
        arch.id, arch.paralympic_sports?.[0] ?? "", userHeight, userWeight,
      );
      setExplainer(data.explainer ?? "");
    } catch {
      setExplainer("Unable to load the classification analysis. Please check your connection and try again.");
    } finally {
      setLoading(false);
    }
  }, [selected, userHeight, userWeight]);

  return (
    <section id="paralympic-section" style={{ background: C.bg, padding: "72px 0 88px" }}>
      <div style={{ maxWidth: 1100, margin: "0 auto", padding: "0 24px" }}>

        {/* ── Section header ── */}
        <motion.div
          initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }} transition={{ duration: 0.5 }}
          style={{ textAlign: "center", marginBottom: 52 }}
        >
          <div style={{
            display: "inline-flex", alignItems: "center", gap: 8,
            background: "#EEF2FF", border: "1px solid #C7D2FE",
            borderRadius: 99, padding: "5px 16px", marginBottom: 18,
            fontSize: 11, fontWeight: 800, letterSpacing: "0.1em",
            color: "#4338CA", textTransform: "uppercase",
          }}>
            ♿ Paralympic Deep-Dive
          </div>
          <h2 style={{
            fontSize: "clamp(26px, 4vw, 34px)", fontWeight: 900,
            color: C.navy, marginBottom: 12,
            letterSpacing: "-0.025em", lineHeight: 1.2,
          }}>
            The 6 Archetypes of&nbsp;
            <span style={{ color: "#4338CA" }}>Paralympic</span>&nbsp;Team USA
          </h2>
          <p style={{ color: C.sub, fontSize: 14, maxWidth: 540, margin: "0 auto", lineHeight: 1.65 }}>
            Select an archetype for a <strong style={{ color: C.navy, fontWeight: 700 }}>Gemini-powered</strong> classification
            deep-dive — IPC class codes, biometric profiles, and Team USA legacy.
          </p>
        </motion.div>

        {/* ── IPC Quick-Reference ── */}
        <motion.div
          initial={{ opacity: 0, y: 14 }} whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }} transition={{ duration: 0.45, delay: 0.07 }}
          style={{
            background: C.card, border: `1.5px solid ${C.border}`,
            borderRadius: 20, padding: "24px 28px",
            marginBottom: 40, boxShadow: "0 1px 12px rgba(0,0,0,0.05)",
          }}
        >
          <div style={{
            fontSize: 10.5, fontWeight: 800, color: C.gold,
            letterSpacing: "0.12em", marginBottom: 18, textTransform: "uppercase",
          }}>
            IPC Classification Quick-Reference
          </div>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill,minmax(250px,1fr))", gap: 10 }}>
            {IPC_CLASSES.map(c => (
              <div key={c.code} style={{
                background: "#FAFAF8", border: `1px solid ${C.border}`,
                borderRadius: 11, padding: "11px 14px",
              }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", marginBottom: 4 }}>
                  <span style={{ fontWeight: 800, fontSize: 13.5, color: C.navy }}>{c.code}</span>
                  <span style={{ fontSize: 9.5, color: C.muted, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.07em" }}>
                    {c.sport}
                  </span>
                </div>
                <div style={{ fontSize: 11.5, color: C.sub, lineHeight: 1.5 }}>{c.desc}</div>
              </div>
            ))}
          </div>
        </motion.div>

        {/* ── Card grid — layout-animated so panel expansion reflows grid ── */}
        <motion.div layout style={{
          display: "grid", gridTemplateColumns: "repeat(auto-fill,minmax(300px,1fr))",
          gap: 16, marginBottom: selected ? 24 : 0,
        }}>
          {paraArchetypes.map((a, i) => {
            const isActive = selected?.id === a.id;
            return (
              <motion.button
                key={a.id} layout
                initial={{ opacity: 0, y: 24 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, margin: "-36px" }}
                transition={{ duration: 0.38, delay: i * 0.065 }}
                whileHover={{ y: -2, boxShadow: "0 8px 24px rgba(0,0,0,0.09)" }}
                onClick={() => loadExplainer(a)}
                style={{
                  background: isActive ? C.bgActive : C.card,
                  border: `1.5px solid ${isActive ? C.borderActive : C.border}`,
                  borderRadius: 18, padding: "22px 22px 18px",
                  textAlign: "left", cursor: "pointer", color: C.navy,
                  transition: "background 0.2s, border-color 0.2s",
                  boxShadow: isActive
                    ? `0 0 0 3px ${C.borderActive}18, 0 4px 16px rgba(0,0,0,0.07)`
                    : "0 1px 8px rgba(0,0,0,0.05)",
                }}
              >
                {/* Header */}
                <div style={{ display: "flex", alignItems: "flex-start", gap: 12, marginBottom: 12 }}>
                  <span style={{
                    fontSize: 24, background: `${a.color}14`, borderRadius: 10,
                    width: 44, height: 44, display: "flex", alignItems: "center",
                    justifyContent: "center", flexShrink: 0,
                  }}>{a.icon}</span>
                  <div>
                    <div style={{ fontWeight: 800, fontSize: 15, color: C.navy, marginBottom: 2 }}>{a.label}</div>
                    <div style={{ fontSize: 11.5, color: C.muted, fontWeight: 500 }}>
                      {a.athlete_count ? `${a.athlete_count.toLocaleString()} proxy athletes` : "Functional profile"}
                    </div>
                  </div>
                </div>

                {/* Description */}
                <p style={{ fontSize: 13, color: C.sub, lineHeight: 1.6, marginBottom: 14 }}>{a.description}</p>

                {/* Stats */}
                {(a.avg_height || a.avg_weight || a.medal_rate) && (
                  <div style={{ display: "flex", gap: 8, marginBottom: 14 }}>
                    {a.avg_height != null && (
                      <div style={{
                        background: "#F9FAFB", border: `1px solid ${C.border}`,
                        borderRadius: 10, padding: "7px 10px", flex: 1, textAlign: "center",
                      }}>
                        <div style={{ fontSize: 17, fontWeight: 800, color: C.navy, lineHeight: 1 }}>{a.avg_height}</div>
                        <div style={{ fontSize: 9, color: C.muted, fontWeight: 700, letterSpacing: "0.09em", marginTop: 3 }}>AVG CM</div>
                      </div>
                    )}
                    {a.avg_weight != null && (
                      <div style={{
                        background: "#F9FAFB", border: `1px solid ${C.border}`,
                        borderRadius: 10, padding: "7px 10px", flex: 1, textAlign: "center",
                      }}>
                        <div style={{ fontSize: 17, fontWeight: 800, color: C.navy, lineHeight: 1 }}>{a.avg_weight}</div>
                        <div style={{ fontSize: 9, color: C.muted, fontWeight: 700, letterSpacing: "0.09em", marginTop: 3 }}>AVG KG</div>
                      </div>
                    )}
                    {a.medal_rate != null && (
                      <div style={{
                        background: "#FFFBEE", border: `1px solid ${C.goldAccent}35`,
                        borderRadius: 10, padding: "7px 10px", flex: 1, textAlign: "center",
                      }}>
                        <div style={{ fontSize: 17, fontWeight: 800, color: C.gold, lineHeight: 1 }}>{a.medal_rate}%</div>
                        <div style={{ fontSize: 9, color: C.gold, fontWeight: 700, letterSpacing: "0.09em", marginTop: 3, opacity: 0.75 }}>MEDAL RATE</div>
                      </div>
                    )}
                  </div>
                )}

                {/* Sport tags — blue pills matching screenshot 1 */}
                <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
                  {(a.paralympic_sports ?? []).slice(0, 3).map(s => (
                    <span key={s} style={{
                      background: C.tagBg, border: `1px solid ${C.tagBorder}`,
                      borderRadius: 99, padding: "3px 10px",
                      fontSize: 11, color: C.tagText, fontWeight: 600,
                    }}>{s}</span>
                  ))}
                </div>

                {/* Expand CTA */}
                <div style={{
                  marginTop: 14, paddingTop: 12,
                  borderTop: `1px solid ${isActive ? `${C.borderActive}30` : C.border}`,
                  fontSize: 11.5, color: isActive ? C.borderActive : C.goldAccent,
                  fontWeight: 700, fontStyle: "italic",
                  display: "flex", alignItems: "center", gap: 5,
                  letterSpacing: "0.01em",
                }}>
                  <span style={{ fontSize: 12 }}>✨</span>
                  <span>{isActive ? "Collapse Gemini Analysis ▲" : "Open Gemini Classification Analysis ▼"}</span>
                </div>
              </motion.button>
            );
          })}
        </motion.div>

        {/* ── Gemini Panel — slides in below the grid ── */}
        <AnimatePresence>
          {selected && (
            <motion.div
              ref={panelRef}
              key={selected.id}
              initial={{ opacity: 0, y: 20, scale: 0.99 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 8, scale: 0.99 }}
              transition={{ duration: 0.38, ease: [0.22, 1, 0.36, 1] }}
              style={{ transformOrigin: "top center", scrollMarginTop: 24 }}
            >
              <div style={{
                background: C.card,
                border: `1.5px solid ${C.border}`,
                borderRadius: 24, padding: "32px 36px",
                boxShadow: "0 4px 32px rgba(0,0,0,0.08), 0 1px 6px rgba(0,0,0,0.04)",
              }}>
                {/* Panel header — matches screenshot 2 exactly */}
                <div style={{
                  display: "flex", alignItems: "flex-start",
                  justifyContent: "space-between",
                  marginBottom: 22, flexWrap: "wrap", gap: 16,
                }}>
                  {/* Left: icon + title */}
                  <div style={{ display: "flex", alignItems: "center", gap: 14 }}>
                    <span style={{
                      fontSize: 28, background: `${selected.color}14`, borderRadius: 14,
                      width: 56, height: 56,
                      display: "flex", alignItems: "center", justifyContent: "center",
                      flexShrink: 0,
                    }}>{selected.icon}</span>
                    <div>
                      <div style={{
                        fontWeight: 900, fontSize: 22, color: C.navy,
                        letterSpacing: "-0.025em", lineHeight: 1.2,
                      }}>
                        {selected.label}
                      </div>
                      <div style={{ fontSize: 12.5, color: C.muted, marginTop: 3, fontWeight: 400 }}>
                        Gemini-Powered IPC Classification Analysis
                      </div>
                    </div>
                  </div>

                  {/* Right: segmented tab control */}
                  <div style={{
                    display: "flex",
                    background: C.tabBg,
                    border: `1px solid ${C.border}`,
                    borderRadius: 12, padding: 3,
                    gap: 2, alignSelf: "flex-start",
                  }}>
                    {TABS.map(tab => (
                      <button
                        key={tab.id}
                        onClick={() => setActiveTab(tab.id)}
                        style={{
                          background: activeTab === tab.id ? C.tabBgActive : "transparent",
                          border: "none",
                          borderRadius: 9, padding: "7px 16px",
                          fontSize: 12.5, fontWeight: activeTab === tab.id ? 700 : 500,
                          color: activeTab === tab.id ? C.tabActive : C.tabInactive,
                          cursor: "pointer", transition: "all 0.18s",
                          boxShadow: activeTab === tab.id ? "0 1px 6px rgba(0,0,0,0.1)" : "none",
                          whiteSpace: "nowrap",
                        }}
                      >
                        {tab.label}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Sport pills — blue outlined (matches screenshot 2) */}
                <div style={{ display: "flex", flexWrap: "wrap", gap: 8, marginBottom: 20 }}>
                  {(selected.paralympic_sports ?? []).map(s => (
                    <span key={s} style={{
                      background: C.tagBg, border: `1px solid ${C.tagBorder}`,
                      borderRadius: 99, padding: "5px 14px",
                      fontSize: 12.5, color: C.tagText, fontWeight: 600,
                      display: "flex", alignItems: "center", gap: 5,
                    }}>
                      <span style={{ fontSize: 11 }}>♿</span> {s}
                    </span>
                  ))}
                </div>

                {/* Horizontal rule */}
                <div style={{ height: 1, background: C.border, marginBottom: 24 }} />

                {/* Content area */}
                <AnimatePresence mode="wait">
                  {loading ? (
                    <motion.div
                      key="loading"
                      initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                      transition={{ duration: 0.2 }}
                    >
                      <LoadingState color={selected.color} />
                    </motion.div>
                  ) : explainer ? (
                    <motion.div
                      key={activeTab}
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -6 }}
                      transition={{ duration: 0.28 }}
                    >
                      {activeTab === "overview" && (
                        <Markdown text={filterSection(explainer, ["Classification System Overview", "Biometric"])} />
                      )}
                      {activeTab === "classes" && (
                        <Markdown text={filterSection(explainer, ["Classes for This Archetype", "Training"])} />
                      )}
                      {activeTab === "legacy" && (
                        <Markdown text={filterSection(explainer, ["Team USA Legacy", "Training"])} />
                      )}
                      {/* Attribution */}
                      <div style={{
                        marginTop: 28, padding: "11px 15px",
                        background: "#F9FAFB", border: `1px solid ${C.border}`,
                        borderRadius: 9,
                        fontSize: 11.5, color: C.muted,
                        display: "flex", alignItems: "center", gap: 7,
                        letterSpacing: "0.01em",
                      }}>
                        <span style={{ fontSize: 12 }}>✨</span>
                        Generated by Gemini · Based on IPC classification guidelines and historical Team USA performance data
                      </div>
                    </motion.div>
                  ) : (
                    <motion.div
                      key="placeholder"
                      initial={{ opacity: 0 }} animate={{ opacity: 1 }}
                      style={{ color: C.muted, fontSize: 13.5, padding: "12px 0" }}
                    >
                      Preparing classification analysis…
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </section>
  );
}

// ── Section extractor ─────────────────────────────────────────────────────────
function filterSection(text: string, keywords: string[]): string {
  const lines = text.split("\n");
  const result: string[] = [];
  let capturing = false;
  for (const line of lines) {
    if (line.startsWith("## ")) {
      const heading = line.slice(3).toLowerCase();
      const matches = keywords.some(k => heading.includes(k.toLowerCase()));
      if (matches) { capturing = true; result.push(line); continue; }
      else if (capturing) break;
    } else if (capturing) {
      result.push(line);
    }
  }
  return result.length > 3 ? result.join("\n") : text;
}
