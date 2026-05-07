"use client";
import { motion, AnimatePresence } from "framer-motion";
import { Check, Share2, Download, Trophy, Target, Award, Star, Zap, History, Info } from "lucide-react";
import type { ArchetypeProfile, MatchResult } from "@/lib/api";
import { Bar } from "./Bar";

const containerVariants = {
  hidden: { opacity: 0 },
  visible: { 
    opacity: 1,
    transition: { staggerChildren: 0.1 }
  }
};

const itemVariants = {
  hidden: { opacity: 0, y: 20 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.5, ease: "easeOut" } }
};

export function MatchResultPanel({
  result,
  glitchArch,
  resultRef,
  shareDna,
  copied,
}: {
  result: MatchResult | null;
  glitchArch: ArchetypeProfile | null;
  resultRef: React.RefObject<HTMLDivElement | null>;
  shareDna: () => void;
  copied: boolean;
}) {
  const displayArch = glitchArch || result?.archetype;
  if (!displayArch) return null;

  return (
    <section ref={resultRef} className="max-w-6xl mx-auto px-6 pb-32">
      {/* Archetype reveal card */}
      <motion.div 
        initial={{ opacity: 0, scale: 0.95, y: 50 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        transition={{ type: "spring", damping: 25, stiffness: 80 }}
        className="relative overflow-hidden rounded-[56px] p-12 md:p-20 text-center mb-16 shadow-[0_50px_100px_-20px_rgba(0,0,0,0.2)] transition-all duration-500"
        style={{
          background: `linear-gradient(165deg, ${displayArch.color}, ${displayArch.color}DD, #0F172A)`,
          boxShadow: `0 40px 80px -15px ${displayArch.color}60`
        }}
      >
        {/* Decorative background effects */}
        <div className="absolute inset-0 pointer-events-none opacity-40 bg-[radial-gradient(circle_at_50%_-20%,rgba(255,255,255,0.5),transparent_70%)]" />
        <div className="absolute -top-[50%] -left-[50%] w-[200%] h-[200%] pointer-events-none opacity-20 bg-[radial-gradient(circle,rgba(255,255,255,0.3)_0%,transparent_60%)] animate-pulse" />

        <motion.div 
          initial={{ scale: 0.5, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ type: "spring", delay: 0.2 }}
          className={`
            w-48 h-48 md:w-64 md:h-64 mx-auto mb-10 relative z-10 transition-all duration-300 rounded-[48px] overflow-hidden border-4 border-white/20 shadow-2xl bg-white
            ${glitchArch ? "blur-[8px] animate-pulse" : "drop-shadow-[0_20px_50px_rgba(0,0,0,0.3)]"}
          `}
        >
          <img 
            src={`/archetypes/${displayArch.id}.png`} 
            alt={displayArch.label}
            className="w-full h-full object-cover"
          />
        </motion.div>
        
        <motion.h2 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="hero-title text-5xl md:text-7xl font-bold text-white mb-6 relative z-10 tracking-tight leading-none"
        >
          {displayArch.label}
        </motion.h2>
        
        <motion.p 
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.4 }}
          className="text-white/80 max-w-2xl mx-auto text-lg md:text-xl leading-relaxed mb-12 relative z-10 font-medium italic"
        >
          {glitchArch ? "Searching historical data patterns..." : displayArch.description}
        </motion.p>
        
        <motion.div 
          variants={containerVariants}
          initial="hidden"
          animate="visible"
          className={`
            grid grid-cols-2 md:grid-cols-4 gap-4 md:gap-6 max-w-4xl mx-auto relative z-10 transition-opacity duration-500
            ${glitchArch ? "opacity-30" : "opacity-100"}
          `}
        >
          {[
            { label: "Your BMI", val: result?.user_bmi.toFixed(1) || "--", icon: Target },
            { label: "Avg Height", val: `${displayArch.avg_height} cm`, icon: Zap },
            { label: "Avg Weight", val: `${displayArch.avg_weight} kg`, icon: Award },
            { label: "Medal Rate", val: `${displayArch.medal_rate}%`, icon: Trophy },
          ].map(({ label, val, icon: Icon }) => (
            <motion.div 
              key={label} 
              variants={itemVariants}
              whileHover={{ y: -5, backgroundColor: "rgba(255,255,255,0.15)" }}
              className="bg-white/10 backdrop-blur-2xl border border-white/20 rounded-[32px] p-6 md:p-8 shadow-inner flex flex-col items-center"
            >
              <Icon className="w-5 h-5 text-white/40 mb-4" />
              <div className="text-2xl md:text-3xl font-black text-white mb-1">{val}</div>
              <div className="text-[10px] md:text-xs text-white/50 font-black tracking-[0.2em] uppercase">{label}</div>
            </motion.div>
          ))}
        </motion.div>

        {/* Share / Download Actions */}
        {result && !glitchArch && (
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.8 }}
            className="flex flex-wrap gap-6 justify-center mt-16 relative z-10"
          >
            <button 
              onClick={shareDna} 
              className="group bg-white text-slate-900 px-10 py-5 rounded-[24px] font-black text-sm flex items-center gap-4 shadow-[0_20px_40px_rgba(0,0,0,0.2)] hover:shadow-[0_30px_60px_rgba(0,0,0,0.3)] hover:-translate-y-1 transition-all active:scale-95"
            >
              {copied ? <Check className="w-6 h-6 text-green-500" /> : <Share2 className="w-6 h-6 group-hover:rotate-12 transition-transform" />}
              {copied ? "LINK COPIED!" : "SHARE DNA PROFILE"}
            </button>

            <a 
              href={`/api/og?id=${result.archetype.id}&arch=${result.archetype.label}&color=${result.archetype.color.replace('#','%23')}&bmi=${result.user_bmi.toFixed(1)}&sports=${result.archetype.olympic_sports.slice(0, 3).join(", ")}&matches=847`}
              download={`TeamUSA-Archetype-${result.archetype.label.replace(/\s+/g, '-')}.png`}
              className="bg-white/10 backdrop-blur-xl border border-white/20 text-white px-10 py-5 rounded-[24px] font-black text-sm flex items-center gap-4 hover:bg-white/20 transition-all shadow-xl active:scale-95"
            >
              <Download className="w-6 h-6" /> SAVE AS IMAGE
            </a>
          </motion.div>
        )}

        {result?.percentile_note && (
          <motion.p 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 1 }}
            className="mt-12 text-xs md:text-sm text-white/40 font-bold tracking-widest relative z-10"
          >
            <span className="bg-white/5 px-4 py-2 rounded-full border border-white/10 uppercase">
              {result.percentile_note}
            </span>
          </motion.p>
        )}
      </motion.div>

      {/* Alignment Grids */}
      {result && (
        <motion.div 
          variants={containerVariants}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true }}
          className="grid grid-cols-1 lg:grid-cols-2 gap-10 mb-16"
        >
          <motion.div variants={itemVariants} className="bg-white border-2 border-slate-50 rounded-[48px] p-10 md:p-12 shadow-[0_30px_60px_-12px_rgba(0,0,0,0.05)]">
            <h3 className="text-2xl font-black text-slate-900 mb-10 flex items-center gap-4 tracking-tight">
              <div className="w-10 h-10 rounded-2xl bg-amber-50 flex items-center justify-center">
                <Star className="w-5 h-5 text-amber-500 fill-amber-500" />
              </div>
              Olympic Alignment
            </h3>
            <div className="space-y-8">
              {displayArch.olympic_sports?.slice(0, 5).map((s, i) => (
                <Bar key={s} label={s} pct={95 - i * 8} color={displayArch.color || "#C9A227"} />
              ))}
            </div>
          </motion.div>

          <motion.div variants={itemVariants} className="bg-white border-2 border-indigo-50 rounded-[48px] p-10 md:p-12 shadow-[0_30px_60px_-12px_rgba(79,70,229,0.08)]">
            <h3 className="text-2xl font-black text-slate-900 mb-10 flex items-center gap-4 tracking-tight">
              <div className="w-10 h-10 rounded-2xl bg-indigo-50 flex items-center justify-center">
                <Target className="w-5 h-5 text-indigo-600" />
              </div>
              Paralympic Parity
            </h3>
            <div className="space-y-8">
              {displayArch.paralympic_sports?.map((s, i) => (
                <Bar key={s} label={s} pct={90 - i * 10} color="#6366F1" />
              ))}
            </div>
            <div className="mt-12 flex items-start gap-4 bg-slate-50 p-6 rounded-3xl border border-slate-100">
              <Info className="w-5 h-5 text-indigo-600 flex-shrink-0 mt-0.5" />
              <p className="text-[11px] text-slate-500 font-bold leading-relaxed">
                Biometric archetype patterns guide these suggestions. Actual Paralympic classification depends on medical assessment.
              </p>
            </div>
          </motion.div>
        </motion.div>
      )}

      {/* Closest Historical Records */}
      {result && result.closest_athletes.length > 0 && (
        <motion.div 
          variants={containerVariants}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true }}
          className="bg-slate-50/50 border border-slate-100 rounded-[56px] p-10 md:p-16 shadow-inner"
        >
          <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 mb-12">
            <div>
              <div className="inline-flex items-center gap-2 bg-white px-3 py-1 rounded-full border border-slate-200 text-[10px] font-black text-slate-400 uppercase tracking-widest mb-4">
                <History className="w-3 h-3" /> Historical Archive
              </div>
              <h3 className="text-3xl font-black text-slate-900 tracking-tight flex items-center gap-4">
                Closest Historical Records
              </h3>
              <p className="text-slate-500 text-lg font-medium mt-2">Matching your profile within 120 years of data.</p>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8">
            {result.closest_athletes.slice(0, 6).map((a, i) => {
              const medalColors = { Gold: "border-amber-400 bg-amber-50/30 shadow-[0_20px_40px_rgba(251,191,36,0.1)]", Silver: "border-slate-300 bg-slate-50/50", Bronze: "border-orange-400 bg-orange-50/30" };
              const medalText = { Gold: "text-amber-600", Silver: "text-slate-500", Bronze: "text-orange-600" };
              const isMedalist = !!a.Medal;
              const mc = isMedalist ? medalColors[a.Medal as keyof typeof medalColors] : "border-white bg-white hover:border-slate-200";
              const mt = isMedalist ? medalText[a.Medal as keyof typeof medalText] : "text-slate-400";
              
              return (
                <motion.div 
                  key={i}
                  variants={itemVariants}
                  whileHover={{ y: -8, scale: 1.02 }} 
                  className={`relative overflow-hidden rounded-[32px] p-8 border-2 transition-all duration-300 shadow-sm ${mc}`}
                >
                  {isMedalist && (
                    <div className={`absolute top-0 right-0 px-4 py-1.5 text-[10px] font-black uppercase tracking-widest text-white ${a.Medal === 'Gold' ? 'bg-amber-400' : a.Medal === 'Silver' ? 'bg-slate-400' : 'bg-orange-500'}`}>
                      {a.Medal}
                    </div>
                  )}
                  <div className="text-2xl font-black text-slate-900 mb-2 truncate tracking-tight">{a.Sport}</div>
                  <div className="text-sm font-bold text-slate-400 mb-6 uppercase tracking-widest">{a.Year} · {a.Height}cm / {a.Weight}kg</div>
                  
                  {isMedalist && (
                    <div className={`inline-flex items-center gap-3 font-black text-[11px] px-4 py-2 rounded-2xl border ${mt} ${a.Medal === 'Gold' ? 'border-amber-200 bg-white' : a.Medal === 'Silver' ? 'border-slate-200 bg-white' : 'border-orange-200 bg-white'}`}>
                      <Award className="w-4 h-4" />
                      {a.Medal.toUpperCase()} MEDALIST
                    </div>
                  )}
                  {!isMedalist && (
                    <div className="inline-flex items-center gap-3 font-black text-[11px] text-slate-400 px-4 py-2 rounded-2xl border border-slate-100 bg-slate-50">
                      TOP FINISHER
                    </div>
                  )}
                </motion.div>
              )
            })}
          </div>
        </motion.div>
      )}
    </section>
  );
}
