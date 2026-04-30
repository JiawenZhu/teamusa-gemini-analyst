"use client";
import React, { useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import { Html } from '@react-three/drei';
import * as THREE from 'three';

const EARTH_RADIUS = 2;

function latLngToVector3(lat: number, lng: number, radius: number): THREE.Vector3 {
  const phi = (90 - lat) * (Math.PI / 180);
  const theta = (lng + 180) * (Math.PI / 180);
  return new THREE.Vector3(
    -radius * Math.sin(phi) * Math.cos(theta),
    radius * Math.cos(phi),
    radius * Math.sin(phi) * Math.sin(theta)
  );
}

interface MarkerProps {
  lat: number;
  lng: number;
  color: string;
  label: string;
}

function PulsingCityMarker({ lat, lng, color, label }: MarkerProps) {
  const ring1Ref = useRef<THREE.Mesh>(null!);
  const ring2Ref = useRef<THREE.Mesh>(null!);
  const position = latLngToVector3(lat, lng, EARTH_RADIUS + 0.01);

  useFrame(({ clock }) => {
    const t = clock.getElapsedTime();
    const s1 = 1 + ((t * 0.7) % 1) * 1.8;
    const s2 = 1 + (((t * 0.7) + 0.5) % 1) * 1.8;
    const o1 = 1 - ((t * 0.7) % 1);
    const o2 = 1 - (((t * 0.7) + 0.5) % 1);
    if (ring1Ref.current) {
      ring1Ref.current.scale.set(s1, s1, 1);
      (ring1Ref.current.material as THREE.MeshBasicMaterial).opacity = o1 * 0.8;
    }
    if (ring2Ref.current) {
      ring2Ref.current.scale.set(s2, s2, 1);
      (ring2Ref.current.material as THREE.MeshBasicMaterial).opacity = o2 * 0.8;
    }
  });

  // Orient flat to face outward from globe center
  const normal = position.clone().normalize();
  const quaternion = new THREE.Quaternion().setFromUnitVectors(
    new THREE.Vector3(0, 0, 1),
    normal
  );

  return (
    <group position={position} quaternion={quaternion}>
      {/* Solid center dot */}
      <mesh>
        <circleGeometry args={[0.028, 24]} />
        <meshBasicMaterial color={color} />
      </mesh>

      {/* Pulsing ring 1 */}
      <mesh ref={ring1Ref}>
        <ringGeometry args={[0.034, 0.052, 32]} />
        <meshBasicMaterial color={color} transparent opacity={1} side={THREE.DoubleSide} />
      </mesh>

      {/* Pulsing ring 2 — staggered */}
      <mesh ref={ring2Ref}>
        <ringGeometry args={[0.034, 0.052, 32]} />
        <meshBasicMaterial color={color} transparent opacity={0.5} side={THREE.DoubleSide} />
      </mesh>

      {/* Floating HTML label — always faces camera */}
      <Html
        position={[0, 0.1, 0]}
        center
        style={{ pointerEvents: 'none', userSelect: 'none' }}
        distanceFactor={6}
      >
        <div style={{
          background: 'rgba(2, 8, 23, 0.8)',
          border: `1px solid ${color}55`,
          color: color,
          padding: '3px 8px',
          borderRadius: 6,
          fontSize: 10,
          fontWeight: 700,
          whiteSpace: 'nowrap',
          fontFamily: 'sans-serif',
          backdropFilter: 'blur(4px)',
          letterSpacing: '0.5px',
        }}>
          {label}
        </div>
      </Html>
    </group>
  );
}

interface CityMarkersProps {
  userLocation?: { lat: number; lng: number; city?: string } | null;
  triggerCity?: { lat: number; lng: number; city?: string } | null;
}

export default function CityMarkers({ userLocation, triggerCity }: CityMarkersProps) {
  const LA = { lat: 34.0522, lng: -118.2437 };
  // Check if trigger city is LA (by name or coordinates)
  const isTriggerLA = triggerCity && (
    triggerCity.city === 'Los Angeles' || 
    (Math.abs(triggerCity.lat - LA.lat) < 1 && Math.abs(triggerCity.lng - LA.lng) < 1)
  );

  return (
    <group>
      {userLocation && (
        <PulsingCityMarker
          lat={userLocation.lat}
          lng={userLocation.lng}
          color="#FFD700"
          label={`📍 ${userLocation.city || 'You'}`}
        />
      )}
      {triggerCity && !isTriggerLA && (
        <PulsingCityMarker
          lat={triggerCity.lat}
          lng={triggerCity.lng}
          color="#ff3366"
          label={`📍 ${triggerCity.city || 'City'}`}
        />
      )}
    </group>
  );
}
