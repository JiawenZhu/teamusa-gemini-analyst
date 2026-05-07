"use client";
import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ChevronDown, ChevronUp, LineChart, Info, Activity, Trophy } from "lucide-react";
import type { TimelinePoint, ArchetypeProfile, MatchResult } from "@/lib/api";

const W = 800, H = 350, PAD = 50;
const minY = 140, maxY = 220, minX = 1890, maxX = 2026;
const sx = (year: number) => PAD + ((year - minX) / (maxX - minX)) * (W - PAD * 2);
const sy = (ht: number) => H - PAD - ((ht - minY) / (maxY - minY)) * (H - PAD * 2);

const archColor: Record<string, string> = {
  powerhouse: "#EF4444", aerobic_engine: "#3B82F6", explosive_athlete: "#F59E0B",
  precision_maestro: "#8B5CF6", aquatic_titan: "#06B6D4", agile_competitor: "#10B981",
};

export function TimelineChart({
  timeline,
  archetypes,
  result,
  h,
  accent,
}: {
  timeline: TimelinePoint[];
  archetypes: ArchetypeProfile[];
  result: MatchResult | null;
  h: string;
  accent: string;
}) {
  const [open, setOpen] = useState(true);
  if (timeline.length === 0) return null;

  return (
    <motion.section
      initial={{ opacity: 0, y: 50 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      transition={{ duration: 0.8, ease: [0.22, 1, 0.36, 1] as [number, number, number, number] }}
      className="max-w-7xl mx-auto px-6 py-32"
    >
      <div className="text-center mb-16">
        <motion.div 
          initial={{ opacity: 0, scale: 0.9 }}
          whileInView={{ opacity: 1, scale: 1 }}
          viewport={{ once: true }}
          className="inline-flex items-center gap-2 bg-slate-900 text-white text-[10px] font-black px-5 py-2 rounded-full uppercase tracking-[0.2em] mb-8 shadow-xl"
        >
          <Activity className="w-3.5 h-3.5" /> Act 3: Historical DNA
        </motion.div>
        <h2 className="hero-title text-5xl md:text-6xl font-bold text-slate-900 mb-8 tracking-tight">
          The <span className="text-indigo-600">DNA</span> of Success
        </h2>
        <p className="text-slate-500 max-w-3xl mx-auto text-xl font-medium leading-relaxed">
          See how your biometric profile fits into the 120-year evolution of Team USA. 
          Every dot represents an Olympian who walked the path before you.
        </p>
      </div>

      <div className="bg-white border-2 border-slate-100 rounded-[56px] overflow-hidden shadow-[0_50px_100px_-20px_rgba(0,0,0,0.08)] relative">
        {/* Background Grid Pattern */}
        <div className="absolute inset-0 opacity-[0.02] pointer-events-none">
          <svg className="w-full h-full">
            <defs>
              <pattern id="grid" width="40" height="40" patternUnits="userSpaceOnUse">
                <path d="M 40 0 L 0 0 0 40" fill="none" stroke="currentColor" strokeWidth="1"/>
              </pattern>
            </defs>
            <rect width="100%" height="100%" fill="url(#grid)" />
          </svg>
        </div>

        <button
          onClick={() => setOpen(v => !v)}
          className={`
            relative z-10 flex items-center gap-6 w-full px-10 py-8 text-left transition-all duration-500
            ${open ? "bg-slate-50/50 border-b border-slate-100" : "hover:bg-slate-50/50"}
          `}
        >
          <div className="w-14 h-14 rounded-2xl bg-slate-900 flex items-center justify-center text-white shadow-2xl transition-transform duration-500 group-hover:scale-110">
            <LineChart className="w-7 h-7" />
          </div>
          <div className="flex-1">
            <h3 className="text-2xl font-black text-slate-900 tracking-tight">Historical Height Distribution</h3>
            <p className="text-xs text-slate-500 font-bold tracking-widest mt-1 opacity-60">BIOMETRIC RECORDS FROM 1896 TO 2016 MAPPED BY ARCHETYPE</p>
          </div>
          <div className="w-10 h-10 rounded-full border-2 border-slate-100 flex items-center justify-center">
            {open ? <ChevronUp className="w-5 h-5 text-slate-900" /> : <ChevronDown className="w-5 h-5 text-slate-900" />}
          </div>
        </button>

        <AnimatePresence initial={false}>
          {open && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: "auto", opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] as [number, number, number, number] }}
              className="overflow-hidden"
            >
              <div className="p-10 md:p-20 relative">
                <div className="relative aspect-[21/9] w-full min-h-[400px]">
                  <svg viewBox={`0 0 ${W} ${H}`} className="w-full h-full overflow-visible drop-shadow-sm">
                    <defs>
                      <filter id="glow" x="-20%" y="-20%" width="140%" height="140%">
                        <feGaussianBlur stdDeviation="3" result="blur" />
                        <feComposite in="SourceGraphic" in2="blur" operator="over" />
                      </filter>
                    </defs>

                    {/* Grid lines & Y-Axis Labels */}
                    {[150, 160, 170, 180, 190, 200, 210].map((ht, idx) => (
                      <motion.g 
                        key={ht}
                        initial={{ opacity: 0, x: -30 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: idx * 0.1, duration: 0.6 }}
                      >
                        <line x1={PAD} y1={sy(ht)} x2={W - PAD} y2={sy(ht)} className="stroke-slate-200" strokeWidth="1.5" strokeDasharray="4 4" />
                        <text 
                          x={PAD - 15} 
                          y={sy(ht) + 4} 
                          textAnchor="end" 
                          className="fill-slate-900 text-[12px] font-black tracking-tight"
                        >
                          {ht}cm
                        </text>
                      </motion.g>
                    ))}
                    
                    {/* Years & X-Axis Labels */}
                    {[1900, 1920, 1940, 1960, 1980, 2000, 2016].map((yr, idx) => (
                      <motion.g 
                        key={yr}
                        initial={{ opacity: 0, y: 30 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: idx * 0.1, duration: 0.6 }}
                      >
                        <line x1={sx(yr)} y1={PAD} x2={sx(yr)} y2={H - PAD} className="stroke-slate-200" strokeWidth="1.5" />
                        <text 
                          x={sx(yr)} 
                          y={H - PAD + 30} 
                          textAnchor="middle" 
                          className="fill-slate-900 text-[12px] font-black tracking-[0.15em]"
                        >
                          {yr}
                        </text>
                      </motion.g>
                    ))}

                    {/* Timeline Points */}
                    {timeline.map((pt, i) => (
                      <motion.circle 
                        key={i}
                        initial={{ r: 0, opacity: 0 }}
                        animate={{ r: pt.has_medal ? 4.5 : 2.5, opacity: pt.has_medal ? 1 : 0.2 }}
                        transition={{ 
                          delay: (i % 300) * 0.001, 
                          duration: 0.5,
                          ease: "easeOut"
                        }}
                        cx={sx(pt.Year)} 
                        cy={sy(pt.Height)}
                        fill={archColor[pt.archetype] || "#94A3B8"}
                        className={`transition-all duration-300 ${pt.has_medal ? "hover:r-8 hover:opacity-100 cursor-help" : ""}`}
                      />
                    ))}

                    {/* User Marker - "Your Profile (2026)" */}
                    {result && (
                      <g className="relative z-50">
                        {/* Pulse Ring */}
                        <motion.circle
                          initial={{ scale: 0.8, opacity: 0 }}
                          animate={{ scale: [1, 1.5, 1], opacity: [0, 0.4, 0] }}
                          transition={{ duration: 2, repeat: Infinity, ease: "easeInOut", delay: 1.2 }}
                          cx={sx(2026)} 
                          cy={sy(parseFloat(h))} 
                          r={25}
                          fill={accent || "#6366F1"}
                          className="opacity-20"
                        />
                        
                        <motion.line
                          initial={{ pathLength: 0 }}
                          animate={{ pathLength: 1 }}
                          transition={{ duration: 1, delay: 1 }}
                          x1={sx(2026)} y1={H - PAD} x2={sx(2026)} y2={sy(parseFloat(h))}
                          className="stroke-slate-900"
                          strokeWidth="3"
                          strokeDasharray="6 6"
                        />
                        
                        <motion.circle 
                          initial={{ scale: 0, opacity: 0 }}
                          animate={{ scale: 1, opacity: 1 }}
                          transition={{ type: "spring", stiffness: 300, damping: 20, delay: 1.2 }}
                          cx={sx(2026)} 
                          cy={sy(parseFloat(h))} 
                          r={16}
                          className="fill-white stroke-slate-900"
                          strokeWidth="5"
                          filter="url(#glow)"
                        />
                        
                        <motion.circle 
                          initial={{ scale: 0 }}
                          animate={{ scale: 1 }}
                          transition={{ delay: 1.4 }}
                          cx={sx(2026)} 
                          cy={sy(parseFloat(h))} 
                          r={6}
                          fill={accent || "#6366F1"}
                        />

                        <motion.g
                          initial={{ opacity: 0, y: 15 }}
                          animate={{ opacity: 1, y: 0 }}
                          transition={{ delay: 1.5 }}
                        >
                          <rect x={sx(2026) - 45} y={sy(parseFloat(h)) - 55} width="90" height="28" rx="14" className="fill-slate-900 shadow-2xl" />
                          <text x={sx(2026)} y={sy(parseFloat(h)) - 37} textAnchor="middle" className="fill-white text-[11px] font-black uppercase tracking-[0.2em]">YOU (2026)</text>
                          {/* Arrow down */}
                          <path d={`M ${sx(2026) - 6} ${sy(parseFloat(h)) - 27} L ${sx(2026) + 6} ${sy(parseFloat(h)) - 27} L ${sx(2026)} ${sy(parseFloat(h)) - 20} Z`} className="fill-slate-900" />
                        </motion.g>
                      </g>
                    )}
                  </svg>
                </div>

                {/* Legend */}
                <motion.div 
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: 0.5 }}
                  className="mt-24 pt-12 border-t border-slate-100 flex flex-wrap gap-x-10 gap-y-6 justify-center relative z-10"
                >
                  {Object.entries(archColor).map(([id, col], idx) => {
                    const a = archetypes.find(x => x.id === id);
                    return a ? (
                      <motion.div 
                        key={id} 
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.6 + idx * 0.05 }}
                        className="flex items-center gap-3 bg-white px-5 py-3 rounded-2xl border border-slate-200 shadow-sm hover:shadow-md transition-shadow"
                      >
                        <div className="w-4 h-4 rounded-full shadow-lg" style={{ backgroundColor: col }} />
                        <span className="text-[12px] font-black text-slate-900 tracking-tight uppercase">{a.label.replace("The ", "")}</span>
                      </motion.div>
                    ) : null;
                  })}
                  <motion.div 
                    initial={{ scale: 0.9, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    transition={{ delay: 1.2 }}
                    className="flex items-center gap-4 bg-slate-900 px-6 py-3 rounded-2xl shadow-2xl ring-4 ring-slate-900/10"
                  >
                    <div className="w-4 h-4 rounded-full bg-white shadow-lg animate-pulse" />
                    <span className="text-[12px] font-black text-white tracking-widest uppercase">Your DNA Profile (2026)</span>
                  </motion.div>
                </motion.div>

                <motion.div 
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 1 }}
                  className="mt-20 flex items-start gap-8 bg-slate-50 p-10 rounded-[40px] border border-slate-100 max-w-4xl mx-auto group hover:border-indigo-100 transition-all duration-500 shadow-inner"
                >
                  <div className="w-14 h-14 bg-white rounded-2xl flex items-center justify-center shadow-xl flex-shrink-0 group-hover:scale-110 transition-transform duration-500">
                    <Trophy className="w-7 h-7 text-indigo-600" />
                  </div>
                  <div>
                    <p className="text-[12px] text-slate-500 font-black uppercase tracking-[0.2em] mb-3 opacity-60">Data Integrity & Historical Context</p>
                    <p className="text-[15px] text-slate-700 font-medium leading-relaxed">
                      This visualization maps your biometric profile against a 120-year archive of Team USA excellence. 
                      Larger dots identify medalists, marking the peak biological efficiency achieved within each cluster.
                      Every position on this matrix represents a real path taken by an American athlete.
                    </p>
                  </div>
                </motion.div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </motion.section>
  );
}
