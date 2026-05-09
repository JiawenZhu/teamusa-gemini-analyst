"use client";
import React, { useState, useRef, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Sparkles, Mic, MicOff, ArrowUp, User, RotateCcw, Globe, BarChart2, Dumbbell, History } from "lucide-react";
import type { MatchResult } from "@/lib/api";
import { FormattedBotMessage } from "./FormattedBotMessage";
import { AIGuidelinesPanel } from "./AIGuidelinesPanel";

type PersonaMode = "analyst" | "coach" | "historian";

const PERSONA_QUESTIONS: Record<PersonaMode, { icon: string; text: string }[]> = {
  analyst: [
    { icon: "📏", text: "Which Team USA sports have the tallest average athletes, and how has that changed over time?" },
    { icon: "⚖️", text: "Which sports show the biggest difference in average height and weight between medalists and non-medalists?" },
    { icon: "🧬", text: "For Team USA, does BMI correlate more strongly with medal success in strength sports or endurance sports?" },
    { icon: "👩", text: "How have Team USA women's participation rates changed across Summer Olympic history?" },
    { icon: "🎯", text: "Which Team USA sports have become more specialized by body type over time?" },
    { icon: "⏳", text: "What is the average age of Team USA medalists by sport, and which sports favor younger or older athletes?" },
  ],
  coach: [
    { icon: "🏋️", text: "Based on my archetype match, what are the top 3 Olympic sports historically aligned with my body type?" },
    { icon: "💪", text: "What training focus — strength, endurance, or technique — do athletes in my archetype historically prioritize?" },
    { icon: "📈", text: "At what age do athletes in my archetype typically peak in competition, based on Team USA history?" },
    { icon: "🥇", text: "Which sports give athletes with my BMI range the highest historical medal rate in Team USA?" },
    { icon: "🏃", text: "How does my height-to-weight ratio compare to the most decorated Team USA athletes in my cluster?" },
    { icon: "🎽", text: "What are the physical benchmarks of a medalist in the sport most aligned with my archetype?" },
  ],
  historian: [
    { icon: "🏛️", text: "Which Olympic host city has the most Team USA medals, and what sports drove that success?" },
    { icon: "🌍", text: "How did Team USA's sport composition evolve from the 1896 Athens Games to the 2016 Rio Games?" },
    { icon: "🕰️", text: "Which decade was the most dominant era for Team USA in the Summer Olympics, and why?" },
    { icon: "⚡", text: "Which individual events have Team USA athletes won the most gold medals in across all Games?" },
    { icon: "🔄", text: "How have the number of Olympic events and Team USA's participation changed since 1896?" },
    { icon: "🏅", text: "Which Team USA athletes appeared in the most Olympic Games, and what sports kept them competing longest?" },
  ],
};

const PERSONA_CONFIG: Record<PersonaMode, { label: string; icon: React.ReactNode; description: string }> = {
  analyst: {
    label: "Analyst",
    icon: <BarChart2 className="w-3.5 h-3.5" />,
    description: "Biometric data & body-type trends",
  },
  coach: {
    label: "Coach",
    icon: <Dumbbell className="w-3.5 h-3.5" />,
    description: "Training insights for your archetype",
  },
  historian: {
    label: "Historian",
    icon: <History className="w-3.5 h-3.5" />,
    description: "120 years of Olympic history",
  },
};

export function ChatPanel({
  result,
  chat,
  msg,
  setMsg,
  chatLoading,
  doChat,
  isSpeaking,
  micState,
  permissionError,
  startListening,
  stopListening,
  chatContainerRef,
  clearChat,
  onOpenGlobe,
}: {
  result: MatchResult | null;
  chat: { role: string; text: string; sealed?: boolean; fromVoice?: boolean }[];
  msg: string;
  setMsg: (v: string) => void;
  chatLoading: boolean;
  doChat: (overrideMsg?: string) => void;
  isSpeaking: boolean;
  micState: "idle" | "listening" | "processing" | "speaking";
  permissionError?: string | null;
  startListening: () => void;
  stopListening: () => void;
  chatContainerRef: React.RefObject<HTMLDivElement | null>;
  clearChat: () => void;
  onOpenGlobe?: () => void;
}) {
  const [isTyping, setIsTyping] = React.useState(false);
  const [personaMode, setPersonaMode] = React.useState<PersonaMode>("analyst");
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  // Auto-expand textarea on content change
  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = "auto";
      textareaRef.current.style.height = `${Math.min(textareaRef.current.scrollHeight, 160)}px`;
    }
  }, [msg]);
  
  if (!result) return null;

  return (
    <motion.div 
      initial={{ opacity: 0, y: 30 }} 
      animate={{ opacity: 1, y: 0 }} 
      transition={{ delay: 0.3 }} 
      className="bg-white border border-slate-100 rounded-[32px] p-6 md:p-8 shadow-2xl shadow-slate-200/50 flex flex-col min-w-0"
    >
      {/* Header Row */}
      <div className="flex items-center gap-4 mb-6 w-full">
        <div 
          className="w-12 h-12 rounded-2xl flex items-center justify-center flex-shrink-0 shadow-lg relative overflow-hidden"
          style={{ background: `linear-gradient(135deg, ${result.archetype.color}, #0A1628)` }}
        >
          {isSpeaking ? (
            <div className="flex items-center gap-1 relative z-10">
              {[1, 1.5, 0.8, 1.3, 0.9].map((h, i) => (
                <motion.div 
                  key={i} 
                  animate={{ scaleY: [1, h * 1.8, 1] }} 
                  transition={{ repeat: Infinity, duration: 0.5 + i * 0.1, delay: i * 0.08 }} 
                  className="w-1 h-3 bg-white rounded-full transform-origin-center" 
                />
              ))}
            </div>
          ) : (
            <Sparkles className="w-6 h-6 text-white relative z-10" />
          )}
          <div className="absolute inset-0 bg-white/10 opacity-50" />
        </div>
        
        <div className="flex-1">
          <h3 className="hero-title text-xl font-bold text-slate-900 tracking-tight">Ask Gemini</h3>
          <p className="text-[11px] font-bold text-slate-400 tracking-wider uppercase">Powered by Live Olympic Database</p>
        </div>
        


        <div className="flex items-center gap-2">
          {onOpenGlobe && (
            <button 
              onClick={onOpenGlobe}
              title="Open World Map"
              className="flex items-center gap-2 px-4 py-2.5 rounded-full bg-indigo-50 border border-indigo-100 text-indigo-600 hover:bg-indigo-600 hover:text-white transition-all duration-200 font-bold text-xs shadow-sm"
            >
              <Globe className="w-3.5 h-3.5" />
              <span>Explore Olympic World Map</span>
            </button>
          )}

          {chat.length > 0 && (
            <button 
              onClick={clearChat}
              title="Clear Chat"
              className="p-2.5 rounded-full bg-slate-50 border border-slate-200 text-slate-400 hover:text-red-500 hover:bg-red-50 hover:border-red-100 transition-all duration-200 shadow-sm"
            >
              <RotateCcw className="w-4 h-4" />
            </button>
          )}
        </div>
      </div>

      <AIGuidelinesPanel />

      <div 
        ref={chatContainerRef} 
        className="min-h-[250px] max-h-[500px] overflow-y-auto mb-6 pr-2 flex flex-col gap-8 scroll-smooth"
      >
        {chat.length === 0 && !chatLoading && (
          <div className="flex flex-col items-center justify-center py-8 gap-6">
            {/* Header */}
            <div className="text-center space-y-1.5">
              <div className="text-4xl animate-bounce">✨</div>
              <p className="text-lg font-black text-slate-900 tracking-tight">Your AI Analyst is Active</p>
              <p className="text-sm text-slate-500 max-w-[300px] leading-relaxed">
                Choose a mode to explore questions tailored to your archetype.
              </p>
            </div>

            {/* ── Persona Toggle Pills ── */}
            <div className="flex gap-2 p-1 bg-slate-100 rounded-2xl">
              {(Object.keys(PERSONA_CONFIG) as PersonaMode[]).map((mode) => {
                const cfg = PERSONA_CONFIG[mode];
                const isActive = personaMode === mode;
                return (
                  <button
                    key={mode}
                    onClick={() => setPersonaMode(mode)}
                    className={`
                      flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-bold transition-all duration-200
                      ${isActive
                        ? "bg-white shadow-sm text-slate-900 shadow-slate-200"
                        : "text-slate-500 hover:text-slate-700"}
                    `}
                    style={isActive ? { color: result.archetype.color } : {}}
                  >
                    <span style={isActive ? { color: result.archetype.color } : {}}>{cfg.icon}</span>
                    {cfg.label}
                  </button>
                );
              })}
            </div>

            {/* Active mode description */}
            <p className="text-xs text-slate-400 font-medium tracking-wide -mt-3">
              {PERSONA_CONFIG[personaMode].description}
            </p>

            {/* ── Question Chips (animated on mode switch) ── */}
            <AnimatePresence mode="wait">
              <motion.div
                key={personaMode}
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -8 }}
                transition={{ duration: 0.18 }}
                className="flex flex-wrap gap-2 justify-center max-w-2xl"
              >
                {PERSONA_QUESTIONS[personaMode].map(({ icon, text }) => (
                  <button
                    key={text}
                    disabled={isTyping || chatLoading}
                    onClick={() => {
                      if (isTyping || chatLoading) return;
                      setIsTyping(true);
                      let current = "";
                      let i = 0;
                      setMsg("");
                      const interval = setInterval(() => {
                        current += text[i];
                        setMsg(current);
                        i++;
                        if (i >= text.length) {
                          clearInterval(interval);
                          setIsTyping(false);
                          setTimeout(() => doChat(text), 400);
                        }
                      }, 30);
                    }}
                    className={`
                      bg-slate-50 hover:bg-white hover:shadow-md border border-slate-200 rounded-2xl px-5 py-3 text-sm font-bold text-slate-700 flex items-center gap-3 transition-all duration-200 group text-left
                      ${isTyping || chatLoading ? "opacity-50 cursor-not-allowed" : "active:scale-95"}
                    `}
                  >
                    <span className="text-lg group-hover:scale-125 transition-transform flex-shrink-0">{icon}</span>
                    <span>{text}</span>
                  </button>
                ))}
              </motion.div>
            </AnimatePresence>
          </div>
        )}

        {chat.map((m, i) => (
          <motion.div
            initial={{ opacity: 0, y: 15, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            transition={{ type: "spring", stiffness: 220, damping: 22 }}
            key={i}
            className={`flex gap-4 items-end max-w-[90%] ${m.role === "user" ? "self-end flex-row-reverse" : "self-start"}`}
          >
            <div className={`
              w-9 h-9 rounded-full flex items-center justify-center flex-shrink-0 shadow-sm
              ${m.role === "user" ? "bg-slate-100 border border-slate-200" : "bg-slate-900"}
            `}>
              {m.role === "user" ? <User className="w-4 h-4 text-slate-600" /> : <Sparkles className="w-4 h-4 text-white" />}
            </div>
            
            <div className={`
              relative p-5 text-[15px] leading-relaxed font-medium
              ${m.role === "user" 
                ? "bg-slate-900 text-white rounded-3xl rounded-br-none shadow-xl shadow-slate-900/10" 
                : "bg-slate-50 border border-slate-100 text-slate-800 rounded-3xl rounded-bl-none shadow-sm"}
            `}>
              {m.role === "user" ? (
                <>
                  <span className="font-semibold">{m.text}</span>
                  {m.fromVoice && (
                    <span title="Transcribed from voice" className="absolute -top-3 right-0 bg-white border border-slate-200 text-slate-400 text-[9px] px-2 py-0.5 rounded-full shadow-sm">🎙 Voice</span>
                  )}
                </>
              ) : (
                <FormattedBotMessage
                  text={m.text}
                  color={result.archetype.color}
                  onQuickAsk={(q) => doChat(q)}
                />
              )}
            </div>
          </motion.div>
        ))}
        
        {chatLoading && (
          <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="flex gap-4 items-end self-start">
             <div className="w-9 h-9 rounded-full bg-slate-900 flex items-center justify-center flex-shrink-0 shadow-sm">
               <Sparkles className="w-4 h-4 text-white" />
             </div>
             <div className="bg-slate-50 border border-slate-100 p-5 rounded-3xl rounded-bl-none flex items-center gap-2 shadow-sm">
               <motion.div animate={{ y: [0, -4, 0] }} transition={{ repeat: Infinity, duration: 0.6 }} className="w-1.5 h-1.5 rounded-full bg-slate-400" />
               <motion.div animate={{ y: [0, -4, 0] }} transition={{ repeat: Infinity, duration: 0.6, delay: 0.15 }} className="w-1.5 h-1.5 rounded-full bg-slate-400" />
               <motion.div animate={{ y: [0, -4, 0] }} transition={{ repeat: Infinity, duration: 0.6, delay: 0.3 }} className="w-1.5 h-1.5 rounded-full bg-slate-400" />
             </div>
          </motion.div>
        )}
      </div>

      {/* Input Area */}
      {permissionError && (
        <div className="mb-3 rounded-2xl border border-red-100 bg-red-50 px-4 py-3 text-xs font-bold leading-relaxed text-red-600">
          {permissionError}
        </div>
      )}
      <div className={`
        flex items-end gap-3 p-2 pl-6 bg-slate-50 border-2 rounded-[28px] shadow-inner transition-all duration-300
        focus-within:bg-white focus-within:border-slate-200 focus-within:shadow-xl focus-within:shadow-slate-200/50
      `}>
        <textarea
          id="chat-input"
          ref={textareaRef}
          value={msg}
          rows={1}
          disabled={isTyping || chatLoading}
          onChange={e => setMsg(e.target.value)}
          onKeyDown={e => {
            if (e.key === "Enter" && !e.shiftKey) { 
              e.preventDefault(); 
              doChat(); 
            }
          }}
          placeholder={isTyping ? "Typing..." : micState === "listening" ? "Listening to you…" : "Ask Gemini anything…"}
          className="flex-1 bg-transparent border-none text-slate-900 text-base outline-none resize-none py-3 font-medium placeholder:text-slate-400 min-h-[48px] max-h-[160px] disabled:opacity-70 transition-[height] duration-100 ease-out"
        />
        
        {/* Action Buttons */}
        <div className="flex gap-2 items-center pb-1 pr-1">
          <button
            onClick={micState === "listening" ? stopListening : startListening}
            disabled={isTyping || chatLoading}
            className={`
              w-10 h-10 rounded-full flex items-center justify-center transition-all duration-300
              ${micState === "listening" 
                ? "bg-red-500 text-white animate-pulse shadow-lg shadow-red-500/30" 
                : "bg-white border border-slate-200 text-slate-400 hover:text-slate-600 hover:border-slate-300 hover:shadow-md"}
              ${isTyping || chatLoading ? "opacity-50 cursor-not-allowed" : ""}
            `}
          >
            {micState === "listening" ? <MicOff className="w-4 h-4" /> : <Mic className="w-4 h-4" />}
          </button>
          
          <button 
            onClick={() => doChat()} 
            disabled={isTyping || chatLoading || !msg.trim()}
            className={`
              w-10 h-10 rounded-full flex items-center justify-center transition-all duration-300
              ${msg.trim() && !isTyping && !chatLoading
                ? "bg-slate-900 text-white shadow-lg shadow-slate-900/20 hover:-translate-y-0.5 active:scale-95" 
                : "bg-slate-100 text-slate-300 cursor-not-allowed"}
            `}
          >
            <ArrowUp className="w-5 h-5" />
          </button>
        </div>
      </div>
    </motion.div>
  );
}
