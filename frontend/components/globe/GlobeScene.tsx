"use client";
import React, { Suspense, useRef, useEffect } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import { OrbitControls, Stars } from '@react-three/drei';
import * as THREE from 'three';
import EarthSphere from './EarthSphere';
import CityMarkers from './CityMarkers';
import FlightArc from './FlightArc';

const LA = { lat: 34.0522, lng: -118.2437 };

interface GlobeSceneProps {
  userLocation?: { lat: number; lng: number; city?: string } | null;
  triggerCity?: { lat: number; lng: number; city?: string } | null;
}

// Convert lng to Earth group Y rotation so that city faces the camera (+Z axis)
function lngToRotationY(lng: number): number {
  // Camera looks along -Z. The sphere maps lng=0 → -X side by default.
  // This offset centres the city facing the camera at rest.
  return -(lng * Math.PI / 180) - Math.PI / 2;
}

// ─── Single rotating group with smart fly-to ────────────────────────────────
function EarthGroup({ userLocation, triggerCity }: GlobeSceneProps) {
  const groupRef = useRef<THREE.Group>(null!);
  // Target Y rotation; null = free auto-spin
  const targetRotY = useRef<number | null>(null);
  const autoSpin = useRef(true);

  // When triggerCity changes, lock onto that city's longitude
  useEffect(() => {
    if (!triggerCity) {
      autoSpin.current = true;
      targetRotY.current = null;
      return;
    }
    autoSpin.current = false;
    // Calculate shortest-path target rotation from current rotation
    if (groupRef.current) {
      const rawTarget = lngToRotationY(triggerCity.lng);
      // Normalize to minimize rotation distance
      const current = groupRef.current.rotation.y;
      const diff = ((rawTarget - current) % (2 * Math.PI));
      // Prefer the short way around
      const shortDiff = diff > Math.PI ? diff - 2 * Math.PI : diff < -Math.PI ? diff + 2 * Math.PI : diff;
      targetRotY.current = current + shortDiff;
    }
    // After 8 seconds, resume auto-spin
    const timer = setTimeout(() => {
      autoSpin.current = true;
      targetRotY.current = null;
    }, 8000);
    return () => clearTimeout(timer);
  }, [triggerCity]);

  useFrame((_, delta) => {
    if (!groupRef.current) return;
    if (targetRotY.current !== null) {
      // Smooth lerp toward the target city (feels like the globe is "flying")
      const dist = targetRotY.current - groupRef.current.rotation.y;
      if (Math.abs(dist) < 0.002) {
        groupRef.current.rotation.y = targetRotY.current;
        targetRotY.current = null; // arrived — hold still until timer resumes spin
      } else {
        groupRef.current.rotation.y += dist * Math.min(delta * 3, 0.12);
      }
    } else if (autoSpin.current) {
      groupRef.current.rotation.y += delta * 0.04;
    }
  });

  return (
    <group ref={groupRef}>
      <EarthSphere />
      <CityMarkers userLocation={userLocation} triggerCity={triggerCity} />
      {userLocation && (
        <FlightArc
          fromLat={userLocation.lat}
          fromLng={userLocation.lng}
          toLat={LA.lat}
          toLng={LA.lng}
          color="#FFD700"
        />
      )}
    </group>
  );
}

function GlobeContent({ userLocation, triggerCity }: GlobeSceneProps) {
  return (
    <>
      <Stars radius={120} depth={60} count={8000} factor={5} saturation={0.3} fade speed={0.5} />
      {/* No lights needed — meshBasicMaterial renders raw texture colours */}
      <EarthGroup userLocation={userLocation} triggerCity={triggerCity} />
      <OrbitControls
        enableZoom={true}
        enablePan={false}
        enableRotate={true}
        rotateSpeed={0.5}
        zoomSpeed={0.7}
        autoRotate={false}
        minDistance={2.8}
        maxDistance={9}
        enableDamping
        dampingFactor={0.08}
      />
    </>
  );
}

export default function GlobeScene({ userLocation, triggerCity }: GlobeSceneProps) {
  return (
    <div style={{ width: '100%', height: '100%', minHeight: 480 }}>
      <Canvas
        camera={{ position: [0, 0, 5.5], fov: 45 }}
        dpr={[1, 2]}
        gl={{ antialias: true, alpha: true }}
        style={{ background: 'transparent' }}
      >
        <Suspense fallback={null}>
          <GlobeContent userLocation={userLocation} triggerCity={triggerCity} />
        </Suspense>
      </Canvas>
    </div>
  );
}
