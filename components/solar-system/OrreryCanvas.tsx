"use client";

import { Canvas } from "@react-three/fiber";
import { OrbitControls, Stars } from "@react-three/drei";
import type { PlanetName } from "@/lib/planets";
import Orrery from "./Orrery";

interface OrreryCanvasProps {
  simMsRef: React.RefObject<number>;
  playing: boolean;
  speedDaysPerSec: number;
  onFocus: (name: PlanetName) => void;
}

/**
 * Full-viewport orrery canvas. Same performance budget as the other worlds
 * (dpr capped at 2, high-performance context). A slightly top-down default
 * camera reads the ecliptic plane; OrbitControls let the user rotate/zoom.
 */
export default function OrreryCanvas(props: OrreryCanvasProps) {
  return (
    <Canvas
      className="absolute inset-0"
      dpr={[1, 2]}
      camera={{ position: [0, 13, 15], fov: 45, near: 0.1, far: 400 }}
      gl={{ powerPreference: "high-performance", antialias: true, alpha: false }}
      onCreated={({ gl }) => gl.setClearColor("#05060a")}
    >
      <ambientLight intensity={0.6} />
      <Stars
        radius={120}
        depth={60}
        count={5000}
        factor={3}
        saturation={0}
        fade
        speed={0.25}
      />
      <Orrery
        simMsRef={props.simMsRef}
        playing={props.playing}
        speedDaysPerSec={props.speedDaysPerSec}
        onFocus={props.onFocus}
      />
      <OrbitControls
        makeDefault
        enablePan={false}
        enableDamping
        dampingFactor={0.08}
        rotateSpeed={0.5}
        zoomSpeed={0.7}
        minDistance={3}
        maxDistance={34}
        maxPolarAngle={Math.PI * 0.92}
      />
    </Canvas>
  );
}
