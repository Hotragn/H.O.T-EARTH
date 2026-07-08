"use client";

import { useEffect, useState } from "react";
import { Canvas } from "@react-three/fiber";
import { OrbitControls, Stars } from "@react-three/drei";
import type { MoonName } from "@/lib/moons";
import MoonGlobe from "./MoonGlobe";
import { useMoonSurfaceTexture } from "./useMoonSurfaceTexture";

interface MoonDetailCanvasProps {
  name: MoonName;
  timeOffsetDaysRef: React.RefObject<number>;
  /** reports whether the real texture loaded (true = using procedural fallback) */
  onFallback?: (usingFallback: boolean) => void;
}

/**
 * Full-viewport detail globe for one moon. Same performance budget as the other
 * worlds (dpr capped at 2, high-performance context). Auto-rotates gently until
 * the user grabs it. The globe reads the day-scrub offset from a ref per frame,
 * so scrubbing the orbit never re-renders the canvas.
 */
export default function MoonDetailCanvas({
  name,
  timeOffsetDaysRef,
  onFallback,
}: MoonDetailCanvasProps) {
  const [interacted, setInteracted] = useState(false);
  const { texture, ready, usingFallback } = useMoonSurfaceTexture(name);

  useEffect(() => {
    if (ready) onFallback?.(usingFallback);
  }, [ready, usingFallback, onFallback]);

  return (
    <Canvas
      className="absolute inset-0"
      dpr={[1, 2]}
      camera={{ position: [0, 0.9, 3.6], fov: 42, near: 0.1, far: 300 }}
      gl={{ powerPreference: "high-performance", antialias: true, alpha: false }}
      onCreated={({ gl }) => gl.setClearColor("#05060a")}
    >
      <Stars
        radius={80}
        depth={40}
        count={4200}
        factor={2.6}
        saturation={0}
        fade
        speed={0.3}
      />
      <MoonGlobe
        name={name}
        surfaceTexture={texture}
        usingFallback={usingFallback}
        timeOffsetDaysRef={timeOffsetDaysRef}
      />
      <OrbitControls
        makeDefault
        enablePan={false}
        enableDamping
        dampingFactor={0.08}
        rotateSpeed={0.45}
        zoomSpeed={0.65}
        minDistance={1.6}
        maxDistance={6}
        autoRotate={!interacted}
        autoRotateSpeed={0.24}
        onStart={() => setInteracted(true)}
      />
    </Canvas>
  );
}
