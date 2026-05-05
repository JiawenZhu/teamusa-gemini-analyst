"use client";
import React, { useRef } from 'react';
import { useTexture } from '@react-three/drei';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';

// Fresnel atmosphere shader — the Apple Earth blue rim glow
const atmosphereVertexShader = `
  varying vec3 vNormal;
  void main() {
    vNormal = normalize(normalMatrix * normal);
    gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
  }
`;

const atmosphereFragmentShader = `
  varying vec3 vNormal;
  void main() {
    float intensity = pow(0.65 - dot(vNormal, vec3(0.0, 0.0, 1.0)), 2.5);
    gl_FragColor = vec4(0.15, 0.5, 1.0, 1.0) * intensity;
  }
`;


export default function EarthSphere() {
  const cloudsRef = useRef<THREE.Mesh>(null!);

  const [dayMap, cloudMap] = useTexture([
    '/textures/earth_daymap.jpg',
    '/textures/earth_clouds.png',
  ]);

  // Give textures vivid, saturated colours
  // eslint-disable-next-line react-hooks/immutability
  dayMap.colorSpace = THREE.SRGBColorSpace;

  // Clouds drift slightly faster than the Earth (parent group handles Earth rotation)
  useFrame((_, delta) => {
    if (cloudsRef.current) cloudsRef.current.rotation.y += delta * 0.007;
  });



  return (
    <group>
      {/* Outer atmosphere glow — the Apple Earth signature */}
      <mesh scale={[1.22, 1.22, 1.22]}>
        <sphereGeometry args={[2, 64, 64]} />
        <shaderMaterial
          vertexShader={atmosphereVertexShader}
          fragmentShader={atmosphereFragmentShader}
          blending={THREE.AdditiveBlending}
          side={THREE.BackSide}
          transparent
        />
      </mesh>

      {/* Inner soft atmosphere haze */}
      <mesh scale={[1.07, 1.07, 1.07]}>
        <sphereGeometry args={[2, 64, 64]} />
        <meshBasicMaterial
          color={new THREE.Color(0.1, 0.4, 1.0)}
          transparent
          opacity={0.06}
          side={THREE.BackSide}
        />
      </mesh>

      {/* Main Earth — BasicMaterial: raw texture, no lighting wash-out */}
      <mesh>
        <sphereGeometry args={[2, 64, 64]} />
        <meshBasicMaterial map={dayMap} />
      </mesh>


      {/* Cloud layer — BasicMaterial so clouds stay white not grey */}
      <mesh ref={cloudsRef}>
        <sphereGeometry args={[2.025, 64, 64]} />
        <meshBasicMaterial
          map={cloudMap}
          transparent
          opacity={0.35}
          depthWrite={false}
        />
      </mesh>
    </group>
  );
}
