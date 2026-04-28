"use client";
import { motion } from "framer-motion";
import { Sparkles, Medal, ChevronRight } from "lucide-react";

const FLAG_MAP: Record<string, string> = {
  "USA": "🇺🇸", "United States": "🇺🇸", "GBR": "🇬🇧", "Great Britain": "🇬🇧", 
  "GER": "🇩🇪", "Germany": "🇩🇪", "FRA": "🇫🇷", "France": "🇫🇷", 
  "CHN": "🇨🇳", "China": "🇨🇳", "JPN": "🇯🇵", "Japan": "🇯🇵", 
  "AUS": "🇦🇺", "Australia": "🇦🇺", "ITA": "🇮🇹", "Italy": "🇮🇹", 
  "CAN": "🇨🇦", "Canada": "🇨🇦", "RUS": "🇷🇺", "Russia": "🇷🇺", 
  "KOR": "🇰🇷", "South Korea": "🇰🇷", "NED": "🇳🇱", "Netherlands": "🇳🇱", 
  "BRA": "🇧🇷", "Brazil": "🇧🇷", "URS": "🔴", "Soviet Union": "🔴",
  "DJI": "🇩🇯", "Djibouti": "🇩🇯", "GUA": "🇬🇹", "Guatemala": "🇬🇹",
  "CYP": "🇨🇾", "Cyprus": "🇨🇾", "Botswana": "🇧🇼", "Eritrea": "🇪🇷", 
  "Gabon": "🇬🇦", "Barbados": "🇧🇧", "Bermuda": "🇧🇲", "Guyana": "🇬🇾",
};

function parseInline(text: string, highlightColor?: string) {
  const parts = text.split(/(\*\*.*?\*\*)/g);
  return (
    <>
      {parts.map((part, i) => {
        if (part.startsWith('**') && part.endsWith('**')) {
          return <strong key={i} style={{ fontWeight: 800, color: highlightColor || "var(--text-main)" }}>{part.slice(2, -2)}</strong>;
        }
        return <span key={i}>{part}</span>;
      })}
    </>
  );
}

export function FormattedBotMessage({ text, color }: { text: string; color: string }) {
  let enrichedText = text;
  
  // 1. Process flags
  Object.entries(FLAG_MAP).forEach(([name, flag]) => {
    const regex = new RegExp(`\\b(${name})\\b`);
    enrichedText = enrichedText.replace(regex, `${flag} $1`);
  });

  // 2. Process medals
  enrichedText = enrichedText.replace(/\b([Gg]old [Mm]edal(s)?)\b/, '🥇 $1');
  enrichedText = enrichedText.replace(/\b([Ss]ilver [Mm]edal(s)?)\b/, '🥈 $1');
  enrichedText = enrichedText.replace(/\b([Bb]ronze [Mm]edal(s)?)\b/, '🥉 $1');

  const blocks = enrichedText.split('\n\n');
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
      {blocks.map((block, i) => {
        if (block.startsWith('### ')) {
          return (
            <h4 key={i} style={{ fontSize: 16, fontWeight: 800, color: "var(--text-main)", borderBottom: "1px solid #1E293B", paddingBottom: 8, marginTop: 16, display: "flex", alignItems: "center", gap: 8 }}>
              <Medal className="w-4 h-4" style={{ color }} />
              {parseInline(block.replace('### ', ''), color)}
            </h4>
          );
        }

        if (block.includes('\n* ') || block.startsWith('* ')) {
          const lines = block.split('\n');
          return (
            <ul key={i} style={{ display: "flex", flexDirection: "column", gap: 8, marginTop: 4 }}>
              {lines.map((line, j) => {
                const isIndented = line.startsWith('  * ') || line.startsWith('    * ');
                const cleanLine = line.replace(/^(\s*)\*\s/, '');
                if (!cleanLine.trim()) return null;
                return (
                  <li key={j} style={{ display: "flex", alignItems: "flex-start", gap: 10, marginLeft: isIndented ? 24 : 0, marginBottom: 4 }}>
                    <div style={{ background: `${color}25`, borderRadius: "50%", padding: 3, marginTop: 4 }}>
                      <ChevronRight className="w-3.5 h-3.5 shrink-0" style={{ color }} />
                    </div>
                    <span style={{ flex: 1, lineHeight: 1.65 }}>{parseInline(cleanLine, color)}</span>
                  </li>
                );
              })}
            </ul>
          );
        }

        if (block.includes("**Gemini's Insight:**") || block.includes("**The Verdict:**") || block.includes("**Gemini's Insight")) {
          const cleanText = block.replace(/\*\*Gemini's Insight(:?)\*\*/i, '').replace(/\*\*The Verdict(:?)\*\*/i, '');
          return (
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} transition={{ delay: 0.3 }}
              key={i}
              style={{ marginTop: 16, padding: 16, borderRadius: 12, background: `linear-gradient(135deg, ${color}15, #0A1628)`, border: `1px solid ${color}40`, position: "relative", overflow: "hidden" }}
            >
              <div style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 8 }}>
                <Sparkles className="w-4 h-4" style={{ color }} />
                <span style={{ fontWeight: 800, letterSpacing: "0.05em", fontSize: 12, textTransform: "uppercase", color }}>Gemini's Insight</span>
              </div>
              <p style={{ fontStyle: "italic", color: "var(--text-muted)", margin: 0, fontSize: 13, lineHeight: 1.6 }}>{parseInline(cleanText, color)}</p>
            </motion.div>
          );
        }

        return <p key={i} style={{ margin: 0 }}>{parseInline(block, color)}</p>;
      })}
    </div>
  );
}
