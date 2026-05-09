"use client";

import React, { useCallback, useEffect, useRef, useState } from "react";
import { Canvas } from "@react-three/fiber";
import { AnimatePresence, motion } from "framer-motion";
import { Activity, Mic, MicOff, Volume2, X, Dumbbell, Rotate3D } from "lucide-react";
import type { ArchetypeProfile, MatchResult } from "@/lib/api";
import BodyPoseOverlay, { type PoseArchetypeId } from "@/components/BodyPoseOverlay";
import type { PoseMatch } from "@/components/BodyPoseOverlay";
import { MirrorScene } from "@/components/BiometricMirror";

function clamp(v: number, min: number, max: number) {
  return Math.max(min, Math.min(max, v));
}

function norm(val: number, lo: number, hi: number) {
  return clamp((val - lo) / (hi - lo), 0, 1);
}

function bmiZone(bmi: number): string {
  if (bmi < 18.5) return "Lean";
  if (bmi < 23) return "Athletic";
  if (bmi < 27) return "Power";
  return "Strength";
}

function renderBodyLiveText(text: string): React.ReactNode {
  const parts = text.split(/(\*\*[^*]+\*\*)/g);
  return parts.map((part, index) => {
    if (part.startsWith("**") && part.endsWith("**")) {
      return (
        <span
          key={index}
          style={{
            color: "#bfdbfe",
            background: "rgba(96,165,250,0.14)",
            borderRadius: 4,
            padding: "0 4px",
            fontWeight: 800,
          }}
        >
          {part.slice(2, -2)}
        </span>
      );
    }
    return <span key={index}>{part}</span>;
  });
}

const POSE_GUIDES: Array<{
  id: PoseArchetypeId;
  label: string;
  cue: string;
  instruction: string;
}> = [
  { id: "powerhouse", label: "Power", cue: "Power V", instruction: "Raise both arms wide above shoulders." },
  { id: "aquatic_titan", label: "Aquatic", cue: "Streamline", instruction: "Lift both hands overhead close together." },
  { id: "precision_maestro", label: "Precision", cue: "Aim", instruction: "Extend one arm straight to the side." },
  { id: "agile_competitor", label: "Agile", cue: "T control", instruction: "Extend both arms level to the sides." },
];

function MiniPose({
  id,
  active,
  progress,
  color,
}: {
  id: PoseArchetypeId;
  active: boolean;
  progress: number;
  color: string;
}) {
  const stroke = active ? "#facc15" : "rgba(203,213,225,0.72)";
  const glow = active ? "drop-shadow(0 0 8px rgba(250,204,21,0.7))" : "none";
  const leftArm =
    id === "aquatic_titan" ? "M40 33 L47 16" :
    id === "powerhouse" ? "M40 33 L28 20" :
    id === "precision_maestro" ? "M40 34 L18 34" :
    id === "aerobic_engine" ? "M40 34 L27 28" :
    id === "explosive_athlete" ? "M40 39 L38 56" :
    "M40 34 L18 34";
  const rightArm =
    id === "aquatic_titan" ? "M56 33 L49 16" :
    id === "powerhouse" ? "M56 33 L68 20" :
    id === "precision_maestro" ? "M56 34 L64 42" :
    id === "aerobic_engine" ? "M56 34 L67 46" :
    id === "explosive_athlete" ? "M56 39 L58 56" :
    "M56 34 L78 34";

  return (
    <svg viewBox="0 0 96 96" width="100%" height="100%" style={{ overflow: "visible", filter: glow }}>
      <circle cx="48" cy="20" r="8" fill={active ? "#fde68a" : "rgba(148,163,184,0.58)"} />
      <path d="M48 29 L48 58" stroke={stroke} strokeWidth="5" strokeLinecap="round" />
      <path d={leftArm} stroke={stroke} strokeWidth="5" strokeLinecap="round" />
      <path d={rightArm} stroke={stroke} strokeWidth="5" strokeLinecap="round" />
      <path d="M47 58 L43 78" stroke="rgba(148,163,184,0.34)" strokeWidth="4" strokeLinecap="round" />
      <path d="M49 58 L55 78" stroke="rgba(148,163,184,0.34)" strokeWidth="4" strokeLinecap="round" />
      {active && (
        <circle
          cx="48"
          cy="48"
          r="39"
          fill="none"
          stroke={color}
          strokeWidth="3"
          strokeDasharray={`${Math.max(10, progress * 245)} 245`}
          strokeLinecap="round"
          transform="rotate(-90 48 48)"
        />
      )}
    </svg>
  );
}

interface FullscreenBiometricMirrorProps {
  result: MatchResult;
  userHeight: number;
  userWeight: number;
  archetypes?: ArchetypeProfile[];
  onClose: () => void;
  voiceAssistant?: {
    micState: string;
    permissionError?: string | null;
    toggleLive: (prompt?: string) => void;
  };
}

export default function FullscreenBiometricMirror({
  result,
  userHeight,
  userWeight,
  archetypes = [],
  onClose,
  voiceAssistant,
}: FullscreenBiometricMirrorProps) {
  const [bodyControlActive, setBodyControlActive] = useState(false);
  const [poseArchetypeId, setPoseArchetypeId] = useState<PoseArchetypeId | null>(null);
  const [posePreview, setPosePreview] = useState<PoseMatch | null>(null);
  const [poseProgress, setPoseProgress] = useState(0);
  const [lockPulse, setLockPulse] = useState(false);
  const [targetPoseId, setTargetPoseId] = useState<PoseArchetypeId>("powerhouse");
  const [gameScore, setGameScore] = useState(0);
  const [combo, setCombo] = useState(0);
  const [completedPoses, setCompletedPoses] = useState<Set<PoseArchetypeId>>(new Set());
  const [scoreBurst, setScoreBurst] = useState<{ id: number; points: number; label: string } | null>(null);
  const targetPoseRef = useRef<PoseArchetypeId>(targetPoseId);
  const comboRef = useRef(combo);
  const activeArchetype = archetypes.find(arch => arch.id === poseArchetypeId) ?? result.archetype;
  const targetPose = POSE_GUIDES.find(guide => guide.id === targetPoseId) ?? POSE_GUIDES[0];
  const detectedPose = posePreview ? POSE_GUIDES.find(guide => guide.id === posePreview.archetypeId) : null;
  const targetDetected = posePreview?.archetypeId === targetPoseId;
  const progressPercent = Math.round(poseProgress * 100);
  const color = activeArchetype.color ?? result.archetype.color ?? "#6366f1";
  const heightFactor = norm(userHeight, 155, 210);
  const widthFactor = norm(userWeight, 45, 130);
  const micState = voiceAssistant?.micState ?? "idle";
  const permissionError = voiceAssistant?.permissionError ?? null;
  const voiceEnabled = micState !== "idle";
  const toggleLive = voiceAssistant?.toggleLive ?? (() => {});
  const chatScrollRef = useRef<HTMLDivElement>(null);
  const [liveMessages, setLiveMessages] = useState<{ role: "agent" | "user"; text: string; sealed?: boolean }[]>([]);
  const [interimUserText, setInterimUserText] = useState("");

  useEffect(() => {
    targetPoseRef.current = targetPoseId;
  }, [targetPoseId]);

  useEffect(() => {
    comboRef.current = combo;
  }, [combo]);

  useEffect(() => {
    const onKey = (event: KeyboardEvent) => {
      if (event.key === "Escape") onClose();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onClose]);

  useEffect(() => {
    const onText = (event: Event) => {
      const { role, text } = (event as CustomEvent<{ role: "agent" | "user"; text: string }>).detail;
      if (!text?.trim()) return;
      setLiveMessages(prev => {
        if (role === "user") return [...prev, { role, text, sealed: true }];
        const last = prev[prev.length - 1];
        if (last && last.role === "agent" && !last.sealed) {
          return [...prev.slice(0, -1), { role, text: last.text + text }];
        }
        return [...prev, { role, text }];
      });
    };

    const onTurnComplete = () => {
      setLiveMessages(prev => {
        const last = prev[prev.length - 1];
        if (!last || last.role !== "agent" || last.sealed) return prev;
        return [...prev.slice(0, -1), { ...last, sealed: true }];
      });
    };

    const onInterim = (event: Event) => {
      const detail = (event as CustomEvent<{ text: string; clear?: boolean }>).detail;
      setInterimUserText(detail.clear ? "" : prev => prev + detail.text);
    };

    window.addEventListener("live_text", onText);
    window.addEventListener("live_turn_complete", onTurnComplete);
    window.addEventListener("live_user_interim", onInterim);
    return () => {
      window.removeEventListener("live_text", onText);
      window.removeEventListener("live_turn_complete", onTurnComplete);
      window.removeEventListener("live_user_interim", onInterim);
    };
  }, []);

  useEffect(() => {
    if (chatScrollRef.current) {
      chatScrollRef.current.scrollTo({ top: chatScrollRef.current.scrollHeight, behavior: "smooth" });
    }
  }, [liveMessages, interimUserText]);

  const voicePrompt = [
    "You are the Team USA Digital Mirror body-analysis guide.",
    `The active archetype shown in the mirror is ${activeArchetype.label}.`,
    poseArchetypeId ? "The active archetype was selected by a body pose classifier using MediaPipe Pose." : "The active archetype is the user's biometric match.",
    `Their aggregate profile is ${userHeight} cm and ${userWeight} kg.`,
    "Explain biomechanics, body profile, sport alignment, and Paralympic classification context using conditional phrasing.",
    "Do not identify individual athletes, do not mention finish times or exact scores, and do not make performance predictions.",
  ].join(" ");

  const advanceTargetPose = useCallback((currentId: PoseArchetypeId) => {
    const currentIndex = POSE_GUIDES.findIndex(guide => guide.id === currentId);
    const nextIndex = currentIndex < 0 ? 0 : (currentIndex + 1) % POSE_GUIDES.length;
    setTargetPoseId(POSE_GUIDES[nextIndex].id);
  }, []);

  const handlePosePreview = useCallback((match: PoseMatch | null, progress: number) => {
    setPosePreview(match);
    setPoseProgress(progress);
  }, []);

  const handlePoseMatch = useCallback((match: PoseMatch) => {
    setPoseArchetypeId(match.archetypeId);
    setLockPulse(true);
    const hitTarget = match.archetypeId === targetPoseRef.current;
    const nextCombo = hitTarget ? comboRef.current + 1 : 0;
    const points = hitTarget ? 150 + nextCombo * 25 : 0;
    comboRef.current = nextCombo;
    setCombo(nextCombo);
    if (hitTarget) {
      setGameScore(score => score + points);
      setCompletedPoses(prev => {
        const next = new Set(prev);
        next.add(match.archetypeId);
        return next;
      });
      setScoreBurst({ id: Date.now(), points, label: "Target locked" });
      advanceTargetPose(match.archetypeId);
    } else {
      setScoreBurst({ id: Date.now(), points: 0, label: `${match.cue} detected · target only scores` });
    }
    setTimeout(() => setLockPulse(false), 900);
  }, [advanceTargetPose]);

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      style={{
        position: "fixed",
        inset: 0,
        zIndex: 9000,
        background: "#020617",
        overflow: "hidden",
      }}
    >
      <Canvas
        camera={{ position: [0, 0.4, 5.4], fov: 38 }}
        dpr={[1, 3]}
        gl={{ antialias: true, alpha: false }}
        style={{ position: "absolute", inset: 0, zIndex: 1, background: "#111827", opacity: bodyControlActive ? 0.16 : 1, transition: "opacity 420ms ease" }}
      >
        <color attach="background" args={["#111827"]} />
        <MirrorScene
          heightFactor={heightFactor}
          widthFactor={widthFactor}
          color={color}
          immersive
        />
      </Canvas>

      <div
        style={{
          position: "absolute",
          inset: 0,
          zIndex: bodyControlActive ? 19 : 2,
          pointerEvents: "none",
          background: "linear-gradient(90deg, rgba(17,24,39,0.86), transparent 30%, transparent 70%, rgba(17,24,39,0.74))",
        }}
      />

      <BodyPoseOverlay
        active={bodyControlActive}
        fullScreen
        color={color}
        onPosePreview={handlePosePreview}
        onPoseMatch={handlePoseMatch}
      />

      <div
        style={{
          position: "absolute",
          top: 0,
          left: 0,
          right: 0,
          zIndex: 120,
          padding: "16px 24px",
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          background: "linear-gradient(180deg, rgba(2,6,23,0.94) 0%, transparent 100%)",
        }}
      >
        <div>
          <h2 style={{ margin: 0, color: "#f8fafc", fontSize: 20, fontWeight: 900, letterSpacing: "-0.02em", display: "flex", alignItems: "center", gap: 10 }}>
            <Dumbbell size={19} color={color} /> Anatomical Archetype Mirror
          </h2>
          <p style={{ margin: "3px 0 0", color: "#64748b", fontSize: 12, fontWeight: 700 }}>
            Rotate, pan, and zoom the 3D body profile · Esc to exit
          </p>
        </div>

        <div style={{ display: "flex", gap: 10, pointerEvents: "auto" }}>
          {permissionError && (
            <div
              style={{
                maxWidth: 360,
                background: "rgba(127,29,29,0.78)",
                border: "1px solid rgba(248,113,113,0.45)",
                borderRadius: 10,
                padding: "8px 12px",
                color: "#fecaca",
                fontSize: 11,
                fontWeight: 800,
                lineHeight: 1.4,
              }}
            >
              {permissionError}
            </div>
          )}
          <button
            onClick={() => setBodyControlActive(value => !value)}
            title="Toggle body-controlled archetype mirror"
            style={{
              background: bodyControlActive ? "rgba(16,185,129,0.18)" : "rgba(255,255,255,0.05)",
              border: `1px solid ${bodyControlActive ? "#10b981" : "#1e293b"}`,
              borderRadius: 10,
              padding: "8px 14px",
              color: bodyControlActive ? "#86efac" : "#94a3b8",
              cursor: "pointer",
              display: "flex",
              alignItems: "center",
              gap: 6,
              fontSize: 13,
              fontWeight: 800,
            }}
          >
            <Activity size={14} />
            {bodyControlActive ? "Body ON" : "Body Control"}
          </button>

          <button
            onClick={() => toggleLive(voicePrompt)}
            title={voiceEnabled ? "Stop Voice AI" : "Talk to the body analysis agent"}
            style={{
              background: voiceEnabled ? "rgba(239,68,68,0.2)" : "rgba(99,102,241,0.15)",
              border: `1px solid ${voiceEnabled ? "#ef4444" : "#6366f1"}`,
              borderRadius: 10,
              padding: "8px 14px",
              color: voiceEnabled ? "#f87171" : "#a5b4fc",
              cursor: "pointer",
              display: "flex",
              alignItems: "center",
              gap: 6,
              fontSize: 13,
              fontWeight: 800,
            }}
          >
            {voiceEnabled
              ? micState === "speaking" ? <Volume2 size={14} style={{ animation: "body-pulse 1s infinite" }} /> : <MicOff size={14} />
              : <Mic size={14} />}
            {voiceEnabled ? micState === "speaking" ? "Speaking..." : micState === "listening" ? "Listening..." : "Voice ON" : "Voice AI"}
          </button>

          <button
            onClick={onClose}
            style={{
              background: "rgba(255,255,255,0.05)",
              border: "1px solid #1e293b",
              borderRadius: 10,
              padding: "8px 14px",
              color: "#94a3b8",
              cursor: "pointer",
              display: "flex",
              alignItems: "center",
              gap: 6,
              fontSize: 13,
              fontWeight: 800,
            }}
          >
            <X size={14} /> Close
          </button>
        </div>
      </div>

      {bodyControlActive && (
        <motion.div
          initial={{ opacity: 0, x: "-50%", y: -14 }}
          animate={{ opacity: 1, x: "-50%", y: 0 }}
          exit={{ opacity: 0, x: "-50%", y: -14 }}
          transition={{ duration: 0.28 }}
          style={{
            position: "absolute",
            top: 82,
            left: "50%",
            zIndex: 138,
            width: "min(1120px, calc(100vw - 56px))",
            pointerEvents: "auto",
          }}
        >
          <div
            style={{
              border: "1px solid rgba(148,163,184,0.16)",
              borderRadius: 22,
              padding: "14px 16px 16px",
              background: "rgba(2,8,23,0.66)",
              backdropFilter: "blur(18px)",
              boxShadow: "0 24px 80px rgba(0,0,0,0.24)",
            }}
          >
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 16, marginBottom: 12 }}>
              <div>
                <div style={{ color: "#f8fafc", fontSize: 13, fontWeight: 950, letterSpacing: "-0.02em", display: "flex", alignItems: "center", gap: 8 }}>
                  Mirror Quest
                  <span style={{ color: "#fde68a", fontSize: 11, fontWeight: 950 }}>
                    Target: {targetPose.cue}
                  </span>
                </div>
                <div style={{ color: "#64748b", fontSize: 10, fontWeight: 800, marginTop: 2 }}>
                  Four clear upper-body poses. Hold the target to 100%, then the next target appears.
                </div>
              </div>
              <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                <div style={{ border: "1px solid rgba(250,204,21,0.35)", borderRadius: 999, padding: "7px 11px", color: "#fde68a", fontSize: 11, fontWeight: 950, background: "rgba(250,204,21,0.10)" }}>
                  {gameScore.toLocaleString()} pts
                </div>
                <div style={{ border: "1px solid rgba(96,165,250,0.30)", borderRadius: 999, padding: "7px 11px", color: "#bfdbfe", fontSize: 11, fontWeight: 950, background: "rgba(96,165,250,0.10)" }}>
                  Combo x{combo}
                </div>
                <div style={{ color: targetDetected ? "#fde68a" : posePreview ? "#fca5a5" : "#94a3b8", fontSize: 10, fontWeight: 900, letterSpacing: "0.14em", textTransform: "uppercase", whiteSpace: "nowrap" }}>
                  {posePreview ? `${targetDetected ? "Target" : "Not target"} · ${progressPercent}%` : "Waiting"}
                </div>
              </div>
            </div>

            <div
              style={{
                display: "grid",
                gridTemplateColumns: "repeat(6, minmax(128px, 1fr))",
                gap: 10,
                overflowX: "auto",
                scrollbarWidth: "none",
              }}
            >
              {POSE_GUIDES.map((guide) => {
                const active = posePreview?.archetypeId === guide.id;
                const locked = poseArchetypeId === guide.id;
                const isTarget = targetPoseId === guide.id;
                const completed = completedPoses.has(guide.id);
                return (
                  <div
                    key={guide.id}
                    onClick={() => setTargetPoseId(guide.id)}
                    style={{
                      minWidth: 128,
                      cursor: "pointer",
                      border: `1px solid ${active ? "#facc15" : isTarget ? "#60a5fa" : locked ? color : "rgba(148,163,184,0.14)"}`,
                      borderRadius: 16,
                      padding: "10px 10px 12px",
                      background: active
                        ? "rgba(250,204,21,0.12)"
                        : isTarget
                          ? "rgba(96,165,250,0.13)"
                        : locked
                          ? "rgba(96,165,250,0.10)"
                          : "rgba(15,23,42,0.58)",
                      boxShadow: active ? "0 0 32px rgba(250,204,21,0.16)" : isTarget ? "0 0 28px rgba(96,165,250,0.12)" : "none",
                      transition: "border-color 180ms ease, background 180ms ease, box-shadow 180ms ease",
                    }}
                  >
                    <div style={{ height: 16, display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 2 }}>
                      <span style={{ color: isTarget ? "#bfdbfe" : completed ? "#86efac" : "rgba(148,163,184,0.42)", fontSize: 8.5, fontWeight: 950, letterSpacing: "0.12em", textTransform: "uppercase" }}>
                        {isTarget ? "Target" : completed ? "Unlocked" : "Try"}
                      </span>
                      {completed && <span style={{ color: "#86efac", fontSize: 12, fontWeight: 950 }}>✓</span>}
                    </div>
                    <div style={{ height: 66, marginBottom: 6 }}>
                      <MiniPose id={guide.id} active={active || locked} progress={active ? poseProgress : locked ? 1 : 0} color={active ? "#facc15" : color} />
                    </div>
                    <div style={{ color: active ? "#fde68a" : "#f8fafc", fontSize: 12, fontWeight: 950, lineHeight: 1 }}>
                      {guide.label}
                    </div>
                    <div style={{ color: "#94a3b8", fontSize: 10, fontWeight: 850, marginTop: 4 }}>
                      {guide.cue}
                    </div>
                    <div style={{ color: "rgba(203,213,225,0.62)", fontSize: 9.5, lineHeight: 1.35, fontWeight: 650, marginTop: 6 }}>
                      {guide.instruction}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </motion.div>
      )}

      <AnimatePresence>
        {scoreBurst && bodyControlActive && (
          <motion.div
            key={scoreBurst.id}
            initial={{ opacity: 0, scale: 0.86, x: "-50%", y: "-35%" }}
            animate={{ opacity: 1, scale: 1, x: "-50%", y: "-50%" }}
            exit={{ opacity: 0, scale: 1.08, x: "-50%", y: "-75%" }}
            transition={{ duration: 0.42 }}
            onAnimationComplete={() => {
              window.setTimeout(() => setScoreBurst(null), 520);
            }}
            style={{
              position: "absolute",
              left: "50%",
              top: "48%",
              zIndex: 145,
              pointerEvents: "none",
              border: `1px solid ${scoreBurst.points > 0 ? "rgba(250,204,21,0.42)" : "rgba(248,113,113,0.42)"}`,
              borderRadius: 999,
              padding: "14px 22px",
              background: "rgba(2,8,23,0.72)",
              backdropFilter: "blur(18px)",
              boxShadow: scoreBurst.points > 0 ? "0 0 80px rgba(250,204,21,0.22)" : "0 0 80px rgba(248,113,113,0.16)",
              textAlign: "center",
            }}
          >
            <div style={{ color: scoreBurst.points > 0 ? "#fde68a" : "#fecaca", fontSize: 28, fontWeight: 950, letterSpacing: "-0.04em", lineHeight: 1 }}>
              {scoreBurst.points > 0 ? `+${scoreBurst.points}` : "No score"}
            </div>
            <div style={{ color: "#94a3b8", fontSize: 10, fontWeight: 900, letterSpacing: "0.14em", textTransform: "uppercase", marginTop: 4 }}>
              {scoreBurst.label}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {bodyControlActive && (
        <motion.div
          initial={{ opacity: 0, x: "-50%", y: 24 }}
          animate={{ opacity: 1, x: "-50%", y: 0, scale: lockPulse ? [1, 1.04, 1] : 1 }}
          transition={{ duration: 0.32 }}
          style={{
            position: "absolute",
            left: "50%",
            bottom: 34,
            zIndex: 140,
            width: 760,
            maxWidth: "calc(100vw - 48px)",
            border: `1px solid ${posePreview ? "#facc15" : color}55`,
            borderRadius: 22,
            padding: 18,
            background: "rgba(2,8,23,0.74)",
            backdropFilter: "blur(18px)",
            boxShadow: lockPulse ? "0 0 80px rgba(250,204,21,0.24)" : "0 24px 80px rgba(0,0,0,0.32)",
            pointerEvents: "none",
          }}
        >
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 94px", gap: 16, alignItems: "center" }}>
            <div style={{ borderRight: "1px solid rgba(148,163,184,0.14)", paddingRight: 14 }}>
              <div style={{ color: "#60a5fa", fontSize: 10, fontWeight: 950, letterSpacing: "0.16em", textTransform: "uppercase", marginBottom: 8 }}>
                1 · Do this target
              </div>
              <div style={{ display: "flex", alignItems: "center", gap: 14 }}>
                <div style={{ width: 72, height: 72, borderRadius: 18, border: "1px solid rgba(96,165,250,0.3)", background: "rgba(96,165,250,0.10)", padding: 6 }}>
                  <MiniPose id={targetPose.id} active progress={1} color="#60a5fa" />
                </div>
                <div>
                  <div style={{ color: "#f8fafc", fontSize: 24, lineHeight: 1, fontWeight: 950, letterSpacing: "-0.04em" }}>
                    {targetPose.cue}
                  </div>
                  <div style={{ color: "#94a3b8", fontSize: 12, fontWeight: 750, lineHeight: 1.35, marginTop: 8 }}>
                    {targetPose.instruction}
                  </div>
                </div>
              </div>
            </div>

            <div>
              <div style={{ color: targetDetected ? "#fde68a" : posePreview ? "#fecaca" : "#94a3b8", fontSize: 10, fontWeight: 950, letterSpacing: "0.16em", textTransform: "uppercase", marginBottom: 8 }}>
                2 · Camera sees
              </div>
              <div style={{ display: "flex", alignItems: "center", gap: 14 }}>
                <div style={{ width: 72, height: 72, borderRadius: 18, border: `1px solid ${targetDetected ? "rgba(250,204,21,0.44)" : posePreview ? "rgba(248,113,113,0.35)" : "rgba(148,163,184,0.18)"}`, background: targetDetected ? "rgba(250,204,21,0.10)" : "rgba(15,23,42,0.72)", padding: 6 }}>
                  {detectedPose ? (
                    <MiniPose id={detectedPose.id} active={targetDetected} progress={targetDetected ? poseProgress : 0} color={targetDetected ? "#facc15" : "#94a3b8"} />
                  ) : (
                    <div style={{ height: "100%", display: "grid", placeItems: "center", color: "#475569", fontSize: 10, fontWeight: 900, textAlign: "center" }}>
                      MOVE<br />ARMS
                    </div>
                  )}
                </div>
                <div>
                  <div style={{ color: targetDetected ? "#fde68a" : posePreview ? "#f8fafc" : "#f8fafc", fontSize: 24, lineHeight: 1, fontWeight: 950, letterSpacing: "-0.04em" }}>
                    {posePreview ? posePreview.cue : "No pose yet"}
                  </div>
                  <div style={{ color: targetDetected ? "#fde68a" : posePreview ? "#fca5a5" : "#94a3b8", fontSize: 12, fontWeight: 750, lineHeight: 1.35, marginTop: 8 }}>
                    {targetDetected ? "Good. Hold still to score." : posePreview ? `Not scoring. Target is ${targetPose.cue}.` : "Match the target shape above."}
                  </div>
                </div>
              </div>
            </div>

            <div style={{ width: 84, height: 84, borderRadius: "50%", display: "grid", placeItems: "center", border: `5px solid rgba(148,163,184,0.18)`, background: `conic-gradient(${targetDetected ? "#facc15" : posePreview ? "#f87171" : color} ${Math.round((targetDetected ? poseProgress : 0) * 360)}deg, rgba(148,163,184,0.16) 0deg)` }}>
              <div style={{ width: 52, height: 52, borderRadius: "50%", background: "rgba(2,8,23,0.92)", display: "grid", placeItems: "center", color: posePreview ? "#fde68a" : "#bfdbfe", fontSize: 13, fontWeight: 950 }}>
                {targetDetected ? progressPercent : 0}%
              </div>
            </div>
          </div>
        </motion.div>
      )}

      <div
        style={{
          position: "absolute",
          left: 28,
          bottom: 28,
          zIndex: 130,
          width: 330,
          pointerEvents: "auto",
          border: "1px solid rgba(255,255,255,0.08)",
          borderRadius: 22,
          padding: 20,
          background: "rgba(2,8,23,0.62)",
          backdropFilter: "blur(18px)",
          boxShadow: "0 24px 80px rgba(0,0,0,0.28)",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 14 }}>
          <Rotate3D size={16} color={color} />
          <span style={{ color: color, fontSize: 10, fontWeight: 900, letterSpacing: "0.16em", textTransform: "uppercase" }}>
            Body Profile
          </span>
        </div>
        <h3 style={{ color: "#f8fafc", fontSize: 28, lineHeight: 1, fontWeight: 950, letterSpacing: "-0.04em", margin: "0 0 10px" }}>
          {activeArchetype.label}
        </h3>
        <p style={{ color: "#94a3b8", fontSize: 13, lineHeight: 1.6, fontWeight: 650, margin: "0 0 18px" }}>
          {userHeight}cm · {userWeight}kg · BMI {result.user_bmi} · {bmiZone(result.user_bmi)} zone
        </p>
        {poseArchetypeId && (
          <div style={{ margin: "-8px 0 16px", color: "#fde68a", fontSize: 11, fontWeight: 850, letterSpacing: "0.08em", textTransform: "uppercase" }}>
            Pose-controlled archetype view
          </div>
        )}
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
          <div style={{ border: "1px solid rgba(255,255,255,0.08)", borderRadius: 14, padding: 12, background: "rgba(255,255,255,0.04)" }}>
            <div style={{ color: "#f8fafc", fontSize: 20, fontWeight: 950 }}>Top {Math.round((1 - (result.height_percentile ?? 0.5)) * 100)}%</div>
            <div style={{ color: "#64748b", fontSize: 9, fontWeight: 900, letterSpacing: "0.12em", textTransform: "uppercase" }}>Height rank</div>
          </div>
          <div style={{ border: "1px solid rgba(255,255,255,0.08)", borderRadius: 14, padding: 12, background: "rgba(255,255,255,0.04)" }}>
            <div style={{ color: "#f8fafc", fontSize: 20, fontWeight: 950 }}>{(result.archetype.athlete_count ?? 0).toLocaleString()}</div>
            <div style={{ color: "#64748b", fontSize: 9, fontWeight: 900, letterSpacing: "0.12em", textTransform: "uppercase" }}>Aggregate records</div>
          </div>
        </div>
      </div>

      <AnimatePresence>
        {voiceEnabled && (
          <motion.div
            key="body-voice-panel"
            initial={{ opacity: 0, x: 40 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: 40 }}
            transition={{ type: "spring", stiffness: 300, damping: 25 }}
            style={{
              position: "absolute",
              top: 100,
              bottom: 40,
              right: 40,
              width: 380,
              display: "flex",
              flexDirection: "column",
              zIndex: 150,
              pointerEvents: "auto",
            }}
          >
            <div style={{
              display: "flex",
              alignItems: "center",
              gap: 14,
              marginBottom: 16,
              background: "rgba(2,8,23,0.46)",
              backdropFilter: "blur(16px)",
              padding: "12px 16px",
              borderRadius: 16,
              border: "1px solid rgba(255,255,255,0.07)",
            }}>
              <div style={{
                width: 36,
                height: 36,
                borderRadius: "50%",
                background: micState === "speaking" ? "rgba(99,102,241,0.3)" : "rgba(239,68,68,0.2)",
                border: `2px solid ${micState === "speaking" ? "#6366f1" : "#ef4444"}`,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                animation: micState === "listening" ? "body-ring-pulse 1.5s ease-in-out infinite" : "none",
              }}>
                {micState === "speaking" ? <Volume2 size={16} color="#a5b4fc" /> : <Mic size={16} color="#f87171" />}
              </div>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ color: "#f8fafc", fontSize: 13, fontWeight: 800 }}>
                  {micState === "speaking" ? "AI Analyst speaking..." : micState === "listening" ? "Listening..." : "Connecting..."}
                </div>
                <div style={{ color: "#64748b", fontSize: 10, fontWeight: 800, marginTop: 1 }}>Body mirror voice session</div>
              </div>
              <button
                onClick={() => toggleLive()}
                style={{
                  background: "rgba(239,68,68,0.15)",
                  border: "1px solid rgba(239,68,68,0.4)",
                  borderRadius: 8,
                  padding: "6px 12px",
                  color: "#f87171",
                  fontSize: 11,
                  fontWeight: 800,
                  cursor: "pointer",
                }}
              >
                End
              </button>
            </div>

            <div
              ref={chatScrollRef}
              style={{
                flex: 1,
                overflowY: "auto",
                padding: "0 4px 8px 0",
                WebkitMaskImage: "linear-gradient(to bottom, transparent 0%, rgba(0,0,0,0.35) 10%, black 28%, black 100%)",
                maskImage: "linear-gradient(to bottom, transparent 0%, rgba(0,0,0,0.35) 10%, black 28%, black 100%)",
                scrollbarWidth: "none",
              }}
            >
              <div style={{ minHeight: "100%", display: "flex", flexDirection: "column", justifyContent: "flex-end", gap: 14, paddingTop: 60 }}>
                {liveMessages.length === 0 && !interimUserText ? (
                  <span style={{ opacity: 0.36, fontSize: 14, fontStyle: "italic", color: "#94a3b8", lineHeight: 1.6 }}>
                    {'Try asking: "What does this body profile suggest about sport alignment?"'}
                  </span>
                ) : (
                  <>
                    {liveMessages.map((msg, index) => (
                      <div key={index} style={{ display: "flex", flexDirection: "column", alignItems: msg.role === "user" ? "flex-end" : "flex-start", gap: 4 }}>
                        <span style={{ color: msg.role === "user" ? "rgba(148,163,184,0.56)" : "rgba(96,165,250,0.66)", fontSize: 9, fontWeight: 800, letterSpacing: "0.12em", textTransform: "uppercase" }}>
                          {msg.role === "user" ? "You" : "AI Analyst"}
                        </span>
                        <div style={{ color: msg.role === "agent" ? "#f1f5f9" : "#cbd5e1", fontSize: msg.role === "agent" ? 16 : 13, lineHeight: 1.7, maxWidth: "100%", textAlign: msg.role === "user" ? "right" : "left" }}>
                          {msg.role === "agent" ? renderBodyLiveText(msg.text) : <span style={{ fontStyle: "italic" }}>{msg.text}</span>}
                        </div>
                      </div>
                    ))}
                    {interimUserText && (
                      <div style={{ display: "flex", flexDirection: "column", alignItems: "flex-end", gap: 4 }}>
                        <span style={{ color: "rgba(148,163,184,0.6)", fontSize: 9, fontWeight: 800, letterSpacing: "0.12em", textTransform: "uppercase" }}>You</span>
                        <div style={{ fontSize: 13, color: "rgba(226,232,240,0.78)", lineHeight: 1.7, fontStyle: "italic", textAlign: "right", padding: "6px 10px", background: "rgba(148,163,184,0.08)", borderRadius: "14px 14px 4px 14px", border: "1px solid rgba(148,163,184,0.15)", animation: "body-interim-pulse 1.4s ease-in-out infinite" }}>
                          {interimUserText}<span style={{ opacity: 0.5, marginLeft: 4 }}>▋</span>
                        </div>
                      </div>
                    )}
                  </>
                )}
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <style>{`
        @keyframes body-ring-pulse {
          0%, 100% { transform: scale(1); opacity: 1; }
          50% { transform: scale(1.08); opacity: 0.85; }
        }
        @keyframes body-pulse {
          0%, 100% { opacity: 1; }
          50% { opacity: 0.5; }
        }
        @keyframes body-interim-pulse {
          0%, 100% { border-color: rgba(148,163,184,0.15); box-shadow: none; }
          50% { border-color: rgba(148,163,184,0.4); box-shadow: 0 0 8px rgba(148,163,184,0.12); }
        }
      `}</style>
    </motion.div>
  );
}
