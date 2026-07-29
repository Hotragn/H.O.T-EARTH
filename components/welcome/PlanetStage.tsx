"use client";

import { Suspense, useMemo, useRef } from "react";
import { Canvas, useFrame, useLoader } from "@react-three/fiber";
import { TextureLoader } from "three";
import type { Mesh } from "three";

/**
 * A single slowly rotating body, rendered with the app's real shipped texture
 * (NASA / USGS imagery, the same files the world tabs use).
 *
 * This is the onboarding's visual spine: one canvas per section, mounted only
 * while its section is near the viewport so we never run several WebGL contexts
 * at once. Rotation rate is chosen for looks, not simulated; the tour says so and
 * the real orbital mechanics live in the world tabs.
 */
function Body({
  texture,
  ring,
  tilt,
}: {
  texture: string;
  ring?: string;
  tilt: number;
}) {
  const mesh = useRef<Mesh>(null);
  const map = useLoader(TextureLoader, texture);
  const ringMap = useLoader(TextureLoader, ring ?? texture);

  useFrame((_, dt) => {
    if (mesh.current) mesh.current.rotation.y += dt * 0.07;
  });

  return (
    <group rotation={[tilt, 0, 0]}>
      <mesh ref={mesh}>
        <sphereGeometry args={[1, 64, 64]} />
        <meshStandardMaterial map={map} roughness={1} metalness={0} />
      </mesh>
      {ring && (
        <mesh rotation={[Math.PI / 2, 0, 0]}>
          <ringGeometry args={[1.35, 2.15, 96]} />
          <meshBasicMaterial map={ringMap} transparent opacity={0.85} />
        </mesh>
      )}
    </group>
  );
}

export default function PlanetStage({
  texture,
  ring,
  tilt = 0.35,
  className = "",
}: {
  texture: string;
  ring?: string;
  tilt?: number;
  className?: string;
}) {
  // Static camera and lighting: the tour is a gallery, not an orrery.
  const light = useMemo(() => [4, 2.5, 5] as [number, number, number], []);
  return (
    <div className={className} aria-hidden>
      <Canvas
        camera={{ position: [0, 0, 3.1], fov: 42 }}
        dpr={[1, 1.75]}
        gl={{ antialias: true, alpha: true }}
      >
        <ambientLight intensity={0.22} />
        <directionalLight position={light} intensity={2.2} />
        {/* Cool rim light from behind, so the limb separates from the background
            instead of the sphere reading as a flat pasted circle. */}
        <directionalLight position={[-4, -1.5, -3]} intensity={0.5} color="#8fb3ff" />
        <Suspense fallback={null}>
          <Body texture={texture} ring={ring} tilt={tilt} />
        </Suspense>
      </Canvas>
    </div>
  );
}
