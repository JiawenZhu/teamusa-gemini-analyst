"use client";
import { useEffect, useState, useRef, useCallback } from "react";
import { fetchStats, fetchArchetypes, matchBiometrics, fetchTimeline, sendChat, sendChatStream, registerLocation } from "@/lib/api";

import type { DatasetStats, ArchetypeProfile, MatchResult, TimelinePoint, LocationData } from "@/lib/api";
import { motion } from "framer-motion";
import { Hero } from "@/components/Hero";
import { InputSection } from "@/components/InputSection";
import { MatchResultPanel } from "@/components/MatchResultPanel";
import { ChatPanel } from "@/components/ChatPanel";
import { ArchetypeExplorer } from "@/components/ArchetypeExplorer";
import { TimelineChart } from "@/components/TimelineChart";
import { useVoiceAssistant } from "@/hooks/useVoiceAssistant";
import GlobeScene from "@/components/globe/GlobeScene";

export default function Page() {
  const [stats, setStats] = useState<DatasetStats | null>(null);
  const [archetypes, setArchetypes] = useState<ArchetypeProfile[]>([]);
  const [selected, setSelected] = useState<ArchetypeProfile | null>(null);
  const [h, setH] = useState(""); const [w, setW] = useState(""); const [age, setAge] = useState("");
  const [mode, setMode] = useState<"olympic" | "paralympic">("olympic");
  const [matching, setMatching] = useState(false);
  const [result, setResult] = useState<MatchResult | null>(null);
  const [glitchArch, setGlitchArch] = useState<ArchetypeProfile | null>(null);
  const [timeline, setTimeline] = useState<TimelinePoint[]>([]);
  const [chat, setChat] = useState<{ role: string; text: string }[]>([]);
  const [msg, setMsg] = useState("");
  const [chatLoading, setCL] = useState(false);
  const [copied, setCopied] = useState(false);
  const [isSharedView, setIsSharedView] = useState(false);

  // Globe Location State
  const [hometown, setHometown] = useState("");
  const [locationData, setLocationData] = useState<LocationData | null>(null);
  const [locLoading, setLocLoading] = useState(false);
  const [locError, setLocError] = useState("");

  // Globe city trigger from Gemini chat
  const [triggerCity, setTriggerCity] = useState<{ lat: number; lng: number; city: string } | null>(null);
  const [globeToast, setGlobeToast] = useState<string | null>(null);

  const {
    voiceEnabled,
    setVoiceEnabled,
    micState,
    isSpeaking,
    playNativeTTS,
    stopAudio,
    startListening,
    stopListening,
  } = useVoiceAssistant();

  const resultRef = useRef<HTMLDivElement>(null);
  const chatContainerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    fetchStats().then(setStats);
    fetchArchetypes().then(setArchetypes);
    fetchTimeline().then(setTimeline);

    // Feature A: Read shared URL params and auto-run match
    if (typeof window !== "undefined") {
      const params = new URLSearchParams(window.location.search);
      const ph = params.get("h");
      const pw = params.get("w");
      const pa = params.get("age");
      if (ph && pw) {
        setH(ph); setW(pw);
        if (pa) setAge(pa);
        setIsSharedView(true);
        // Auto-run match after archetypes load (slight delay)
        setTimeout(() => {
          setMatching(true);
          matchBiometrics(parseFloat(ph), parseFloat(pw), pa ? parseInt(pa) : undefined)
            .then(r => {
              setResult(r);
              setMatching(false);
              setTimeout(() => resultRef.current?.scrollIntoView({ behavior: "smooth", block: "center" }), 300);
            });
        }, 800);
      }
    }
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
    const r = await matchBiometrics(parseFloat(h), parseFloat(w), age ? parseInt(age) : undefined, mode);
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
  }, [h, w, age, archetypes, mode]);

  const shareDna = useCallback(() => {
    // Feature A: Encode biometrics into URL for shareable deep link
    const url = new URL(window.location.href);
    url.search = "";
    if (h) url.searchParams.set("h", h);
    if (w) url.searchParams.set("w", w);
    if (age) url.searchParams.set("age", age);
    navigator.clipboard.writeText(url.toString());
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }, [h, w, age]);

  // Helper: set city trigger + show toast
  const fireTriggerCity = (city: string, lat: number, lng: number) => {
    setTriggerCity({ city, lat, lng });
    setGlobeToast(city);
    setTimeout(() => setGlobeToast(null), 4000);
  };

  const handleLocationSubmit = async () => {
    if (!hometown.trim()) return;
    setLocLoading(true);
    setLocError("");
    try {
      const data = await registerLocation(hometown);
      setLocationData(data);
    } catch (err: any) {
      setLocError(err.message || "Could not find city");
    } finally {
      setLocLoading(false);
    }
  };

  // Use the native browser logic exclusively now
  const playTTS = useCallback(async (text: string) => {
    playNativeTTS(text);
  }, [playNativeTTS]);

  const doChat = useCallback(async () => {
    if (!msg.trim() || !result) return;
    const currentChat = [...chat, { role: "user", text: msg }];
    setChat(currentChat);
    setMsg("");
    setCL(true);
    const m = msg;

    if (voiceEnabled) {
      let rendered = "";
      setChat(c => [...c, { role: "bot", text: "" }]);

      try {
        await sendChatStream(
          m,
          result.archetype_id,
          currentChat,
          async (text, audio, _idx) => {
            rendered += (rendered ? " " : "") + text;
            setChat(c => {
              const updated = [...c];
              updated[updated.length - 1] = { role: "bot", text: rendered };
              return updated;
            });
          },
          (fullText) => {
            setChat(c => {
              const updated = [...c];
              updated[updated.length - 1] = { role: "bot", text: fullText || rendered };
              return updated;
            });
            setCL(false);
            playNativeTTS(fullText || rendered);
          },
          undefined, // signal
          // Feature B: Globe city trigger callback
          (city, lat, lng) => fireTriggerCity(city, lat, lng),
        );
      } catch (err) {
        console.warn("Stream failed, falling back:", err);
        const { text: reply, mapTrigger } = await sendChat(m, result.archetype_id, currentChat);
        if (mapTrigger) fireTriggerCity(mapTrigger.city, mapTrigger.lat, mapTrigger.lng);
        setChat(c => {
          const updated = [...c];
          updated[updated.length - 1] = { role: "bot", text: reply };
          return updated;
        });
        setCL(false);
        if (reply) playNativeTTS(reply);
      }
    } else {
      // Non-streaming path — use sendChat and extract mapTrigger from response
      const { text: reply, mapTrigger } = await sendChat(m, result.archetype_id, currentChat);
      if (mapTrigger) fireTriggerCity(mapTrigger.city, mapTrigger.lat, mapTrigger.lng);
      setChat(c => [...c, { role: "bot", text: reply }]);
      setCL(false);
    }
  }, [msg, result, chat, voiceEnabled, playNativeTTS]);

  const bgAccent = result?.archetype?.color || glitchArch?.color || "transparent";
  const accent = result?.archetype?.color || "#C9A227";

  return (
    <main style={{ background: "transparent", minHeight: "100vh", color: "var(--text-main)", position: "relative", overflow: "hidden" }}>

      {/* Globe fly-to toast */}
      {globeToast && (
        <motion.div
          initial={{ opacity: 0, y: 30, x: "-50%" }}
          animate={{ opacity: 1, y: 0, x: "-50%" }}
          exit={{ opacity: 0, y: 30, x: "-50%" }}
          style={{
            position: "fixed", bottom: 32, left: "50%",
            zIndex: 9999,
            background: "rgba(2,8,23,0.92)",
            border: "1px solid #3B82F680",
            borderRadius: 12, padding: "10px 20px",
            display: "flex", alignItems: "center", gap: 10,
            backdropFilter: "blur(12px)",
            boxShadow: "0 4px 20px rgba(59,130,246,0.3)",
            pointerEvents: "none",
          }}
        >
          <span style={{ fontSize: 18 }}>🌍</span>
          <span style={{ color: "#93c5fd", fontWeight: 600, fontSize: 14 }}>
            Globe flying to <strong style={{ color: "white" }}>{globeToast}</strong>
          </span>
        </motion.div>
      )}
      
      {/* Dynamic Ambient Background */}
      <div style={{
        position: "fixed", top: 0, left: 0, right: 0, bottom: 0,
        background: `radial-gradient(circle at 50% 40%, ${bgAccent}15, transparent 70%)`,
        transition: "background 1.5s ease", pointerEvents: "none", zIndex: 0
      }} />

      <div style={{ position: "relative", zIndex: 1 }}>
        
        <Hero stats={stats} />

        {/* ── SHARED VIEW BANNER ───────────────────────────────────── */}
        {isSharedView && (
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            style={{
              maxWidth: 700, margin: "0 auto 24px", padding: "12px 20px",
              background: "linear-gradient(90deg, #C9A22720, #C9A22708)",
              border: "1px solid #C9A22740", borderRadius: 12,
              display: "flex", alignItems: "center", gap: 12,
              backdropFilter: "blur(10px)",
            }}
          >
            <span style={{ fontSize: 20 }}>🔗</span>
            <div style={{ flex: 1 }}>
              <p style={{ margin: 0, fontSize: 14, fontWeight: 600, color: "#C9A227" }}>Viewing a shared Olympic DNA result</p>
              <p style={{ margin: 0, fontSize: 12, color: "var(--text-sub)", marginTop: 2 }}>This result was shared with you. Enter your own measurements below to find your archetype!</p>
            </div>
            <button
              onClick={() => { setIsSharedView(false); window.history.replaceState({}, "", window.location.pathname); }}
              style={{ background: "none", border: "1px solid #C9A22740", color: "#C9A227", borderRadius: 8, padding: "6px 12px", fontSize: 12, cursor: "pointer", whiteSpace: "nowrap" }}
            >
              Try yours →
            </button>
          </motion.div>
        )}

        {/* ══════════════════════════════════════════════════════════════
             PREMIUM 3D GLOBE SECTION — Full-width dark space panel
        ════════════════════════════════════════════════════════════════ */}
        <section style={{
          width: "100%",
          background: "linear-gradient(180deg, #020817 0%, #040f2a 100%)",
          padding: "60px 24px",
          marginBottom: 40,
          position: "relative",
          overflow: "hidden",
        }}>
          {/* Subtle space glow behind the globe */}
          <div style={{
            position: "absolute", top: "50%", left: "60%",
            transform: "translate(-50%, -50%)",
            width: 500, height: 500,
            background: "radial-gradient(circle, rgba(30,60,140,0.35) 0%, transparent 70%)",
            pointerEvents: "none"
          }} />

          <div style={{ maxWidth: 1200, margin: "0 auto", display: "flex", alignItems: "center", gap: 40, flexWrap: "wrap" }}>
            
            {/* LEFT PANEL — Input UI */}
            <div style={{ flex: "0 0 360px", minWidth: 280 }}>
              <p style={{ fontSize: 11, letterSpacing: 3, color: "#4a7fa5", textTransform: "uppercase", marginBottom: 12, fontWeight: 600 }}>🏅 LA 2028 DISTANCE TRACKER</p>
              <h2 style={{ fontSize: 32, fontWeight: 800, color: "white", lineHeight: 1.2, marginBottom: 8 }}>
                Where will you<br/><span style={{ color: "#FFD700" }}>cheer from?</span>
              </h2>
              <p style={{ fontSize: 15, color: "#6b8fa8", marginBottom: 28, lineHeight: 1.6 }}>
                Enter your city to see how far you are from the 2028 Los Angeles Olympics.
              </p>

              <div style={{ display: "flex", gap: 10, marginBottom: 16 }}>
                <input
                  type="text"
                  value={hometown}
                  onChange={e => setHometown(e.target.value)}
                  placeholder="e.g. Tokyo, Beijing, London…"
                  style={{
                    flex: 1, padding: "13px 16px",
                    borderRadius: 10,
                    border: "1px solid rgba(255,255,255,0.12)",
                    background: "rgba(255,255,255,0.07)",
                    color: "white",
                    fontSize: 15,
                    outline: "none",
                    backdropFilter: "blur(10px)",
                  }}
                  onKeyDown={e => e.key === 'Enter' && handleLocationSubmit()}
                />
                <button
                  onClick={handleLocationSubmit}
                  disabled={locLoading}
                  style={{
                    padding: "13px 22px",
                    background: locLoading ? "#7a6010" : "#C9A227",
                    color: "#020817",
                    border: "none",
                    borderRadius: 10,
                    fontWeight: 700,
                    fontSize: 14,
                    cursor: locLoading ? "wait" : "pointer",
                    whiteSpace: "nowrap",
                    transition: "background 0.2s",
                  }}
                >
                  {locLoading ? "Finding…" : "🚀 Fly"}
                </button>
              </div>

              {locError && (
                <p style={{ color: "#fc8181", fontSize: 14, marginBottom: 12 }}>{locError}</p>
              )}

              {locationData && (
                <motion.div
                  initial={{ opacity: 0, y: 12 }}
                  animate={{ opacity: 1, y: 0 }}
                  style={{ padding: "20px", background: "rgba(255,215,0,0.07)", borderRadius: 12, border: "1px solid rgba(255,215,0,0.2)" }}
                >
                  <p style={{ color: "#8baec7", fontSize: 13, marginBottom: 4 }}>From {locationData.city} to LA 2028</p>
                  <p style={{ fontSize: 36, fontWeight: 900, color: "#FFD700", lineHeight: 1 }}>
                    {locationData.distance_miles.toLocaleString()}
                    <span style={{ fontSize: 16, fontWeight: 400, color: "#a0aec0", marginLeft: 8 }}>miles</span>
                  </p>
                  <p style={{ fontSize: 13, color: "#4a7fa5", marginTop: 4 }}>
                    {locationData.distance_km.toLocaleString()} km · Drag the globe to explore!
                  </p>
                </motion.div>
              )}

              {!locationData && (
                <p style={{ fontSize: 13, color: "#2d4a63", marginTop: 12 }}>
                  🖱️ Drag to rotate · Scroll to zoom · Auto-spins when idle
                </p>
              )}
            </div>

            {/* RIGHT PANEL — The 3D Globe */}
            <div style={{ flex: 1, minWidth: 320, height: 520, position: "relative" }}>
              <GlobeScene
                userLocation={locationData ? { lat: locationData.lat, lng: locationData.lng, city: locationData.city } : null}
                triggerCity={triggerCity}
              />
            </div>
          </div>
        </section>

        <InputSection
          h={h} setH={setH} w={w} setW={setW} age={age} setAge={setAge}
          matching={matching} doMatch={doMatch}
          mode={mode} setMode={setMode}
        />

        {/* ── RESULTS & GLITCH REVEAL ────────────────────────────────────── */}
        {(result || glitchArch) && (
          <>
            <MatchResultPanel 
              result={result} glitchArch={glitchArch} resultRef={resultRef}
              shareDna={shareDna} copied={copied}
            />
            
            {result && (
              <section style={{ maxWidth: 900, margin: "0 auto", padding: "0 24px 80px" }}>
                <ChatPanel 
                  result={result}
                  chat={chat} msg={msg} setMsg={setMsg} chatLoading={chatLoading} doChat={doChat}
                  voiceEnabled={voiceEnabled} setVoiceEnabled={setVoiceEnabled} stopAudio={stopAudio}
                  isSpeaking={isSpeaking} micState={micState}
                  startListening={() => startListening((t) => setMsg(t), doChat)}
                  stopListening={stopListening}
                  chatContainerRef={chatContainerRef}
                />
              </section>
            )}
          </>
        )}

        <ArchetypeExplorer 
          archetypes={archetypes} stats={stats}
          selected={selected} setSelected={setSelected}
        />

        <TimelineChart 
          timeline={timeline} archetypes={archetypes} result={result}
          h={h} accent={accent}
        />

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
