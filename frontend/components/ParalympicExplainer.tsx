"use client";
import { useState, useCallback, useEffect, useRef, useMemo } from "react";
import { motion, AnimatePresence, Variants } from "framer-motion";
import { Info, Sparkles, ChevronDown, ChevronUp, History, ClipboardCheck, LayoutGrid, Zap, Activity } from "lucide-react";
import type { ArchetypeProfile } from "@/lib/api";
import { fetchParaClassificationExplainer } from "@/lib/api";

const LOADING_PHRASES = [
  "Consulting the IPC classification database…",
  "Analyzing functional impairment profiles…",
  "Cross-referencing Team USA Paralympic results…",
  "Mapping biometric data to class codes…",
  "Synthesizing legacy performance statistics…",
];

const containerVariants: Variants = {
  hidden: { opacity: 0, y: 30 },
  visible: { 
    opacity: 1, 
    y: 0,
    transition: { 
      duration: 0.6, 
      ease: [0.22, 1, 0.36, 1] as [number, number, number, number],
      staggerChildren: 0.08
    }
  }
};

const itemVariants: Variants = {
  hidden: { opacity: 0, y: 20 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.5 } }
};

function LoadingState({ color }: { color: string }) {
  const [phraseIdx, setPhraseIdx] = useState(0);
  useEffect(() => {
    const t = setInterval(() => setPhraseIdx(p => (p + 1) % LOADING_PHRASES.length), 2400);
    return () => clearInterval(t);
  }, []);
  
  return (
    <div className="py-20 flex flex-col items-center gap-8">
      <div className="relative w-16 h-16">
        <div className="absolute inset-0 rounded-full border-4 border-slate-100" />
        <motion.div 
          animate={{ rotate: 360 }}
          transition={{ duration: 1.5, repeat: Infinity, ease: "linear" }}
          className="absolute inset-0 rounded-full border-4 border-transparent border-t-current"
          style={{ color }}
        />
        <div className="absolute inset-0 flex items-center justify-center text-2xl">⚡</div>
      </div>
      <AnimatePresence mode="wait">
        <motion.p
          key={phraseIdx}
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -10 }}
          className="text-sm font-black text-slate-400 tracking-[0.1em] uppercase text-center max-w-[320px]"
        >
          {LOADING_PHRASES[phraseIdx]}
        </motion.p>
      </AnimatePresence>
    </div>
  );
}

function Markdown({ text }: { text: string }) {
  const lines = useMemo(() => text.split("\n").filter(l => !/^---+$/.test(l.trim())), [text]);
  return (
    <motion.div 
      variants={containerVariants}
      initial="hidden"
      animate="visible"
      className="space-y-6 text-slate-600 leading-relaxed font-medium"
    >
      {lines.map((line, i) => {
        if (line.startsWith("## ")) {
          return (
            <motion.div key={i} variants={itemVariants} className="pt-8 first:pt-0 pb-2 border-b border-slate-50">
              <h3 className="text-lg font-black text-slate-900 tracking-tight flex items-center gap-3">
                <div className="w-2 h-8 bg-indigo-600 rounded-full shadow-[0_0_15px_rgba(79,70,229,0.3)]" />
                {line.slice(3)}
              </h3>
            </motion.div>
          );
        }
        if (line.startsWith("### ")) {
          return (
            <motion.h4 key={i} variants={itemVariants} className="text-xs font-black text-indigo-500 tracking-[0.2em] uppercase mt-8 mb-4">
              {line.slice(4)}
            </motion.h4>
          );
        }
        if (/^[-*]\s/.test(line)) {
          const content = line.replace(/^[-*]\s/, "");
          return (
            <motion.div key={i} variants={itemVariants} className="flex gap-4 items-start pl-4 group">
              <div className="w-1.5 h-1.5 bg-indigo-200 rounded-full mt-2 group-hover:bg-indigo-600 transition-colors" />
              <span className="text-[16px] text-slate-600" dangerouslySetInnerHTML={{ __html: content.replace(/\*\*(.+?)\*\*/g, '<strong class="text-slate-900 font-black">$1</strong>') }} />
            </motion.div>
          );
        }
        if (line.trim() === "") return null;
        return (
          <motion.p key={i} variants={itemVariants} className="text-[16px] leading-[1.8]" dangerouslySetInnerHTML={{ __html: line.replace(/\*\*(.+?)\*\*/g, '<strong class="text-slate-900 font-black">$1</strong>') }} />
        );
      })}
    </motion.div>
  );
}

const IPC_CLASSES = [
  { code: "T11–T13", sport: "Athletics Track", desc: "Visual impairment. T11 = total blindness; T13 = partial sight." },
  { code: "T33–T34", sport: "Athletics Track", desc: "Cerebral palsy / brain injury. Wheelchair based." },
  { code: "S1–S14", sport: "Para Swimming", desc: "S1 = lowest function; S14 = intellectual impairment." },
  { code: "BC1–BC4", sport: "Boccia", desc: "Severe functional impairment. BC3 uses assistive ramps." },
];

export function ParalympicExplainer({ paraArchetypes, userHeight, userWeight }: { paraArchetypes: ArchetypeProfile[]; userHeight?: number; userWeight?: number }) {
  const [selected, setSelected] = useState<ArchetypeProfile | null>(null);
  const [explainer, setExplainer] = useState<string>("");
  const [loading, setLoading] = useState(false);
  const [activeTab, setActiveTab] = useState<"overview" | "classes" | "legacy">("overview");
  const panelRef = useRef<HTMLDivElement>(null);

  const loadExplainer = useCallback(async (arch: ArchetypeProfile) => {
    if (selected?.id === arch.id) { setSelected(null); setExplainer(""); return; }
    setSelected(arch);
    setExplainer("");
    setLoading(true);
    setActiveTab("overview");
    
    setTimeout(() => {
      panelRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
    }, 300);

    try {
      const data = await fetchParaClassificationExplainer(arch.id, arch.paralympic_sports?.[0] ?? "", userHeight, userWeight);
      setExplainer(data.explainer ?? "");
    } catch {
      setExplainer("Unable to load the classification analysis.");
    } finally {
      setLoading(false);
    }
  }, [selected, userHeight, userWeight]);

  // Split content by ## headings
  const sections = useMemo(() => {
    if (!explainer) return { overview: "", classes: "", legacy: "" };
    
    const parts = explainer.split(/(?=## )/);
    const result = {
      overview: "",
      classes: "",
      legacy: ""
    };

    parts.forEach(part => {
      const lower = part.toLowerCase();
      if (lower.includes("## overview") || lower.includes("## biometric") || lower.includes("## profile")) {
        result.overview += part;
      } else if (lower.includes("## classification") || lower.includes("## class") || lower.includes("## category") || lower.includes("## ipc")) {
        result.classes += part;
      } else if (lower.includes("## legacy") || lower.includes("## history") || lower.includes("## results") || lower.includes("## usa")) {
        result.legacy += part;
      } else {
        // Fallback: put unmapped content in overview
        if (!result.overview) result.overview = part;
      }
    });

    // Final fallback: if a tab is empty, give it something
    if (!result.overview) result.overview = explainer.split("##")[0] || explainer;
    if (!result.classes) result.classes = "## Classification Standards\n\nIndividual classification depends on the official IPC medical assessment process for the specific sport selected.";
    if (!result.legacy) result.legacy = "## Team USA Legacy\n\nTeam USA has a long-standing history of excellence in this biometric cluster, with multiple podium finishes across international Paralympic competition.";

    return result;
  }, [explainer]);

  return (
    <section id="paralympic-section" className="bg-slate-50 py-32">
      <div className="max-w-7xl mx-auto px-6">
        
        {/* Section Header */}
        <div className="text-center mb-24">
          <motion.div 
            initial={{ opacity: 0, scale: 0.9 }}
            whileInView={{ opacity: 1, scale: 1 }}
            viewport={{ once: true }}
            className="inline-flex items-center gap-2 bg-indigo-600 text-white text-[10px] font-black px-5 py-2 rounded-full uppercase tracking-[0.2em] mb-8 shadow-xl shadow-indigo-600/20"
          >
            <Activity className="w-3.5 h-3.5" /> Paralympic Parity Analysis
          </motion.div>
          <h2 className="hero-title text-5xl md:text-6xl font-bold text-slate-900 mb-8 tracking-tight">
            Paralympic <span className="text-indigo-600">Archetype Matching</span>
          </h2>
          <p className="text-slate-500 max-w-3xl mx-auto text-xl font-medium leading-relaxed">
            Every biometric profile has a legacy in the Paralympic Games. Explore how functional 
            profiles translate to world-class competition across IPC classifications.
          </p>
        </div>

        {/* Quick Reference Table */}
        <motion.div 
          variants={containerVariants}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true }}
          className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-20"
        >
          {IPC_CLASSES.map(c => (
            <motion.div 
              key={c.code} 
              variants={itemVariants}
              whileHover={{ y: -5 }}
              className="bg-white border border-slate-100 rounded-3xl p-6 shadow-sm hover:shadow-xl transition-all duration-300"
            >
              <div className="flex items-center justify-between mb-4">
                <span className="bg-slate-900 text-white text-[10px] font-black px-3 py-1 rounded-lg tracking-tighter uppercase">{c.code}</span>
                <span className="text-[10px] font-bold text-slate-300 uppercase tracking-widest">{c.sport}</span>
              </div>
              <p className="text-[13px] text-slate-500 font-semibold leading-relaxed">{c.desc}</p>
            </motion.div>
          ))}
        </motion.div>

        {/* Archetype Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 mb-20">
          {paraArchetypes.map((a, i) => {
            const isActive = selected?.id === a.id;
            return (
              <motion.div
                key={a.id}
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.05 }}
                whileHover={{ y: -10 }}
                className={`
                  group relative bg-white border-2 rounded-[40px] p-10 transition-all duration-500 cursor-pointer overflow-hidden
                  ${isActive ? "border-indigo-600 shadow-[0_40px_80px_-15px_rgba(79,70,229,0.15)] z-10" : "border-slate-50 shadow-sm hover:border-slate-200 hover:shadow-xl"}
                `}
                onClick={() => loadExplainer(a)}
              >
                <div className="flex items-start gap-5 mb-8">
                  <div 
                    className="w-16 h-16 rounded-3xl flex items-center justify-center text-4xl shadow-xl transition-transform duration-500 group-hover:scale-110 group-hover:rotate-6"
                    style={{ background: `${a.color}15` }}
                  >
                    {a.icon}
                  </div>
                  <div>
                    <h3 className="text-xl font-black text-slate-900 tracking-tight">{a.label}</h3>
                    <div className="text-[10px] font-black text-slate-300 uppercase tracking-[0.2em] mt-1">Functional DNA</div>
                  </div>
                </div>

                <p className="text-slate-500 text-base leading-relaxed mb-10 font-medium opacity-80">
                  {a.description}
                </p>

                <div className="flex flex-wrap gap-2 mb-10">
                  {a.paralympic_sports?.slice(0, 3).map(s => (
                    <span key={s} className="bg-indigo-50 border border-indigo-100 text-indigo-600 text-[10px] font-black px-4 py-1.5 rounded-full uppercase tracking-tighter shadow-sm">
                      {s}
                    </span>
                  ))}
                </div>

                <div className={`
                  flex items-center gap-3 text-xs font-black transition-colors duration-300 pt-6 border-t border-slate-50
                  ${isActive ? "text-indigo-600" : "text-slate-400 group-hover:text-slate-600"}
                `}>
                  <Sparkles className="w-4 h-4" />
                  {isActive ? "Deep-Dive Active" : "View Gemini Analysis"}
                  <div className="ml-auto bg-slate-50 p-1.5 rounded-full group-hover:bg-indigo-50 transition-colors">
                    {isActive ? <ChevronUp className="w-4 h-4 text-indigo-600" /> : <ChevronDown className="w-4 h-4" />}
                  </div>
                </div>
              </motion.div>
            );
          })}
        </div>

        {/* Gemini Analysis Panel */}
        <AnimatePresence mode="wait">
          {selected && (
            <motion.div
              key={selected.id}
              ref={panelRef}
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-white border-2 border-indigo-600 rounded-[56px] p-10 md:p-16 shadow-[0_50px_100px_-20px_rgba(79,70,229,0.15)] scroll-mt-24 relative overflow-hidden"
            >
              {/* Animated Background Accent */}
              <div className="absolute top-0 right-0 w-64 h-64 blur-[120px] opacity-10 rounded-full animate-pulse" style={{ backgroundColor: selected.color }} />
              
              <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-12 mb-12 pb-12 border-b border-slate-100 relative z-10">
                <div className="flex items-center gap-8">
                  <motion.div 
                    initial={{ scale: 0.8 }}
                    animate={{ scale: 1 }}
                    className="w-20 h-20 rounded-[32px] flex items-center justify-center text-5xl shadow-2xl"
                    style={{ background: `${selected.color}15` }}
                  >
                    {selected.icon}
                  </motion.div>
                  <div>
                    <h3 className="text-3xl font-black text-slate-900 tracking-tight mb-1">{selected.label}</h3>
                    <div className="flex items-center gap-2">
                      <div className="w-2 h-2 rounded-full bg-indigo-500 animate-pulse" />
                      <p className="text-indigo-500 text-xs font-black uppercase tracking-[0.2em]">Gemini Functional Alignment Analysis</p>
                    </div>
                  </div>
                </div>

                <div className="flex bg-slate-50 border border-slate-100 rounded-[28px] p-1.5 gap-1.5 shadow-inner">
                  {[
                    { id: "overview", label: "Overview", icon: LayoutGrid },
                    { id: "classes", label: "Classification", icon: ClipboardCheck },
                    { id: "legacy", label: "USA Legacy", icon: History },
                  ].map(tab => (
                    <button
                      key={tab.id}
                      onClick={() => setActiveTab(tab.id as any)}
                      className={`
                        flex items-center gap-3 px-6 py-3 rounded-2xl text-[11px] font-black transition-all duration-300
                        ${activeTab === tab.id 
                          ? "bg-white text-indigo-600 shadow-xl shadow-indigo-900/10 ring-1 ring-slate-200" 
                          : "text-slate-400 hover:text-slate-600 hover:bg-white/50"}
                      `}
                    >
                      <tab.icon className="w-4 h-4" />
                      {tab.label.toUpperCase()}
                    </button>
                  ))}
                </div>
              </div>

              {loading ? (
                <LoadingState color={selected.color} />
              ) : (
                <motion.div
                  key={activeTab}
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ duration: 0.4 }}
                  className="min-h-[400px] relative z-10"
                >
                  <Markdown text={sections[activeTab]} />
                  
                  <motion.div 
                    variants={itemVariants}
                    className="mt-16 p-10 bg-slate-50 rounded-[40px] border border-slate-100 flex items-start gap-6 relative overflow-hidden group hover:border-indigo-100 transition-colors"
                  >
                    <div className="absolute top-0 right-0 w-32 h-32 blur-3xl opacity-5 bg-indigo-600 group-hover:opacity-10 transition-opacity" />
                    <div className="w-12 h-12 bg-white rounded-2xl flex items-center justify-center shadow-lg flex-shrink-0 group-hover:scale-110 transition-transform">
                      <Info className="w-6 h-6 text-indigo-600" />
                    </div>
                    <div>
                      <p className="text-[13px] text-slate-500 font-bold leading-relaxed mb-3">
                        COMPLIANCE NOTE: Paralympic classification is a medical process conducted by the IPC. 
                        This AI analysis provides biometric alignment insights for educational purposes only.
                      </p>
                      <div className="flex items-center gap-3">
                        <div className="px-3 py-1 bg-white border border-slate-200 rounded-full text-[9px] font-black text-slate-400 uppercase tracking-widest">
                          Gemini Flash 1.5
                        </div>
                        <div className="px-3 py-1 bg-white border border-slate-200 rounded-full text-[9px] font-black text-slate-400 uppercase tracking-widest">
                          IPC Class Standards
                        </div>
                      </div>
                    </div>
                  </motion.div>
                </motion.div>
              )}
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </section>
  );
}
