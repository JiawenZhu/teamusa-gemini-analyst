"use client";
import type { DatasetStats } from "@/lib/api";
import { AnimCount } from "./AnimCount";

export function HeroV2({ stats }: { stats: DatasetStats | null }) {
  // Use a fallback for the stats if they haven't loaded yet
  const athletes = stats ? "271k" : "271k";
  const years = stats ? stats.year_max - stats.year_min : 120;
  const sports = stats ? stats.sports_count : 33;

  return (
    <section className="relative h-screen w-full overflow-hidden bg-black font-sans">
      
      {/* Background Image + CSS Ken Burns Animation */}
      <div 
        className="absolute inset-0 w-full h-full"
        style={{ WebkitMaskImage: 'linear-gradient(to right, transparent 0%, black 20%, black 80%, transparent 100%)', maskImage: 'linear-gradient(to right, transparent 0%, black 20%, black 80%, transparent 100%)' }}
      >
        <img 
          src="/hero-bg.png" 
          alt="Team USA Athlete" 
          className="absolute inset-0 w-full h-full object-cover animate-ken-burns scale-[1.1] opacity-90 object-center"
        />
      </div>
      {/* Dark overlay for text readability */}
      <div className="absolute inset-0 bg-black/40" />

      {/* Navbar (Floating Pill Design) */}
      <nav className="absolute z-20 px-6 md:px-10 top-24 left-0 right-0 flex items-center justify-between gap-4">
        {/* Left Pill */}
        <div className="flex items-center gap-2 bg-neutral-900/90 backdrop-blur-md rounded-full pl-4 pr-6 py-3 border border-white/10 shadow-lg">
          <span className="text-[18px]">🏅</span>
          <span className="text-white text-sm font-semibold tracking-wide">teamusa</span>
        </div>

        {/* Center Pill Removed because StepNav handles top navigation */}

        {/* Right Button */}
        <button 
          onClick={() => document.getElementById("mirror-main")?.scrollIntoView({ behavior: "smooth", block: "center" })}
          className="bg-white text-black text-sm font-semibold rounded-full px-6 py-3 hover:bg-neutral-200 transition-colors shadow-[0_0_20px_rgba(201,162,39,0.3)] border border-[#C9A227]/30"
        >
          find your archetype DNA →
        </button>
      </nav>

      {/* Foreground Content */}
      <div className="relative h-full w-full pointer-events-none select-none">

        {/* Olympic + Paralympic Badge */}
        <div className="absolute left-6 md:left-12 top-[22%] inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-white/10 border border-white/20 backdrop-blur-md shadow-lg text-[11px] md:text-xs font-semibold tracking-wide text-white">
          <span className="w-1.5 h-1.5 rounded-full bg-[#C9A227] animate-pulse" />
          OLYMPIC + PARALYMPIC ARCHETYPE ANALYSIS
        </div>

        {/* Staggered Giant Typography */}
        <h1 className="hero-title absolute text-white font-medium text-[14vw] md:text-[12vw] left-6 md:left-12 top-[28%] text-[#F8FAFC]">
          find
        </h1>
        <h1 className="hero-title absolute text-white font-medium text-[14vw] md:text-[12vw] right-6 md:right-[15%] top-[45%] text-[#C9A227] drop-shadow-lg">
          your
        </h1>
        <h1 className="hero-title absolute text-white font-medium text-[8vw] md:text-[7vw] left-6 md:left-[20%] top-[68%] text-[#F8FAFC]">
          archetype DNA
        </h1>

        {/* Description Paragraph */}
        <p className="absolute left-6 md:left-12 top-[58%] max-w-[220px] text-[14px] leading-relaxed text-white/80 font-medium">
          120 years of Olympic history reflected through your body profile.
        </p>

        {/* Stat Block: Top Right */}
        <div className="absolute right-6 md:right-16 top-[28%] flex flex-col items-end">
          <div className="flex items-center gap-3 justify-end">
            <div className="hidden md:block h-px w-16 bg-white/40 rotate-[20deg]" />
            <span className="text-4xl md:text-5xl font-medium tracking-tight text-white">
              +{athletes}
            </span>
          </div>
          <span className="text-xs md:text-sm text-white/70 mt-1 text-right font-medium tracking-wide">
            public Olympic records
          </span>
          <span className="text-[10px] md:text-xs text-[#C9A227] mt-0.5 text-right font-semibold tracking-wide uppercase">
            + USA-filtered analysis
          </span>
        </div>

        {/* Stat Block: Bottom Left */}
        <div className="absolute left-6 md:left-12 bottom-20 md:bottom-24">
          <div className="flex items-center gap-3">
            <span className="text-4xl md:text-5xl font-medium tracking-tight text-white">
              +{years}
            </span>
            <div className="hidden md:block h-px w-16 bg-white/40 rotate-[-20deg]" />
          </div>
          <span className="text-xs md:text-sm text-white/70 mt-1 font-medium tracking-wide">
            years of history
          </span>
        </div>

        {/* Stat Block: Bottom Right */}
        <div className="absolute right-6 md:right-16 bottom-16 md:bottom-20 flex flex-col items-end">
          <div className="flex items-center gap-3 justify-end">
            <div className="hidden md:block h-px w-16 bg-white/40 rotate-[-20deg]" />
            <span className="text-4xl md:text-5xl font-medium tracking-tight text-white">
              +{sports}
            </span>
          </div>
          <span className="text-xs md:text-sm text-white/70 mt-1 right-aligned font-medium tracking-wide">
            sports
          </span>
        </div>

      </div>

      {/* Bottom Gradient Fade */}
      <div className="pointer-events-none absolute bottom-0 left-0 right-0 h-48 bg-gradient-to-b from-transparent to-[#050D1F]" />
      
    </section>
  );
}
