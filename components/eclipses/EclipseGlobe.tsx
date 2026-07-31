"use client";

import { Suspense, useMemo } from "react";
import { Canvas } from "@react-three/fiber";
import { OrbitControls } from "@react-three/drei";
import * as THREE from "three";
import { useLoader } from "@react-three/fiber";
import type { LunarEclipse, SolarEclipse } from "@/lib/eclipses";
import { LUNAR_COLOR, SOLAR_COLOR } from "./eclipsesUi";

/**
 * Earth with a marker at each eclipse's tabulated greatest-eclipse point.
 *
 * These are the single published points, not paths: the canon row gives one
 * coordinate plus a path width, and we do not have the track, so we do not draw
 * one. The selected eclipse is highlighted; the rest are dimmed context.
 */
const R = 1;

function latLonToVec(lat: number, lon: number, radius = R): THREE.Vector3 {
  const la = (lat * Math.PI) / 180;
  const lo = (lon * Math.PI) / 180;
  const cl = Math.cos(la);
  // Same convention as the other globe tabs.
  return new THREE.Vector3(
    radius * cl * Math.cos(lo),
    radius * Math.sin(la),
    -radius * cl * Math.sin(lo),
  );
}

function Earth() {
  const map = useLoader(THREE.TextureLoader, "/textures/earth-day-blue-marble.jpg");
  return (
    <mesh>
      <sphereGeometry args={[R, 96, 72]} />
      <meshStandardMaterial map={map} roughness={1} metalness={0} />
    </mesh>
  );
}

function Markers({
  eclipses,
  selectedId,
  solar,
}: {
  eclipses: Array<SolarEclipse | LunarEclipse>;
  selectedId: string | null;
  solar: boolean;
}) {
  const pts = useMemo(
    () =>
      eclipses
        .filter((e) => e.lat != null && e.lon != null)
        .map((e) => ({
          id: e.id,
          v: latLonToVec(e.lat!, e.lon!, R * 1.008),
          color: (solar ? SOLAR_COLOR : LUNAR_COLOR)[e.type] ?? "#9aa2b1",
        })),
    [eclipses, solar],
  );

  return (
    <group>
      {pts.map((p) => {
        const active = p.id === selectedId;
        return (
          <mesh key={p.id} position={p.v}>
            <sphereGeometry args={[active ? 0.028 : 0.012, 16, 16]} />
            <meshBasicMaterial
              color={p.color}
              transparent
              opacity={active ? 1 : 0.4}
            />
          </mesh>
        );
      })}
    </group>
  );
}

export default function EclipseGlobe({
  eclipses,
  selectedId,
  solar,
  className = "",
}: {
  eclipses: Array<SolarEclipse | LunarEclipse>;
  selectedId: string | null;
  solar: boolean;
  className?: string;
}) {
  return (
    <div className={className}>
      <Canvas camera={{ position: [0, 0.7, 3 ], fov: 45 }} dpr={[1, 1.75]}>
        <ambientLight intensity={0.55} />
        <directionalLight position={[4, 2, 4]} intensity={1.6} />
        <Suspense fallback={null}>
          <Earth />
        </Suspense>
        <Markers eclipses={eclipses} selectedId={selectedId} solar={solar} />
        <OrbitControls
          enablePan={false}
          minDistance={1.35}
          maxDistance={7}
          rotateSpeed={0.45}
        />
      </Canvas>
    </div>
  );
}
