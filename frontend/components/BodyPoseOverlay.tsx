"use client";

import React, { useEffect, useRef, useState } from "react";

type Landmark = { x: number; y: number; z?: number; visibility?: number };

export type PoseArchetypeId =
  | "aerobic_engine"
  | "powerhouse"
  | "explosive_athlete"
  | "precision_maestro"
  | "aquatic_titan"
  | "agile_competitor";

export type PoseMatch = {
  archetypeId: PoseArchetypeId;
  label: string;
  cue: string;
  confidence: number;
};

const POSE_COPY: Record<PoseArchetypeId, { label: string; cue: string; icon: string }> = {
  aerobic_engine: { label: "Aerobic Engine", cue: "Runner arms", icon: "🏃" },
  powerhouse: { label: "Powerhouse", cue: "Power V", icon: "💪" },
  explosive_athlete: { label: "Explosive Athlete", cue: "Launch guard", icon: "⚡" },
  precision_maestro: { label: "Precision Maestro", cue: "Aim pose", icon: "🎯" },
  aquatic_titan: { label: "Aquatic Titan", cue: "Streamline", icon: "🏊" },
  agile_competitor: { label: "Agile Competitor", cue: "T control", icon: "🧠" },
};

const TRACKED_POSE_IDS: PoseArchetypeId[] = [
  "powerhouse",
  "aquatic_titan",
  "precision_maestro",
  "agile_competitor",
];

const CONNECTIONS = [
  [11, 12], [11, 13], [13, 15], [12, 14], [14, 16],
  [11, 23], [12, 24], [23, 24],
];

function dist(a: Landmark, b: Landmark) {
  return Math.hypot(a.x - b.x, a.y - b.y);
}

function visible(...points: Array<Landmark | undefined>) {
  return points.every(point => point && (point.visibility ?? 1) > 0.45);
}

function classifyPose(lm: Landmark[]): PoseMatch | null {
  const nose = lm[0];
  const leftShoulder = lm[11];
  const rightShoulder = lm[12];
  const leftElbow = lm[13];
  const rightElbow = lm[14];
  const leftWrist = lm[15];
  const rightWrist = lm[16];
  const leftHip = lm[23];
  const rightHip = lm[24];

  if (!visible(nose, leftShoulder, rightShoulder, leftElbow, rightElbow, leftWrist, rightWrist, leftHip, rightHip)) return null;

  const shoulderWidth = Math.max(dist(leftShoulder, rightShoulder), 0.08);
  const hipY = (leftHip.y + rightHip.y) / 2;
  const shoulderY = (leftShoulder.y + rightShoulder.y) / 2;
  const torsoHeight = Math.abs(hipY - shoulderY);
  if (shoulderWidth < 0.1 || shoulderWidth > 0.58 || torsoHeight < 0.1 || torsoHeight > 0.58) return null;
  if (nose.y > shoulderY + shoulderWidth * 0.35 || hipY < shoulderY + shoulderWidth * 0.55) return null;

  const wristDistance = dist(leftWrist, rightWrist);
  const bothHandsAboveHead = leftWrist.y < nose.y && rightWrist.y < nose.y;
  const bothHandsAboveShoulders = leftWrist.y < shoulderY - shoulderWidth * 0.18 && rightWrist.y < shoulderY - shoulderWidth * 0.18;
  const handsClose = wristDistance < shoulderWidth * 0.92;

  if (bothHandsAboveHead && handsClose) {
    return { archetypeId: "aquatic_titan", confidence: 0.92, ...POSE_COPY.aquatic_titan };
  }
  if (bothHandsAboveShoulders && wristDistance > shoulderWidth * 1.35) {
    return { archetypeId: "powerhouse", confidence: 0.88, ...POSE_COPY.powerhouse };
  }

  const leftArmExtended = dist(leftShoulder, leftWrist) > shoulderWidth * 1.25 && Math.abs(leftWrist.y - leftShoulder.y) < shoulderWidth * 0.45;
  const rightArmExtended = dist(rightShoulder, rightWrist) > shoulderWidth * 1.25 && Math.abs(rightWrist.y - rightShoulder.y) < shoulderWidth * 0.45;
  if (leftArmExtended && rightArmExtended) {
    return { archetypeId: "agile_competitor", confidence: 0.84, ...POSE_COPY.agile_competitor };
  }
  if (leftArmExtended !== rightArmExtended) {
    return { archetypeId: "precision_maestro", confidence: 0.8, ...POSE_COPY.precision_maestro };
  }

  return null;
}

function point(canvas: HTMLCanvasElement, landmark: Landmark) {
  return { x: (1 - landmark.x) * canvas.width, y: landmark.y * canvas.height };
}

function drawSkeleton(
  canvas: HTMLCanvasElement,
  lm: Landmark[],
  match: PoseMatch | null,
  progress: number,
  pulse: boolean,
) {
  const ctx = canvas.getContext("2d");
  if (!ctx) return;

  ctx.fillStyle = "rgba(2,6,23,0.22)";
  ctx.fillRect(0, 0, canvas.width, canvas.height);

  const color = match ? "#facc15" : "#60a5fa";
  const glow = match ? "rgba(250,204,21,0.7)" : "rgba(96,165,250,0.42)";

  if (pulse) {
    ctx.fillStyle = "rgba(250,204,21,0.10)";
    ctx.fillRect(0, 0, canvas.width, canvas.height);
  }

  ctx.save();
  ctx.shadowColor = glow;
  ctx.shadowBlur = match ? 24 : 14;
  ctx.lineCap = "round";
  ctx.lineJoin = "round";

  for (const [a, b] of CONNECTIONS) {
    const pa = lm[a];
    const pb = lm[b];
    if (!visible(pa, pb)) continue;
    const start = point(canvas, pa);
    const end = point(canvas, pb);
    ctx.beginPath();
    ctx.moveTo(start.x, start.y);
    ctx.lineTo(end.x, end.y);
    ctx.strokeStyle = color;
    ctx.lineWidth = match ? 5 : 3;
    ctx.stroke();
  }

  for (const p of lm) {
    if (!visible(p)) continue;
    const pp = point(canvas, p);
    ctx.beginPath();
    ctx.arc(pp.x, pp.y, match ? 6 : 4, 0, Math.PI * 2);
    ctx.fillStyle = color;
    ctx.fill();
  }
  ctx.restore();

  const centerX = canvas.width / 2;
  const top = 90;
  ctx.beginPath();
  ctx.arc(centerX, top, 34, -Math.PI / 2, -Math.PI / 2 + Math.PI * 2 * progress);
  ctx.strokeStyle = match ? "#facc15" : "rgba(96,165,250,0.56)";
  ctx.lineWidth = 5;
  ctx.stroke();
}

export default function BodyPoseOverlay({
  active,
  fullScreen = false,
  color = "#60a5fa",
  onPoseMatch,
  onPosePreview,
}: {
  active: boolean;
  fullScreen?: boolean;
  color?: string;
  onPoseMatch: (match: PoseMatch) => void;
  onPosePreview?: (match: PoseMatch | null, progress: number) => void;
}) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const landmarkerRef = useRef<unknown>(null);
  const rafId = useRef(0);
  const stableRef = useRef<{ id: PoseArchetypeId | null; frames: number }>({ id: null, frames: 0 });
  const lastEmitRef = useRef<PoseArchetypeId | null>(null);
  const pulseUntilRef = useRef(0);
  const [status, setStatus] = useState("");
  const [match, setMatch] = useState<PoseMatch | null>(null);
  const [progress, setProgress] = useState(0);

  useEffect(() => {
    if (!active) return;
    let cancelled = false;

    async function init() {
      try {
        setStatus("Loading pose model...");
        const { FilesetResolver, PoseLandmarker } = await import("@mediapipe/tasks-vision");
        const vision = await FilesetResolver.forVisionTasks("https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@latest/wasm");
        const landmarker = await PoseLandmarker.createFromOptions(vision, {
          baseOptions: {
            modelAssetPath: "https://storage.googleapis.com/mediapipe-models/pose_landmarker/pose_landmarker_lite/float16/latest/pose_landmarker_lite.task",
            delegate: "GPU",
          },
          runningMode: "VIDEO",
          numPoses: 1,
        });
        if (cancelled) {
          landmarker.close();
          return;
        }
        landmarkerRef.current = landmarker;

        const stream = await navigator.mediaDevices.getUserMedia({
          video: { width: fullScreen ? 1280 : 360, height: fullScreen ? 720 : 270, facingMode: "user" },
        });
        if (cancelled) {
          stream.getTracks().forEach(track => track.stop());
          return;
        }
        streamRef.current = stream;
        if (videoRef.current) {
          videoRef.current.srcObject = stream;
          await videoRef.current.play();
        }
        setStatus("Body tracking active");

        function loop(now: number) {
          if (cancelled) return;
          rafId.current = requestAnimationFrame(loop);
          if (!videoRef.current || !canvasRef.current || !landmarkerRef.current) return;

          const canvas = canvasRef.current;
          const rect = canvas.getBoundingClientRect();
          const dpr = window.devicePixelRatio || 1;
          const nextWidth = Math.max(1, Math.floor(rect.width * dpr));
          const nextHeight = Math.max(1, Math.floor(rect.height * dpr));
          if (canvas.width !== nextWidth || canvas.height !== nextHeight) {
            canvas.width = nextWidth;
            canvas.height = nextHeight;
          }

          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          const result = (landmarkerRef.current as any).detectForVideo(videoRef.current, now);
          const landmarks = result.landmarks?.[0] as Landmark[] | undefined;
          if (!landmarks) {
            setMatch(null);
            setProgress(0);
            onPosePreview?.(null, 0);
            stableRef.current = { id: null, frames: 0 };
            const ctx = canvas.getContext("2d");
            if (ctx) {
              ctx.fillStyle = "rgba(2,6,23,0.18)";
              ctx.fillRect(0, 0, canvas.width, canvas.height);
            }
            return;
          }

          const nextMatch = classifyPose(landmarks);
          if (!nextMatch) {
            stableRef.current = { id: null, frames: 0 };
          } else if (stableRef.current.id === nextMatch.archetypeId) {
            stableRef.current.frames += 1;
          } else {
            stableRef.current = { id: nextMatch.archetypeId, frames: 1 };
          }

          const nextProgress = Math.min(stableRef.current.frames / 6, 1);
          setMatch(nextMatch);
          setProgress(nextProgress);
          onPosePreview?.(nextMatch, nextProgress);

          if (nextMatch && stableRef.current.frames >= 6 && lastEmitRef.current !== nextMatch.archetypeId) {
            lastEmitRef.current = nextMatch.archetypeId;
            pulseUntilRef.current = Date.now() + 850;
            onPoseMatch(nextMatch);
          }

          drawSkeleton(canvas, landmarks, nextMatch, nextProgress, Date.now() < pulseUntilRef.current);
        }
        rafId.current = requestAnimationFrame(loop);
      } catch (error) {
        setStatus(error instanceof Error ? error.message : "Pose tracking failed");
      }
    }

    init();
    return () => {
      cancelled = true;
      cancelAnimationFrame(rafId.current);
      streamRef.current?.getTracks().forEach(track => track.stop());
      streamRef.current = null;
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      (landmarkerRef.current as any)?.close?.();
      landmarkerRef.current = null;
      stableRef.current = { id: null, frames: 0 };
      lastEmitRef.current = null;
      setMatch(null);
      setProgress(0);
      setStatus("");
    };
  }, [active, fullScreen, onPoseMatch, onPosePreview]);

  if (!active) return null;

  if (fullScreen) {
    return (
      <div style={{ position: "absolute", inset: 0, zIndex: 20, background: "radial-gradient(circle at 50% 45%, rgba(15,23,42,0.56), rgba(2,6,23,0.94))" }}>
        <video ref={videoRef} muted playsInline style={{ position: "absolute", inset: 0, width: "100%", height: "100%", objectFit: "cover", transform: "scaleX(-1)", opacity: 0.08 }} />
        <canvas ref={canvasRef} style={{ position: "absolute", inset: 0, width: "100%", height: "100%" }} />

        <div style={{ position: "absolute", top: 128, left: "50%", transform: "translateX(-50%)", textAlign: "center", pointerEvents: "none" }}>
          <div style={{ display: "inline-flex", alignItems: "center", gap: 10, padding: "8px 14px", borderRadius: 999, border: `1px solid ${match ? "#facc15" : color}55`, background: "rgba(2,6,23,0.62)", color: match ? "#fde68a" : "#bfdbfe", fontSize: 12, fontWeight: 900, letterSpacing: "0.12em", textTransform: "uppercase" }}>
            {match ? `${POSE_COPY[match.archetypeId].icon} ${match.cue} detected` : status || "Move into frame"}
          </div>
          <div style={{ marginTop: 12, color: "rgba(226,232,240,0.68)", fontSize: 13, fontWeight: 750 }}>
            Keep your head, shoulders, elbows, and hands in frame
          </div>
        </div>

        <div style={{ position: "absolute", right: 24, bottom: 24, width: 210, border: "1px solid rgba(148,163,184,0.22)", borderRadius: 16, padding: 12, background: "rgba(2,8,23,0.78)", backdropFilter: "blur(12px)", color: "#94a3b8", fontSize: 10, lineHeight: 1.8 }}>
          <div style={{ color: "#f8fafc", fontWeight: 900, marginBottom: 6 }}>Upper-Body Poses</div>
          {TRACKED_POSE_IDS.map((id) => {
            const copy = POSE_COPY[id];
            return (
            <div key={id} style={{ color: match?.archetypeId === id ? "#fde68a" : "#94a3b8", fontWeight: match?.archetypeId === id ? 900 : 650 }}>
              {copy.icon} {copy.cue} - {copy.label}
            </div>
            );
          })}
        </div>
      </div>
    );
  }

  return (
    <div style={{ position: "fixed", bottom: 24, right: 24, zIndex: 10000, display: "flex", flexDirection: "column", alignItems: "flex-end", gap: 8 }}>
      <div style={{ background: match ? "rgba(250,204,21,0.16)" : "rgba(16,185,129,0.15)", border: `1px solid ${match ? "#facc15" : "#10b981"}55`, borderRadius: 20, padding: "5px 12px", fontSize: 11, color: match ? "#fde68a" : "#86efac", fontWeight: 850, backdropFilter: "blur(8px)" }}>
        {match ? `${match.label} ${Math.round(progress * 100)}%` : status || "Starting body tracking..."}
      </div>
      <div style={{ position: "relative", width: 180, height: 135, borderRadius: 14, overflow: "hidden", border: "2px solid rgba(96,165,250,0.32)", boxShadow: "0 4px 24px rgba(0,0,0,0.42)", background: "#020617" }}>
        <video ref={videoRef} muted playsInline style={{ transform: "scaleX(-1)", display: "block", width: "100%", height: "100%", objectFit: "cover", opacity: 0.3 }} />
        <canvas ref={canvasRef} style={{ position: "absolute", inset: 0, width: "100%", height: "100%" }} />
      </div>
    </div>
  );
}
