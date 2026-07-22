"use client";

import { Canvas } from "@react-three/fiber";
import type { CosmicWebPoint } from "@/lib/galaxies";
import CosmicWebScene from "./CosmicWebScene";

/**
 * Full-viewport canvas hosting the cosmic-web point cloud. The camera looks at
 * the origin (the observer / Milky Way) and slowly auto-orbits; drag to look
 * around, scroll to zoom. The scene is a single Points object, so it is cheap.
 */
export default function CosmicWebCanvas({
  points,
  redshifts,
  maxDistanceMpc,
}: {
  points: CosmicWebPoint[];
  redshifts: number[];
  maxDistanceMpc: number;
}) {
  return (
    <Canvas
      className="absolute inset-0"
      dpr={[1, 2]}
      camera={{ position: [0, 6, 16], fov: 55, near: 0.1, far: 200 }}
      gl={{ powerPreference: "high-performance", antialias: true, alpha: false }}
      onCreated={({ gl }) => gl.setClearColor("#03040c")}
    >
      <CosmicWebScene
        points={points}
        redshifts={redshifts}
        maxDistanceMpc={maxDistanceMpc}
      />
    </Canvas>
  );
}
