"use client";
import { motion } from "framer-motion";
import { Sparkles, Volume2, VolumeX, Mic, MicOff, ArrowUp, User } from "lucide-react";
import type { MatchResult } from "@/lib/api";
import { FormattedBotMessage } from "./FormattedBotMessage";
import { AIGuidelinesPanel } from "./AIGuidelinesPanel";

export function ChatPanel({
  result,
  chat,
  msg,
  setMsg,
  chatLoading,
  doChat,
  voiceEnabled,
  setVoiceEnabled,
  stopAudio,
  isSpeaking,
  micState,
  startListening,
  stopListening,
  chatContainerRef,
}: {
  result: MatchResult | null;
  chat: { role: string; text: string; sealed?: boolean; fromVoice?: boolean }[];
  msg: string;
  setMsg: (v: string) => void;
  chatLoading: boolean;
  doChat: () => void;
  voiceEnabled: boolean;
  setVoiceEnabled: React.Dispatch<React.SetStateAction<boolean>>;
  stopAudio: () => void;
  isSpeaking: boolean;
  micState: "idle" | "listening" | "processing" | "speaking";
  startListening: () => void;
  stopListening: () => void;
  chatContainerRef: React.RefObject<HTMLDivElement | null>;
}) {
  if (!result) return null;

  return (
    <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }} style={{ background: "var(--bg-card)", border: "1px solid var(--border-color)", borderRadius: 20, padding: "24px 20px", boxShadow: "0 20px 60px rgba(0,0,0,0.15)", minWidth: 0 }}>
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
        <button onClick={() => { if (voiceEnabled) stopAudio(); setVoiceEnabled(v => !v); }}
          style={{ display: "flex", alignItems: "center", gap: 6, padding: "8px 14px", borderRadius: 99, background: voiceEnabled ? `${result.archetype.color}20` : "var(--border-color)", border: `1px solid ${voiceEnabled ? result.archetype.color + "60" : "transparent"}`, color: voiceEnabled ? result.archetype.color : "var(--text-sub)", fontWeight: 700, fontSize: 12, cursor: "pointer", transition: "all 0.2s", flexShrink: 0 }}>
          {voiceEnabled ? <Volume2 className="w-4 h-4" /> : <VolumeX className="w-4 h-4" />}
          {voiceEnabled ? "Voice ON" : "Voice"}
        </button>
      </div>

      {/* AI Guidelines collapsible panel */}
      <AIGuidelinesPanel />

      <div ref={chatContainerRef} style={{ minHeight: 180, maxHeight: 500, overflowY: "auto", margin: "16px 0 24px 0", paddingRight: 8, display: "flex", flexDirection: "column", gap: 24 }}>
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
              position: 'relative',
            }}>
              {m.role === "user" ? (
                <>
                  <span style={{ fontWeight: 600 }}>{m.text}</span>
                  {/* Small 🎙 badge on voice-transcribed messages */}
                  {m.fromVoice && (
                    <span title="Transcribed from voice" style={{
                      position: 'absolute', top: 6, left: 8,
                      fontSize: 9, opacity: 0.55,
                    }}>🎙</span>
                  )}
                </>
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
        display: "flex", alignItems: "flex-end", gap: 10, position: "relative",
        background: "var(--bg-main)", border: "1px solid var(--border-color)", borderRadius: 20, 
        padding: "10px 10px 10px 18px", boxShadow: "0 8px 24px rgba(0,0,0,0.05)",
        transition: "border-color 0.2s, box-shadow 0.2s"
      }}
        onFocus={(e) => { e.currentTarget.style.borderColor = result.archetype.color; e.currentTarget.style.boxShadow = `0 8px 32px ${result.archetype.color}20`; }}
        onBlur={(e) => { e.currentTarget.style.borderColor = "var(--border-color)"; e.currentTarget.style.boxShadow = "0 8px 24px rgba(0,0,0,0.05)"; }}
      >
        <textarea
          id="chat-input"
          value={msg}
          rows={1}
          onChange={e => {
            setMsg(e.target.value);
            // Auto-grow: reset height then set to scrollHeight (capped at ~5 lines)
            e.target.style.height = "auto";
            e.target.style.height = Math.min(e.target.scrollHeight, 130) + "px";
          }}
          onKeyDown={e => {
            if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); doChat(); }
          }}
          placeholder={micState === "listening" ? "Listening…" : "Ask Gemini about Olympic history…"}
          style={{
            flex: 1, background: "transparent", border: "none",
            color: "var(--text-main)", fontSize: 15, outline: "none", resize: "none",
            lineHeight: 1.55, fontFamily: "inherit", minHeight: 26, maxHeight: 130,
            overflowY: "auto", padding: 0,
            fontStyle: micState === "listening" ? "italic" : "normal",
          }}
        />
        {/* Mic Button */}
        <button
          id="mic-btn"
          onClick={micState === "listening" ? stopListening : startListening}
          title={micState === "listening" ? "Stop listening" : "Ask Gemini"}
          style={{
            width: 40, height: 40, borderRadius: "50%",
            background: micState === "listening" ? "#EF4444" : "var(--border-color)",
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
            width: 40, height: 40, borderRadius: "50%", 
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
  );
}
