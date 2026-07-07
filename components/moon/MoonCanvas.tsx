"use client";

import { useState } from "react";
import { Canvas } from "@react-three/fiber";
import { OrbitControls, Stars } from "@react-three/drei";
import type * as THREE from "three";
import { latLonToVector3 } from "@/lib/geo";
import MoonGlobe from "./MoonGlobe";

// Open looking straight at the near side (0°, 0° → +X in the Moon-fixed frame):
// the familiar Earth-facing hemisphere, so libration reads as a visible nod of
// that face.
const INITIAL_CAMERA = latLonToVector3(8, 6, 2.9);

interface MoonCanvasProps {
  surfaceTexture: THREE.Texture | null;
  usingFallback: boolean;
  timeOffsetDaysRef: React.RefObject<number>;
}

export default function MoonCanvas(props: MoonCanvasProps) {
  const [interacted, setInteracted] = useState(false);

  return (
    <Canvas
      className="absolute inset-0"
      // Same performance budget as Earth/Mars: dpr capped at 2, high-performance
      // context, RAF pauses when the tab is hidden.
      dpr={[1, 2]}
      camera={{ position: INITIAL_CAMERA, fov: 42, near: 0.1, far: 300 }}
      gl={{ powerPreference: "high-performance", antialias: true, alpha: false }}
      onCreated={({ gl }) => gl.setClearColor("#05060a")}
    >
      <Stars
        radius={70}
        depth={35}
        count={4000}
        factor={2.6}
        saturation={0}
        fade
        speed={0.35}
      />
      <MoonGlobe
        surfaceTexture={props.surfaceTexture}
        usingFallback={props.usingFallback}
        timeOffsetDaysRef={props.timeOffsetDaysRef}
      />
      <OrbitControls
        makeDefault
        enablePan={false}
        enableDamping
        dampingFactor={0.08}
        rotateSpeed={0.45}
        zoomSpeed={0.65}
        minDistance={1.5}
        maxDistance={5.5}
        autoRotate={!interacted}
        autoRotateSpeed={0.18}
        onStart={() => setInteracted(true)}
      />
    </Canvas>
  );
}
