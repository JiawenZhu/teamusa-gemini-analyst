"use client";

import { useRef, useMemo, useEffect, Suspense } from "react";
import { Canvas, useFrame } from "@react-three/fiber";
import { Environment, OrbitControls, Preload, useGLTF } from "@react-three/drei";
import * as THREE from "three";
import { motion } from "framer-motion";
import type { MatchResult } from "@/lib/api";

const BODY_MODEL_PATH = "/models/gltf/Xbot.glb";

// ─── Helper: clamp a value between min and max ───────────────────────────────
function clamp(v: number, min: number, max: number) {
  return Math.max(min, Math.min(max, v));
}

// ─── Helper: linear interpolation for figure proportions ─────────────────────
// Maps a real measurement to a 0–1 scale for rendering
function norm(val: number, lo: number, hi: number) {
  return clamp((val - lo) / (hi - lo), 0, 1);
}

// ─── The 3D human figure using a GLTF model ───────────────────────────────────
function HumanFigure({
  heightFactor,
  widthFactor,
  color,
  autoRotate = true,
  scanMode = false,
}: {
  heightFactor: number;
  widthFactor: number;
  color: string;
  autoRotate?: boolean;
  scanMode?: boolean;
}) {
  const { scene } = useGLTF(BODY_MODEL_PATH);
  const clonedScene = useMemo(() => scene.clone(true), [scene]);
  const groupRef = useRef<THREE.Group>(null!);

  // Parse the CSS hex color
  const [cr, cg, cb] = useMemo(() => {
    const c = new THREE.Color(color);
    return [c.r, c.g, c.b];
  }, [color]);

  // PBR-ready material. Swap only the GLB path when a more anatomical asset is provided.
  const mat = useMemo(() => new THREE.MeshPhysicalMaterial({
    color: scanMode ? new THREE.Color("#9ca3af") : new THREE.Color(cr * 0.55, cg * 0.55, cb * 0.65),
    emissive: scanMode ? new THREE.Color("#111827") : new THREE.Color(cr * 0.18, cg * 0.18, cb * 0.22),
    emissiveIntensity: scanMode ? 0.08 : 0.55,
    roughness: scanMode ? 0.68 : 0.42,
    metalness: scanMode ? 0.0 : 0.08,
    clearcoat: scanMode ? 0.08 : 0.35,
    clearcoatRoughness: scanMode ? 0.72 : 0.28,
  }), [cr, cg, cb, scanMode]);

  // Apply material and initial scaling
  useEffect(() => {
    clonedScene.traverse((child) => {
      if ((child as THREE.Mesh).isMesh) {
        (child as THREE.Mesh).material = mat;
      }
    });
  }, [clonedScene, mat]);

  // Skeletal Scaling Logic
  useFrame((_, delta) => {
    if (!groupRef.current) return;

    if (autoRotate) groupRef.current.rotation.y += delta * 0.25;

    // Dynamic Skeletal Scaling
    // Xbot bone names (Standard Mixamo Rig)
    const bones: Record<string, THREE.Bone> = {};
    clonedScene.traverse((child) => {
      if ((child as THREE.Bone).isBone) {
        bones[child.name] = child as THREE.Bone;
      }
    });

    if (bones["mixamorig_Hips"]) {
      // Height affects Y-scale of hips/spine
      const hScale = 0.85 + heightFactor * 0.3; // 0.85 to 1.15
      bones["mixamorig_Hips"].scale.y = hScale;

      // Width affects X/Z scale
      const wScale = 0.8 + widthFactor * 0.5; // 0.8 to 1.3
      bones["mixamorig_Hips"].scale.x = wScale;
      bones["mixamorig_Hips"].scale.z = wScale;

      // Compensate spine for width to avoid extreme bulging if needed, 
      // but usually hips scale propagates down.
    }
  });

  return (
    <group ref={groupRef} position={[0, -2, 0]} scale={[1.8, 1.8, 1.8]}>
      <primitive object={clonedScene} />
    </group>
  );
}

// ─── Scene lighting ───────────────────────────────────────────────────────────
function Lights({ color, immersive = false }: { color: string; immersive?: boolean }) {
  return (
    <>
      <ambientLight intensity={immersive ? 0.52 : 0.34} />
      <directionalLight position={[3.5, 6, 5]} intensity={immersive ? 2.4 : 1.8} color="#ffffff" castShadow />
      <spotLight position={[-3, 5, 4]} angle={0.38} penumbra={0.75} intensity={immersive ? 1.8 : 1.2} color="#f8fafc" />
      <pointLight position={[0, 2, -4]} intensity={immersive ? 0.85 : 0.45} color={color} />
    </>
  );
}

// ─── The full 3D scene ────────────────────────────────────────────────────────
export function MirrorScene({
  heightFactor,
  widthFactor,
  color,
  immersive = false,
}: {
  heightFactor: number;
  widthFactor: number;
  color: string;
  immersive?: boolean;
}) {
  return (
    <Suspense fallback={null}>
      <Environment preset="studio" />
      <Lights color={color} immersive={immersive} />
      <HumanFigure heightFactor={heightFactor} widthFactor={widthFactor} color={color} autoRotate={!immersive} />
      <OrbitControls
        enableZoom={true}
        enablePan={immersive}
        enableRotate={true}
        rotateSpeed={immersive ? 0.35 : 0.5}
        zoomSpeed={0.7}
        minDistance={immersive ? 1.8 : 3}
        maxDistance={immersive ? 12 : 10}
        enableDamping
        dampingFactor={0.08}
      />
      <Preload all />
    </Suspense>
  );
}

// ─── Stat badge (sports-card style) ──────────────────────────────────────────
function StatBadge({
  icon, label, value, delay, color,
}: {
  icon: string; label: string; value: string; delay: number; color: string;
}) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20, scale: 0.85 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      transition={{ delay, type: "spring", stiffness: 200, damping: 18 }}
      style={{
        background: "#ffffff",
        border: `1px solid ${color}30`,
        borderTop: `3px solid ${color}`,
        borderRadius: 14,
        padding: "12px 16px",
        minWidth: 120,
        boxShadow: `0 4px 20px ${color}15`,
        textAlign: "center",
      }}
    >
      <div style={{ fontSize: 22, marginBottom: 4 }}>{icon}</div>
      <div style={{ fontSize: 18, fontWeight: 900, color: "#0f172a", letterSpacing: "-0.03em" }}>
        {value}
      </div>
      <div style={{ fontSize: 10, fontWeight: 700, color: "#94a3b8", textTransform: "uppercase", letterSpacing: "0.08em", marginTop: 2 }}>
        {label}
      </div>
    </motion.div>
  );
}

// ─── BMI zone label ───────────────────────────────────────────────────────────
function bmiZone(bmi: number): string {
  if (bmi < 18.5) return "Lean";
  if (bmi < 23)   return "Athletic";
  if (bmi < 27)   return "Power";
  return "Strength";
}

// ─── Main exported component ──────────────────────────────────────────────────
export function BiometricMirror({
  result,
  userHeight,
  userWeight,
  onOpenFullscreen,
}: {
  result: MatchResult;
  userHeight: number;
  userWeight: number;
  onOpenFullscreen?: () => void;
}) {
  const color = result.archetype.color ?? "#6366f1";
  const heightFactor = norm(userHeight, 155, 210);
  const widthFactor  = norm(userWeight, 45,  130);
  const centroids    = result.all_centroids ?? [];
  const heightPct    = result.height_percentile ?? 0.5;
  const athleteCount = result.archetype.athlete_count ?? 0;

  const badges = [
    { icon: "📏", label: "Height Rank",  value: `Top ${Math.round((1 - heightPct) * 100)}%`,  delay: 0.6 },
    { icon: "⚡", label: "Weight Class", value: result.archetype.label,                         delay: 0.75 },
    { icon: "🧬", label: "BMI Zone",     value: bmiZone(result.user_bmi),                        delay: 0.9 },
    { icon: "👥", label: "Cluster Size", value: `${athleteCount.toLocaleString()} athletes`,    delay: 1.05 },
  ];

  return (
    <section
      id="body-mirror-section"
      style={{
        background: "linear-gradient(180deg, #020617 0%, #0f172a 100%)",
        padding: "80px 24px",
        position: "relative",
        overflow: "hidden",
      }}
    >
      {/* Background glow */}
      <div
        style={{
          position: "absolute",
          inset: 0,
          background: `radial-gradient(ellipse at 50% 30%, ${color}20 0%, transparent 65%)`,
          pointerEvents: "none",
        }}
      />

      <div style={{ maxWidth: 1100, margin: "0 auto", position: "relative", zIndex: 1 }}>
        {/* Section header */}
        <motion.div
          initial={{ opacity: 0, y: -16 }}
          animate={{ opacity: 1, y: 0 }}
          style={{ textAlign: "center", marginBottom: 48 }}
        >
          <div style={{
            display: "inline-flex", alignItems: "center", gap: 8,
            background: `${color}18`, border: `1px solid ${color}40`,
            borderRadius: 999, padding: "6px 18px", marginBottom: 20,
          }}>
            <span style={{ fontSize: 10, fontWeight: 800, color, textTransform: "uppercase", letterSpacing: "0.1em" }}>
              🧬 Your DNA Mirror
            </span>
          </div>
          <h2 style={{ fontSize: 40, fontWeight: 900, color: "#ffffff", letterSpacing: "-0.03em", margin: 0 }}>
            {result.archetype.icon} {result.archetype.label}
          </h2>
          <p style={{ color: "#94a3b8", fontSize: 16, fontWeight: 500, marginTop: 12, maxWidth: 480, margin: "12px auto 0" }}>
            {result.percentile_note}
          </p>
        </motion.div>

        {/* Main layout: figure left, badges right */}
        <div style={{ display: "flex", flexWrap: "wrap", gap: 40, alignItems: "flex-start", justifyContent: "center" }}>

          {/* Three.js Canvas */}
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.2, type: "spring", stiffness: 120, damping: 14 }}
            style={{
              width: 380, height: 500, borderRadius: 32, overflow: "hidden",
              border: `1px solid ${color}30`,
              boxShadow: `0 0 80px ${color}25`,
              background: "#020617",
              flexShrink: 0,
              position: "relative",
              cursor: onOpenFullscreen ? "pointer" : "default",
            }}
            onClick={onOpenFullscreen}
          >
            <Canvas
              camera={{ position: [0, 0, 6], fov: 45 }}
              dpr={[1, 2]}
              gl={{ antialias: true, alpha: true }}
              style={{ background: "transparent" }}
            >
              <MirrorScene
                heightFactor={heightFactor}
                widthFactor={widthFactor}
                color={color}
              />
            </Canvas>
            {onOpenFullscreen && (
              <div
                style={{
                  position: "absolute",
                  left: "50%",
                  bottom: 18,
                  transform: "translateX(-50%)",
                  padding: "8px 14px",
                  borderRadius: 999,
                  border: "1px solid rgba(255,255,255,0.14)",
                  background: "rgba(15,23,42,0.72)",
                  backdropFilter: "blur(14px)",
                  color: "#dbeafe",
                  fontSize: 10,
                  fontWeight: 900,
                  letterSpacing: "0.14em",
                  textTransform: "uppercase",
                  pointerEvents: "none",
                }}
              >
                Click for immersive body view
              </div>
            )}
          </motion.div>

          {/* Right side: stats + cluster legend */}
          <div style={{ flex: 1, minWidth: 280 }}>
            {/* Biometric readout */}
            <motion.div
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.35 }}
              style={{
                background: `${color}0a`,
                border: `1px solid ${color}25`,
                borderRadius: 20,
                padding: "24px 28px",
                marginBottom: 24,
              }}
            >
              <p style={{ fontSize: 10, fontWeight: 800, color, textTransform: "uppercase", letterSpacing: "0.1em", margin: "0 0 12px" }}>
                Your Profile
              </p>
              <div style={{ fontSize: 32, fontWeight: 900, color: "#ffffff", letterSpacing: "-0.04em" }}>
                {userHeight}cm · {userWeight}kg
              </div>
              <div style={{ fontSize: 14, color: "#64748b", fontWeight: 600, marginTop: 6 }}>
                BMI {result.user_bmi} · {bmiZone(result.user_bmi)} Zone
              </div>
            </motion.div>

            {/* Stat badges grid */}
            <div style={{ display: "flex", flexWrap: "wrap", gap: 12, marginBottom: 28 }}>
              {badges.map(b => (
                <StatBadge key={b.label} icon={b.icon} label={b.label} value={b.value} delay={b.delay} color={color} />
              ))}
            </div>

            {/* Cluster legend */}
            {centroids.length > 0 && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 1.2 }}
                style={{
                  background: "rgba(255,255,255,0.04)",
                  border: "1px solid rgba(255,255,255,0.08)",
                  borderRadius: 16,
                  padding: "16px 20px",
                }}
              >
                <p style={{ fontSize: 10, fontWeight: 800, color: "#64748b", textTransform: "uppercase", letterSpacing: "0.1em", margin: "0 0 12px" }}>
                  6 Archetype Clusters
                </p>
                <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
                  {centroids.map((c, i) => (
                    <div
                      key={i}
                      style={{
                        display: "flex", alignItems: "center", gap: 6,
                        background: c.is_user_cluster ? `${color}20` : "rgba(255,255,255,0.04)",
                        border: `1px solid ${c.is_user_cluster ? color + "60" : "rgba(255,255,255,0.08)"}`,
                        borderRadius: 999, padding: "4px 10px",
                      }}
                    >
                      <div style={{
                        width: 7, height: 7, borderRadius: "50%",
                        background: c.is_user_cluster ? color : "#475569",
                        boxShadow: c.is_user_cluster ? `0 0 6px ${color}` : "none",
                      }} />
                      <span style={{ fontSize: 10, fontWeight: 700, color: c.is_user_cluster ? "#ffffff" : "#64748b" }}>
                        {c.archetype_id.replace(/_/g, " ")}
                      </span>
                    </div>
                  ))}
                </div>
              </motion.div>
            )}
          </div>
        </div>
      </div>
    </section>
  );
}

useGLTF.preload(BODY_MODEL_PATH);
