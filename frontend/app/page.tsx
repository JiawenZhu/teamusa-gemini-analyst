"use client";
import { useEffect, useState, useRef, useCallback } from "react";
import { fetchStats, fetchArchetypes, matchBiometrics, fetchTimeline, sendChat } from "@/lib/api";
import type { DatasetStats, ArchetypeProfile, MatchResult, TimelinePoint } from "@/lib/api";
import { motion } from "framer-motion";
import { Sparkles, Medal, ChevronRight, Terminal, Activity, ArrowUp, MoreHorizontal, User, Share2, Download, Check, Mic, MicOff, Volume2, VolumeX } from "lucide-react";

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

function FormattedBotMessage({ text, color }: { text: string; color: string }) {
  let enrichedText = text;
  
  // 1. Process flags (String.prototype.replace without 'g' flag only replaces the first occurrence!)
  Object.entries(FLAG_MAP).forEach(([name, flag]) => {
    const regex = new RegExp(`\\b(${name})\\b`);
    enrichedText = enrichedText.replace(regex, `${flag} $1`);
  });

  // 2. Process medals (first occurrence only)
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
const fmt = (n: number) => n.toLocaleString();
const pct = (n: number) => `${Math.round(n)}%`;

function AnimCount({ target, duration = 1800 }: { target: number; duration?: number }) {
  const [v, setV] = useState(0);
  useEffect(() => {
    let start: number, raf: number;
    const tick = (ts: number) => {
      if (!start) start = ts;
      const p = Math.min((ts - start) / duration, 1);
      setV(Math.floor(p * target));
      if (p < 1) raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [target, duration]);
  return <>{fmt(v)}</>;
}

// bar for sport affinity
function Bar({ label, pct: p, color }: { label: string; pct: number; color: string }) {
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
}

export default function Page() {
  const [stats, setStats] = useState<DatasetStats | null>(null);
  const [archetypes, setArchetypes] = useState<ArchetypeProfile[]>([]);
  const [selected, setSelected] = useState<ArchetypeProfile | null>(null);
  const [h, setH] = useState(""); const [w, setW] = useState(""); const [age, setAge] = useState("");
  const [matching, setMatching] = useState(false);
  const [result, setResult] = useState<MatchResult | null>(null);
  const [glitchArch, setGlitchArch] = useState<ArchetypeProfile | null>(null);
  const [timeline, setTimeline] = useState<TimelinePoint[]>([]);
  const [chat, setChat] = useState<{ role: string; text: string }[]>([]);
  const [msg, setMsg] = useState("");
  const [chatLoading, setCL] = useState(false);
  const [copied, setCopied] = useState(false);
  // Voice Oracle state
  const [voiceEnabled, setVoiceEnabled] = useState(false);
  const [micState, setMicState] = useState<"idle" | "listening" | "processing">("idle");
  const [isSpeaking, setIsSpeaking] = useState(false);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const recognitionRef = useRef<any>(null);
  const resultRef = useRef<HTMLDivElement>(null);
  const chatContainerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    fetchStats().then(setStats);
    fetchArchetypes().then(setArchetypes);
    fetchTimeline().then(setTimeline);
  }, []);

  useEffect(() => {
    if (chatContainerRef.current) {
      chatContainerRef.current.scrollTo({
        top: chatContainerRef.current.scrollHeight,
        behavior: "smooth"
      });
    }
  }, [chat, chatLoading]);

  const doMatch = useCallback(async () => {
    if (!h || !w) return;
    setMatching(true); setResult(null); setGlitchArch(null);
    const r = await matchBiometrics(parseFloat(h), parseFloat(w), age ? parseInt(age) : undefined);
    
    // Glitch / Dataserver suspense effect
    let ticks = 0;
    setTimeout(() => resultRef.current?.scrollIntoView({ behavior: "smooth", block: "center" }), 50);
    const interval = setInterval(() => {
      setGlitchArch(archetypes[Math.floor(Math.random() * archetypes.length)]);
      ticks++;
      if (ticks > 15) {
        clearInterval(interval);
        setGlitchArch(null);
        setResult(r);
        setMatching(false);
      }
    }, 100);
  }, [h, w, age, archetypes]);

  // ── TTS playback (Google Cloud → browser fallback) ─────────────────────
  const playTTS = useCallback(async (text: string) => {
    if (!voiceEnabled) return;
    if (audioRef.current) { audioRef.current.pause(); audioRef.current = null; }
    window.speechSynthesis?.cancel();
    setIsSpeaking(true);
    try {
      const res = await fetch("/api/tts", {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ text }),
      });
      const { audio } = await res.json();
      if (audio) {
        const bytes = Uint8Array.from(atob(audio), c => c.charCodeAt(0));
        const blob = new Blob([bytes], { type: "audio/mp3" });
        const url = URL.createObjectURL(blob);
        const audioEl = new Audio(url);
        audioRef.current = audioEl;
        audioEl.onended = () => { setIsSpeaking(false); URL.revokeObjectURL(url); };
        audioEl.play();
      } else {
        const utter = new SpeechSynthesisUtterance(text.replace(/[*#_]/g, ""));
        utter.rate = 0.9; utter.pitch = 0.8;
        utter.onend = () => setIsSpeaking(false);
        window.speechSynthesis.speak(utter);
      }
    } catch { setIsSpeaking(false); }
  }, [voiceEnabled]);

  // ── Mic / Speech-to-Text ──────────────────────────────────────────────
  const startListening = useCallback(() => {
    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (!SpeechRecognition) { alert("Speech recognition is not supported. Please use Chrome."); return; }
    if (audioRef.current) { audioRef.current.pause(); audioRef.current = null; }
    window.speechSynthesis?.cancel(); setIsSpeaking(false);
    const rec = new SpeechRecognition();
    rec.lang = "en-US"; rec.interimResults = false; rec.maxAlternatives = 1;
    recognitionRef.current = rec;
    setMicState("listening");
    rec.onresult = (e: any) => {
      const transcript = e.results[0][0].transcript;
      setMsg(transcript); setMicState("processing");
      setTimeout(() => setMicState("idle"), 300);
    };
    rec.onerror = () => setMicState("idle");
    rec.onend = () => setMicState(s => s === "listening" ? "idle" : s);
    rec.start();
  }, []);

  const stopListening = useCallback(() => {
    recognitionRef.current?.stop(); setMicState("idle");
  }, []);

  const shareDna = useCallback(() => {
    if (!result) return;
    const params = new URLSearchParams({
      arch: result.archetype.label,
      icon: result.archetype.icon,
      color: result.archetype.color,
      bmi: result.user_bmi.toFixed(1),
      sports: result.archetype.olympic_sports.slice(0, 3).join(", "),
      matches: "847",
    });
    const shareUrl = `${window.location.origin}/card?${params.toString()}`;
    navigator.clipboard.writeText(shareUrl);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }, [result]);

  const doChat = useCallback(async () => {
    if (!msg.trim() || !result) return;
    const m = msg.trim();
    setMsg(""); setCL(true);
    const currentChat = [...chat];
    setChat(c => [...c, { role: "user", text: m }]);
    const reply = await sendChat(m, result.archetype_id, currentChat);
    setChat(c => [...c, { role: "bot", text: reply }]);
    setCL(false);
    if (reply) playTTS(reply);
  }, [msg, result, chat, playTTS]);

  const accent = result?.archetype?.color || "#C9A227";

  // ── scatter mini-chart (SVG) ────────────────────────────────────────────
  const W = 600, H = 260, PAD = 40;
  const minY = 140, maxY = 220, minX = 1890, maxX = 2020;
  const sx = (year: number) => PAD + ((year - minX) / (maxX - minX)) * (W - PAD * 2);
  const sy = (ht: number) => H - PAD - ((ht - minY) / (maxY - minY)) * (H - PAD * 2);
  const archColor: Record<string, string> = {
    powerhouse: "#EF4444", aerobic_engine: "#3B82F6", explosive_athlete: "#F59E0B",
    precision_maestro: "#8B5CF6", aquatic_titan: "#06B6D4", agile_competitor: "#10B981",
  };

  const bgAccent = result?.archetype?.color || glitchArch?.color || "transparent";

  return (
    <main style={{ background: "var(--navy)", minHeight: "100vh", color: "var(--text-main)", position: "relative", overflow: "hidden" }}>
      
      {/* Dynamic Ambient Background */}
      <div style={{
        position: "fixed", top: 0, left: 0, right: 0, bottom: 0,
        background: `radial-gradient(circle at 50% 40%, ${bgAccent}15, transparent 70%)`,
        transition: "background 1.5s ease", pointerEvents: "none", zIndex: 0
      }} />

      <div style={{ position: "relative", zIndex: 1 }}>
        {/* ── HERO ───────────────────────────────────────────────────────── */}
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
        <p style={{ marginTop: 18, fontSize: 11, color: "var(--text-sub)" }}>
          Data: {stats?.data_source || "github.com/rgriff23/Olympic_history"} · Filtered to USA Summer athletes · No individual athletes identified
        </p>
      </section>

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

      {/* ── RESULTS & GLITCH REVEAL ────────────────────────────────────── */}
      {(result || glitchArch) && (() => {
        const displayArch = glitchArch || result?.archetype;
        if (!displayArch) return null;
        return (
        <section ref={resultRef} style={{ maxWidth: 900, margin: "0 auto", padding: "0 24px 80px" }}>
          {/* Archetype reveal */}
          <motion.div 
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

            {/* Share / Download Actions */}
            {result && !glitchArch && (
              <motion.div 
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.5 }}
                style={{ display: "flex", gap: 12, justifyContent: "center", marginTop: 32, position: "relative", zIndex: 1 }}
              >
                <button onClick={shareDna} style={{
                  background: "rgba(255,255,255,1)",
                  color: "#0A1628",
                  padding: "12px 24px",
                  borderRadius: "14px",
                  fontWeight: 800,
                  fontSize: "14px",
                  display: "flex",
                  alignItems: "center",
                  gap: 8,
                  border: "none",
                  cursor: "pointer",
                  boxShadow: "0 10px 20px rgba(0,0,0,0.2)",
                  transition: "all 0.2s"
                }}
                  onMouseDown={e => e.currentTarget.style.transform = "scale(0.96)"}
                  onMouseUp={e => e.currentTarget.style.transform = "scale(1)"}
                >
                  {copied ? <Check className="w-4 h-4" /> : <Share2 className="w-4 h-4" />}
                  {copied ? "Link Copied!" : "Share My DNA Card"}
                </button>

                <a 
                  href={`/api/og?arch=${result.archetype.label}&icon=${result.archetype.icon}&color=${result.archetype.color.replace('#','%23')}&bmi=${result.user_bmi.toFixed(1)}&sports=${result.archetype.olympic_sports.slice(0, 3).join(", ")}&matches=847`}
                  download={`TeamUSA-Gemini-Analyst-${result.archetype.label.replace(/\s+/g, '-')}.png`}
                  style={{
                    background: "rgba(255,255,255,0.15)",
                    backdropFilter: "blur(12px)",
                    border: "1px solid rgba(255,255,255,0.2)",
                    color: "white",
                    padding: "12px 20px",
                    borderRadius: "14px",
                    fontWeight: 700,
                    fontSize: "14px",
                    display: "flex",
                    alignItems: "center",
                    gap: 8,
                    textDecoration: "none",
                    boxShadow: "0 10px 20px rgba(0,0,0,0.1)",
                    transition: "all 0.2s"
                  }}
                  onMouseEnter={e => e.currentTarget.style.background = "rgba(255,255,255,0.25)"}
                  onMouseLeave={e => e.currentTarget.style.background = "rgba(255,255,255,0.15)"}
                >
                  <Download className="w-4 h-4" /> Download
                </a>
              </motion.div>
            )}

            {result?.percentile_note && (
              <p style={{ marginTop: 24, fontSize: 13, color: "rgba(255,255,255,0.6)", fontStyle: "italic", position: "relative", zIndex: 1 }}>📊 {result.percentile_note}</p>
            )}
          </motion.div>

          {/* Olympic + Paralympic alignment */}
          {result && (
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }} style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16, marginBottom: 24 }}>
            <div style={{ background: "var(--bg-card)", border: "1px solid var(--border-color)", borderRadius: 20, padding: 32, boxShadow: "0 10px 30px rgba(0,0,0,0.05)" }}>
              <h3 style={{ fontWeight: 800, marginBottom: 24, fontSize: 18, display: "flex", alignItems: "center", gap: 8 }}>🏅 Olympic Sport Alignment</h3>
              {displayArch.olympic_sports?.slice(0, 5).map((s, i) => (
                <Bar key={s} label={s} pct={95 - i * 8} color={displayArch.color || "#C9A227"} />
              ))}
            </div>
            <div style={{ background: "var(--bg-card)", border: "1px solid rgba(124, 58, 237, 0.2)", borderRadius: 20, padding: 32, boxShadow: "0 10px 30px rgba(0,0,0,0.05)" }}>
              <h3 style={{ fontWeight: 800, marginBottom: 24, fontSize: 18, display: "flex", alignItems: "center", gap: 8 }}>♿ Paralympic Alignment</h3>
              {displayArch.paralympic_sports?.map((s, i) => (
                <Bar key={s} label={s} pct={90 - i * 10} color="#7C3AED" />
              ))}
              <p style={{ fontSize: 11, color: "var(--text-sub)", marginTop: 14, lineHeight: 1.5 }}>
                Paralympic sport alignment is based on biometric archetype patterns. Individual classification depends on IPC medical assessment.
              </p>
            </div>
          </motion.div>
          )}

          {/* Closest historical records */}
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
          )}

          {/* Chat */}
          {result && (
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }} style={{ background: "var(--bg-card)", border: "1px solid var(--border-color)", borderRadius: 24, padding: "32px", boxShadow: "0 20px 60px rgba(0,0,0,0.15)" }}>
              <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 6, width: "100%" }}>
                <div style={{ width: 40, height: 40, borderRadius: "50%", background: `linear-gradient(135deg, ${result.archetype.color}, #0A1628)`, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0, boxShadow: `0 0 14px ${result.archetype.color}60` }}>
                  {isSpeaking ? (
                    <div style={{ display: "flex", alignItems: "center", gap: 2 }}>
                      {[1, 1.5, 0.8, 1.3, 0.9].map((h, i) => (
                        <motion.div key={i} animate={{ scaleY: [1, h * 1.8, 1] }} transition={{ repeat: Infinity, duration: 0.5 + i * 0.1, delay: i * 0.08 }} style={{ width: 3, height: 12, background: "white", borderRadius: 99, transformOrigin: "center" }} />
                      ))}
                    </div>
                  ) : (
                    <Sparkles className="w-5 h-5 text-white" />
                  )}
                </div>
                <div style={{ flex: 1 }}>
                  <h3 style={{ fontWeight: 900, fontSize: 18, letterSpacing: "-0.02em" }}>Ask Gemini</h3>
                  <p style={{ fontSize: 12, color: "var(--text-sub)", fontWeight: 500 }}>Powered by Gemini · Live 271k row Olympic database</p>
                </div>
                <button onClick={() => { if (voiceEnabled) { audioRef.current?.pause(); window.speechSynthesis?.cancel(); setIsSpeaking(false); } setVoiceEnabled(v => !v); }}
                  style={{ display: "flex", alignItems: "center", gap: 6, padding: "8px 14px", borderRadius: 99, background: voiceEnabled ? `${result.archetype.color}20` : "var(--border-color)", border: `1px solid ${voiceEnabled ? result.archetype.color + "60" : "transparent"}`, color: voiceEnabled ? result.archetype.color : "var(--text-sub)", fontWeight: 700, fontSize: 12, cursor: "pointer", transition: "all 0.2s", flexShrink: 0 }}>
                  {voiceEnabled ? <Volume2 className="w-4 h-4" /> : <VolumeX className="w-4 h-4" />}
                  {voiceEnabled ? "Voice ON" : "Voice"}
                </button>
              </div>

            <div ref={chatContainerRef} style={{ minHeight: 180, maxHeight: 500, overflowY: "auto", margin: "24px 0", paddingRight: 8, display: "flex", flexDirection: "column", gap: 24 }}>
              {chat.map((m, i) => (
                <motion.div
                  initial={{ opacity: 0, y: 15, scale: 0.98 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  transition={{ type: "spring", stiffness: 220, damping: 22 }}
                  key={i}
                  style={{ display: "flex", gap: 12, alignItems: "flex-end", alignSelf: m.role === "user" ? "flex-end" : "flex-start", maxWidth: "85%" }}
                >
                  {m.role !== "user" && (
                    <div style={{ width: 32, height: 32, borderRadius: "50%", background: `linear-gradient(135deg, ${result.archetype.color}, #0A1628)`, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0, boxShadow: `0 0 10px ${result.archetype.color}40` }}>
                      <Sparkles className="w-4 h-4" style={{ color: "#FFF" }} />
                    </div>
                  )}
                  <div style={{
                    padding: "16px 20px", fontSize: 14.5, lineHeight: 1.6,
                    background: m.role === "user" ? `linear-gradient(135deg, ${result.archetype.color}, ${result.archetype.color}DD)` : "var(--bg-main)",
                    border: m.role === "user" ? "none" : "1px solid var(--border-color)",
                    color: m.role === "user" ? "#FFF" : "var(--text-main)",
                    borderRadius: 20,
                    borderBottomRightRadius: m.role === "user" ? 4 : 20,
                    borderBottomLeftRadius: m.role === "user" ? 20 : 4,
                    boxShadow: m.role === "user" ? `0 8px 24px ${result.archetype.color}40` : "0 8px 24px rgba(0,0,0,0.04)",
                  }}>
                    {m.role === "user" ? (
                      <span style={{ fontWeight: 600 }}>{m.text}</span>
                    ) : (
                      <FormattedBotMessage text={m.text} color={result.archetype.color} />
                    )}
                  </div>
                  {m.role === "user" && (
                    <div style={{ width: 32, height: 32, borderRadius: "50%", background: "var(--border-color)", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                      <User className="w-4 h-4 text-white" />
                    </div>
                  )}
                </motion.div>
              ))}
              
              {chatLoading && (
                <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} style={{ display: "flex", gap: 12, alignItems: "flex-end", alignSelf: "flex-start" }}>
                   <div style={{ width: 32, height: 32, borderRadius: "50%", background: `linear-gradient(135deg, ${result.archetype.color}, #0A1628)`, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0, boxShadow: `0 0 10px ${result.archetype.color}40` }}>
                     <Sparkles className="w-4 h-4" style={{ color: "#FFF" }} />
                   </div>
                   <div style={{ padding: "16px 20px", background: "var(--bg-main)", border: "1px solid var(--border-color)", borderRadius: 20, borderBottomLeftRadius: 4, display: "flex", alignItems: "center", gap: 6 }}>
                     <motion.div animate={{ y: [0, -4, 0] }} transition={{ repeat: Infinity, duration: 0.6, delay: 0 }} style={{ width: 6, height: 6, borderRadius: "50%", background: result.archetype.color }} />
                     <motion.div animate={{ y: [0, -4, 0] }} transition={{ repeat: Infinity, duration: 0.6, delay: 0.15 }} style={{ width: 6, height: 6, borderRadius: "50%", background: result.archetype.color }} />
                     <motion.div animate={{ y: [0, -4, 0] }} transition={{ repeat: Infinity, duration: 0.6, delay: 0.3 }} style={{ width: 6, height: 6, borderRadius: "50%", background: result.archetype.color }} />
                   </div>
                </motion.div>
              )}
            </div>

            <div style={{ 
              display: "flex", alignItems: "center", gap: 12, position: "relative",
              background: "var(--bg-main)", border: "1px solid var(--border-color)", borderRadius: 99, 
              padding: "6px 6px 6px 20px", boxShadow: "0 8px 24px rgba(0,0,0,0.05)",
              transition: "border-color 0.2s, box-shadow 0.2s"
            }}
              onFocus={(e) => { e.currentTarget.style.borderColor = result.archetype.color; e.currentTarget.style.boxShadow = `0 8px 32px ${result.archetype.color}20`; }}
              onBlur={(e) => { e.currentTarget.style.borderColor = "var(--border-color)"; e.currentTarget.style.boxShadow = "0 8px 24px rgba(0,0,0,0.05)"; }}
            >
              <input id="chat-input" value={msg} onChange={e => setMsg(e.target.value)}
                onKeyDown={e => e.key === "Enter" && doChat()}
                placeholder={micState === "listening" ? "Listening…" : "Ask Gemini about Olympic history..."}
                style={{ flex: 1, background: "transparent", border: "none", color: "var(--text-main)", fontSize: 15, outline: "none", fontStyle: micState === "listening" ? "italic" : "normal" }}
              />
              {/* Mic Button */}
              <button
                id="mic-btn"
                onClick={micState === "listening" ? stopListening : startListening}
                title={micState === "listening" ? "Stop listening" : "Ask Gemini"}
                style={{
                  width: 44, height: 44, borderRadius: "50%",
                  background: micState === "listening"
                    ? "#EF4444"
                    : "var(--border-color)",
                  border: micState === "listening" ? "none" : "1px solid var(--border-color)",
                  color: micState === "listening" ? "#FFF" : "var(--text-sub)",
                  cursor: "pointer", transition: "all 0.2s",
                  display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0,
                  boxShadow: micState === "listening" ? "0 0 0 6px rgba(239,68,68,0.2)" : "none",
                  animation: micState === "listening" ? "micPulse 1.2s ease-in-out infinite" : "none",
                }}
              >
                {micState === "listening" ? <MicOff className="w-4 h-4" /> : <Mic className="w-4 h-4" />}
              </button>
              <button id="chat-send" onClick={doChat} disabled={chatLoading || !msg.trim()}
                style={{ 
                  width: 44, height: 44, borderRadius: "50%", 
                  background: msg.trim() ? `linear-gradient(135deg, ${result.archetype.color}, ${result.archetype.color}DD)` : "var(--border-color)", 
                  border: "none", color: "#FFF", 
                  cursor: chatLoading || !msg.trim() ? "not-allowed" : "pointer", 
                  opacity: chatLoading ? 0.5 : 1, transition: "all 0.2s", 
                  display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0,
                  boxShadow: msg.trim() ? `0 4px 12px ${result.archetype.color}50` : "none"
                }}
                onMouseDown={e => e.currentTarget.style.transform = "scale(0.92)"}
                onMouseUp={e => e.currentTarget.style.transform = "scale(1)"}
                onMouseLeave={e => e.currentTarget.style.transform = "scale(1)"}
              >
                <ArrowUp className="w-5 h-5" />
              </button>
            </div>
          </motion.div>
          )}
        </section>
        );
      })()}

      {/* ── ARCHETYPE EXPLORER ─────────────────────────────────────────── */}
      <section style={{ maxWidth: 1100, margin: "0 auto", padding: "64px 24px" }}>
        <h2 style={{ textAlign: "center", fontSize: 28, fontWeight: 800, marginBottom: 8 }}>
          The 6 Archetypes of <span style={{ color: "#C9A227" }}>Team USA</span>
        </h2>
        <p style={{ textAlign: "center", color: "var(--text-sub)", marginBottom: 40, fontSize: 14 }}>
          K-means clustering of {fmt(stats?.total_records || 0)} athlete biometric records · 1896–2016
        </p>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill,minmax(300px,1fr))", gap: 16 }}>
          {archetypes.map((a, i) => (
            <motion.button 
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: "-50px" }}
              transition={{ duration: 0.5, delay: i * 0.1 }}
              key={a.id} className="card-hover" onClick={() => setSelected(selected?.id === a.id ? null : a)}
              style={{
                background: selected?.id === a.id ? `${a.color}18` : "var(--bg-card)",
                border: `1px solid ${selected?.id === a.id ? a.color + "80" : "var(--border-color)"}`,
                borderRadius: 16, padding: 24, textAlign: "left", cursor: "pointer",
                color: "var(--text-main)",
              }}>
              <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 12 }}>
                <span style={{ fontSize: 32 }}>{a.icon}</span>
                <div>
                  <div style={{ fontWeight: 700, fontSize: 15, color: a.color }}>{a.label}</div>
                  <div style={{ fontSize: 12, color: "var(--text-sub)" }}>{fmt(a.athlete_count || 0)} athletes</div>
                </div>
              </div>
              <p style={{ fontSize: 13, color: "var(--text-muted)", lineHeight: 1.55, marginBottom: 14 }}>{a.description}</p>
              <div style={{ display: "flex", gap: 8, marginBottom: 12 }}>
                <div style={{ background: "var(--border-color)", borderRadius: 8, padding: "6px 10px", flex: 1, textAlign: "center" }}>
                  <div style={{ fontSize: 16, fontWeight: 700 }}>{a.avg_height}</div>
                  <div style={{ fontSize: 10, color: "var(--text-sub)" }}>AVG CM</div>
                </div>
                <div style={{ background: "var(--border-color)", borderRadius: 8, padding: "6px 10px", flex: 1, textAlign: "center" }}>
                  <div style={{ fontSize: 16, fontWeight: 700 }}>{a.avg_weight}</div>
                  <div style={{ fontSize: 10, color: "var(--text-sub)" }}>AVG KG</div>
                </div>
                <div style={{ background: "var(--border-color)", borderRadius: 8, padding: "6px 10px", flex: 1, textAlign: "center" }}>
                  <div style={{ fontSize: 16, fontWeight: 700, color: "#C9A227" }}>{a.medal_rate}%</div>
                  <div style={{ fontSize: 10, color: "var(--text-sub)" }}>MEDAL RATE</div>
                </div>
              </div>
              {selected?.id === a.id && a.top_sports && (
                <div style={{ borderTop: "1px solid #1E293B", paddingTop: 14 }}>
                  <div style={{ fontSize: 11, color: "var(--text-sub)", fontWeight: 700, marginBottom: 8, letterSpacing: "0.08em" }}>TOP SPORTS (OLYMPIC)</div>
                  {a.top_sports.slice(0, 5).map(s => (
                    <div key={s.Sport} style={{ display: "flex", justifyContent: "space-between", fontSize: 12, color: "var(--text-muted)", marginBottom: 4 }}>
                      <span>{s.Sport}</span>
                      <span style={{ color: "#C9A227" }}>{s.medals} 🥇</span>
                    </div>
                  ))}
                  <div style={{ marginTop: 10, fontSize: 11, color: "var(--text-sub)", fontWeight: 700, letterSpacing: "0.08em" }}>PARALYMPIC ALIGNMENT</div>
                  {a.paralympic_sports.map(s => (
                    <div key={s} style={{ fontSize: 12, color: "#7C3AED", marginTop: 4 }}>♿ {s}</div>
                  ))}
                </div>
              )}
            </motion.button>
          ))}
        </div>
      </section>

      {/* ── TIMELINE SCATTER ───────────────────────────────────────────── */}
      {timeline.length > 0 && (
        <motion.section 
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-50px" }}
          transition={{ duration: 0.6 }}
          style={{ maxWidth: 1100, margin: "0 auto", padding: "0 24px 64px" }}
        >
          <h2 style={{ fontSize: 22, fontWeight: 800, marginBottom: 4 }}>120-Year Athlete Timeline</h2>
          <p style={{ fontSize: 13, color: "var(--text-sub)", marginBottom: 20 }}>Height distribution of USA Summer Olympic athletes by year — colored by archetype</p>
          <div style={{ background: "var(--bg-card)", border: "1px solid #1E293B", borderRadius: 16, padding: 16, overflowX: "auto" }}>
            <svg viewBox={`0 0 ${W} ${H}`} style={{ width: "100%", maxHeight: 260 }}>
              {/* Axes */}
              <line x1={PAD} y1={H - PAD} x2={W - PAD} y2={H - PAD} stroke="var(--border-color)" />
              <line x1={PAD} y1={PAD} x2={PAD} y2={H - PAD} stroke="var(--border-color)" />
              {[1900, 1920, 1940, 1960, 1980, 2000, 2016].map(yr => (
                <text key={yr} x={sx(yr)} y={H - PAD + 14} textAnchor="middle" fontSize={9} fill="var(--text-sub)">{yr}</text>
              ))}
              {[150, 160, 170, 180, 190, 200, 210].map(ht => (
                <text key={ht} x={PAD - 4} y={sy(ht) + 3} textAnchor="end" fontSize={9} fill="var(--text-sub)">{ht}</text>
              ))}
              {/* Data points */}
              {timeline.map((pt, i) => (
                <circle key={i}
                  cx={sx(pt.Year)} cy={sy(pt.Height)}
                  r={pt.has_medal ? 3.5 : 2}
                  fill={archColor[pt.archetype] || "var(--text-sub)"}
                  opacity={pt.has_medal ? 0.9 : 0.4}
                />
              ))}
              {/* User dot */}
              {result && (
                <circle cx={sx(2024)} cy={sy(parseFloat(h))} r={7} fill="white" stroke={accent} strokeWidth={2.5} />
              )}
            </svg>
            {/* Legend */}
            <div style={{ display: "flex", flexWrap: "wrap", gap: "8px 16px", marginTop: 8, paddingLeft: 40 }}>
              {Object.entries(archColor).map(([id, col]) => {
                const a = archetypes.find(x => x.id === id);
                return a ? (
                  <div key={id} style={{ display: "flex", alignItems: "center", gap: 5, fontSize: 11, color: "var(--text-sub)" }}>
                    <div style={{ width: 8, height: 8, borderRadius: "50%", background: col }} />
                    {a.label.replace("The ", "")}
                  </div>
                ) : null;
              })}
              <div style={{ display: "flex", alignItems: "center", gap: 5, fontSize: 11, color: "var(--text-muted)" }}>
                <div style={{ width: 8, height: 8, borderRadius: "50%", background: "var(--text-main)" }} />
                You (2026)
              </div>
            </div>
          </div>
        </motion.section>
      )}

      {/* ── FOOTER ─────────────────────────────────────────────────────── */}
      <footer style={{ borderTop: "1px solid #1E293B", padding: "32px 24px", textAlign: "center", position: "relative", zIndex: 1 }}>
        <p style={{ fontSize: 12, color: "var(--text-sub)" }}>
          Built for the <strong style={{ color: "#C9A227" }}>Vibe Code for Gold with Google</strong> hackathon ·
          Data: github.com/rgriff23/Olympic_history (public domain) ·
          All insights use conditional language. No individual athletes identified. No performance guarantees implied.
        </p>
        <p style={{ fontSize: 11, color: "var(--border-color)", marginTop: 6 }}>
          Powered by Google Cloud · Gemini API · Next.js · FastAPI · K-means clustering
        </p>
      </footer>
      </div>
    </main>
  );
}
