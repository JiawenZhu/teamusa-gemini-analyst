"use client";
import { motion } from "framer-motion";

type Mode = "olympic" | "paralympic";

export function InputSection({
  h, setH, w, setW, age, setAge,
  matching, doMatch,
  mode, setMode, hideHeader, id
}: {
  h: string; setH: (v: string) => void;
  w: string; setW: (v: string) => void;
  age: string; setAge: (v: string) => void;
  matching: boolean; doMatch: () => void;
  mode: Mode; setMode: (m: Mode) => void;
  hideHeader?: boolean;
  id?: string;
}) {
  const isOlympic = mode === "olympic";
  const textColor = isOlympic ? "text-[#C9A227]" : "text-[#818CF8]";

  const hNum = Number(h);
  const wNum = Number(w);
  const aNum = Number(age);
  const isInvalidH = h !== "" && (hNum < 120 || hNum > 250);
  const isInvalidW = w !== "" && (wNum < 30 || wNum > 200);
  const isInvalidA = age !== "" && (aNum < 12 || aNum > 100);
  const hasErrors = isInvalidH || isInvalidW || isInvalidA;

  return (
    <section id={id || "mirror-input"} className="max-w-2xl mx-auto px-6 pb-20 pt-10">
      {!hideHeader && (
        <div className="text-center mb-10">
          <div className="inline-block bg-[#B22234]/10 border border-[#B22234]/20 rounded-full px-4 py-1 text-[10px] font-bold tracking-widest text-[#B22234] mb-4 uppercase">
            Your Digital Mirror
          </div>
          <h2 className="font-['Readex_Pro'] text-3xl md:text-4xl font-bold text-slate-900 mb-3 tracking-tight">
            Find Your Place in <span className={textColor}>Team USA History</span>
          </h2>
          <p className="text-slate-500 text-sm md:text-base max-w-md mx-auto leading-relaxed">
            Enter your biometric data to match against 120 years of real {isOlympic ? "Olympic" : "Paralympic"} athlete profiles.
          </p>
        </div>
      )}

      {/* ── Mode Toggle ─────────────────────────────────────────────────── */}
      <div className="flex justify-center mb-10">
        <div className="flex bg-slate-100 p-1.5 rounded-2xl gap-1.5 border border-slate-200/50 shadow-inner">
          {(["olympic", "paralympic"] as Mode[]).map((m) => {
            const active = mode === m;
            return (
              <button
                key={m}
                onClick={() => setMode(m)}
                className={`
                  px-6 py-2.5 rounded-xl text-sm font-bold transition-all duration-300
                  ${active 
                    ? `shadow-md text-white ${m === "olympic" ? "bg-gradient-to-br from-[#C9A227] to-[#B8860B]" : "bg-gradient-to-br from-[#818CF8] to-[#6366F1]"}` 
                    : "text-slate-500 hover:text-slate-700 hover:bg-slate-200/50"}
                `}
              >
                {m === "olympic" ? "🏅 Olympic" : "♿ Paralympic"}
              </button>
            );
          })}
        </div>
      </div>

      {/* Mode context banner */}
      {!isOlympic && (
        <motion.div
          initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }}
          className="mb-8 p-4 bg-blue-50 border border-blue-100 rounded-2xl text-sm text-blue-800 leading-relaxed shadow-sm flex gap-3 items-start"
        >
          <span className="text-xl">♿</span>
          <div>
            <strong className="text-blue-900 block mb-0.5">Paralympic Mode Active</strong>
            Matching your measurements against functional impairment profiles across 13 sports.
          </div>
        </motion.div>
      )}

      <div className={`
        bg-white border transition-all duration-500 rounded-[32px] p-8 md:p-12 shadow-xl shadow-slate-200/50
        ${isOlympic ? "border-slate-100" : "border-blue-100 bg-blue-50/20"}
      `}>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-10">
          {[
            { label: "Height (cm)", val: h, set: setH, placeholder: "e.g. 178", id: "input-h", error: isInvalidH, errMsg: "120-250cm" },
            { label: "Weight (kg)", val: w, set: setW, placeholder: "e.g. 75",  id: "input-w", error: isInvalidW, errMsg: "30-200kg" },
            { label: "Age (opt.)",  val: age, set: setAge, placeholder: "e.g. 28", id: "input-a", error: isInvalidA, errMsg: "12-100yrs" },
          ].map(({ label, val, set, placeholder, id, error, errMsg }) => (
            <div key={id} className="space-y-2">
              <div className="flex justify-between items-baseline px-1">
                <label htmlFor={id} className="text-[10px] font-bold tracking-wider text-slate-400 uppercase">{label}</label>
                {error && <span className="text-[10px] font-bold text-red-500 animate-pulse">{errMsg}</span>}
              </div>
              <input 
                id={id} 
                type="number" 
                value={val}
                onChange={e => set(e.target.value)}
                onKeyDown={e => {
                  if (e.key === 'Enter' && !matching && h && w && !hasErrors) {
                    doMatch();
                  }
                }}
                placeholder={placeholder}
                className={`
                  w-full bg-slate-50 border-2 rounded-2xl px-5 py-4 text-slate-900 text-lg font-medium outline-none transition-all
                  ${error ? "border-red-200 focus:border-red-400 text-red-600 bg-red-50" : "border-slate-100 focus:border-slate-300 focus:bg-white"}
                `}
              />
            </div>
          ))}
        </div>
        
        {hasErrors && (
          <div className="text-sm text-red-500 text-center mb-6 font-bold bg-red-50 py-3 rounded-xl border border-red-100">
            Please enter values within realistic ranges.
          </div>
        )}

        <button
          id="match-btn"
          onClick={doMatch}
          disabled={matching || !h || !w || hasErrors}
          className={`
            w-full py-5 rounded-2xl font-bold text-lg transition-all duration-300 transform active:scale-[0.98]
            ${matching || !h || !w || hasErrors
              ? "bg-slate-100 text-slate-400 cursor-not-allowed border border-slate-200"
              : `text-white shadow-xl hover:shadow-2xl hover:-translate-y-0.5 ${isOlympic 
                  ? "bg-gradient-to-r from-[#C9A227] to-[#B8860B] shadow-[#C9A227]/30" 
                  : "bg-gradient-to-r from-[#818CF8] to-[#6366F1] shadow-[#818CF8]/30"}`
            }
          `}
        >
          {matching
            ? <span className="flex items-center justify-center gap-3">
                <span className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                Matching patterns…
              </span>
            : isOlympic
              ? "🔍 Find My Olympic Archetype →"
              : "♿ Find My Paralympic Archetype →"}
        </button>

        {/* Archetype DNA clarifier */}
        <p className="mt-5 text-center text-[11px] text-slate-400 leading-relaxed flex items-center justify-center gap-1.5">
          <svg className="w-3.5 h-3.5 shrink-0 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M13 16h-1v-4h-1m1-4h.01M12 2a10 10 0 100 20A10 10 0 0012 2z" />
          </svg>
          <span>
            <strong className="font-semibold text-slate-500">Archetype Match</strong> is a data-driven comparison based on aggregate historical biometrics — not genetic analysis or a performance prediction.
          </span>
        </p>
      </div>
    </section>
  );
}
