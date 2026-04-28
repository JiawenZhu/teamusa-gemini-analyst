"use client";
import { useState, useEffect } from "react";

const pct = (n: number) => `${Math.round(n)}%`;

export function Bar({ label, pct: p, color }: { label: string; pct: number; color: string }) {
  const [w, setW] = useState(0);
  
  useEffect(() => { 
    const timer = setTimeout(() => setW(p), 100); 
    return () => clearTimeout(timer); 
  }, [p]);
  
  return (
    <div style={{ marginBottom: 16 }}>
      <div style={{ display: "flex", justifyContent: "space-between", fontSize: 13, marginBottom: 6, fontWeight: 600 }}>
        <span style={{ color: "var(--text-main)" }}>{label}</span>
        <span style={{ color: color }}>{pct(p)}</span>
      </div>
      <div style={{ height: 8, borderRadius: 99, background: "var(--border-color)", overflow: "hidden", boxShadow: "inset 0 1px 3px rgba(0,0,0,0.05)" }}>
        <div style={{ height: "100%", borderRadius: 99, background: `linear-gradient(90deg, ${color}99, ${color})`, width: `${w}%`, transition: "width 1.2s cubic-bezier(0.2, 0.8, 0.2, 1)", boxShadow: `0 0 10px ${color}80` }} />
      </div>
    </div>
  );
}
