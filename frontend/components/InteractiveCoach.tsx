"use client";

import React, { useEffect, useRef, useState, Suspense, useMemo } from "react";
import { Canvas, useFrame } from "@react-three/fiber";
import { OrbitControls, useGLTF, Environment } from "@react-three/drei";
import * as THREE from "three";
import { motion, AnimatePresence } from "framer-motion";
import { Mic, MicOff, Volume2, X, Zap, ChevronRight } from "lucide-react";
import type { MatchResult } from "@/lib/api";

// ─── Holographic scan shader ────────────────────────────────────────────────
const holoVert = `
  varying vec3 vNormal;
  varying vec3 vPosition;
  varying vec2 vUv;
  void main() {
    vNormal = normalize(normalMatrix * normal);
    vPosition = (modelViewMatrix * vec4(position, 1.0)).xyz;
    vUv = uv;
    gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
  }
`;

const holoFrag = `
  uniform float time;
  uniform vec3 baseColor;
  varying vec3 vNormal;
  varying vec3 vPosition;
  varying vec2 vUv;

  void main() {
    vec3 viewDir = normalize(-vPosition);
    float fresnel = pow(1.0 - max(dot(vNormal, viewDir), 0.0), 2.2);

    // Horizontal scan lines
    float scan = step(0.5, fract(vUv.y * 80.0 + time * 0.4));
    float scanLine = scan * 0.07;

    // Moving scan sweep
    float sweep = smoothstep(0.0, 0.06, fract(vUv.y - time * 0.18)) * 
                  smoothstep(0.12, 0.06, fract(vUv.y - time * 0.18));

    vec3 col = baseColor * (fresnel * 1.6 + 0.08 + scanLine + sweep * 0.5);

    // Pulse
    float pulse = 0.5 + 0.5 * sin(time * 2.0);
    col += baseColor * fresnel * pulse * 0.25;

    float alpha = clamp(fresnel * 1.8 + 0.05 + scanLine * 0.5 + sweep * 0.4, 0.0, 1.0);
    gl_FragColor = vec4(col, alpha);
  }
`;

// ─── Holographic body figure ──────────────────────────────────────────────────
function HoloFigure({ heightFactor, widthFactor, speaking }: {
  heightFactor: number; widthFactor: number; speaking: boolean;
}) {
  const { scene } = useGLTF("/models/gltf/Xbot.glb");
  const cloned = useMemo(() => scene.clone(true), [scene]);
  const groupRef = useRef<THREE.Group>(null!);

  const mat = useMemo(() => new THREE.ShaderMaterial({
    vertexShader: holoVert,
    fragmentShader: holoFrag,
    uniforms: {
      time: { value: 0 },
      baseColor: { value: new THREE.Color("#60a5fa") },
    },
    transparent: true,
    side: THREE.DoubleSide,
    depthWrite: false,
    blending: THREE.AdditiveBlending,
  }), []);

  useEffect(() => {
    cloned.traverse((c) => {
      if ((c as THREE.Mesh).isMesh) (c as THREE.Mesh).material = mat;
    });
  }, [cloned, mat]);

  useFrame(({ clock }) => {
    if (!groupRef.current) return;
    groupRef.current.rotation.y += 0.003;
    mat.uniforms.time.value = clock.elapsedTime;

    // Speaking pulse: scale body slightly when AI speaks
    const scale = speaking ? 1.02 + Math.sin(clock.elapsedTime * 8) * 0.01 : 1.0;
    groupRef.current.scale.setScalar(scale * 1.8);

    // Bone scaling
    const bones: Record<string, THREE.Bone> = {};
    cloned.traverse((c) => { if ((c as THREE.Bone).isBone) bones[c.name] = c as THREE.Bone; });
    if (bones["mixamorig_Hips"]) {
      bones["mixamorig_Hips"].scale.y = 0.85 + heightFactor * 0.3;
      bones["mixamorig_Hips"].scale.x = 0.8 + widthFactor * 0.4;
      bones["mixamorig_Hips"].scale.z = 0.8 + widthFactor * 0.4;
    }
  });

  return (
    <group ref={groupRef} position={[0, -2.1, 0]}>
      <primitive object={cloned} />
    </group>
  );
}

// ─── Scan ring ────────────────────────────────────────────────────────────────
function ScanRing({ y, radius, speed, opacity }: { y: number; radius: number; speed: number; opacity: number }) {
  const ref = useRef<THREE.Mesh>(null!);
  useFrame(({ clock }) => {
    if (!ref.current) return;
    const s = 1 + Math.sin(clock.elapsedTime * speed) * 0.04;
    ref.current.scale.set(s, s, s);
    (ref.current.material as THREE.MeshBasicMaterial).opacity =
      opacity * (0.5 + 0.5 * Math.sin(clock.elapsedTime * speed * 0.7));
  });
  return (
    <mesh ref={ref} position={[0, y, 0]} rotation={[Math.PI / 2, 0, 0]}>
      <torusGeometry args={[radius, 0.012, 6, 80]} />
      <meshBasicMaterial color="#60a5fa" transparent opacity={opacity} depthWrite={false} blending={THREE.AdditiveBlending} />
    </mesh>
  );
}

// ─── Scene ───────────────────────────────────────────────────────────────────
function CoachScene({ heightFactor, widthFactor, speaking }: {
  heightFactor: number; widthFactor: number; speaking: boolean;
}) {
  return (
    <Suspense fallback={null}>
      <ambientLight intensity={0.05} />
      <pointLight position={[0, 4, -3]} intensity={2.5} color="#60a5fa" />
      <pointLight position={[3, 2, 3]} intensity={1.2} color="#818cf8" />
      <HoloFigure heightFactor={heightFactor} widthFactor={widthFactor} speaking={speaking} />
      <ScanRing y={0.5} radius={1.4} speed={1.1} opacity={0.35} />
      <ScanRing y={-0.5} radius={1.7} speed={0.8} opacity={0.2} />
      <ScanRing y={1.5} radius={1.1} speed={1.4} opacity={0.15} />
      <OrbitControls enableZoom={false} enablePan={false} autoRotate={false} enableRotate />
    </Suspense>
  );
}

// ─── Suggested questions by coach mode ───────────────────────────────────────
const COACH_QUESTIONS = [
  { icon: "🏋️", text: "What are the best sports for my body archetype?" },
  { icon: "💪", text: "What training focus suits my height-to-weight ratio?" },
  { icon: "📈", text: "At what age do athletes in my archetype peak?" },
  { icon: "🥇", text: "Which Team USA sports give my BMI the best medal odds?" },
  { icon: "🧬", text: "How does my body type compare to Olympic medalists?" },
  { icon: "🏃", text: "What biomechanical advantages does my archetype have?" },
];

// ─── Main exported component ──────────────────────────────────────────────────
interface InteractiveCoachProps {
  result: MatchResult;
  userHeight: number;
  userWeight: number;
  onClose: () => void;
  voiceAssistant: {
    micState: string;
    isSpeaking: boolean;
    permissionError?: string | null;
    toggleLive: (prompt?: string) => void;
  };
}

export default function InteractiveCoach({
  result,
  userHeight,
  userWeight,
  onClose,
  voiceAssistant,
}: InteractiveCoachProps) {
  const { micState, isSpeaking, permissionError, toggleLive } = voiceAssistant;
  const color = result.archetype.color ?? "#60a5fa";
  const heightFactor = Math.max(0, Math.min(1, (userHeight - 155) / 55));
  const widthFactor = Math.max(0, Math.min(1, (userWeight - 45) / 85));
  const voiceActive = micState !== "idle";

  const [messages, setMessages] = useState<{ role: "agent" | "user"; text: string; sealed?: boolean }[]>([]);
  const [interim, setInterim] = useState("");
  const chatRef = useRef<HTMLDivElement>(null);

  // Build a rich coach system prompt with biometric mirror knowledge
  const coachPrompt = [
    "You are an elite interactive body coach for Team USA. You have deep knowledge of Olympic sports biometrics.",
    `The user's archetype is: ${result.archetype.label} (${result.archetype.icon}).`,
    `Their profile: ${userHeight}cm tall, ${userWeight}kg, BMI ${result.user_bmi}.`,
    `Height percentile: Top ${Math.round((1 - (result.height_percentile ?? 0.5)) * 100)}% among Team USA athletes.`,
    `Their best sport matches: ${result.archetype.olympic_sports?.slice(0, 3).join(", ") ?? "swimming, athletics, gymnastics"}.`,
    `Archetype description: ${result.archetype.description ?? ""}`,
    "Give motivating, data-driven coaching advice. Reference Olympic history, biomechanics, and sport-specific body requirements.",
    "Keep responses concise and energetic. Use the user's actual numbers to personalize every answer.",
    "Do NOT identify real athletes by name. Do NOT make medical diagnoses.",
  ].join(" ");

  useEffect(() => {
    const onText = (e: Event) => {
      const detail = (e as CustomEvent).detail;
      if (detail?.clear) {
        setMessages([]);
        setInterim("");
        return;
      }
      const { role, text } = (e as CustomEvent<{ role: "agent" | "user"; text: string }>).detail;
      if (!text?.trim()) return;
      
      setMessages(prev => {
        if (role === "user") return [...prev, { role, text, sealed: true }];
        // Normalize role for local state comparison
        const last = prev[prev.length - 1];
        if (last && (last.role === "agent") && !last.sealed)
          return [...prev.slice(0, -1), { role: "agent", text: last.text + text }];
        return [...prev, { role: "agent", text }];
      });
    };
    const onComplete = () => {
      setMessages(prev => {
        const last = prev[prev.length - 1];
        if (!last || last.role !== "agent" || last.sealed) return prev;
        return [...prev.slice(0, -1), { ...last, sealed: true }];
      });
    };
    const onInterim = (e: Event) => {
      const d = (e as CustomEvent<{ text: string; clear?: boolean }>).detail;
      setInterim(d.clear ? "" : prev => prev + d.text);
    };
    window.addEventListener("live_text", onText);
    window.addEventListener("live_turn_complete", onComplete);
    window.addEventListener("live_user_interim", onInterim);
    return () => {
      window.removeEventListener("live_text", onText);
      window.removeEventListener("live_turn_complete", onComplete);
      window.removeEventListener("live_user_interim", onInterim);
    };
  }, []);

  useEffect(() => {
    chatRef.current?.scrollTo({ top: chatRef.current.scrollHeight, behavior: "smooth" });
  }, [messages, interim]);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => { if (e.key === "Escape") onClose(); };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onClose]);

  const handleSuggestedQ = (text: string) => {
    if (!voiceActive) toggleLive(coachPrompt);
    // Small delay to let session open, then show as user message
    setTimeout(() => {
      window.dispatchEvent(new CustomEvent("live_text", { detail: { role: "user", text } }));
    }, 300);
  };

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      style={{
        position: "fixed", inset: 0, zIndex: 9100,
        background: "#020617",
        display: "flex", flexDirection: "column",
        overflow: "hidden",
      }}
    >
      {/* Background glow */}
      <div style={{
        position: "absolute", inset: 0, pointerEvents: "none",
        background: `radial-gradient(ellipse at 40% 50%, ${color}18 0%, transparent 60%)`,
      }} />

      {/* Top bar */}
      <div style={{
        position: "relative", zIndex: 10,
        display: "flex", alignItems: "center", justifyContent: "space-between",
        padding: "16px 24px",
        background: "linear-gradient(180deg, rgba(2,6,23,0.95) 0%, transparent 100%)",
        borderBottom: "1px solid rgba(255,255,255,0.06)",
      }}>
        <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
          <div style={{
            width: 36, height: 36, borderRadius: "50%",
            background: `${color}22`, border: `2px solid ${color}55`,
            display: "flex", alignItems: "center", justifyContent: "center",
            fontSize: 18,
          }}>
            {result.archetype.icon}
          </div>
          <div>
            <div style={{ color: "#f8fafc", fontSize: 16, fontWeight: 900, letterSpacing: "-0.02em" }}>
              AI Body Coach
            </div>
            <div style={{ color: "#475569", fontSize: 11, fontWeight: 700 }}>
              {result.archetype.label} · {userHeight}cm · {userWeight}kg
            </div>
          </div>
        </div>

        <div style={{ display: "flex", gap: 10, alignItems: "center" }}>
          {/* Voice status pill */}
          <AnimatePresence>
            {voiceActive && (
              <motion.div
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.8 }}
                style={{
                  display: "flex", alignItems: "center", gap: 6,
                  background: micState === "speaking" ? "rgba(99,102,241,0.2)" : "rgba(239,68,68,0.15)",
                  border: `1px solid ${micState === "speaking" ? "#6366f1" : "#ef4444"}`,
                  borderRadius: 999, padding: "6px 12px",
                  color: micState === "speaking" ? "#a5b4fc" : "#f87171",
                  fontSize: 11, fontWeight: 800,
                }}
              >
                <span style={{
                  width: 6, height: 6, borderRadius: "50%",
                  background: micState === "speaking" ? "#6366f1" : "#ef4444",
                  animation: "coach-blink 1.2s ease-in-out infinite",
                }} />
                {micState === "speaking" ? "Speaking..." : micState === "listening" ? "Listening..." : "Live"}
              </motion.div>
            )}
          </AnimatePresence>

          <button
            onClick={() => toggleLive(coachPrompt)}
            style={{
              display: "flex", alignItems: "center", gap: 6,
              background: voiceActive ? "rgba(239,68,68,0.15)" : `${color}20`,
              border: `1px solid ${voiceActive ? "#ef4444" : color}`,
              borderRadius: 10, padding: "8px 16px",
              color: voiceActive ? "#f87171" : color,
              fontSize: 13, fontWeight: 800, cursor: "pointer",
            }}
          >
            {voiceActive
              ? micState === "speaking" ? <Volume2 size={14} /> : <MicOff size={14} />
              : <Mic size={14} />}
            {voiceActive ? "End Session" : "Start Voice Session"}
          </button>

          <button
            onClick={onClose}
            style={{
              background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.1)",
              borderRadius: 10, padding: "8px 14px", color: "#64748b",
              fontSize: 13, fontWeight: 800, cursor: "pointer",
              display: "flex", alignItems: "center", gap: 6,
            }}
          >
            <X size={14} /> Close
          </button>
        </div>
      </div>

      {/* Main content */}
      <div style={{ flex: 1, display: "flex", overflow: "hidden", position: "relative", zIndex: 5 }}>

        {/* 3D body panel */}
        <div style={{ flex: "0 0 55%", position: "relative" }}>
          <Canvas
            camera={{ position: [0, 0.5, 5.8], fov: 40 }}
            dpr={[1, 2]}
            gl={{ antialias: true, alpha: false }}
            style={{ background: "transparent", width: "100%", height: "100%" }}
          >
            <color attach="background" args={["#020617"]} />
            <CoachScene heightFactor={heightFactor} widthFactor={widthFactor} speaking={isSpeaking} />
          </Canvas>

          {/* Body stats overlay bottom-left */}
          <div style={{
            position: "absolute", left: 24, bottom: 24,
            background: "rgba(2,8,23,0.78)", backdropFilter: "blur(20px)",
            border: "1px solid rgba(255,255,255,0.08)", borderRadius: 18,
            padding: "16px 20px", minWidth: 240,
          }}>
            <div style={{ color: color, fontSize: 10, fontWeight: 900, letterSpacing: "0.14em", textTransform: "uppercase", marginBottom: 10 }}>
              Body Profile
            </div>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
              {[
                { label: "Height", value: `${userHeight}cm` },
                { label: "Weight", value: `${userWeight}kg` },
                { label: "BMI", value: String(result.user_bmi) },
                { label: "Height Rank", value: `Top ${Math.round((1 - (result.height_percentile ?? 0.5)) * 100)}%` },
              ].map(b => (
                <div key={b.label} style={{ background: "rgba(255,255,255,0.04)", borderRadius: 10, padding: "8px 10px" }}>
                  <div style={{ color: "#f8fafc", fontSize: 16, fontWeight: 900 }}>{b.value}</div>
                  <div style={{ color: "#475569", fontSize: 9, fontWeight: 800, textTransform: "uppercase", letterSpacing: "0.1em" }}>{b.label}</div>
                </div>
              ))}
            </div>
          </div>

          {/* Archetype badge top-left */}
          <div style={{
            position: "absolute", left: 24, top: 20,
            display: "inline-flex", alignItems: "center", gap: 8,
            background: `${color}15`, border: `1px solid ${color}40`,
            borderRadius: 999, padding: "6px 14px",
          }}>
            <Zap size={11} color={color} />
            <span style={{ color, fontSize: 11, fontWeight: 800, letterSpacing: "0.08em" }}>
              {result.archetype.label}
            </span>
          </div>
        </div>

        {/* Coach chat panel */}
        <div style={{
          flex: "0 0 45%", display: "flex", flexDirection: "column",
          background: "rgba(255,255,255,0.02)",
          borderLeft: "1px solid rgba(255,255,255,0.06)",
        }}>

          {/* Chat header */}
          <div style={{
            padding: "20px 24px 16px",
            borderBottom: "1px solid rgba(255,255,255,0.05)",
          }}>
            <div style={{ color: "#f8fafc", fontSize: 15, fontWeight: 900 }}>AI Coach Chat</div>
            <div style={{ color: "#475569", fontSize: 11, fontWeight: 700, marginTop: 2 }}>
              Real-time voice · powered by Gemini Live
            </div>
          </div>

          {/* Messages */}
          <div ref={chatRef} style={{
            flex: 1, overflowY: "auto", padding: "20px 24px",
            scrollbarWidth: "none",
            WebkitMaskImage: "linear-gradient(transparent, black 12%, black 100%)",
            maskImage: "linear-gradient(transparent, black 12%, black 100%)",
          }}>
            {messages.length === 0 && !interim && !voiceActive ? (
              <div style={{ color: "#334155", fontSize: 14, textAlign: "center", marginTop: 40, lineHeight: 2 }}>
                Click <strong style={{ color: color }}>Start Voice Session</strong> and ask the coach anything about your body type, training, or Olympic sport fit.
              </div>
            ) : (
              <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
                {messages.map((m, i) => (
                  <div key={i} style={{
                    display: "flex",
                    flexDirection: "column",
                    alignItems: m.role === "user" ? "flex-end" : "flex-start",
                    gap: 4,
                  }}>
                    <span style={{
                      fontSize: 9, fontWeight: 800, letterSpacing: "0.12em",
                      textTransform: "uppercase",
                      color: m.role === "user" ? "rgba(148,163,184,0.5)" : color + "aa",
                    }}>
                      {m.role === "user" ? "You" : "Coach"}
                    </span>
                    <div style={{
                      maxWidth: "90%",
                      background: m.role === "user" ? "rgba(255,255,255,0.06)" : `${color}12`,
                      border: `1px solid ${m.role === "user" ? "rgba(255,255,255,0.08)" : color + "25"}`,
                      borderRadius: m.role === "user" ? "16px 16px 4px 16px" : "4px 16px 16px 16px",
                      padding: "10px 14px",
                      color: m.role === "agent" ? "#e2e8f0" : "#94a3b8",
                      fontSize: 14, lineHeight: 1.65, fontWeight: m.role === "agent" ? 500 : 400,
                    }}>
                      {m.text}
                    </div>
                  </div>
                ))}

                {/* Interim user speech */}
                {interim && (
                  <div style={{ display: "flex", flexDirection: "column", alignItems: "flex-end", gap: 4 }}>
                    <span style={{ fontSize: 9, fontWeight: 800, color: "rgba(148,163,184,0.5)", letterSpacing: "0.12em", textTransform: "uppercase" }}>You</span>
                    <div style={{
                      background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.1)",
                      borderRadius: "16px 16px 4px 16px", padding: "10px 14px",
                      color: "rgba(226,232,240,0.6)", fontSize: 13, fontStyle: "italic",
                    }}>
                      {interim}▋
                    </div>
                  </div>
                )}

                {/* AI typing indicator */}
                {voiceActive && micState === "speaking" && messages.length > 0 && !messages[messages.length - 1].sealed && (
                  <div style={{ display: "flex", gap: 5, padding: "6px 0" }}>
                    {[0, 1, 2].map(i => (
                      <div key={i} style={{
                        width: 7, height: 7, borderRadius: "50%", background: color,
                        animation: `coach-dot 1.2s ease-in-out ${i * 0.2}s infinite`,
                      }} />
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Suggested questions */}
          {!voiceActive && (
            <div style={{ padding: "16px 24px", borderTop: "1px solid rgba(255,255,255,0.05)" }}>
              <div style={{ color: "#334155", fontSize: 10, fontWeight: 800, letterSpacing: "0.1em", textTransform: "uppercase", marginBottom: 10 }}>
                Ask the coach
              </div>
              <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
                {COACH_QUESTIONS.slice(0, 4).map(q => (
                  <button
                    key={q.text}
                    onClick={() => handleSuggestedQ(q.text)}
                    style={{
                      display: "flex", alignItems: "center", gap: 10,
                      background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.07)",
                      borderRadius: 12, padding: "10px 14px",
                      color: "#94a3b8", fontSize: 12, fontWeight: 600,
                      cursor: "pointer", textAlign: "left",
                      transition: "all 0.15s ease",
                    }}
                    onMouseEnter={e => {
                      (e.currentTarget as HTMLButtonElement).style.background = `${color}10`;
                      (e.currentTarget as HTMLButtonElement).style.borderColor = `${color}35`;
                      (e.currentTarget as HTMLButtonElement).style.color = "#e2e8f0";
                    }}
                    onMouseLeave={e => {
                      (e.currentTarget as HTMLButtonElement).style.background = "rgba(255,255,255,0.03)";
                      (e.currentTarget as HTMLButtonElement).style.borderColor = "rgba(255,255,255,0.07)";
                      (e.currentTarget as HTMLButtonElement).style.color = "#94a3b8";
                    }}
                  >
                    <span style={{ fontSize: 16, flexShrink: 0 }}>{q.icon}</span>
                    <span style={{ flex: 1 }}>{q.text}</span>
                    <ChevronRight size={12} style={{ flexShrink: 0, opacity: 0.5 }} />
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Permission error */}
          {permissionError && (
            <div style={{
              margin: "0 24px 16px", padding: "10px 14px",
              background: "rgba(127,29,29,0.5)", border: "1px solid rgba(248,113,113,0.35)",
              borderRadius: 10, color: "#fca5a5", fontSize: 11, fontWeight: 700,
            }}>
              {permissionError}
            </div>
          )}

          {/* CTA when voice active */}
          {voiceActive && (
            <div style={{
              padding: "16px 24px", borderTop: "1px solid rgba(255,255,255,0.05)",
              display: "flex", alignItems: "center", justifyContent: "center",
            }}>
              <div style={{
                display: "flex", alignItems: "center", gap: 10,
                background: "rgba(255,255,255,0.04)", borderRadius: 12, padding: "10px 18px",
                border: `1px solid ${color}25`,
              }}>
                <div style={{
                  width: 10, height: 10, borderRadius: "50%",
                  background: micState === "listening" ? "#22c55e" : color,
                  animation: "coach-blink 1.2s ease-in-out infinite",
                }} />
                <span style={{ color: "#94a3b8", fontSize: 12, fontWeight: 700 }}>
                  {micState === "listening" ? "Listening — speak naturally" :
                   micState === "speaking" ? "Coach is responding..." : "Connecting..."}
                </span>
              </div>
            </div>
          )}
        </div>
      </div>

      <style>{`
        @keyframes coach-blink { 0%,100%{opacity:1} 50%{opacity:0.3} }
        @keyframes coach-dot { 0%,80%,100%{transform:scale(0.6);opacity:0.4} 40%{transform:scale(1.1);opacity:1} }
      `}</style>
    </motion.div>
  );
}
