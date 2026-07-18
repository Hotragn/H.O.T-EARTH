"use client";

import { Canvas } from "@react-three/fiber";
import { OrbitControls, Stars } from "@react-three/drei";
import type { ExoSystemData, SystemDerived } from "@/lib/exo-facts";
import ExoSystemScene from "./ExoSystemScene";

interface ExoSystemCanvasProps {
  system: ExoSystemData;
  derived: SystemDerived;
  simDaysRef: React.RefObject<number>;
  playing: boolean;
  daysPerSec: number;
  compareOn: boolean;
  onFocusPlanet: (name: string) => void;
}

/**
 * Full-viewport canvas for the system architecture view. Same performance budget
 * as the other worlds (dpr capped at 2, high-performance context). A
 * top-down-ish default camera reads the orbital plane; OrbitControls let the
 * user rotate/zoom to take in the whole system (and, with the comparison overlay
 * on, our own Solar System's much wider orbits).
 */
export default function ExoSystemCanvas(props: ExoSystemCanvasProps) {
  return (
    <Canvas
      className="absolute inset-0"
      dpr={[1, 2]}
      camera={{ position: [0, 13, 15], fov: 45, near: 0.1, far: 600 }}
      gl={{ powerPreference: "high-performance", antialias: true, alpha: false }}
      onCreated={({ gl }) => gl.setClearColor("#05060a")}
    >
      <ambientLight intensity={0.5} />
      <Stars
        radius={160}
        depth={80}
        count={5200}
        factor={3}
        saturation={0}
        fade
        speed={0.15}
      />
      <ExoSystemScene {...props} />
      <OrbitControls
        makeDefault
        enablePan={false}
        enableDamping
        dampingFactor={0.08}
        rotateSpeed={0.5}
        zoomSpeed={0.7}
        minDistance={3}
        maxDistance={60}
        maxPolarAngle={Math.PI * 0.92}
      />
    </Canvas>
  );
}
