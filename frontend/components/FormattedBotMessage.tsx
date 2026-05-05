"use client";
import { motion } from "framer-motion";
import { Sparkles, Medal, ChevronRight, User, Trophy, Ruler, Weight } from "lucide-react";

// ─── Flag map ─────────────────────────────────────────────────────────────────
const FLAG_MAP: Record<string, string> = {
  "USA": "🇺🇸", "United States": "🇺🇸", "GBR": "🇬🇧", "Great Britain": "🇬🇧",
  "GER": "🇩🇪", "Germany": "🇩🇪", "FRA": "🇫🇷", "France": "🇫🇷",
  "CHN": "🇨🇳", "China": "🇨🇳", "JPN": "🇯🇵", "Japan": "🇯🇵",
  "AUS": "🇦🇺", "Australia": "🇦🇺", "ITA": "🇮🇹", "Italy": "🇮🇹",
  "CAN": "🇨🇦", "Canada": "🇨🇦", "RUS": "🇷🇺", "Russia": "🇷🇺",
  "KOR": "🇰🇷", "South Korea": "🇰🇷", "NED": "🇳🇱", "Netherlands": "🇳🇱",
  "BRA": "🇧🇷", "Brazil": "🇧🇷", "URS": "🔴", "Soviet Union": "🔴",
  "ETH": "🇪🇹", "Ethiopia": "🇪🇹", "KEN": "🇰🇪", "Kenya": "🇰🇪",
  "DJI": "🇩🇯", "Djibouti": "🇩🇯",
};

// ─── Inline renderer ──────────────────────────────────────────────────────────
// Renders **bold** as a styled chip and *italic* as <em>.
// All raw ** and ### are consumed here — nothing leaks to the DOM as text.
function parseInline(text: string, accentColor?: string): React.ReactNode {
  // 1. Strip any residual ### / ## heading markers that slipped into inline text
  let t = text.replace(/^#{1,4}\s*/gm, "");

  // 2. Inject flags & medal emojis
  Object.entries(FLAG_MAP).forEach(([name, flag]) => {
    t = t.replace(new RegExp(`\\b(${name})\\b`, "g"), `${flag} $1`);
  });
  t = t
    .replace(/\b([Gg]old [Mm]edal(?:s|ist)?)\b/g, "🥇 $1")
    .replace(/\b([Ss]ilver [Mm]edal(?:s|ist)?)\b/g, "🥈 $1")
    .replace(/\b([Bb]ronze [Mm]edal(?:s|ist)?)\b/g, "🥉 $1");

  // 3. Split on **bold** and *italic*
  const parts = t.split(/(\*\*.*?\*\*|\*[^*]+?\*)/g);
  return (
    <>
      {parts.map((part, i) => {
        if (part.startsWith("**") && part.endsWith("**")) {
          const inner = part.slice(2, -2);
          return (
            <span key={i} style={{
              fontWeight: 700,
              color: accentColor || "#1e293b",
              background: accentColor ? `${accentColor}14` : "rgba(30,41,59,0.07)",
              borderRadius: 4, padding: "1px 5px", display: "inline",
            }}>
              {inner}
            </span>
          );
        }
        if (part.startsWith("*") && part.endsWith("*"))
          return <em key={i} style={{ color: "#475569" }}>{part.slice(1, -1)}</em>;
        return <span key={i}>{part}</span>;
      })}
    </>
  );
}

// ─── Section heading (## in Gemini output) ───────────────────────────────────
function SectionHeading({ content, color }: { content: string; color: string }) {
  // Strip any leading # chars that sneaked in
  const clean = content.replace(/^#+\s*/, "");
  return (
    <div style={{ margin: "6px 0 2px", display: "flex", alignItems: "center", gap: 10 }}>
      <div style={{
        width: 3, height: 20, borderRadius: 2,
        background: `linear-gradient(180deg, ${color}, ${color}44)`,
        flexShrink: 0,
      }} />
      <span style={{
        fontSize: 15, fontWeight: 800,
        color: "#0f172a", letterSpacing: "-0.01em",
      }}>
        {parseInline(clean, color)}
      </span>
    </div>
  );
}

// ─── Modern numbered sport/item card ────────────────────────────────────────
// Handles Gemini output like: "1. **Swimming:** 19 medals (description). 2. **Athletics:** …"
// Each numbered item gets a clean card row — no raw ** visible.
function NumberedSportCard({
  num, label, detail, color
}: { num: string; label: string; detail: string; color: string }) {
  return (
    <motion.div
      initial={{ opacity: 0, x: -8 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ delay: parseInt(num) * 0.06 }}
      style={{
        display: "flex", alignItems: "flex-start", gap: 12,
        padding: "12px 14px",
        background: "#ffffff",
        border: "1px solid #f1f5f9",
        borderLeft: `3px solid ${color}`,
        borderRadius: "0 10px 10px 0",
        boxShadow: "0 1px 6px rgba(0,0,0,0.05)",
      }}
    >
      {/* Rank badge */}
      <div style={{
        width: 26, height: 26, borderRadius: "50%",
        background: color,
        display: "flex", alignItems: "center", justifyContent: "center",
        flexShrink: 0, marginTop: 1,
        boxShadow: `0 2px 8px ${color}44`,
      }}>
        <span style={{ fontSize: 11, fontWeight: 900, color: "#fff" }}>{num}</span>
      </div>
      {/* Content */}
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ fontWeight: 700, fontSize: 14, color: "#0f172a", marginBottom: 2 }}>
          {label}
        </div>
        {detail && (
          <div style={{ fontSize: 13, color: "#475569", lineHeight: 1.6 }}>
            {parseInline(detail, color)}
          </div>
        )}
      </div>
    </motion.div>
  );
}

// ─── Pre-process: split inline numbered list runs ─────────────────────────────
// Gemini sometimes outputs "1. **Foo:** desc. 2. **Bar:** desc. 3. …" on a single line.
// We split these into separate lines so each becomes its own block.
function splitInlineNumberedList(text: string): string {
  // Match "N. " that appears mid-sentence (not at start of line), preceded by a period or content
  return text.replace(/([^\n])(\s+)(\d+\.\s)/g, "$1\n\n$3");
}

// ─── Parse a block that starts with "N. **Label:** rest" ─────────────────────
function parseNumberedItem(trimmed: string): { num: string; label: string; detail: string } | null {
  // "1. **Swimming:** 19 medals (A legendary …)"
  // "1. Swimming — 19 medals"
  const m = trimmed.match(/^(\d+)\.\s+(?:\*\*)?([^*:\n]+?)(?:\*\*)?\s*[:\—–-]\s*(.*)/s);
  if (m) return { num: m[1], label: m[2].trim(), detail: m[3].replace(/\*\*/g, "").trim() };

  // Fallback: "1. Swimming (19 medals …)"
  const m2 = trimmed.match(/^(\d+)\.\s+([^(\n]+?)\s*\(([^)]*)\)/s);
  if (m2) return { num: m2[1], label: m2[2].trim(), detail: m2[3].trim() };

  return null;
}

// ─── Athlete Card ─────────────────────────────────────────────────────────────
function tryParseAthleteCard(block: string, color: string): React.ReactNode | null {
  const nameMatch = block.match(/^#{1,4}\s*\d*\.?\s*(.+)/m);
  if (!nameMatch) return null;
  const name = nameMatch[1].replace(/[—–-].*/, "").trim();

  const extract = (label: string) => {
    const m = block.match(new RegExp(`\\*\\*${label}[:：]?\\*\\*\\s*([^\n*]+)`, "i"))
      || block.match(new RegExp(`${label}[:：]\\s*([^\n*]+)`, "i"));
    return m ? m[1].trim().replace(/\*+/g, "").trim() : null;
  };

  const height = extract("Height");
  const weight = extract("Weight");
  const record = extract("Olympic Record");
  const why = extract("Why (?:he|she|they) match(?:es)? you")
    || extract("Why matches you")
    || extract("Why this match");

  if ([height, weight, record, why].filter(Boolean).length < 2) return null;

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      style={{
        borderRadius: 14, border: `1px solid ${color}30`,
        background: "#ffffff", overflow: "hidden",
        boxShadow: "0 4px 20px rgba(0,0,0,0.08)", marginTop: 8,
      }}
    >
      <div style={{
        background: `linear-gradient(90deg, ${color}20 0%, ${color}06 100%)`,
        borderBottom: `1px solid ${color}25`,
        padding: "14px 18px",
        display: "flex", alignItems: "center", gap: 10,
      }}>
        <div style={{
          width: 34, height: 34, borderRadius: "50%",
          background: `${color}20`, border: `1.5px solid ${color}60`,
          display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0,
        }}>
          <User size={16} style={{ color }} />
        </div>
        <h4 style={{ margin: 0, fontSize: 15, fontWeight: 800, color: "#1e293b" }}>
          {parseInline(name, color)}
        </h4>
      </div>
      <div style={{ padding: "14px 18px", display: "flex", flexDirection: "column", gap: 12 }}>
        {(height || weight || record) && (
          <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
            {height && (
              <div style={{ display: "flex", alignItems: "center", gap: 6, padding: "5px 12px", background: "#f1f5f9", borderRadius: 8, border: "1px solid #e2e8f0" }}>
                <Ruler size={12} style={{ color, flexShrink: 0 }} />
                <span style={{ fontSize: 12, color: "#64748b" }}>Height</span>
                <span style={{ fontSize: 13, fontWeight: 700, color: "#1e293b" }}>{height}</span>
              </div>
            )}
            {weight && (
              <div style={{ display: "flex", alignItems: "center", gap: 6, padding: "5px 12px", background: "#f1f5f9", borderRadius: 8, border: "1px solid #e2e8f0" }}>
                <Weight size={12} style={{ color, flexShrink: 0 }} />
                <span style={{ fontSize: 12, color: "#64748b" }}>Weight</span>
                <span style={{ fontSize: 13, fontWeight: 700, color: "#1e293b" }}>{weight}</span>
              </div>
            )}
            {record && (
              <div style={{ display: "flex", alignItems: "center", gap: 6, padding: "5px 12px", background: `${color}12`, borderRadius: 8, border: `1px solid ${color}30` }}>
                <Trophy size={12} style={{ color, flexShrink: 0 }} />
                <span style={{ fontSize: 12, color: "#64748b" }}>Record</span>
                <span style={{ fontSize: 13, fontWeight: 700, color }}>{record}</span>
              </div>
            )}
          </div>
        )}
        {why && (
          <div style={{ padding: "10px 14px", borderRadius: 10, background: `${color}08`, borderLeft: `3px solid ${color}` }}>
            <div style={{ fontSize: 10, fontWeight: 800, color, textTransform: "uppercase", letterSpacing: "0.08em", marginBottom: 5 }}>
              ✨ Why you match
            </div>
            <p style={{ margin: 0, fontSize: 13, color: "#334155", lineHeight: 1.7 }}>
              {parseInline(why, color)}
            </p>
          </div>
        )}
      </div>
    </motion.div>
  );
}

// ─── Table renderer ───────────────────────────────────────────────────────────
function renderTable(block: string, color: string): React.ReactNode {
  const lines = block.split("\n").filter(l => l.trim().length > 0);
  const sepIdx = lines.findIndex(l => l.includes("|---") || l.includes("| ---"));
  if (sepIdx < 1) return null;

  const parseRow = (line: string) => {
    let c = line.trim();
    if (c.startsWith("|")) c = c.slice(1);
    if (c.endsWith("|")) c = c.slice(0, -1);
    return c.split("|").map(x => x.trim());
  };

  const headers = parseRow(lines[sepIdx - 1]);
  const rows = lines.slice(sepIdx + 1).map(parseRow);

  return (
    <div style={{ overflowX: "auto", maxWidth: "100%", margin: "12px 0", borderRadius: 12, border: "1px solid #e2e8f0", background: "#fff", boxShadow: "0 4px 20px rgba(0,0,0,0.06)" }}>
      <table style={{ width: "100%", borderCollapse: "collapse", textAlign: "left", fontSize: 14 }}>
        <thead>
          <tr style={{ borderBottom: "2px solid #e2e8f0", background: `linear-gradient(90deg, ${color}10, #f8fafc)` }}>
            {headers.map((h, j) => (
              <th key={j} style={{ padding: "12px 16px", whiteSpace: "nowrap", fontWeight: 800, color: "#1e293b" }}>
                {parseInline(h, color)}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.map((row, r) => (
            <tr key={r} style={{ borderBottom: "1px solid #f1f5f9", background: r % 2 === 1 ? "#f8fafc" : "#fff" }}>
              {row.map((cell, c) => (
                <td key={c} style={{ padding: "11px 16px", lineHeight: 1.5, color: c === 0 ? "#1e293b" : "#475569", fontWeight: c === 0 ? 600 : 400 }}>
                  {parseInline(cell, color)}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

// ─── Main component ───────────────────────────────────────────────────────────
export function FormattedBotMessage({ text, color }: { text: string; color: string }) {
  // ── Step 1: split inline numbered list runs onto their own lines ──
  const step1 = splitInlineNumberedList(text);

  // ── Step 2: standard block normalisation ──
  const normalised = step1
    .replace(/(#{1,4} [^\n]+)\n(?!#|\n)/g, "$1\n\n")   // heading → own block
    .replace(/(\n)(#{1,4} )/g, "\n\n$2")                // newline before heading
    .replace(/([^\n])\n(\d+\.\s)/g, "$1\n\n$2")         // numbered items → own block
    .replace(/(#{1,4}[^\n]+)\n(\|)/g, "$1\n\n$2");      // heading before table

  const blocks = normalised.split(/\n\n+/);

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
      {blocks.map((block, i) => {
        const trimmed = block.trim();
        if (!trimmed) return null;

        // ── Section heading ## ──────────────────────────────────────────────
        if (/^#{2}\s/.test(trimmed)) {
          return <SectionHeading key={i} content={trimmed.replace(/^#{2}\s*/, "")} color={color} />;
        }

        // ── Sub-heading ### / #### ──────────────────────────────────────────
        if (/^#{3,4}\s/.test(trimmed)) {
          const card = tryParseAthleteCard(trimmed, color);
          if (card) return <div key={i}>{card}</div>;
          const content = trimmed.replace(/^#{3,4}\s*/, "");
          return (
            <div key={i} style={{
              fontSize: 13.5, fontWeight: 700, color: "#0f172a",
              display: "flex", alignItems: "center", gap: 8,
              paddingBottom: 3, borderBottom: `1px solid ${color}25`,
            }}>
              <Medal size={12} style={{ color, flexShrink: 0 }} />
              {parseInline(content, color)}
            </div>
          );
        }

        // ── Numbered item with "**Label:** detail" or "Label — detail" ─────
        if (/^\d+\.\s/.test(trimmed) && !trimmed.startsWith("|")) {
          // Try athlete card first
          if (trimmed.includes("Height") || trimmed.includes("Weight") || trimmed.includes("Olympic Record")) {
            const card = tryParseAthleteCard(`### ${trimmed}`, color);
            if (card) return <div key={i}>{card}</div>;
          }
          // Try modern sport card
          const parsed = parseNumberedItem(trimmed);
          if (parsed) {
            return <NumberedSportCard key={i} {...parsed} color={color} />;
          }
          // Fallback: plain numbered paragraph
          const [, num, rest] = trimmed.match(/^(\d+)\.\s+(.*)$/s) ?? [];
          if (num && rest) {
            return (
              <div key={i} style={{ display: "flex", alignItems: "flex-start", gap: 10 }}>
                <div style={{
                  width: 22, height: 22, borderRadius: "50%", background: color,
                  display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0, marginTop: 2,
                }}>
                  <span style={{ fontSize: 10, fontWeight: 900, color: "#fff" }}>{num}</span>
                </div>
                <p style={{ margin: 0, fontSize: 14, color: "#1e293b", lineHeight: 1.7, flex: 1 }}>
                  {parseInline(rest, color)}
                </p>
              </div>
            );
          }
        }

        // ── Gemini's Insight card ───────────────────────────────────────────
        if (/\*\*Gemini'?s? Insight[:：]?\*\*|\*\*The Verdict[:：]?\*\*/i.test(trimmed)) {
          const clean = trimmed
            .replace(/\*\*Gemini'?s? Insight[:：]?\*\*/gi, "")
            .replace(/\*\*The Verdict[:：]?\*\*/gi, "")
            .trim();
          return (
            <motion.div
              key={i}
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
              style={{
                marginTop: 14, borderRadius: 14, overflow: "hidden",
                background: "#0f172a",
                border: `1px solid ${color}40`,
                boxShadow: `0 0 20px ${color}15, 0 4px 20px rgba(0,0,0,0.15)`,
              }}
            >
              <div style={{ height: 3, background: `linear-gradient(90deg, ${color}, ${color}44)` }} />
              <div style={{ padding: "14px 18px" }}>
                <div style={{ display: "flex", alignItems: "center", gap: 7, marginBottom: 10 }}>
                  <div style={{
                    width: 26, height: 26, borderRadius: "50%",
                    background: `${color}20`, border: `1px solid ${color}50`,
                    display: "flex", alignItems: "center", justifyContent: "center",
                  }}>
                    <Sparkles size={13} style={{ color }} />
                  </div>
                  <span style={{ fontWeight: 800, letterSpacing: "0.08em", fontSize: 11, textTransform: "uppercase", color }}>
                    Gemini&apos;s Insight
                  </span>
                </div>
                <p style={{ fontStyle: "italic", color: "#f1f5f9", margin: 0, fontSize: 14, lineHeight: 1.75 }}>
                  {parseInline(clean, color)}
                </p>
              </div>
            </motion.div>
          );
        }

        // ── Markdown table ──────────────────────────────────────────────────
        if (trimmed.includes("\n|") || trimmed.startsWith("|")) {
          const table = renderTable(trimmed, color);
          if (table) return <div key={i}>{table}</div>;
        }

        // ── Bullet list ─────────────────────────────────────────────────────
        if (/^[\*\-] /.test(trimmed) || trimmed.includes("\n* ") || trimmed.includes("\n- ")) {
          const lines = trimmed.split("\n");
          return (
            <ul key={i} style={{ display: "flex", flexDirection: "column", gap: 7, margin: 0, paddingLeft: 0, listStyle: "none" }}>
              {lines.map((line, j) => {
                const isIndented = /^\s{2,}[\*\-] /.test(line);
                const clean = line.replace(/^\s*[\*\-] /, "").trim();
                if (!clean) return null;
                return (
                  <li key={j} style={{ display: "flex", alignItems: "flex-start", gap: 10, marginLeft: isIndented ? 20 : 0 }}>
                    <div style={{ background: `${color}20`, borderRadius: "50%", padding: 3, marginTop: 3, flexShrink: 0 }}>
                      <ChevronRight size={13} style={{ color }} />
                    </div>
                    <span style={{ flex: 1, lineHeight: 1.7, fontSize: 14, color: "#1e293b" }}>
                      {parseInline(clean, color)}
                    </span>
                  </li>
                );
              })}
            </ul>
          );
        }

        // ── Default paragraph ───────────────────────────────────────────────
        return (
          <p key={i} style={{ margin: 0, lineHeight: 1.75, fontSize: 14, color: "#1e293b" }}>
            {parseInline(trimmed, color)}
          </p>
        );
      })}
    </div>
  );
}
