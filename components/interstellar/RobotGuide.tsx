"use client";

import { useRef } from "react";
import { Canvas, useFrame } from "@react-three/fiber";
import * as THREE from "three";
import { INTERSTELLAR_ACCENT } from "./interstellarUi";

/**
 * An ORIGINAL monolith-style guide robot, built entirely from r3f primitives (a
 * tall stack of segmented slabs with a glowing sensor strip). This is a deliberate
 * ORIGINAL design, NOT the robot from any film (no TARS/CASE geometry, no film
 * proportions, no copyrighted assets) and it is labeled as such wherever it
 * appears. It idles with a gentle sway and can "gesture" by fanning its segments.
 *
 * `RobotMonolith` is the scene content (place it inside a Canvas). `RobotGuideCanvas`
 * is a self-contained mini-canvas convenience wrapper.
 */

const SEGMENTS = 5;
const SEG_H = 0.62;
const GAP = 0.06;
const WIDTH = 0.9;
const DEPTH = 0.42;

export function RobotMonolith({ gesture = 0.25 }: { gesture?: number }) {
  const group = useRef<THREE.Group>(null);
  const segRefs = useRef<Array<THREE.Group | null>>([]);

  useFrame((state) => {
    const t = state.clock.getElapsedTime();
    if (group.current) {
      // slow idle sway + a small bob
      group.current.rotation.y = Math.sin(t * 0.5) * 0.35;
      group.current.position.y = Math.sin(t * 1.1) * 0.04;
    }
    // segments fan out slightly, staggered, to read as an articulated body
    for (let i = 0; i < segRefs.current.length; i++) {
      const seg = segRefs.current[i];
      if (!seg) continue;
      const phase = t * 0.8 + i * 0.6;
      const amt = gesture * (0.5 + 0.5 * Math.sin(phase));
      seg.rotation.z = amt * 0.12 * (i % 2 === 0 ? 1 : -1);
      seg.position.x = amt * 0.05 * (i % 2 === 0 ? 1 : -1);
    }
  });

  const totalH = SEGMENTS * SEG_H + (SEGMENTS - 1) * GAP;

  return (
    <group ref={group}>
      {Array.from({ length: SEGMENTS }).map((_, i) => {
        const y = i * (SEG_H + GAP) - totalH / 2 + SEG_H / 2;
        const isHead = i === SEGMENTS - 1;
        return (
          <group
            key={i}
            position={[0, y, 0]}
            ref={(el) => {
              segRefs.current[i] = el;
            }}
          >
            <mesh castShadow>
              <boxGeometry args={[WIDTH, SEG_H, DEPTH]} />
              <meshStandardMaterial
                color="#2b3140"
                metalness={0.7}
                roughness={0.35}
              />
            </mesh>
            {/* glowing sensor strip on the front face (the "eye" band) */}
            <mesh position={[0, isHead ? 0.04 : 0, DEPTH / 2 + 0.001]}>
              <planeGeometry args={[WIDTH * 0.66, isHead ? 0.16 : 0.06]} />
              <meshBasicMaterial color={INTERSTELLAR_ACCENT} toneMapped={false} />
            </mesh>
          </group>
        );
      })}
    </group>
  );
}

/**
 * Self-contained mini-canvas of the robot for small chrome placements. Transparent
 * background so it drops onto the page backdrop. Low DPR cap and no controls; it is
 * decorative and does not intercept clicks.
 */
export function RobotGuideCanvas({
  gesture = 0.25,
  className,
}: {
  gesture?: number;
  className?: string;
}) {
  return (
    <Canvas
      className={className}
      dpr={[1, 2]}
      camera={{ position: [0, 0, 5.4], fov: 42 }}
      gl={{ alpha: true, antialias: true }}
      style={{ pointerEvents: "none" }}
    >
      <ambientLight intensity={0.6} />
      <directionalLight position={[3, 4, 5]} intensity={1.1} />
      <directionalLight position={[-4, 1, 2]} intensity={0.4} color={INTERSTELLAR_ACCENT} />
      <RobotMonolith gesture={gesture} />
    </Canvas>
  );
}
