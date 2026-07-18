"use client";

import { Html } from "@react-three/drei";
import * as THREE from "three";
import { CARDINALS } from "@/lib/star-facts";
import { STAR_SPHERE_RADIUS } from "./constants";

/**
 * The local horizon for "sky from your location" mode: a dark ground disk at the
 * observer's horizon plane (y = 0, world-fixed), a crisp horizon ring, and the
 * four cardinal directions (N/E/S/W). The stars themselves are hidden below the
 * horizon on the GPU (see StarField); this ground occludes the lower hemisphere
 * so the view reads like standing on the ground looking up. Rendered only in
 * local mode.
 */
const GROUND_R = STAR_SPHERE_RADIUS * 1.2;
const CARD_R = STAR_SPHERE_RADIUS * 0.72;

export default function HorizonScene() {
  return (
    <group>
      {/* opaque-ish ground disk, drawn last so it covers everything below */}
      <mesh
        rotation={[-Math.PI / 2, 0, 0]}
        renderOrder={20}
        raycast={() => null}
      >
        <circleGeometry args={[GROUND_R, 96]} />
        <meshBasicMaterial
          color="#060810"
          side={THREE.DoubleSide}
          transparent
          opacity={0.96}
          depthTest={false}
          depthWrite={false}
        />
      </mesh>

      {/* crisp horizon ring */}
      <mesh
        rotation={[-Math.PI / 2, 0, 0]}
        renderOrder={21}
        raycast={() => null}
      >
        <ringGeometry args={[STAR_SPHERE_RADIUS * 0.985, STAR_SPHERE_RADIUS * 1.0, 128]} />
        <meshBasicMaterial
          color="#5566aa"
          side={THREE.DoubleSide}
          transparent
          opacity={0.5}
          depthTest={false}
          depthWrite={false}
        />
      </mesh>

      {CARDINALS.map((c) => (
        <Html
          key={c.label}
          position={[c.vec[0] * CARD_R, 5, c.vec[2] * CARD_R]}
          center
          zIndexRange={[22, 0]}
          style={{ pointerEvents: "none", userSelect: "none" }}
        >
          <div
            style={{
              fontFamily: "var(--font-plex-mono, monospace)",
              fontSize: 13,
              fontWeight: 600,
              letterSpacing: "0.1em",
              color: "#c7ccdb",
              textShadow: "0 1px 6px rgba(0,0,0,0.9)",
            }}
          >
            {c.label}
          </div>
        </Html>
      ))}
    </group>
  );
}
