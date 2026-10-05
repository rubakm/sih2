'use client';

import React, { useRef, useMemo, useEffect, useState } from 'react';
import { Canvas, useFrame, useThree } from '@react-three/fiber';
import * as THREE from 'three';

// Procedural wave height function matching vertex shader
function getWaveHeight(x: number, z: number, time: number): number {
  const w1 = Math.sin(x * 0.08 + time * 0.8) * 0.45;
  const w2 = Math.cos(z * 0.07 + time * 0.6) * 0.4;
  const w3 = Math.sin((x + z) * 0.12 + time * 1.1) * 0.25;
  const w4 = Math.sin(Math.sqrt(x * x + z * z) * 0.05 - time * 0.5) * 0.15;
  return w1 + w2 + w3 + w4;
}

// Ocean Shader Material
const oceanVertexShader = `
  uniform float uTime;
  varying vec3 vWorldPosition;
  varying vec3 vNormal;
  varying float vWaveHeight;

  // Multi-frequency wave calculation
  float calculateWave(vec2 p, float t) {
    float w1 = sin(p.x * 0.08 + t * 0.8) * 0.45;
    float w2 = cos(p.y * 0.07 + t * 0.6) * 0.40;
    float w3 = sin((p.x + p.y) * 0.12 + t * 1.1) * 0.25;
    float w4 = sin(length(p) * 0.05 - t * 0.5) * 0.15;
    return w1 + w2 + w3 + w4;
  }

  void main() {
    vec3 pos = position;
    float h = calculateWave(pos.xy, uTime);
    pos.z = h;
    vWaveHeight = h;

    // Approximate normal from neighboring points
    float eps = 0.4;
    float hx = calculateWave(pos.xy + vec2(eps, 0.0), uTime);
    float hy = calculateWave(pos.xy + vec2(0.0, eps), uTime);
    vec3 normalApprox = normalize(vec3(-(hx - h) / eps, -(hy - h) / eps, 1.0));
    vNormal = normalMatrix * normalApprox;

    vec4 worldPos = modelMatrix * vec4(pos, 1.0);
    vWorldPosition = worldPos.xyz;
    gl_Position = projectionMatrix * viewMatrix * worldPos;
  }
`;

const oceanFragmentShader = `
  uniform vec3 uDeepNavy;
  uniform vec3 uSoftTeal;
  uniform vec3 uFoamColor;
  uniform vec3 uFogColor;
  uniform float uFogDensity;
  varying vec3 vWorldPosition;
  varying vec3 vNormal;
  varying float vWaveHeight;

  void main() {
    vec3 viewDir = normalize(cameraPosition - vWorldPosition);
    vec3 normal = normalize(vNormal);

    // Fresnel effect
    float fresnel = pow(1.0 - max(dot(viewDir, normal), 0.0), 3.0);
    fresnel = clamp(fresnel, 0.0, 1.0);

    // Water base color gradient based on wave height
    float heightFactor = smoothstep(-0.8, 0.9, vWaveHeight);
    vec3 waterColor = mix(uDeepNavy, uSoftTeal, heightFactor * 0.75 + fresnel * 0.25);

    // Subtle foam highlights at peaks
    float foamFactor = smoothstep(0.65, 1.1, vWaveHeight);
    waterColor = mix(waterColor, uFoamColor, foamFactor * 0.45);

    // Horizon fog
    float dist = length(vWorldPosition - cameraPosition);
    float fog = 1.0 - exp(-dist * uFogDensity);
    vec3 finalColor = mix(waterColor, uFogColor, clamp(fog, 0.0, 1.0));

    gl_FragColor = vec4(finalColor, 1.0);
  }
`;

function OceanMesh({ isMobile, reducedMotion }: { isMobile: boolean; reducedMotion: boolean }) {
  const meshRef = useRef<THREE.Mesh>(null!);
  const materialRef = useRef<THREE.ShaderMaterial>(null!);

  const uniforms = useMemo(
    () => ({
      uTime: { value: 0 },
      uDeepNavy: { value: new THREE.Color('#050b14') },
      uSoftTeal: { value: new THREE.Color('#0d465c') },
      uFoamColor: { value: new THREE.Color('#d4e8ee') },
      uFogColor: { value: new THREE.Color('#0a0e14') },
      uFogDensity: { value: 0.012 },
    }),
    []
  );

  // Lower subdivision on mobile for guaranteed 60fps
  const segments = isMobile ? 64 : 128;

  useFrame((state, delta) => {
    if (!reducedMotion && materialRef.current) {
      materialRef.current.uniforms.uTime.value += delta * 1.0;
    }
  });

  return (
    <mesh ref={meshRef} rotation={[-Math.PI / 2, 0, 0]} position={[0, -1, 0]} receiveShadow>
      <planeGeometry args={[180, 180, segments, segments]} />
      <shaderMaterial
        ref={materialRef}
        vertexShader={oceanVertexShader}
        fragmentShader={oceanFragmentShader}
        uniforms={uniforms}
        wireframe={false}
      />
    </mesh>
  );
}

// Procedural Bulk Carrier Ship Model
function BulkCarrier({
  initialPos,
  speed,
  scale = 1,
  angle = 0,
  reducedMotion = false,
}: {
  initialPos: [number, number, number];
  speed: number;
  scale?: number;
  angle?: number;
  reducedMotion?: boolean;
}) {
  const groupRef = useRef<THREE.Group>(null!);
  const currentPos = useRef(new THREE.Vector3(...initialPos));
  const timeAcc = useRef(Math.random() * 10);

  useFrame((_, delta) => {
    if (!groupRef.current) return;
    if (!reducedMotion) {
      timeAcc.current += delta;
      // Move slowly along heading
      const rad = angle;
      currentPos.current.x += Math.cos(rad) * speed * delta;
      currentPos.current.z += Math.sin(rad) * speed * delta;

      // Wrap around bounds
      if (currentPos.current.x > 75) currentPos.current.x = -75;
      if (currentPos.current.x < -75) currentPos.current.x = 75;
      if (currentPos.current.z > 75) currentPos.current.z = -75;
      if (currentPos.current.z < -75) currentPos.current.z = 75;
    }

    // Bob on wave height
    const x = currentPos.current.x;
    const z = currentPos.current.z;
    const waveH = getWaveHeight(x, z, timeAcc.current * (reducedMotion ? 0 : 1));
    const waveNextX = getWaveHeight(x + 1, z, timeAcc.current * (reducedMotion ? 0 : 1));
    const waveNextZ = getWaveHeight(x, z + 1, timeAcc.current * (reducedMotion ? 0 : 1));

    const pitch = (waveNextZ - waveH) * 0.15;
    const roll = -(waveNextX - waveH) * 0.2;

    groupRef.current.position.set(x, waveH - 0.15, z);
    groupRef.current.rotation.set(pitch, -angle + Math.PI / 2, roll);
  });

  return (
    <group ref={groupRef} scale={[scale, scale, scale]}>
      {/* Lower Hull (Red antifouling boot-topping) */}
      <mesh position={[0, 0.2, 0]} castShadow>
        <boxGeometry args={[1.8, 0.4, 8.5]} />
        <meshStandardMaterial color="#681919" roughness={0.7} />
      </mesh>

      {/* Upper Hull (Dark Charcoal Black) */}
      <mesh position={[0, 0.6, 0]} castShadow>
        <boxGeometry args={[1.8, 0.45, 8.4]} />
        <meshStandardMaterial color="#1a202c" roughness={0.5} />
      </mesh>

      {/* Bow angled block */}
      <mesh position={[0, 0.5, 4.4]} rotation={[0.4, 0, 0]}>
        <boxGeometry args={[1.7, 0.5, 0.8]} />
        <meshStandardMaterial color="#1a202c" roughness={0.5} />
      </mesh>

      {/* Cargo Deck / Hatch Covers (Bulk carrier hallmark) */}
      {[-2.2, -1.0, 0.2, 1.4, 2.6].map((zPos, idx) => (
        <group key={idx} position={[0, 0.88, zPos]}>
          <mesh castShadow>
            <boxGeometry args={[1.3, 0.18, 0.85]} />
            <meshStandardMaterial color="#334155" roughness={0.4} />
          </mesh>
          {/* Hatch coaming rim */}
          <mesh position={[0, 0.08, 0]}>
            <boxGeometry args={[1.34, 0.04, 0.89]} />
            <meshStandardMaterial color="#475569" roughness={0.5} />
          </mesh>
        </group>
      ))}

      {/* Superstructure / Accommodation Block (Aft) */}
      <mesh position={[0, 1.4, -3.2]} castShadow>
        <boxGeometry args={[1.5, 1.2, 1.4]} />
        <meshStandardMaterial color="#e2e8f0" roughness={0.3} />
      </mesh>
      {/* Navigation Bridge Tier */}
      <mesh position={[0, 2.1, -3.2]} castShadow>
        <boxGeometry args={[1.7, 0.4, 1.1]} />
        <meshStandardMaterial color="#f8fafc" roughness={0.2} />
      </mesh>
      {/* Bridge Windows (tinted strip) */}
      <mesh position={[0, 2.15, -2.62]}>
        <boxGeometry args={[1.5, 0.12, 0.08]} />
        <meshStandardMaterial color="#0A84FF" roughness={0.1} />
      </mesh>

      {/* Smokestack / Funnel */}
      <mesh position={[0, 2.5, -3.6]} castShadow>
        <cylinderGeometry args={[0.2, 0.25, 0.7, 12]} />
        <meshStandardMaterial color="#0f172a" roughness={0.4} />
      </mesh>
      {/* Funnel stripe */}
      <mesh position={[0, 2.6, -3.6]}>
        <cylinderGeometry args={[0.205, 0.21, 0.15, 12]} />
        <meshStandardMaterial color="#0A84FF" roughness={0.3} />
      </mesh>

      {/* Faint Wake Trail */}
      <mesh position={[0, 0.05, -5.5]} rotation={[-Math.PI / 2, 0, 0]}>
        <planeGeometry args={[1.4, 4.5]} />
        <meshBasicMaterial
          color="#a5c4d4"
          transparent
          opacity={0.22}
          blending={THREE.AdditiveBlending}
        />
      </mesh>
    </group>
  );
}

// Coastline silhouette in the horizon for landing scroll
function CoastlineSilhouette() {
  return (
    <group position={[0, 0, -75]}>
      {/* Distant mountains / coast silhouette */}
      <mesh position={[-30, 3, 0]}>
        <coneGeometry args={[18, 8, 5]} />
        <meshBasicMaterial color="#070c14" />
      </mesh>
      <mesh position={[10, 4.5, -5]}>
        <coneGeometry args={[28, 11, 6]} />
        <meshBasicMaterial color="#06090e" />
      </mesh>
      <mesh position={[45, 2.5, 0]}>
        <coneGeometry args={[20, 6, 5]} />
        <meshBasicMaterial color="#070c14" />
      </mesh>
      {/* Distant lighthouse / harbor beacon */}
      <mesh position={[-12, 2.5, 5]}>
        <cylinderGeometry args={[0.3, 0.6, 4, 8]} />
        <meshBasicMaterial color="#1e293b" />
      </mesh>
      <pointLight position={[-12, 4.5, 5]} color="#0A84FF" intensity={2} distance={35} />
    </group>
  );
}

// Camera controller reacting to landing scroll
function CameraController({ scrollProgress }: { scrollProgress: number }) {
  const { camera } = useThree();

  useFrame(() => {
    // Scroll progress moves camera gently forward toward coastline
    const targetZ = 26 - scrollProgress * 14;
    const targetY = 7.5 - scrollProgress * 2.5;
    camera.position.x = Math.sin(scrollProgress * 1.5) * 4;
    camera.position.y = THREE.MathUtils.lerp(camera.position.y, targetY, 0.05);
    camera.position.z = THREE.MathUtils.lerp(camera.position.z, targetZ, 0.05);
    camera.lookAt(0, 1.2, -35);
  });

  return null;
}

export default function OceanScene({ scrollProgress = 0 }: { scrollProgress?: number }) {
  const [isMobile, setIsMobile] = useState(false);
  const [reducedMotion, setReducedMotion] = useState(false);

  useEffect(() => {
    const checkMobile = () => setIsMobile(window.innerWidth < 768);
    checkMobile();
    window.addEventListener('resize', checkMobile);

    const mediaQuery = window.matchMedia('(prefers-reduced-motion: reduce)');
    setReducedMotion(mediaQuery.matches);
    const listener = (e: MediaQueryListEvent) => setReducedMotion(e.matches);
    mediaQuery.addEventListener('change', listener);

    return () => {
      window.removeEventListener('resize', checkMobile);
      mediaQuery.removeEventListener('change', listener);
    };
  }, []);

  return (
    <div className="absolute inset-0 w-full h-full pointer-events-none overflow-hidden">
      <Canvas
        camera={{ position: [0, 7.5, 26], fov: 42 }}
        dpr={isMobile ? [1, 1.5] : [1, 2]}
        gl={{ antialias: true, alpha: true }}
      >
        <color attach="background" args={['#0A0E14']} />
        <fog attach="fog" args={['#0A0E14', 20, 85]} />

        {/* Ambient & Directional Lighting */}
        <ambientLight intensity={0.65} color="#5a7d9a" />
        <directionalLight
          position={[30, 45, 20]}
          intensity={1.4}
          color="#dbeafe"
          castShadow={false}
        />
        <pointLight position={[-15, 10, 10]} intensity={0.5} color="#0A84FF" />

        {/* Camera Scroll Controller */}
        <CameraController scrollProgress={scrollProgress} />

        {/* Procedural Shader Ocean */}
        <OceanMesh isMobile={isMobile} reducedMotion={reducedMotion} />

        {/* 3 Procedural Bulk Carriers navigating coastal lanes */}
        {/* Cape Bulk Carrier heading south */}
        <BulkCarrier
          initialPos={[-12, 0, 4]}
          speed={0.8}
          scale={0.9}
          angle={-0.35}
          reducedMotion={reducedMotion}
        />
        {/* Panamax Bulk Carrier heading north-east */}
        <BulkCarrier
          initialPos={[16, 0, -12]}
          speed={0.65}
          scale={0.7}
          angle={2.7}
          reducedMotion={reducedMotion}
        />
        {/* Supramax Bulk Carrier in mid distance */}
        <BulkCarrier
          initialPos={[-2, 0, -30]}
          speed={0.55}
          scale={0.55}
          angle={1.8}
          reducedMotion={reducedMotion}
        />

        {/* Coastline silhouette */}
        <CoastlineSilhouette />
      </Canvas>
    </div>
  );
}
