"use client";

import { Canvas } from "@react-three/fiber";
import type { BlackHoleState } from "@/lib/black-holes";
import LensScene from "./LensScene";
import { useLensTexture } from "./useLensTexture";

/**
 * Full-viewport canvas hosting the gravitational-lensing render. The camera
 * starts a short distance out looking at the origin (the black hole); the scene
 * itself is a clip-space shader quad, so the camera only supplies orientation
 * for the background lensing and a draggable / auto-orbiting viewpoint.
 */
export default function LensCanvas({
  state,
  accent,
}: {
  state: BlackHoleState;
  accent: string;
}) {
  const background = useLensTexture();

  return (
    <Canvas
      className="absolute inset-0"
      dpr={[1, 2]}
      camera={{ position: [0, 0, 6], fov: 60, near: 0.1, far: 100 }}
      gl={{ powerPreference: "high-performance", antialias: true, alpha: false }}
      onCreated={({ gl }) => gl.setClearColor("#02020a")}
    >
      <LensScene state={state} background={background} accent={accent} />
    </Canvas>
  );
}
