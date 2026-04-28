"use client";
import { useState, useEffect } from "react";

const fmt = (n: number) => n.toLocaleString();

export function AnimCount({ target, duration = 1800 }: { target: number; duration?: number }) {
  const [v, setV] = useState(0);
  
  useEffect(() => {
    let start: number, raf: number;
    const tick = (ts: number) => {
      if (!start) start = ts;
      const p = Math.min((ts - start) / duration, 1);
      setV(Math.floor(p * target));
      if (p < 1) raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [target, duration]);
  
  return <>{fmt(v)}</>;
}
