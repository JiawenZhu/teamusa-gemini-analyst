"use client";
import { motion } from "framer-motion";
import { Check } from "lucide-react";

export type StepId = 1 | 2 | 3;

const STEPS: { n: StepId; label: string; icon: string; anchor: string }[] = [
  { n: 1, label: "Match",    icon: "🏅", anchor: "mirror-main"      },
  { n: 2, label: "Chat",     icon: "💬", anchor: "chat-panel"       },
  { n: 3, label: "Discover", icon: "🌍", anchor: "globe-section"    },
];

export function StepNav({ step }: { step: StepId }) {
  const handleClick = (anchor: string, n: StepId) => {
    if (n > step) {
      document.getElementById("mirror-main")?.scrollIntoView({ behavior: "smooth", block: "center" });
      return;
    }
    document.getElementById(anchor)?.scrollIntoView({ behavior: "smooth", block: "start" });
  };

  return (
    <div className="sticky top-0 z-[100] bg-white/80 backdrop-blur-2xl border-b border-slate-100 shadow-sm">
      <div className="max-w-xl mx-auto px-6 py-3 flex items-center justify-center gap-1">
        {STEPS.map((s, i) => {
          const active = step === s.n;
          const done   = step >  s.n;
          const locked = step <  s.n;

          return (
            <div key={s.n} className="flex items-center">
              <motion.button
                onClick={() => handleClick(s.anchor, s.n)}
                whileHover={!locked ? { scale: 1.05, y: -1 } : {}}
                whileTap={!locked ? { scale: 0.95 } : {}}
                className={`
                  relative flex items-center gap-2.5 px-5 py-2 rounded-full transition-all duration-300
                  ${active ? "bg-indigo-600 text-white shadow-lg shadow-indigo-200" : ""}
                  ${done ? "bg-indigo-50 text-indigo-600" : ""}
                  ${locked ? "opacity-30 cursor-not-allowed text-slate-400" : "cursor-pointer"}
                  ${!active && !done && !locked ? "text-slate-500 hover:bg-slate-50" : ""}
                `}
              >
                <div className={`
                  w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-black
                  ${active ? "bg-white text-indigo-600" : ""}
                  ${done ? "bg-indigo-600 text-white" : "border border-current"}
                `}>
                  {done ? <Check className="w-3 h-3 stroke-[4]" /> : s.n}
                </div>
                <span className="text-xs font-black tracking-tight">{s.label}</span>
                
                {active && (
                  <motion.div
                    animate={{ opacity: [0.4, 1, 0.4] }}
                    transition={{ repeat: Infinity, duration: 2 }}
                    className="w-1.5 h-1.5 rounded-full bg-white shadow-[0_0_8px_white]"
                  />
                )}
              </motion.button>

              {i < 2 && (
                <div className={`
                  w-8 h-0.5 mx-1 rounded-full transition-colors duration-500
                  ${done ? "bg-indigo-600" : "bg-slate-100"}
                `} />
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
