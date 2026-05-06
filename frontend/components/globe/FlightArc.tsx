"use client";
import React, { useMemo, useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import { Line } from '@react-three/drei';
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

interface FlightArcProps {
  fromLat: number;
  fromLng: number;
  toLat: number;
  toLng: number;
  color?: string;
}

export default function FlightArc({ fromLat, fromLng, toLat, toLng, color = '#FFD700' }: FlightArcProps) {
  const dashOffsetRef = useRef(0);
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const lineRef = useRef<any>(null);

  // Build a quadratic bezier arc between the two cities via a point above the Earth
  const points = useMemo(() => {
    const start = latLngToVector3(fromLat, fromLng, EARTH_RADIUS + 0.02);
    const end = latLngToVector3(toLat, toLng, EARTH_RADIUS + 0.02);

    // Lift the midpoint above the surface for a natural orbital arc
    const mid = start.clone().add(end).multiplyScalar(0.5);
    const liftHeight = EARTH_RADIUS * 0.55;
    mid.normalize().multiplyScalar(EARTH_RADIUS + liftHeight);

    const curve = new THREE.QuadraticBezierCurve3(start, mid, end);
    return curve.getPoints(80);
  }, [fromLat, fromLng, toLat, toLng]);

  // Animate a dashed "moving trail" effect along the arc
  useFrame((_, delta) => {
    dashOffsetRef.current -= delta * 0.8;
    if (lineRef.current && lineRef.current.material) {
      lineRef.current.material.dashOffset = dashOffsetRef.current;
    }
  });

  return (
    <group>
      {/* Faint static arc — the full path */}
      <Line
        points={points}
        color={color}
        lineWidth={1}
        transparent
        opacity={0.25}
      />

      {/* Animated bright dashed trail on top */}
      <Line
        ref={lineRef}
        points={points}
        color={color}
        lineWidth={2.5}
        dashed
        dashScale={30}
        dashSize={0.6}
        gapSize={0.4}
        transparent
        opacity={0.9}
      />
    </group>
  );
}
