"use client";
import { useEffect, useState, useRef, useCallback, startTransition } from "react";
import { fetchStats, fetchArchetypes, matchBiometrics, fetchTimeline, sendChat, sendChatStream, registerLocation } from "@/lib/api";

import type { DatasetStats, ArchetypeProfile, MatchResult, TimelinePoint, LocationData } from "@/lib/api";
import { motion, AnimatePresence } from "framer-motion";
import { HeroV2 } from "@/components/HeroV2";
import { InputSection } from "@/components/InputSection";
import { MatchResultPanel } from "@/components/MatchResultPanel";
import { ChatPanel } from "@/components/ChatPanel";
import { ArchetypeExplorer } from "@/components/ArchetypeExplorer";
import { ParalympicExplainer } from "@/components/ParalympicExplainer";
import { TimelineChart } from "@/components/TimelineChart";
import { useVoiceAssistant } from "@/hooks/useVoiceAssistant";
import GlobeScene from "@/components/globe/GlobeScene";
import FullscreenGlobe from "@/components/globe/FullscreenGlobe";
import { StepNav } from "@/components/StepNav";
import { Sparkles, Globe, MapPin, Rocket, Info } from "lucide-react";

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

  // Progress bar step (1 = Match, 2 = Chat, 3 = Discover)
  const [currentStep, setCurrentStep] = useState<1 | 2 | 3>(1);

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
  const chatHistoryRef = useRef<{ role: string; text: string; sealed?: boolean }[]>([]);
  const isStreamingChatRef = useRef(false);

  useEffect(() => {
    const apiUrl = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:8000";
    fetch(`${apiUrl}/health`).catch(() => {});

    fetchStats().then(setStats);
    fetchArchetypes().then(setArchetypes);
    fetch(`${apiUrl}/api/para-archetypes`)
      .then(r => r.json()).then(d => setParaArchetypes(d.archetypes ?? []));
    fetchTimeline().then(setTimeline);

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
    chatHistoryRef.current = chat;
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
        setTimeout(() => resultRef.current?.scrollIntoView({ behavior: "smooth", block: "center" }), 50);
      }
      ticks++;
      if (ticks > 15) {
        clearInterval(interval);
        setGlitchArch(null);
        setResult(r);
        setMatching(false);
        setCurrentStep(prev => (prev < 2 ? 2 : prev) as 1 | 2 | 3);
      }
    }, 100);
  }, [h, w, age, archetypes, mode]);

  const shareDna = useCallback(() => {
    const url = new URL(window.location.href);
    url.search = "";
    if (h) url.searchParams.set("h", h);
    if (w) url.searchParams.set("w", w);
    if (age) url.searchParams.set("age", age);
    navigator.clipboard.writeText(url.toString());
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }, [h, w, age]);

  const fireTriggerCity = (city: string, lat: number, lng: number) => {
    setTriggerCity({ city, lat, lng });
    setGlobeToast(city);
    setTimeout(() => setGlobeToast(null), 8000);
  };

  useEffect(() => {
    const handleLiveText = (e: any) => {
      const detail = e.detail;
      const text: string = typeof detail === "string" ? detail : (detail?.text ?? "");
      const role: string = typeof detail === "object" && detail?.role === "user" ? "user" : "model";
      if (!text || isStreamingChatRef.current) return;

      setChat(prev => {
        if (role === 'user') {
          const lastMsg = prev[prev.length - 1];
          if (lastMsg && lastMsg.role === 'model' && !lastMsg.sealed) {
            return [...prev.slice(0, -1), { role, text, sealed: true }, lastMsg];
          }
          return [...prev, { role, text, sealed: true }];
        }
        if (prev.length > 0 && prev[prev.length - 1].role === role && !prev[prev.length - 1].sealed) {
           const last = prev[prev.length - 1];
           return [...prev.slice(0, -1), { role, text: last.text + " " + text }];
        }
        return [...prev, { role, text }];
      });
    };

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
    } catch (err: any) {
      setLocError(err.message || "Could not find city");
    } finally {
      setLocLoading(false);
    }
  };

  const doChat = useCallback(async (overrideMsg?: string) => {
    const finalMsg = overrideMsg !== undefined ? overrideMsg : msg;
    if (!finalMsg.trim() || !result) return;
    
    const historySnapshot = chatHistoryRef.current;
    const currentChat = [...historySnapshot, { role: "user", text: finalMsg }];
    setChat(currentChat);
    chatHistoryRef.current = currentChat;
    setMsg("");
    setCL(true);
    const m = finalMsg;

    if (voiceEnabled) {
      let rendered = "";
      isStreamingChatRef.current = true;
      setChat(c => [...c, { role: "model", text: "" }]);
      try {
        await sendChatStream(
          m, result.archetype_id, historySnapshot,
          { height_cm: h ? parseFloat(h) : undefined, weight_kg: w ? parseFloat(w) : undefined, age: age ? parseInt(age) : undefined },
          (text) => {
            const clean = text.replace(/trigger_map_view\([^)]*\)/g, "").trim();
            if (!clean) return;
            rendered += (rendered ? " " : "") + clean;
            setChat(c => {
              const updated = [...c];
              updated[updated.length - 1] = { role: "model", text: rendered };
              return updated;
            });
          },
          (fullText) => {
            const cleanFull = fullText.replace(/trigger_map_view\([^)]*\)/g, "").trim();
            setChat(c => {
              const updated = [...c];
              updated[updated.length - 1] = { role: "model", text: cleanFull || rendered };
              return updated;
            });
            isStreamingChatRef.current = false;
            setCL(false);
            playNativeTTS(cleanFull || rendered);
          },
          undefined,
          (city, lat, lng) => fireTriggerCity(city, lat, lng),
        );
      } catch {
        isStreamingChatRef.current = false;
        setCL(false);
      }
    } else {
      const { text: reply, mapTrigger } = await sendChat(m, result.archetype_id, historySnapshot, { height_cm: h ? parseFloat(h) : undefined, weight_kg: w ? parseFloat(w) : undefined, age: age ? parseInt(age) : undefined });
      if (mapTrigger) fireTriggerCity(mapTrigger.city, mapTrigger.lat, mapTrigger.lng);
      setChat(c => [...c, { role: "model", text: reply }]);
      setCL(false);
    }
  }, [msg, result, voiceEnabled, playNativeTTS, h, w, age]);

  const clearChat = useCallback(() => {
    setChat([]);
    chatHistoryRef.current = [];
    setMsg("");
    stopAudio();
  }, [stopAudio]);

  const bgAccent = result?.archetype?.color || glitchArch?.color || "transparent";
  const accent = result?.archetype?.color || "#C9A227";

  useEffect(() => {
    if (!result) return;
    const ids = ["globe-section", "archetypes-section"];
    const targets = ids.map(id => document.getElementById(id)).filter(Boolean) as HTMLElement[];
    const observer = new IntersectionObserver(
      (entries) => {
        if (entries.some(e => e.isIntersecting)) setCurrentStep(3);
        else if (ids.every(id => {
          const el = document.getElementById(id);
          if (!el) return true;
          const r = el.getBoundingClientRect();
          return r.bottom < 0 || r.top > window.innerHeight;
        })) setCurrentStep(prev => (prev > 2 ? 2 : prev) as 1 | 2 | 3);
      },
      { threshold: 0.12 }
    );
    targets.forEach(t => observer.observe(t));
    return () => observer.disconnect();
  }, [result]);

  return (
    <div className="min-h-screen bg-white text-slate-900 selection:bg-indigo-100 selection:text-indigo-900 font-readex">
      <StepNav step={currentStep} />
      
      {/* Globe fly-to toast */}
      <AnimatePresence>
        {globeToast && (
          <motion.div
            initial={{ opacity: 0, y: 30, x: "-50%" }}
            animate={{ opacity: 1, y: 0, x: "-50%" }}
            exit={{ opacity: 0, y: 30, x: "-50%" }}
            onClick={() => { openFullscreenGlobe(); setGlobeToast(null); }}
            className="fixed bottom-8 left-1/2 z-[9999] bg-slate-900/90 border border-indigo-400/30 backdrop-blur-xl rounded-2xl px-6 py-3 flex items-center gap-3 shadow-2xl cursor-pointer hover:scale-105 active:scale-95 transition-transform"
          >
            <Globe className="w-5 h-5 text-indigo-400" />
            <span className="text-indigo-100 font-bold text-sm">
              Flying to <strong className="text-white">{globeToast}</strong>
            </span>
            <span className="text-[10px] font-black text-indigo-400/60 uppercase tracking-widest ml-2">Click to View</span>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Stats Modal */}
      <AnimatePresence>
        {showStatsModal && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[10000] bg-slate-900/60 backdrop-blur-md flex items-center justify-center p-6"
            onClick={() => setShowStatsModal(false)}
          >
            <motion.div
              initial={{ scale: 0.9, y: 20 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.9, y: 20 }}
              className="bg-white border border-slate-100 rounded-[40px] p-10 max-w-xl w-full shadow-2xl"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="text-center mb-8">
                <div className="w-16 h-16 bg-indigo-50 rounded-3xl flex items-center justify-center text-indigo-600 mx-auto mb-6">
                  <Sparkles className="w-8 h-8" />
                </div>
                <h2 className="text-2xl font-black text-slate-900 tracking-tight mb-3">Unlock Personalized Analysis</h2>
                <p className="text-slate-500 text-sm font-medium leading-relaxed">
                  Gemini needs your biometric data to provide tailored historical matches. 
                  Find your archetype first to enable deep-dive insights.
                </p>
              </div>
              
              <div className="scale-95 origin-top">
                <InputSection 
                  id="mirror-modal"
                  h={h} setH={setH} w={w} setW={setW} age={age} setAge={setAge}
                  matching={matching} 
                  doMatch={async () => {
                    setShowStatsModal(false);
                    setIsGlobeFullscreen(false);
                    setTimeout(() => {
                      document.getElementById('mirror-main')?.scrollIntoView({ behavior: "smooth", block: "start" });
                    }, 100);
                    await doMatch();
                    if (pendingChatTopic) {
                      setTimeout(() => {
                        setMsg(`Tell me more about Team USA in ${pendingChatTopic}`);
                        document.getElementById('chat-panel')?.scrollIntoView({ behavior: "smooth", block: "center" });
                      }, 3000);
                      setPendingChatTopic(null);
                    } else if (pendingGlobe) {
                      setTimeout(() => setIsGlobeFullscreen(true), 3000);
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

      <main className="relative">
        <HeroV2 stats={stats} />

        {/* Dynamic Glow */}
        <div 
          className="fixed inset-0 pointer-events-none z-0 transition-all duration-1000 opacity-20"
          style={{ background: `radial-gradient(circle at 50% 40%, ${bgAccent}, transparent 70%)` }}
        />

        <div className="relative z-10">
          
          {isSharedView && (
            <motion.div
              initial={{ opacity: 0, y: -20 }}
              animate={{ opacity: 1, y: 0 }}
              className="max-w-4xl mx-auto px-6 -mt-8 mb-12"
            >
              <div className="bg-indigo-600 text-white rounded-2xl p-4 flex items-center justify-between shadow-xl">
                <div className="flex items-center gap-3">
                  <span className="text-xl">🔗</span>
                  <div>
                    <p className="text-sm font-black tracking-tight">Viewing shared archetype result</p>
                    <p className="text-[10px] font-bold text-indigo-100/80 uppercase tracking-widest mt-0.5">Enter your biometrics to find your own match</p>
                  </div>
                </div>
                <button 
                  onClick={() => { setIsSharedView(false); window.history.replaceState({}, "", window.location.pathname); }}
                  className="bg-white/20 hover:bg-white/30 text-white text-xs font-black px-4 py-2 rounded-xl transition-colors"
                >
                  Clear Results
                </button>
              </div>
            </motion.div>
          )}

          <section id="mirror-main" className="scroll-mt-24">
            <InputSection 
              h={h} setH={setH} w={w} setW={setW} age={age} setAge={setAge}
              matching={matching} doMatch={doMatch}
              mode={mode} setMode={setMode}
            />
          </section>

          {(result || glitchArch) && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="space-y-12"
            >
              <MatchResultPanel 
                result={result} glitchArch={glitchArch} resultRef={resultRef}
                shareDna={shareDna} copied={copied}
              />
              
              {result && (
                <section id="chat-panel" className="max-w-5xl mx-auto px-6 py-12 scroll-mt-24">
                  <div className="mb-8 flex items-center gap-4 bg-slate-50 border border-slate-100 rounded-2xl p-4 max-w-2xl mx-auto">
                    <div className="w-10 h-10 rounded-xl bg-indigo-600 flex items-center justify-center text-white shadow-lg">
                      <Sparkles className="w-5 h-5" />
                    </div>
                    <div>
                      <h4 className="text-sm font-black text-slate-900 tracking-tight">Act 2: The Gemini Dialogue</h4>
                      <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-0.5">Ask about host cities, historical stats, or your match</p>
                    </div>
                  </div>
                  
                  <ChatPanel 
                    result={result}
                    chat={chat} msg={msg} setMsg={setMsg} chatLoading={chatLoading} doChat={doChat}
                    clearChat={clearChat}
                    voiceEnabled={voiceEnabled} setVoiceEnabled={setVoiceEnabled} stopAudio={stopAudio}
                    isSpeaking={isSpeaking} micState={micState}
                    startListening={() => startListening("User biometrics: " + (result?.archetype.description || ""), result?.archetype_id)}
                    stopListening={stopListening}
                    chatContainerRef={chatContainerRef}
                  />
                </section>
              )}
            </motion.div>
          )}

          {/* Interactive Globe Section */}
          <section id="globe-section" className="bg-slate-900 py-32 relative overflow-hidden">
            <div className="absolute inset-0 opacity-10" style={{ backgroundImage: "radial-gradient(circle at 60% 50%, #3B82F6 0%, transparent 70%)" }} />
            
            <div className="max-w-6xl mx-auto px-6 relative z-10">
              <div className="flex flex-col lg:flex-row items-center gap-16">
                
                <div className="flex-1 space-y-8">
                  <div>
                    <div className="inline-flex items-center gap-2 bg-indigo-500/10 border border-indigo-500/30 text-indigo-400 text-[10px] font-black px-4 py-1.5 rounded-full uppercase tracking-widest mb-6">
                      <Globe className="w-3.5 h-3.5" /> Global Connection
                    </div>
                    <h2 className="hero-title text-4xl md:text-5xl font-bold text-white mb-6 tracking-tight leading-[0.95]">
                      Explore the <span className="text-indigo-400">Olympic Map</span>
                    </h2>
                    <p className="text-slate-400 text-lg font-medium leading-relaxed max-w-xl">
                      Mention any host city in the chat or type it here. Watch the globe fly to 
                      the location of historical glory.
                    </p>
                  </div>

                  <div className="bg-white/5 border border-white/10 backdrop-blur-xl rounded-[32px] p-8 space-y-6">
                    <div className="flex gap-3">
                      <div className="flex-1 relative">
                        <MapPin className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-500" />
                        <input
                          type="text"
                          value={hometown}
                          onChange={e => setHometown(e.target.value)}
                          placeholder="Search a host city..."
                          className="w-full bg-white/5 border border-white/10 rounded-2xl py-4 pl-12 pr-6 text-white placeholder:text-slate-600 focus:border-indigo-500 outline-none transition-colors"
                          onKeyDown={e => e.key === 'Enter' && handleLocationSubmit()}
                        />
                      </div>
                      <button
                        onClick={handleLocationSubmit}
                        disabled={locLoading}
                        className="bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 text-white font-black px-8 rounded-2xl flex items-center gap-2 transition-all shadow-lg shadow-indigo-600/20"
                      >
                        <Rocket className="w-5 h-5" />
                        {locLoading ? "Locating..." : "Fly"}
                      </button>
                    </div>

                    {locError && <p className="text-red-400 text-xs font-bold pl-2">{locError}</p>}

                    <AnimatePresence>
                      {locationData && (
                        <motion.div
                          initial={{ opacity: 0, height: 0 }}
                          animate={{ opacity: 1, height: "auto" }}
                          className="pt-6 border-t border-white/5"
                        >
                          <div className="flex items-end justify-between">
                            <div>
                              <p className="text-indigo-400 text-[10px] font-black uppercase tracking-widest mb-1">Distance to LA28</p>
                              <div className="text-4xl font-black text-white tracking-tighter">
                                {locationData.distance_miles.toLocaleString()} <span className="text-sm text-slate-500 font-bold tracking-tight">mi</span>
                              </div>
                            </div>
                            <div className="text-right">
                              <p className="text-slate-500 text-[10px] font-bold uppercase mb-1">Status</p>
                              <div className="bg-emerald-500/10 text-emerald-400 text-[10px] font-black px-3 py-1 rounded-full border border-emerald-500/30">
                                LOCATED
                              </div>
                            </div>
                          </div>
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </div>
                </div>

                <div 
                  className="flex-1 w-full aspect-square max-w-[600px] relative group cursor-pointer"
                  onDoubleClick={openFullscreenGlobe}
                >
                  <div className="absolute inset-0 bg-indigo-500/20 blur-[120px] rounded-full group-hover:bg-indigo-500/30 transition-all duration-700" />
                  <div className="relative w-full h-full rounded-full overflow-hidden border border-white/5 bg-slate-950 shadow-2xl">
                    <GlobeScene
                      userLocation={locationData ? { lat: locationData.lat, lng: locationData.lng, city: locationData.city } : null}
                      triggerCity={triggerCity}
                    />
                    <div className="absolute bottom-6 left-1/2 -translate-x-1/2 bg-slate-900/80 border border-white/10 backdrop-blur-md px-4 py-2 rounded-xl text-[10px] font-black text-slate-400 uppercase tracking-widest opacity-0 group-hover:opacity-100 transition-opacity">
                      Double-click for immersive view
                    </div>
                  </div>
                </div>

              </div>
            </div>
          </section>

          {/* Act 3: Discovery */}
          <section id="archetypes-section" className="relative z-10 border-t border-slate-100 bg-[#FAF9F6] py-24 scroll-mt-24">
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
          </section>

          {/* Footer */}
          <footer className="bg-white border-t border-slate-100 py-24 relative z-10">
            <div className="max-w-6xl mx-auto px-6 text-center">
              <div className="flex items-center justify-center gap-2 mb-8">
                <div className="w-1.5 h-1.5 bg-red-600 rounded-full" />
                <div className="w-1.5 h-1.5 bg-white border border-slate-200 rounded-full" />
                <div className="w-1.5 h-1.5 bg-blue-600 rounded-full" />
              </div>
              
              <p className="text-sm font-black text-slate-900 tracking-tight mb-4">
                Built for the <a href="https://vibecodeforgoldwithgoogle.devpost.com/" target="_blank" rel="noopener noreferrer" className="hover:underline" style={{ color: "#C9A227" }}>Vibe Code for Gold with Google</a> Hackathon
              </p>
              
              <p className="text-xs text-slate-400 font-medium max-w-2xl mx-auto leading-relaxed mb-8">
                Built on the <a href="https://www.kaggle.com/datasets/heesoo37/120-years-of-olympic-history-athletes-and-results/data" target="_blank" rel="noopener noreferrer" className="underline">CC0 Kaggle 120 Years of Olympic History</a> dataset,
                filtered to aggregate Team USA historical records from 1896–2016. Gemini API powers conditional, educational archetype insights only:
                “Archetype Match” is a metaphor, not genetic analysis, medical advice, official Paralympic classification, or a performance prediction.
                No individual athletes are identified.
              </p>
              
              <div className="flex flex-wrap justify-center gap-x-6 gap-y-2 text-[10px] font-black text-slate-300 uppercase tracking-[0.2em]">
                <span>Google Cloud</span>
                <span>Gemini API</span>
                <span>Next.js</span>
                <span>FastAPI</span>
                <span>Aggregate Team USA Data</span>
              </div>
            </div>
          </footer>

        </div>
      </main>

      {/* Fullscreen Globe Modal */}
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
    </div>
  );
}
