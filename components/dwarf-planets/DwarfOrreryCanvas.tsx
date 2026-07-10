"use client";

import { Canvas } from "@react-three/fiber";
import { OrbitControls, Stars } from "@react-three/drei";
import type { DwarfName } from "@/lib/dwarf-planets";
import DwarfOrrery from "./DwarfOrrery";

interface DwarfOrreryCanvasProps {
  simMsRef: React.RefObject<number>;
  playing: boolean;
  speedDaysPerSec: number;
  onFocus: (name: DwarfName) => void;
}

/**
 * Full-viewport dwarf-planet orrery canvas. Same performance budget as the other
 * worlds (dpr capped at 2, high-performance context). A top-down-ish default
 * camera reads the ecliptic plane; OrbitControls let the user rotate/zoom out to
 * take in Eris' distant, eccentric orbit.
 */
export default function DwarfOrreryCanvas(props: DwarfOrreryCanvasProps) {
  return (
    <Canvas
      className="absolute inset-0"
      dpr={[1, 2]}
      camera={{ position: [0, 15, 17], fov: 45, near: 0.1, far: 500 }}
      gl={{ powerPreference: "high-performance", antialias: true, alpha: false }}
      onCreated={({ gl }) => gl.setClearColor("#05060a")}
    >
      <ambientLight intensity={0.6} />
      <Stars
        radius={140}
        depth={70}
        count={5500}
        factor={3}
        saturation={0}
        fade
        speed={0.2}
      />
      <DwarfOrrery
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
        maxDistance={44}
        maxPolarAngle={Math.PI * 0.92}
      />
    </Canvas>
  );
}
