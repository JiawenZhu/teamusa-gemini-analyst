"use client";
import React, { useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import { Html } from '@react-three/drei';
import * as THREE from 'three';

const EARTH_RADIUS = 2;

export interface OlympicCity {
  city: string;
  lat: number;
  lng: number;
  years: number[];
  usa_medals: number;
  total_medals: number;
  season: string;
}

function latLngToVec3(lat: number, lng: number, r: number): THREE.Vector3 {
  const phi   = (90 - lat) * (Math.PI / 180);
  const theta = (lng + 180) * (Math.PI / 180);
  return new THREE.Vector3(
    -r * Math.sin(phi) * Math.cos(theta),
     r * Math.cos(phi),
     r * Math.sin(phi) * Math.sin(theta)
  );
}

/** Medal count → colour tier */
function medalColor(medals: number): string {
  if (medals >= 300) return '#FFD700';
  if (medals >= 150) return '#C0C0C0';
  if (medals >= 50)  return '#CD7F32';
  return '#60a5fa';
}

/** Dot radius: 0.014 – 0.038 based on medals */
function pinSize(medals: number, max: number): number {
  const norm = Math.sqrt(medals / Math.max(max, 1));
  return 0.014 + norm * 0.024;
}

interface PinProps {
  city: OlympicCity;
  max: number;
  hovered: boolean;
  onHover: (c: OlympicCity | null) => void;
  onSelect: (c: OlympicCity) => void;
}

function OlympicPin({ city, max, hovered, onHover, onSelect }: PinProps) {
  const ringRef = useRef<THREE.Mesh>(null!);
  const pos     = latLngToVec3(city.lat, city.lng, EARTH_RADIUS + 0.015);
  const color   = medalColor(city.usa_medals);
  const size    = pinSize(city.usa_medals, max);

  const normal = pos.clone().normalize();
  const quat   = new THREE.Quaternion().setFromUnitVectors(
    new THREE.Vector3(0, 0, 1), normal
  );

  useFrame(({ clock }) => {
    if (!ringRef.current) return;
    const t  = clock.getElapsedTime();
    const s  = 1 + ((t * 0.6) % 1) * 2.2;
    const op = 1 - ((t * 0.6) % 1);
    ringRef.current.scale.set(s, s, 1);
    (ringRef.current.material as THREE.MeshBasicMaterial).opacity =
      op * (hovered ? 0.9 : 0.45);
  });

  return (
    <group
      position={pos}
      quaternion={quat}
      onPointerOver={e => { e.stopPropagation(); onHover(city); }}
      onPointerOut={() => onHover(null)}
      onClick={e => { e.stopPropagation(); onSelect(city); }}
    >
      {/* Core dot */}
      <mesh>
        <circleGeometry args={[size, 20]} />
        <meshBasicMaterial color={hovered ? '#ffffff' : color} />
      </mesh>

      {/* Pulse ring */}
      <mesh ref={ringRef}>
        <ringGeometry args={[size * 1.3, size * 1.9, 28]} />
        <meshBasicMaterial color={color} transparent opacity={0.6} side={THREE.DoubleSide} />
      </mesh>

      {/*
       * ─── TOOLTIP ──────────────────────────────────────────────────────
       * Only rendered for the ONE hovered city.
       * pointerEvents: 'auto' so the card itself is clickable / double-clickable.
       */}
      {hovered && (
        <Html
          position={[0, size * 7, 0]}
          center
          distanceFactor={4}
          zIndexRange={[100, 0]}
        >
          <div
            onClick={() => onSelect(city)}
            style={{
              background: 'rgba(2,8,23,0.96)',
              border: `1.5px solid ${color}`,
              borderRadius: 14,
              padding: '14px 18px',
              minWidth: 220,
              cursor: 'pointer',
              pointerEvents: 'auto',
              boxShadow: `0 0 24px ${color}50, 0 8px 32px rgba(0,0,0,0.5)`,
              userSelect: 'none',
              fontFamily: 'system-ui, -apple-system, sans-serif',
              animation: 'tooltipFadeIn 0.15s ease-out',
            }}
          >
            {/* Season + City name */}
            <div style={{ fontSize: 18, fontWeight: 900, color: '#f1f5f9', marginBottom: 4 }}>
              {city.season === 'Winter' ? '❄️' : '☀️'} {city.city}
            </div>

            {/* Years */}
            <div style={{ fontSize: 12, color: '#64748b', marginBottom: 10 }}>
              {city.years.join(' · ')}
            </div>

            {/* USA medals */}
            <div style={{
              display: 'inline-flex', alignItems: 'center', gap: 6,
              background: `${color}18`, border: `1px solid ${color}40`,
              borderRadius: 8, padding: '5px 10px',
              marginBottom: 10,
            }}>
              <span style={{ fontSize: 16 }}>🥇</span>
              <span style={{ fontSize: 15, fontWeight: 800, color }}>
                {city.usa_medals} USA medals
              </span>
            </div>

            {/* Double-click hint */}
            <div style={{
              fontSize: 11, color: '#3b82f6',
              fontWeight: 600, marginTop: 4,
              display: 'flex', alignItems: 'center', gap: 4,
            }}>
              Click to explore →
            </div>
          </div>

          {/* Inject fade-in animation */}
          <style>{`
            @keyframes tooltipFadeIn {
              from { opacity: 0; transform: translateY(6px) scale(0.95); }
              to   { opacity: 1; transform: translateY(0) scale(1); }
            }
          `}</style>
        </Html>
      )}
    </group>
  );
}

interface AllOlympicCityPinsProps {
  cities: OlympicCity[];
  hoveredCity: OlympicCity | null;
  onHover: (c: OlympicCity | null) => void;
  onSelect: (c: OlympicCity) => void;
}

export default function AllOlympicCityPins({
  cities, hoveredCity, onHover, onSelect,
}: AllOlympicCityPinsProps) {
  const max = Math.max(...cities.map(c => c.usa_medals), 1);
  return (
    <group>
      {cities.map(c => (
        <OlympicPin
          key={c.city}
          city={c}
          max={max}
          hovered={hoveredCity?.city === c.city}
          onHover={onHover}
          onSelect={onSelect}
        />
      ))}
    </group>
  );
}
