"use client";

import { Canvas } from "@react-three/fiber";
import type { NeutronStarState } from "@/lib/neutron-stars";
import PulsarScene from "./PulsarScene";
import { useNeutronStarBackdrop } from "./useNeutronStarBackdrop";

/**
 * Full-viewport canvas hosting the illustrative lighthouse render. The camera
 * looks at the origin (the neutron star) and slowly auto-orbits; drag to look
 * around. The scene itself is a handful of meshes, so it is GPU-cheap.
 */
export default function PulsarCanvas({
  state,
  accent,
}: {
  state: NeutronStarState;
  accent: string;
}) {
  const background = useNeutronStarBackdrop();

  return (
    <Canvas
      className="absolute inset-0"
      dpr={[1, 2]}
      camera={{ position: [0, 1.5, 8], fov: 55, near: 0.1, far: 100 }}
      gl={{ powerPreference: "high-performance", antialias: true, alpha: false }}
      onCreated={({ gl }) => gl.setClearColor("#03040c")}
    >
      <PulsarScene state={state} accent={accent} background={background} />
    </Canvas>
  );
}
