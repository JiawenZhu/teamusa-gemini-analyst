"use client";
import { useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import type { ArchetypeProfile, DatasetStats } from "@/lib/api";
import { BarChart3, Users, History, Trophy, TrendingUp, Ruler, Activity, Zap } from "lucide-react";

const fmt = (n: number) => n.toLocaleString();

const containerVariants = {
  hidden: { opacity: 0, y: 40 },
  visible: { 
    opacity: 1, 
    y: 0,
    transition: { 
      duration: 0.6, 
      ease: [0.22, 1, 0.36, 1],
      staggerChildren: 0.1
    }
  },
  exit: { opacity: 0, y: 20, transition: { duration: 0.3 } }
};

const itemVariants = {
  hidden: { opacity: 0, x: -20 },
  visible: { opacity: 1, x: 0, transition: { duration: 0.4 } }
};

export function ArchetypeExplorer({
  archetypes,
  stats,
  selected,
  setSelected,
}: {
  archetypes: ArchetypeProfile[];
  stats: DatasetStats | null;
  selected: ArchetypeProfile | null;
  setSelected: (arch: ArchetypeProfile | null) => void;
}) {
  const statsRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (selected && statsRef.current) {
      setTimeout(() => {
        statsRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
      }, 150);
    }
  }, [selected]);

  return (
    <section id="archetypes-explorer" className="max-w-7xl mx-auto px-6 py-32 scroll-mt-24">
      <div className="text-center mb-20">
        <motion.div 
          initial={{ opacity: 0, scale: 0.9 }}
          whileInView={{ opacity: 1, scale: 1 }}
          viewport={{ once: true }}
          className="inline-flex items-center gap-2 bg-indigo-50 text-indigo-600 text-[10px] font-black px-5 py-2 rounded-full uppercase tracking-[0.2em] mb-8 shadow-sm border border-indigo-100"
        >
          <Activity className="w-3.5 h-3.5" /> Performance Catalog
        </motion.div>
        <h2 className="hero-title text-5xl md:text-6xl font-bold text-slate-900 mb-6 tracking-tight">
          Explore the <span className="text-indigo-600">Archetypes</span>
        </h2>
        <p className="text-slate-500 max-w-3xl mx-auto text-xl font-medium leading-relaxed">
          Our analysis identified {archetypes.length} core biometric profiles across {fmt(stats?.total_records ?? 271116)} athlete records. 
          Discover the unique physical traits that define each category.
        </p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-8 mb-20">
        {archetypes.map((arch, i) => (
          <motion.div
            key={arch.label}
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: i * 0.05, duration: 0.5 }}
            whileHover={{ y: -12, transition: { duration: 0.2 } }}
            onClick={() => setSelected(selected?.id === arch.id ? null : arch)}
            className={`
              group relative bg-white border-2 rounded-[40px] p-10 transition-all duration-500 cursor-pointer flex flex-col items-center text-center
              ${selected?.id === arch.id ? "border-slate-900 shadow-[0_40px_80px_-15px_rgba(0,0,0,0.1)] z-10" : "border-slate-50 shadow-[0_20px_40px_-10px_rgba(0,0,0,0.03)] hover:border-slate-200 hover:shadow-xl"}
            `}
          >
            {/* Background pattern */}
            <div className="absolute inset-0 opacity-[0.03] pointer-events-none overflow-hidden rounded-[40px]">
              <svg className="w-full h-full" viewBox="0 0 100 100" fill="none">
                <circle cx="50" cy="50" r="40" stroke="currentColor" strokeWidth="0.5" />
                <path d="M10 50 L90 50 M50 10 L50 90" stroke="currentColor" strokeWidth="0.5" />
              </svg>
            </div>

            <div 
              className="w-32 h-32 rounded-[32px] mb-8 flex items-center justify-center shadow-2xl transition-all duration-500 group-hover:scale-110 group-hover:rotate-3 relative overflow-hidden bg-white border border-slate-100"
            >
              <img 
                src={`/archetypes/${arch.id}.png`} 
                alt={arch.label}
                className="w-full h-full object-cover"
              />
            </div>
            
            <h3 
              className="text-2xl font-black mb-4 tracking-tight transition-colors duration-300"
              style={{ color: selected?.id === arch.id ? '#0f172a' : arch.color }}
            >
              {arch.label}
            </h3>
            
            <p className="text-slate-500 text-base leading-relaxed mb-10 font-medium">
              {arch.description}
            </p>
            
            <div className="mt-auto w-full pt-8 border-t border-slate-50 flex items-center justify-between">
              <div className="text-left">
                <div className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">Avg Height</div>
                <div className="text-lg font-black text-slate-900">{arch.avg_height}cm</div>
              </div>
              <div className="text-right">
                <div className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">Medal Rate</div>
                <div className="text-lg font-black text-slate-900">{arch.medal_rate}%</div>
              </div>
            </div>

            {/* Selected state overlay */}
            {selected?.id === arch.id && (
              <motion.div 
                layoutId="check-badge"
                className="absolute top-6 right-6 bg-slate-900 text-white w-8 h-8 rounded-full flex items-center justify-center shadow-lg"
              >
                <Zap className="w-4 h-4 fill-white" />
              </motion.div>
            )}
          </motion.div>
        ))}
      </div>

      {/* Detailed Stats Panel */}
      <div ref={statsRef} className="scroll-mt-32">
        <AnimatePresence mode="wait">
          {selected ? (
            <motion.div
              key={selected.id}
              variants={containerVariants}
              initial="hidden"
              animate="visible"
              exit="exit"
              className="relative overflow-hidden bg-white border-2 border-slate-100 rounded-[56px] p-10 md:p-16 shadow-[0_50px_100px_-20px_rgba(0,0,0,0.08)]"
            >
              {/* Decorative side accent */}
              <div className="absolute top-0 left-0 w-2 h-full" style={{ backgroundColor: selected.color }} />

              <div className="grid grid-cols-1 lg:grid-cols-12 gap-16 relative z-10">
                
                {/* Left Column: Biometrics */}
                <div className="lg:col-span-4 space-y-12">
                  <div>
                    <motion.h4 variants={itemVariants} className="text-xs font-black text-slate-400 uppercase tracking-[0.3em] mb-10 flex items-center gap-3">
                      <div className="w-8 h-8 rounded-xl bg-slate-50 flex items-center justify-center">
                        <Ruler className="w-4 h-4 text-slate-400" />
                      </div>
                      Biometric DNA Profile
                    </motion.h4>
                    
                    <div className="space-y-10">
                      {[
                        { label: "Avg Height", value: selected.avg_height, unit: "cm", max: 220 },
                        { label: "Avg Weight", value: selected.avg_weight, unit: "kg", max: 140 },
                        { label: "Avg BMI", value: selected.avg_bmi?.toFixed(1), unit: "", max: 40 },
                      ].map((metric) => (
                        <motion.div key={metric.label} variants={itemVariants}>
                          <div className="flex justify-between items-end mb-4">
                            <span className="text-sm font-black text-slate-500 uppercase tracking-wider">{metric.label}</span>
                            <span className="text-3xl font-black text-slate-900 leading-none">{metric.value}<span className="text-sm font-bold text-slate-300 ml-1">{metric.unit}</span></span>
                          </div>
                          <div className="h-3 bg-slate-50 rounded-full overflow-hidden p-0.5 border border-slate-100">
                            <motion.div 
                              initial={{ width: 0 }}
                              animate={{ width: `${(Number(metric.value) / metric.max) * 100}%` }}
                              transition={{ duration: 1, ease: "circOut", delay: 0.2 }}
                              className="h-full rounded-full shadow-[0_0_20px_rgba(0,0,0,0.05)]"
                              style={{ 
                                background: `linear-gradient(90deg, ${selected.color}dd, ${selected.color})`
                              }}
                            />
                          </div>
                        </motion.div>
                      ))}
                    </div>
                  </div>

                  <motion.div variants={itemVariants} className="grid grid-cols-2 gap-6">
                    <div className="bg-slate-50/50 rounded-[32px] p-6 border border-slate-100 transition-all hover:bg-white hover:shadow-xl hover:scale-105 duration-300 group">
                      <Users className="w-6 h-6 text-slate-300 mb-4 transition-colors group-hover:text-indigo-500" />
                      <div className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Total Athletes</div>
                      <div className="text-2xl font-black text-slate-900">{fmt(selected.athlete_count ?? 0)}</div>
                    </div>
                    <div className="bg-slate-50/50 rounded-[32px] p-6 border border-slate-100 transition-all hover:bg-white hover:shadow-xl hover:scale-105 duration-300 group">
                      <History className="w-6 h-6 text-slate-300 mb-4 transition-colors group-hover:text-indigo-500" />
                      <div className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">USA History</div>
                      <div className="text-2xl font-black text-slate-900">{selected.year_min}</div>
                    </div>
                  </motion.div>
                </div>

                {/* Middle Column: Dominant Sports */}
                <div className="lg:col-span-5">
                  <motion.h4 variants={itemVariants} className="text-xs font-black text-slate-400 uppercase tracking-[0.3em] mb-10 flex items-center gap-3">
                    <div className="w-8 h-8 rounded-xl bg-slate-50 flex items-center justify-center">
                      <Trophy className="w-4 h-4 text-slate-400" />
                    </div>
                    Historical Dominance
                  </motion.h4>
                  <div className="space-y-4">
                    {selected.top_sports?.slice(0, 5).map((s, idx) => (
                      <motion.div 
                        key={s.Sport} 
                        variants={itemVariants}
                        whileHover={{ x: 10, scale: 1.02 }}
                        className="bg-white border border-slate-100 rounded-[28px] p-5 flex items-center justify-between group hover:border-slate-300 hover:shadow-lg transition-all duration-300 cursor-default"
                      >
                        <div className="flex items-center gap-5">
                          <div className="w-10 h-10 rounded-2xl bg-slate-50 flex items-center justify-center text-xs font-black text-slate-400 group-hover:bg-slate-900 group-hover:text-white transition-all duration-500">
                            #{idx + 1}
                          </div>
                          <span className="text-lg font-black text-slate-900 tracking-tight">{s.Sport}</span>
                        </div>
                        <div className="flex items-center gap-8 text-right">
                          <div className="transition-transform group-hover:scale-110">
                            <div className="text-[9px] font-black text-slate-400 uppercase tracking-tighter mb-0.5">Pool</div>
                            <div className="text-sm font-black text-slate-900">{fmt(s.count)}</div>
                          </div>
                          <div className="transition-transform group-hover:scale-110">
                            <div className="text-[9px] font-black text-slate-400 uppercase tracking-tighter mb-0.5">Medals</div>
                            <div className="text-sm font-black text-indigo-600 bg-indigo-50 px-2.5 py-0.5 rounded-full">{s.medals}</div>
                          </div>
                        </div>
                      </motion.div>
                    ))}
                  </div>
                </div>

                {/* Right Column: Key Takeaway */}
                <div className="lg:col-span-3">
                  <motion.div 
                    variants={itemVariants}
                    className="h-full bg-slate-900 rounded-[48px] p-10 text-white relative overflow-hidden flex flex-col shadow-2xl"
                  >
                    {/* Glowing background gradient */}
                    <div 
                      className="absolute top-[-20%] right-[-20%] w-64 h-64 blur-[100px] opacity-40 rounded-full animate-pulse"
                      style={{ backgroundColor: selected.color }}
                    />
                    
                    <div className="relative z-10">
                      <div className="w-12 h-12 rounded-2xl bg-white/10 backdrop-blur-md flex items-center justify-center mb-8">
                        <TrendingUp className="w-6 h-6 text-white" />
                      </div>
                      <h5 className="text-2xl font-black mb-6 tracking-tight leading-tight">
                        The <span style={{ color: selected.color }}>{selected.label.replace("The ", "")}</span> <br/>Advantage.
                      </h5>
                      <div className="space-y-6">
                        <p className="text-slate-300 text-base font-medium leading-relaxed italic opacity-90">
                          "Historical data shows {selected.label} athletes possess the specific {selected.avg_bmi! > 26 ? 'mass-to-power' : 'leverage'} ratio 
                          required for high-performance {selected.top_sports?.[0].Sport}."
                        </p>
                        <div className="pt-6 border-t border-white/10">
                          <div className="text-[10px] font-black text-white/40 uppercase tracking-[0.2em] mb-3">Statistical Share</div>
                          <div className="text-4xl font-black text-white tracking-tighter">
                            {((selected.athlete_count! / (stats?.total_records ?? 1)) * 100).toFixed(1)}%
                          </div>
                          <div className="text-[10px] font-bold text-white/30 mt-1">Total Team USA Records</div>
                        </div>
                      </div>
                    </div>
                  </motion.div>
                </div>

              </div>
            </motion.div>
          ) : (
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              className="mt-20 bg-indigo-50/30 border-2 border-indigo-50 border-dashed rounded-[48px] p-12 md:p-16 text-center max-w-4xl mx-auto"
            >
              <div className="w-16 h-16 bg-white rounded-2xl flex items-center justify-center mx-auto mb-8 shadow-xl">
                <BarChart3 className="w-8 h-8 text-indigo-500" />
              </div>
              <p className="text-slate-600 text-xl md:text-2xl font-semibold italic leading-relaxed mb-6">
                "The beauty of the Olympic movement is physical diversity. Every body type has its theater of excellence."
              </p>
              <div className="flex items-center justify-center gap-4">
                <div className="h-[1px] w-12 bg-slate-200" />
                <p className="text-indigo-400 text-xs font-black uppercase tracking-[0.3em]">
                  Select an archetype to analyze its DNA
                </p>
                <div className="h-[1px] w-12 bg-slate-200" />
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </section>
  );
}
