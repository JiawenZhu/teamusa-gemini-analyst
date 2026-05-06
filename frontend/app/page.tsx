"use client";
import { useEffect, useState, useRef, useCallback, startTransition } from "react";
import { fetchStats, fetchArchetypes, matchBiometrics, fetchTimeline, sendChat, sendChatStream, registerLocation } from "@/lib/api";

import type { DatasetStats, ArchetypeProfile, MatchResult, TimelinePoint, LocationData } from "@/lib/api";
import { motion } from "framer-motion";
import { Hero } from "@/components/Hero";
import { InputSection } from "@/components/InputSection";
import { MatchResultPanel } from "@/components/MatchResultPanel";
import { ChatPanel } from "@/components/ChatPanel";
import { ArchetypeExplorer } from "@/components/ArchetypeExplorer";
import { ParalympicExplainer } from "@/components/ParalympicExplainer";
import { TimelineChart } from "@/components/TimelineChart";
import { useVoiceAssistant } from "@/hooks/useVoiceAssistant";
import GlobeScene from "@/components/globe/GlobeScene";
import FullscreenGlobe from "@/components/globe/FullscreenGlobe";
import { FeaturesNav } from "@/components/FeaturesNav";
import { AnimatePresence } from "framer-motion";

export default function Page() {
  const [stats, setStats] = useState<DatasetStats | null>(null);
  const [archetypes, setArchetypes] = useState<ArchetypeProfile[]>([]);
  const [paraArchetypes, setParaArchetypes] = useState<ArchetypeProfile[]>([]);
  const [selected, setSelected] = useState<ArchetypeProfile | null>(null);
  const [h, setH] = useState(""); const [w, setW] = useState(""); const [age, setAge] = useState("");
  const [mode, setMode] = useState<"olympic" | "paralympic">("olympic");
  const [matching, setMatching] = useState(false);
  const [result, setResult] = useState<MatchResult | null>(null);
  const [glitchArch, setGlitchArch] = useState<ArchetypeProfile | null>(null);
  const [timeline, setTimeline] = useState<TimelinePoint[]>([]);
  const [chat, setChat] = useState<{ role: string; text: string; sealed?: boolean }[]>([]);
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
  const [isGlobeFullscreen, setIsGlobeFullscreen] = useState(false);

  // Stats Modal State
  const [showStatsModal, setShowStatsModal] = useState(false);
  const [pendingChatTopic, setPendingChatTopic] = useState<string | null>(null);
  const [pendingGlobe, setPendingGlobe] = useState(false);

  const openFullscreenGlobe = () => {
    if (!result) {
      setPendingGlobe(true);
      setShowStatsModal(true);
    } else {
      setIsGlobeFullscreen(true);
    }
  };

  const {
    voiceEnabled,
    setVoiceEnabled,
    micState,
    isSpeaking,
    playNativeTTS,
    stopAudio,
    startListening,
    stopListening,
    toggleLive,
  } = useVoiceAssistant();

  const resultRef = useRef<HTMLDivElement>(null);
  const chatContainerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    // Backend warm-up: fire /health immediately so Cloud Run container is warm
    // before the user clicks "Find My Archetype". Silent — errors don't surface to UI.
    const apiUrl = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:8000";
    fetch(`${apiUrl}/health`).catch(() => {/* warmup failed — backend may be cold, user will see normal latency */});

    fetchStats().then(setStats);
    fetchArchetypes().then(setArchetypes);
    fetch(`${apiUrl}/api/para-archetypes`)
      .then(r => r.json()).then(d => setParaArchetypes(d.archetypes ?? []));
    fetchTimeline().then(setTimeline);

    // Feature A: Read shared URL params and auto-run match
    if (typeof window !== "undefined") {
      const params = new URLSearchParams(window.location.search);
      const ph = params.get("h");
      const pw = params.get("w");
      const pa = params.get("age");
      if (ph && pw) {
        startTransition(() => {
          setH(ph); setW(pw);
          if (pa) setAge(pa);
          setIsSharedView(true);
        });
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
    const interval = setInterval(() => {
      setGlitchArch(archetypes[Math.floor(Math.random() * archetypes.length)]);
      if (ticks === 0) {
        // Scroll once the component has actually mounted
        setTimeout(() => resultRef.current?.scrollIntoView({ behavior: "smooth", block: "center" }), 50);
      }
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
    setTimeout(() => setGlobeToast(null), 8000);
  };

  // ── Sync Live API Text to Chat History ──────────────────────────────────────
  useEffect(() => {
    const handleLiveText = (e: any) => {
      // e.detail may be a plain string or { role: string, text: string }
      const detail = e.detail;
      const text: string = typeof detail === "string" ? detail : (detail?.text ?? "");
      const role: string = typeof detail === "object" && detail?.role === "user" ? "user" : "model";

      if (!text) return;

      setChat(prev => {
        // User voice utterances are always complete — each gets its own sealed bubble.
        // If the AI has already started responding (last message is unsealed model),
        // backfill the user bubble before it to maintain correct chronological order.
        if (role === 'user') {
          const lastMsg = prev[prev.length - 1];
          if (lastMsg && lastMsg.role === 'model' && !lastMsg.sealed) {
            // Backfill: splice user bubble before the in-progress AI response
            return [...prev.slice(0, -1), { role, text, sealed: true, fromVoice: true }, lastMsg];
          }
          return [...prev, { role, text, sealed: true, fromVoice: true }];
        }

        // Model: append chunks to the current unsealed bubble, or start a new one
        if (prev.length > 0 && prev[prev.length - 1].role === role && !prev[prev.length - 1].sealed) {
           const last = prev[prev.length - 1];
           return [...prev.slice(0, -1), { role, text: last.text + " " + text }];
        }
        return [...prev, { role, text }];
      });
      setTimeout(() => {
        chatContainerRef.current?.scrollTo({ top: chatContainerRef.current.scrollHeight, behavior: "smooth" });
      }, 50);
    };

    // Seal the current model bubble when a turn completes
    const handleTurnComplete = () => {
      setChat(prev => {
        if (prev.length === 0) return prev;
        const last = prev[prev.length - 1];
        if (last.role === "model" && !last.sealed) {
          return [...prev.slice(0, -1), { ...last, sealed: true }];
        }
        return prev;
      });
    };

    const handleMapTrigger = (e: any) => {
      const { city, lat, lng } = e.detail;
      fireTriggerCity(city, lat, lng);
    };

    window.addEventListener("live_text", handleLiveText);
    window.addEventListener("live_turn_complete", handleTurnComplete);
    window.addEventListener("map_trigger", handleMapTrigger);
    return () => {
      window.removeEventListener("live_text", handleLiveText);
      window.removeEventListener("live_turn_complete", handleTurnComplete);
      window.removeEventListener("map_trigger", handleMapTrigger);
    };
  }, []);

  const handleLocationSubmit = async () => {
    if (!hometown.trim()) return;
    setLocLoading(true);
    setLocError("");
    try {
      const data = await registerLocation(hometown);
      setLocationData(data);
    } catch (err: unknown) {
      setLocError((err as Error).message || "Could not find city");
    } finally {
      setLocLoading(false);
    }
  };





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
          chat,
          { height_cm: h ? parseFloat(h) : undefined, weight_kg: w ? parseFloat(w) : undefined, age: age ? parseInt(age) : undefined },
          async (text) => {
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
        const { text: reply, mapTrigger } = await sendChat(m, result.archetype_id, chat, { height_cm: h ? parseFloat(h) : undefined, weight_kg: w ? parseFloat(w) : undefined, age: age ? parseInt(age) : undefined });
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
      const { text: reply, mapTrigger } = await sendChat(m, result.archetype_id, chat, { height_cm: h ? parseFloat(h) : undefined, weight_kg: w ? parseFloat(w) : undefined, age: age ? parseInt(age) : undefined });
      if (mapTrigger) fireTriggerCity(mapTrigger.city, mapTrigger.lat, mapTrigger.lng);
      setChat(c => [...c, { role: "bot", text: reply }]);
      setCL(false);
    }
  }, [msg, result, chat, voiceEnabled, playNativeTTS, h, w, age]);

  const bgAccent = result?.archetype?.color || glitchArch?.color || "transparent";
  const accent = result?.archetype?.color || "#C9A227";

  return (
    <>
    <main style={{ background: "transparent", minHeight: "100vh", color: "var(--text-main)", position: "relative", overflow: "hidden" }}>

      {/* Globe fly-to toast */}
      {globeToast && (
        <motion.div
          initial={{ opacity: 0, y: 30, x: "-50%" }}
          animate={{ opacity: 1, y: 0, x: "-50%" }}
          exit={{ opacity: 0, y: 30, x: "-50%" }}
          onClick={() => {
            openFullscreenGlobe();
            setGlobeToast(null);
          }}
          style={{
            position: "fixed", bottom: 32, left: "50%",
            zIndex: 9999,
            background: "rgba(2,8,23,0.92)",
            border: "1px solid #3B82F680",
            borderRadius: 12, padding: "10px 20px",
            display: "flex", alignItems: "center", gap: 10,
            backdropFilter: "blur(12px)",
            boxShadow: "0 4px 20px rgba(59,130,246,0.3)",
            cursor: "pointer",
            userSelect: "none",
          }}
          whileHover={{ scale: 1.04, boxShadow: "0 6px 28px rgba(59,130,246,0.5)" }}
          whileTap={{ scale: 0.97 }}
        >
          <span style={{ fontSize: 18 }}>🌍</span>
          <span style={{ color: "#93c5fd", fontWeight: 600, fontSize: 14 }}>
            Globe flying to <strong style={{ color: "white" }}>{globeToast}</strong>
          </span>
          <span style={{ fontSize: 11, color: "#60a5fa", marginLeft: 4, opacity: 0.8 }}>↑ view</span>
        </motion.div>
      )}
      
      {/* Dynamic Ambient Background */}
      <AnimatePresence>
        {showStatsModal && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            style={{
              position: "fixed", top: 0, left: 0, right: 0, bottom: 0,
              background: "rgba(0,0,0,0.8)", backdropFilter: "blur(4px)",
              display: "flex", alignItems: "center", justifyContent: "center",
              zIndex: 10000, padding: 20
            }}
            onClick={() => setShowStatsModal(false)}
          >
            <motion.div
              initial={{ scale: 0.95, y: 20 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.95, y: 20 }}
              style={{
                background: "#020817", border: "1px solid #1E293B",
                borderRadius: 24, padding: "32px 0 0 0", maxWidth: 640, width: "100%",
                boxShadow: "0 20px 40px rgba(0,0,0,0.5)", overflow: "hidden"
              }}
              onClick={(e) => e.stopPropagation()}
            >
              <div style={{ padding: "0 32px 16px" }}>
                <h2 style={{ margin: "0 0 12px 0", fontSize: 24, fontWeight: 700, color: "#F8FAFC", textAlign: "center" }}>
                  Hold up! Let&apos;s find your archetype first.
                </h2>
                <p style={{ color: "#94A3B8", margin: 0, fontSize: 14, lineHeight: 1.5, textAlign: "center" }}>
                  Gemini gives more tailored answers when it knows your biometric archetype. Fill out your stats below to unlock personalized historical pattern insights!
                </p>
              </div>
              
              <div style={{ transform: "scale(0.95)", transformOrigin: "top" }}>
                <InputSection 
                  id="mirror-modal"
                  h={h} setH={setH} w={w} setW={setW} age={age} setAge={setAge}
                  matching={matching} 
                  doMatch={async () => {
                    // First, close the modal and map so the user can see the main page animations
                    setShowStatsModal(false);
                    setIsGlobeFullscreen(false);
                    
                    // Immediately scroll to the top section so they see the animation start
                    setTimeout(() => {
                      document.getElementById('mirror-main')?.scrollIntoView({ behavior: "instant", block: "start" });
                    }, 50);
                    
                    // Run the match (this plays the glitch animation and shows the DNA card)
                    await doMatch();
                    
                    // If they came from the map, wait 3.5 seconds so they can see their card, then scroll to chat
                    if (pendingChatTopic) {
                      setTimeout(() => {
                        setMsg(`Tell me more about Team USA in ${pendingChatTopic}`);
                        document.getElementById('chat-panel')?.scrollIntoView({ behavior: "smooth", block: "center" });
                      }, 3500);
                      setPendingChatTopic(null);
                    } else if (pendingGlobe) {
                      setTimeout(() => {
                        setIsGlobeFullscreen(true);
                      }, 3500);
                      setPendingGlobe(false);
                    }
                  }}
                  mode={mode} setMode={setMode}
                  hideHeader={true}
                />
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      <div style={{
        position: "fixed", top: 0, left: 0, right: 0, bottom: 0,
        background: `radial-gradient(circle at 50% 40%, ${bgAccent}15, transparent 70%)`,
        transition: "background 1.5s ease", pointerEvents: "none", zIndex: 0
      }} />

      <div style={{ position: "relative", zIndex: 1 }}>
        
        <Hero stats={stats} />

        <FeaturesNav 
          onOpenModal={() => setShowStatsModal(true)} 
          onOpenFullscreenMap={openFullscreenGlobe} 
        />

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
              <p style={{ margin: 0, fontSize: 14, fontWeight: 600, color: "#C9A227" }}>Viewing a shared biometric archetype result</p>
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
        <section id="globe-section" style={{
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
              <p style={{ fontSize: 11, letterSpacing: 3, color: "#4a7fa5", textTransform: "uppercase", marginBottom: 12, fontWeight: 600 }}>🏅 LA28 GAMES DISTANCE TRACKER</p>
              <h2 style={{ fontSize: 32, fontWeight: 800, color: "white", lineHeight: 1.2, marginBottom: 8 }}>
                Where will you<br/><span style={{ color: "#FFD700" }}>cheer from?</span>
              </h2>
              <p style={{ fontSize: 15, color: "#6b8fa8", marginBottom: 28, lineHeight: 1.6 }}>
                Enter your city to see how far you are from the LA28 Olympic and Paralympic Games.
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
                  <p style={{ color: "#8baec7", fontSize: 13, marginBottom: 4 }}>From {locationData.city} to the LA28 Games</p>
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
            <div
              style={{ flex: 1, minWidth: 320, height: 520, position: "relative", cursor: "zoom-in" }}
              onDoubleClick={openFullscreenGlobe}
              title="Double-click to open immersive globe"
            >
              <GlobeScene
                userLocation={locationData ? { lat: locationData.lat, lng: locationData.lng, city: locationData.city } : null}
                triggerCity={triggerCity}
              />
              {/* Double-click hint */}
              <div style={{
                position: "absolute", bottom: 12, right: 12,
                background: "rgba(2,8,23,0.75)", border: "1px solid #1e293b",
                borderRadius: 8, padding: "5px 10px",
                fontSize: 11, color: "#64748b",
                backdropFilter: "blur(8px)", pointerEvents: "none",
              }}>
                🖱️ Double-click for immersive view
              </div>
            </div>
          </div>
        </section>

        <InputSection 
          id="mirror-main"
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
              <section id="chat-panel" style={{ maxWidth: 900, margin: "0 auto", padding: "0 16px 64px" }}>
                <ChatPanel 
                  result={result}
                  chat={chat} msg={msg} setMsg={setMsg} chatLoading={chatLoading} doChat={doChat}
                  voiceEnabled={voiceEnabled} setVoiceEnabled={setVoiceEnabled} stopAudio={stopAudio}
                  isSpeaking={isSpeaking} micState={micState}
                  startListening={() => startListening("User biometrics: " + (result?.archetype.description || ""), result?.archetype_id)}
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

        <ParalympicExplainer
          paraArchetypes={paraArchetypes}
          userHeight={h ? parseFloat(h) : undefined}
          userWeight={w ? parseFloat(w) : undefined}
        />

        <TimelineChart 
          timeline={timeline} archetypes={archetypes} result={result}
          h={h} accent={accent}
        />

        {/* ── FOOTER ─────────────────────────────────────────────────────── */}
        <footer style={{ borderTop: "1px solid var(--border-color)", padding: "32px 16px", textAlign: "center", position: "relative", zIndex: 1 }}>
          <p style={{ fontSize: 12, color: "var(--text-sub)", lineHeight: 1.7 }}>
            Built for the{" "}
            <a href="https://vibecodeforgoldwithgoogle.devpost.com/" target="_blank" rel="noopener noreferrer" style={{ color: "#C9A227", fontWeight: 700, textDecoration: "none" }}>
              Vibe Code for Gold with Google
            </a>{" "}
            hackathon.
          </p>
          <p style={{ fontSize: 11, color: "var(--text-sub)", marginTop: 6, lineHeight: 1.7, maxWidth: 640, margin: "6px auto 0" }}>
            This project uses the{" "}
            <a href="https://www.kaggle.com/datasets/heesoo37/120-years-of-olympic-history-athletes-and-results/data" target="_blank" rel="noopener noreferrer" style={{ color: "var(--text-sub)", textDecoration: "underline" }}>
              CC0 Kaggle 120 Years of Olympic History dataset
            </a>
            , filtered to Team USA records from 1896–2016. All user-facing insights are aggregate, anonymized, and conditional.
          </p>
          <p style={{ fontSize: 11, color: "var(--border-color)", marginTop: 8 }}>
            Powered by Google Cloud · Gemini API · Next.js · FastAPI · K-means clustering
          </p>
        </footer>
      </div>
    </main>

      {/* ── Fullscreen Globe Modal ─────────────────────────────────────── */}
      <AnimatePresence>
        {isGlobeFullscreen && (
          <FullscreenGlobe
            userLocation={locationData ? { lat: locationData.lat, lng: locationData.lng, city: locationData.city } : null}
            triggerCity={triggerCity}
            archetypeId={result?.archetype_id ?? selected?.id ?? "aerobic_engine"}
            onClose={() => setIsGlobeFullscreen(false)}
            onGoToChat={(topic) => {
              if (!result) {
                setPendingChatTopic(topic);
                setShowStatsModal(true);
                return;
              }
              setIsGlobeFullscreen(false);
              setMsg(`Tell me about Team USA in ${topic}, and how my archetype (${result.archetype.label}) connects to the athletes or sports there.`);
              setTimeout(() => {
                document.getElementById('chat-panel')?.scrollIntoView({ behavior: "smooth", block: "center" });
              }, 400);
            }}
            pauseGesture={showStatsModal}
            voiceAssistant={{
              voiceEnabled,
              micState,
              toggleLive: (prompt?: string) => toggleLive(prompt, result?.archetype_id),
            }}
          />
        )}
      </AnimatePresence>
    </>
  );
}

