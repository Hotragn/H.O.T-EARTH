"use client";

import { useEffect, useMemo, useRef } from "react";
import { useFrame } from "@react-three/fiber";
import { Html } from "@react-three/drei";
import * as THREE from "three";
import {
  GALILEAN_MOONS,
  GALILEAN_MOON_ORDER,
  JUPITER,
  galileanPositions,
  type GalileanMoon,
} from "@/lib/jupiter-moons";
import { MOON_COLORS, MOON_ROMAN } from "./galileanUi";
import type { JupiterTextures } from "./useJupiterTextures";

/**
 * The telescope plane-of-sky view. Jupiter's oblate disk is centered; the four
 * Galilean moons sit at their real apparent (x, y) in Jupiter equatorial radii
 * (X positive = WEST, Y positive = NORTH), scaled so the disk equatorial radius
 * is 1 unit. Depth ordering is honest: a moon with frontOfDisk (physics z > 0,
 * toward Earth = toward the camera) renders in front of the disk; a moon behind
 * is occluded by the opaque disk sphere (so an occultation hides it). A small
 * black shadow dot marks any moon in a shadow transit at (shadowX, shadowY).
 *
 * Positions come from lib/jupiter-moons.galileanPositions, recomputed every frame
 * from the displayed-time ref so play / scrub is smooth without React re-renders.
 * The ONLY liberty is marker SIZE: real Galilean moons are ~1 arcsec against
 * Jupiter's ~40 arcsec, so markers are enlarged for legibility (relative sizes
 * preserved) and that is labeled in the HUD. The where and when are to scale.
 */

/** Jupiter equatorial radius = 1 scene unit; polar radius is the oblate ratio. */
const DISK_R = 1;
const POLAR_RATIO = JUPITER.polarRadiusRatio;
/** Shadow dots sit just in front of the disk's front pole (z=1) so they read. */
const SHADOW_Z = 1.6;
/** Ganymede is the largest moon; enlarged markers are scaled relative to it. */
const GANYMEDE_KM = GALILEAN_MOONS.Ganymede.radiusKm;

function clamp(x: number, lo: number, hi: number): number {
  return x < lo ? lo : x > hi ? hi : x;
}

interface JupiterMoonsSceneProps {
  textures: JupiterTextures;
  jupiterFallback: boolean;
  /** displayed instant (ms) as a ref, read per-frame for smooth animation */
  displayedMsRef: React.RefObject<number>;
  /** half-width of the framed field in Jupiter radii (drives marker sizing) */
  targetRj: number;
  /** true = markers enlarged for visibility; false = true angular size */
  exaggerate: boolean;
}

export default function JupiterMoonsScene({
  textures,
  jupiterFallback,
  displayedMsRef,
  targetRj,
  exaggerate,
}: JupiterMoonsSceneProps) {
  const moonRefs = useRef<Array<THREE.Group | null>>([null, null, null, null]);
  const shadowRefs = useRef<Array<THREE.Mesh | null>>([null, null, null, null]);

  // Marker radius per moon (in Jupiter radii). Enlarged mode keeps a roughly
  // constant on-screen size (scales with the framed field) while preserving the
  // moons' real size ordering; true mode uses the honest angular radius.
  const markerRadii = useMemo<number[]>(() => {
    const enlargedBase = clamp(0.03 * targetRj, 0.12, 0.85);
    return GALILEAN_MOON_ORDER.map((m) => {
      const rk = GALILEAN_MOONS[m].radiusKm;
      const trueR = rk / JUPITER.equatorialRadiusKm;
      const enlargedR = enlargedBase * (rk / GANYMEDE_KM);
      return exaggerate ? enlargedR : trueR;
    });
  }, [targetRj, exaggerate]);

  // Per-frame: place every moon at its real (x, y, z) and toggle its shadow dot.
  useFrame(() => {
    const ms = displayedMsRef.current;
    const positions = galileanPositions(new Date(ms));
    if (!positions) return;
    for (let i = 0; i < positions.length; i++) {
      const p = positions[i];
      const g = moonRefs.current[i];
      if (g) g.position.set(p.x, p.y, p.z);
      const s = shadowRefs.current[i];
      if (s) {
        s.visible = p.inShadowTransit;
        if (p.inShadowTransit) s.position.set(p.shadowX, p.shadowY, SHADOW_Z);
      }
    }
  });

  return (
    <group>
      <JupiterDisk texture={textures.jupiter} fallback={jupiterFallback} />
      <EquatorialLine targetRj={targetRj} />

      {GALILEAN_MOON_ORDER.map((moon, i) => (
        <group
          key={moon}
          ref={(el) => {
            moonRefs.current[i] = el;
          }}
        >
          <MoonMarker
            moon={moon}
            radius={markerRadii[i]}
            texture={textures.moons[moon]}
          />
          <Html
            position={[0, 0, 0]}
            zIndexRange={[15, 0]}
            style={{
              pointerEvents: "none",
              userSelect: "none",
              whiteSpace: "nowrap",
              transform: "translate(-50%, 8px)",
              fontFamily: "var(--font-plex-mono, monospace)",
              fontSize: 10,
              letterSpacing: "0.06em",
              color: MOON_COLORS[moon],
              textShadow: "0 1px 3px rgba(0,0,0,0.9)",
            }}
          >
            {MOON_ROMAN[moon]} {moon}
          </Html>
        </group>
      ))}

      {/* black shadow dots (hidden until a shadow transit is in progress) */}
      {GALILEAN_MOON_ORDER.map((moon, i) => (
        <mesh
          key={`shadow-${moon}`}
          visible={false}
          ref={(el) => {
            shadowRefs.current[i] = el;
          }}
        >
          <circleGeometry args={[markerRadii[i], 28]} />
          <meshBasicMaterial color="#05060a" toneMapped={false} />
        </mesh>
      ))}
    </group>
  );
}

// ─────────────────────────────── Jupiter disk ──────────────────────────────

/**
 * Jupiter as an OBLATE disk: a unit sphere squashed vertically to the real polar
 * ratio (~0.935), textured with the reused NASA/JPL/SSI Cassini map (a snapshot,
 * the belts drift). Rendered unlit (meshBasic) because the focus is the moon
 * geometry, not Jupiter's own gibbous phase, which near opposition is ~full.
 */
function JupiterDisk({
  texture,
  fallback,
}: {
  texture: THREE.Texture | null;
  fallback: boolean;
}) {
  return (
    <mesh scale={[1, POLAR_RATIO, 1]}>
      <sphereGeometry args={[DISK_R, 96, 72]} />
      {texture && !fallback ? (
        <meshBasicMaterial map={texture} toneMapped={false} />
      ) : (
        <meshBasicMaterial color="#b58a5a" toneMapped={false} />
      )}
    </mesh>
  );
}

// ─────────────────────────────── moon marker ───────────────────────────────

/** One moon: a small textured sphere, or a flat tinted disk if its map is missing. */
function MoonMarker({
  moon,
  radius,
  texture,
}: {
  moon: GalileanMoon;
  radius: number;
  texture: THREE.Texture | null;
}) {
  return (
    <mesh>
      <sphereGeometry args={[radius, 24, 24]} />
      {texture ? (
        <meshBasicMaterial map={texture} toneMapped={false} />
      ) : (
        <meshBasicMaterial color={MOON_COLORS[moon]} toneMapped={false} />
      )}
    </mesh>
  );
}

// ───────────────────────────── equatorial line ─────────────────────────────

/**
 * A faint reference line along y = 0 (Jupiter's equatorial plane projected on the
 * sky), the axis the moons string out along. Orientation cue only; rebuilt when
 * the framed field changes so it always spans the view.
 */
function EquatorialLine({ targetRj }: { targetRj: number }) {
  const line = useMemo(() => {
    const g = new THREE.BufferGeometry();
    g.setAttribute(
      "position",
      new THREE.BufferAttribute(
        new Float32Array([-targetRj, 0, -2, targetRj, 0, -2]),
        3
      )
    );
    const m = new THREE.LineBasicMaterial({
      color: "#3a4152",
      transparent: true,
      opacity: 0.5,
    });
    return new THREE.Line(g, m);
  }, [targetRj]);
  useEffect(
    () => () => {
      line.geometry.dispose();
      (line.material as THREE.Material).dispose();
    },
    [line]
  );
  return <primitive object={line} />;
}
