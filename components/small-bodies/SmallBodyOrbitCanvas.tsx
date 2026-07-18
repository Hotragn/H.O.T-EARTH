"use client";

import { Canvas } from "@react-three/fiber";
import { OrbitControls, Stars } from "@react-three/drei";
import type { SmallBodyObject } from "@/lib/small-body-facts";
import SmallBodyOrbitScene from "./SmallBodyOrbitScene";

interface SmallBodyOrbitCanvasProps {
  objects: SmallBodyObject[];
  onFocus: (o: SmallBodyObject) => void;
  /** simulated wall-clock (ms) advanced by the time control, read per-frame */
  simMsRef: React.RefObject<number>;
  playing: boolean;
  /** simulated Earth days advanced per real second while playing */
  speedDaysPerSec: number;
}

/**
 * Full-viewport canvas for the inner-Solar-System orbit view. Same performance
 * budget as the other worlds (dpr capped at 2, high-performance context). A
 * top-down-ish default camera reads the ecliptic plane; OrbitControls let the
 * user rotate/zoom out to take in the comets' far, eccentric orbits.
 */
export default function SmallBodyOrbitCanvas({
  objects,
  onFocus,
  simMsRef,
  playing,
  speedDaysPerSec,
}: SmallBodyOrbitCanvasProps) {
  return (
    <Canvas
      className="absolute inset-0"
      dpr={[1, 2]}
      camera={{ position: [0, 15, 17], fov: 45, near: 0.1, far: 600 }}
      gl={{ powerPreference: "high-performance", antialias: true, alpha: false }}
      onCreated={({ gl }) => gl.setClearColor("#05060a")}
    >
      <ambientLight intensity={0.6} />
      <Stars
        radius={150}
        depth={70}
        count={5200}
        factor={3}
        saturation={0}
        fade
        speed={0.15}
      />
      <SmallBodyOrbitScene
        objects={objects}
        onFocus={onFocus}
        simMsRef={simMsRef}
        playing={playing}
        speedDaysPerSec={speedDaysPerSec}
      />
      <OrbitControls
        makeDefault
        enablePan={false}
        enableDamping
        dampingFactor={0.08}
        rotateSpeed={0.5}
        zoomSpeed={0.7}
        minDistance={3}
        maxDistance={48}
        maxPolarAngle={Math.PI * 0.92}
      />
    </Canvas>
  );
}
