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

// Night side overlay shader — shows city lights on dark hemisphere
const nightVertexShader = `
  varying vec2 vUv;
  varying vec3 vNormal;
  void main() {
    vUv = uv;
    vNormal = normalize(normalMatrix * normal);
    gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
  }
`;

// Uses the sun direction (light) to blend night texture only on dark side
const nightFragmentShader = `
  uniform sampler2D nightMap;
  uniform vec3 sunDirection;
  varying vec2 vUv;
  varying vec3 vNormal;
  void main() {
    float dayness = dot(vNormal, sunDirection);
    float nightFactor = clamp(-dayness * 3.0, 0.0, 1.0);
    vec4 nightColor = texture2D(nightMap, vUv);
    gl_FragColor = nightColor * nightFactor * 0.9;
  }
`;

export default function EarthSphere() {
  const cloudsRef = useRef<THREE.Mesh>(null!);

  const [dayMap, specMap, normalMap, cloudMap, nightMap] = useTexture([
    '/textures/earth_daymap.jpg',
    '/textures/earth_specular.jpg',
    '/textures/earth_normal.jpg',
    '/textures/earth_clouds.png',
    '/textures/earth_nightmap.png',
  ]);

  // Clouds drift slightly faster than the Earth (parent group handles Earth rotation)
  useFrame((_, delta) => {
    if (cloudsRef.current) cloudsRef.current.rotation.y += delta * 0.007;
  });

  const sunDir = new THREE.Vector3(5, 3, 5).normalize();

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

      {/* Main Earth — Phong with all maps */}
      <mesh>
        <sphereGeometry args={[2, 64, 64]} />
        <meshPhongMaterial
          map={dayMap}
          specularMap={specMap}
          normalMap={normalMap}
          normalScale={new THREE.Vector2(0.85, 0.85)}
          shininess={25}
          specular={new THREE.Color(0.25, 0.35, 0.5)}
        />
      </mesh>

      {/* Night-side city lights overlay */}
      <mesh>
        <sphereGeometry args={[2.001, 64, 64]} />
        <shaderMaterial
          vertexShader={nightVertexShader}
          fragmentShader={nightFragmentShader}
          uniforms={{
            nightMap: { value: nightMap },
            sunDirection: { value: sunDir },
          }}
          blending={THREE.AdditiveBlending}
          transparent
          depthWrite={false}
        />
      </mesh>

      {/* Cloud layer */}
      <mesh ref={cloudsRef}>
        <sphereGeometry args={[2.025, 64, 64]} />
        <meshPhongMaterial
          map={cloudMap}
          transparent
          opacity={0.4}
          depthWrite={false}
        />
      </mesh>
    </group>
  );
}
