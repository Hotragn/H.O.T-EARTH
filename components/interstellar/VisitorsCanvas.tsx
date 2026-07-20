"use client";

import { Canvas } from "@react-three/fiber";
import { OrbitControls, Stars } from "@react-three/drei";
import type { InterstellarId } from "@/lib/interstellar";
import VisitorsScene from "./VisitorsScene";

/**
 * Full-viewport canvas for the Visitors (Section B) inner-Solar-System view. Same
 * performance budget as the other worlds (dpr capped at 2, high-performance
 * context). A slightly elevated camera reads the ecliptic plane; OrbitControls
 * let the user orbit/zoom to follow the object out along its hyperbola. The
 * clear colour is transparent so the page's procedural backdrop shows through.
 */
export default function VisitorsCanvas({
  selectedId,
  displayedMsRef,
  fromMs,
  toMs,
}: {
  selectedId: InterstellarId;
  displayedMsRef: React.RefObject<number>;
  fromMs: number;
  toMs: number;
}) {
  return (
    <Canvas
      className="absolute inset-0"
      dpr={[1, 2]}
      camera={{ position: [0, 8, 12], fov: 45, near: 0.05, far: 2000 }}
      gl={{ powerPreference: "high-performance", antialias: true, alpha: true }}
      onCreated={({ gl }) => gl.setClearColor(0x000000, 0)}
    >
      <ambientLight intensity={0.7} />
      <Stars radius={220} depth={80} count={4200} factor={3} saturation={0} fade speed={0.1} />
      <VisitorsScene
        selectedId={selectedId}
        displayedMsRef={displayedMsRef}
        fromMs={fromMs}
        toMs={toMs}
      />
      <OrbitControls
        makeDefault
        enablePan={false}
        enableDamping
        dampingFactor={0.08}
        rotateSpeed={0.5}
        zoomSpeed={0.7}
        minDistance={2}
        maxDistance={120}
        maxPolarAngle={Math.PI * 0.95}
      />
    </Canvas>
  );
}
