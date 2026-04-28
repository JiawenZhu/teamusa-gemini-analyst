"use client";
import { useEffect, useState, useRef, useCallback } from "react";
import { fetchStats, fetchArchetypes, matchBiometrics, fetchTimeline, sendChat, sendChatStream } from "@/lib/api";
import type { DatasetStats, ArchetypeProfile, MatchResult, TimelinePoint } from "@/lib/api";
import { motion } from "framer-motion";
import { Hero } from "@/components/Hero";
import { InputSection } from "@/components/InputSection";
import { MatchResultPanel } from "@/components/MatchResultPanel";
import { ChatPanel } from "@/components/ChatPanel";
import { ArchetypeExplorer } from "@/components/ArchetypeExplorer";
import { TimelineChart } from "@/components/TimelineChart";
import { useVoiceAssistant } from "@/hooks/useVoiceAssistant";

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

  const shareDna = useCallback(() => {
    navigator.clipboard.writeText(window.location.href);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }, []);

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
            
            // Bypass Gemini TTS for now and use premium native browser voice
            playNativeTTS(text);
          },
          (fullText) => {
            setChat(c => {
              const updated = [...c];
              updated[updated.length - 1] = { role: "bot", text: fullText || rendered };
              return updated;
            });
            setCL(false);
          },
        );
      } catch (err) {
        console.warn("Stream failed, falling back:", err);
        const reply = await sendChat(m, result.archetype_id, currentChat);
        setChat(c => {
          const updated = [...c];
          updated[updated.length - 1] = { role: "bot", text: reply };
          return updated;
        });
        setCL(false);
        if (reply) playNativeTTS(reply);
      }
    } else {
      const reply = await sendChat(m, result.archetype_id, currentChat);
      setChat(c => [...c, { role: "bot", text: reply }]);
      setCL(false);
    }
  }, [msg, result, chat, voiceEnabled, playNativeTTS]);

  const bgAccent = result?.archetype?.color || glitchArch?.color || "transparent";
  const accent = result?.archetype?.color || "#C9A227";

  return (
    <main style={{ background: "var(--navy)", minHeight: "100vh", color: "var(--text-main)", position: "relative", overflow: "hidden" }}>
      
      {/* Dynamic Ambient Background */}
      <div style={{
        position: "fixed", top: 0, left: 0, right: 0, bottom: 0,
        background: `radial-gradient(circle at 50% 40%, ${bgAccent}15, transparent 70%)`,
        transition: "background 1.5s ease", pointerEvents: "none", zIndex: 0
      }} />

      <div style={{ position: "relative", zIndex: 1 }}>
        
        <Hero stats={stats} />

        <InputSection 
          h={h} setH={setH} w={w} setW={setW} age={age} setAge={setAge}
          matching={matching} doMatch={doMatch}
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
