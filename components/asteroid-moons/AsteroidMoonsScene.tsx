"use client";

import { useMemo, useRef } from "react";
import { useFrame } from "@react-three/fiber";
import { Html } from "@react-three/drei";
import * as THREE from "three";
import {
  ASTEROID_MOONS,
  ASTEROID_SYSTEMS,
  MOONS_BY_SYSTEM,
  asteroidMoonPositions,
  type AsteroidMoon,
  type AsteroidSystem,
} from "@/lib/asteroid-moons";
import {
  MOON_COLORS,
  SYSTEM_FALLBACK_COLOR,
  primaryHasPhoto,
} from "./asteroidMoonsUi";
import type { AsteroidMoonsTextures } from "./useAsteroidMoonsTextures";

/**
 * The 2-D SCHEMATIC mutual-orbit orrery, and the centerpiece of the tab. Straight
 * from lib/asteroid-moons, it draws each real binary/multiple asteroid system in
 * its ADOPTED mutual-orbit plane, face-on (X right, Y up, drawn in PRIMARY RADII
 * about the system barycenter):
 *
 *  - The PRIMARY is drawn to true scale (radius 1), textured for Didymos and Ida
 *    (reused real single-view mission photos, shown flat) or a labeled illustrative
 *    shape otherwise (Kleopatra gets a dog-bone silhouette).
 *  - Each MOON is drawn to true scale on its real-sized, real-period orbit ring.
 *    Because separations dwarf the body sizes, an "enlarged markers" toggle scales
 *    the tiniest moons up for legibility (labeled); a "true scale" toggle restores
 *    their honest, tiny size.
 *  - For NEAR-EQUAL DOUBLES (Antiope, Patroclus) the primary is offset from the
 *    barycenter too, so BOTH bodies visibly circle the marked barycenter in empty
 *    space; for small-moon systems the primary sits ~centered.
 *  - A per-moon direction glyph shows the orbit sense (Dimorphos is retrograde).
 *
 * This is NOT a plane-of-sky projection: the mutual-orbit poles are unknown, so
 * there is no compass, no sky and no visibility claim (see the module header of
 * lib/asteroid-moons). Every physics call is guarded against null.
 */

/** Edge indicators sit in front of everything. */
const EDGE_Z = 2;

function clamp(x: number, lo: number, hi: number): number {
  return x < lo ? lo : x > hi ? hi : x;
}

interface AsteroidMoonsSceneProps {
  system: AsteroidSystem;
  textures: AsteroidMoonsTextures;
  /** displayed instant (ms) as a ref, read per-frame for smooth animation. */
  displayedMsRef: React.RefObject<number>;
  /** half-width of the framed field in primary radii (drives marker sizing). */
  targetReq: number;
  /** true = tiny moons enlarged for visibility; false = true scale. */
  exaggerate: boolean;
}

export default function AsteroidMoonsScene({
  system,
  textures,
  displayedMsRef,
  targetReq,
  exaggerate,
}: AsteroidMoonsSceneProps) {
  const sysData = ASTEROID_SYSTEMS[system];
  const keys = MOONS_BY_SYSTEM[system];
  const nearEqualDouble = sysData.nearEqualDouble;

  // Refs (keyed by moon; the moon set changes with the system).
  const primaryRef = useRef<THREE.Group | null>(null);
  const markerRefs = useRef<Partial<Record<AsteroidMoon, THREE.Group | null>>>({});
  const edgeRefs = useRef<Partial<Record<AsteroidMoon, THREE.Group | null>>>({});
  const edgeTextRefs = useRef<Partial<Record<AsteroidMoon, HTMLSpanElement | null>>>(
    {}
  );

  // Static orbit-ring radii (in primary radii). Every mutual orbit is adopted
  // near-circular (e = 0), so each body's barycentric distance is constant in time;
  // one physics call at a fixed epoch gives the exact ring radius for the moons and
  // (for the near-equal doubles) the primary. Guarded against null.
  const ringInfo = useMemo(() => {
    const pos = asteroidMoonPositions(system, new Date(Date.UTC(2000, 0, 1, 12)));
    if (!pos) return { moonRings: [] as Array<{ key: AsteroidMoon; radius: number }>, primaryRingReq: 0 };
    const primary = pos.find((p) => p.role === "primary");
    const primaryRingReq = primary ? Math.hypot(primary.xReq, primary.yReq) : 0;
    const moonRings = pos
      .filter((p) => p.role === "moon")
      .map((p, i) => ({ key: keys[i], radius: Math.hypot(p.xReq, p.yReq) }));
    return { moonRings, primaryRingReq };
  }, [system, keys]);

  // Moon drawing radius (in primary radii). True scale = (moon radius / primary
  // radius). Enlarged mode scales the smallest markers up to a legible size while
  // preserving the real size ordering, but never shrinks a body below its true size
  // (so the near-equal-double secondaries stay to scale). The primary is always
  // drawn at true radius 1 as the reference disk.
  const markerRadii = useMemo<Partial<Record<AsteroidMoon, number>>>(() => {
    const primaryRadiusKm = sysData.primaryDiameterKm / 2;
    const moons = keys.map((k) => ASTEROID_MOONS[k]);
    const maxMoonRk = Math.max(...moons.map((m) => m.diameterKm / 2));
    const enlargedBase = clamp(0.035 * targetReq, 0.16, 1.1);
    const out: Partial<Record<AsteroidMoon, number>> = {};
    for (const m of moons) {
      const rk = m.diameterKm / 2;
      const trueR = rk / primaryRadiusKm;
      const enlargedR = Math.max(trueR, Math.max(enlargedBase * (rk / maxMoonRk), 0.1));
      out[m.name] = exaggerate ? enlargedR : trueR;
    }
    return out;
  }, [sysData, keys, targetReq, exaggerate]);

  // Per-frame: place the primary at its barycentric offset (a visible wobble for the
  // near-equal doubles, negligible otherwise), each moon at its (x, y) in primary
  // radii, and route any off-frame moon to an edge indicator. Off the React path;
  // every physics call guarded against null.
  useFrame(() => {
    const date = new Date(displayedMsRef.current);
    const positions = asteroidMoonPositions(system, date);
    if (!positions) return;

    const field = targetReq * 1.08;
    positions.forEach((p, i) => {
      if (i === 0) {
        if (primaryRef.current) primaryRef.current.position.set(p.xReq, p.yReq, 0);
        return;
      }
      const key = keys[i - 1];
      if (!key) return;
      const elong = Math.hypot(p.xReq, p.yReq);
      const off = elong > field;

      const marker = markerRefs.current[key];
      if (marker) {
        marker.visible = !off;
        if (!off) marker.position.set(p.xReq, p.yReq, 0);
      }

      const edge = edgeRefs.current[key];
      if (edge) {
        edge.visible = off;
        if (off) {
          const k = (targetReq * 0.92) / (elong || 1);
          edge.position.set(p.xReq * k, p.yReq * k, EDGE_Z);
          const txt = edgeTextRefs.current[key];
          if (txt) txt.textContent = `${p.body} · ${elong.toFixed(1)} R`;
        }
      }
    });
  });

  return (
    <group>
      {/* barycenter marker (in empty space) for the near-equal doubles */}
      {nearEqualDouble && <BarycenterMarker targetReq={targetReq} />}

      {/* orbit rings (static; e = 0 so the barycentric distance is constant) */}
      {nearEqualDouble && ringInfo.primaryRingReq > 0.15 && (
        <OrbitRing radius={ringInfo.primaryRingReq} color={SYSTEM_FALLBACK_COLOR[system]} />
      )}
      {ringInfo.moonRings.map((r) =>
        r.radius > 0.15 ? (
          <OrbitRing key={`ring-${r.key}`} radius={r.radius} color={MOON_COLORS[r.key]} />
        ) : null
      )}

      {/* per-moon orbit-direction glyph on each ring (Dimorphos is retrograde) */}
      {ringInfo.moonRings.map((r) =>
        r.radius > 0.15 ? (
          <DirectionGlyph
            key={`dir-${r.key}`}
            radius={r.radius}
            retrograde={ASTEROID_MOONS[r.key].retrograde}
            color={MOON_COLORS[r.key]}
          />
        ) : null
      )}

      {/* primary body (wobbles to its barycentric offset) */}
      <group ref={primaryRef}>
        <PrimaryBody
          system={system}
          texture={primaryHasPhoto(system) ? (system === "Didymos" ? textures.didymos : textures.ida) : null}
          color={SYSTEM_FALLBACK_COLOR[system]}
        />
        <Html
          position={[0, 0, 0]}
          zIndexRange={[14, 0]}
          style={labelStyle("#e6ebf2", "translate(-50%, 12px)")}
        >
          <span>{sysData.name}</span>
          <span style={tagStyle("rgba(150,160,175,0.9)", "rgba(150,160,175,0.4)")}>
            {primaryHasPhoto(system) ? "photo, shown flat" : "illustrative shape"}
          </span>
        </Html>
      </group>

      {/* moon markers (real orbit, illustrative orientation & phase) */}
      {keys.map((key) => {
        const moon = ASTEROID_MOONS[key];
        return (
          <group
            key={`marker-${key}`}
            ref={(el) => {
              markerRefs.current[key] = el;
            }}
          >
            <mesh renderOrder={2}>
              <circleGeometry args={[markerRadii[key] ?? 0.12, 40]} />
              <meshBasicMaterial color={MOON_COLORS[key]} toneMapped={false} />
            </mesh>
            <Html
              position={[0, 0, 0]}
              zIndexRange={[15, 0]}
              style={labelStyle(MOON_COLORS[key], "translate(-50%, 8px)")}
            >
              <span>{moon.displayName}</span>
              <MoonTierTag orbitUncertain={moon.orbitUncertain} retrograde={moon.retrograde} />
            </Html>
          </group>
        );
      })}

      {/* off-frame direction/distance indicators (for tight zooms on wide systems) */}
      {keys.map((key) => (
        <group
          key={`edge-${key}`}
          visible={false}
          ref={(el) => {
            edgeRefs.current[key] = el;
          }}
        >
          <mesh renderOrder={4}>
            <circleGeometry args={[Math.max(0.04 * targetReq, 0.08), 20]} />
            <meshBasicMaterial color={MOON_COLORS[key]} toneMapped={false} />
          </mesh>
          <Html
            position={[0, 0, 0]}
            zIndexRange={[16, 0]}
            style={labelStyle(MOON_COLORS[key], "translate(-50%, -170%)", 9.5)}
          >
            <span
              ref={(el) => {
                edgeTextRefs.current[key] = el;
              }}
            >
              {ASTEROID_MOONS[key].displayName}
            </span>
          </Html>
        </group>
      ))}
    </group>
  );
}

// ─────────────────────────── primary / moon bodies ─────────────────────────

/**
 * The primary body, drawn face-on to true scale (radius 1). Didymos and Ida carry a
 * reused real single-view mission photo mapped onto the face-on disk (shown flat,
 * not a wrapped surface map); Kleopatra gets an illustrative dog-bone silhouette;
 * every other primary is a labeled illustrative disk. Rendered unlit (meshBasic):
 * the point of the tab is the mutual-orbit geometry, not a body's own lighting.
 */
function PrimaryBody({
  system,
  texture,
  color,
}: {
  system: AsteroidSystem;
  texture: THREE.Texture | null;
  color: string;
}) {
  if (system === "Kleopatra") {
    return <DogBone radius={1} color={color} />;
  }
  return (
    <mesh renderOrder={0}>
      <circleGeometry args={[1, 96]} />
      {texture ? (
        <meshBasicMaterial map={texture} toneMapped={false} />
      ) : (
        <meshBasicMaterial color={color} toneMapped={false} />
      )}
    </mesh>
  );
}

/**
 * An illustrative "dog-bone" silhouette for 216 Kleopatra (~276x94 km, mean
 * ~135 km): two end lobes joined by a bar, scaled to the mean-radius drawing unit.
 * The shape is illustrative (no resolved model is shipped), and it is labeled so.
 */
function DogBone({ radius, color }: { radius: number; color: string }) {
  const lobeR = 0.72 * radius;
  const lobeX = 1.28 * radius;
  const barW = 2.3 * radius;
  const barH = 0.92 * radius;
  return (
    <group renderOrder={0}>
      <mesh position={[-lobeX, 0, 0]}>
        <circleGeometry args={[lobeR, 40]} />
        <meshBasicMaterial color={color} toneMapped={false} />
      </mesh>
      <mesh position={[lobeX, 0, 0]}>
        <circleGeometry args={[lobeR, 40]} />
        <meshBasicMaterial color={color} toneMapped={false} />
      </mesh>
      <mesh>
        <planeGeometry args={[barW, barH]} />
        <meshBasicMaterial color={color} toneMapped={false} />
      </mesh>
    </group>
  );
}

/** A thin orbit ring at a fixed barycentric radius (in primary radii). */
function OrbitRing({ radius, color }: { radius: number; color: string }) {
  const w = Math.max(radius * 0.006, 0.02);
  return (
    <mesh renderOrder={1}>
      <ringGeometry args={[radius - w, radius + w, 128]} />
      <meshBasicMaterial color={color} transparent opacity={0.32} toneMapped={false} />
    </mesh>
  );
}

/**
 * The system barycenter: a ring outline + label at the origin (the point in empty
 * space that both near-equal-double components orbit). Sized to the framed field so
 * it stays visible at any zoom.
 */
function BarycenterMarker({ targetReq }: { targetReq: number }) {
  const r = clamp(targetReq * 0.03, 0.08, 0.6);
  return (
    <group renderOrder={5}>
      <mesh>
        <ringGeometry args={[r * 0.75, r, 32]} />
        <meshBasicMaterial color="#8fa0b8" transparent opacity={0.85} toneMapped={false} />
      </mesh>
      <Html
        position={[0, 0, 0]}
        zIndexRange={[13, 0]}
        style={labelStyle("rgba(150,168,196,0.95)", "translate(-50%, -160%)", 9.5)}
      >
        <span>barycenter</span>
      </Html>
    </group>
  );
}

/**
 * A static orbit-direction glyph on a moon's ring: counter-clockwise for prograde,
 * clockwise for retrograde (Dimorphos). Placed at the upper-left of the ring so it
 * clears the body labels.
 */
function DirectionGlyph({
  radius,
  retrograde,
  color,
}: {
  radius: number;
  retrograde: boolean;
  color: string;
}) {
  const theta = (127 * Math.PI) / 180;
  const x = radius * Math.cos(theta);
  const y = radius * Math.sin(theta);
  return (
    <Html
      position={[x, y, 1]}
      zIndexRange={[12, 0]}
      style={{
        pointerEvents: "none",
        userSelect: "none",
        transform: "translate(-50%, -50%)",
        fontFamily: "var(--font-plex-mono, monospace)",
        fontSize: 15,
        lineHeight: 1,
        color,
        opacity: 0.9,
        textShadow: "0 1px 3px rgba(0,0,0,0.9)",
      }}
      title={
        retrograde
          ? "Orbit sense: retrograde (clockwise as drawn). Illustrative orientation; the real orbit plane pole is unknown."
          : "Orbit sense: prograde (counter-clockwise as drawn). Illustrative orientation; the real orbit plane pole is unknown."
      }
    >
      <span>{retrograde ? "↻" : "↺"}</span>
    </Html>
  );
}

/** A tier tag on a moon label: loud for Dactyl (uncertain), plus a retrograde chip. */
function MoonTierTag({
  orbitUncertain,
  retrograde,
}: {
  orbitUncertain: boolean;
  retrograde: boolean;
}) {
  return (
    <>
      {retrograde && (
        <span
          title="Retrograde mutual orbit (a real, cited fact)."
          style={tagStyle("rgba(224,168,119,0.98)", "rgba(201,143,90,0.5)")}
        >
          retrograde
        </span>
      )}
      {orbitUncertain ? (
        <span
          title="Dactyl's orbit is bounded, not solved, from the single 1993 Galileo flyby (Belton et al. 1996)."
          style={tagStyle("rgba(224,168,119,0.98)", "rgba(201,143,90,0.55)")}
        >
          orbit uncertain
        </span>
      ) : (
        <span
          title="Orbit real and to scale; orientation and along-orbit phase are an adopted illustrative convention."
          style={tagStyle("rgba(160,170,185,0.9)", "rgba(160,170,185,0.4)")}
        >
          schematic phase
        </span>
      )}
    </>
  );
}

// ─────────────────────────────── label styling ─────────────────────────────

function labelStyle(
  color: string,
  transform: string,
  fontSize = 10
): React.CSSProperties {
  return {
    pointerEvents: "none",
    userSelect: "none",
    whiteSpace: "nowrap",
    transform,
    fontFamily: "var(--font-plex-mono, monospace)",
    fontSize,
    letterSpacing: "0.06em",
    color,
    textShadow: "0 1px 3px rgba(0,0,0,0.9)",
  };
}

function tagStyle(color: string, borderColor: string): React.CSSProperties {
  return {
    marginLeft: 5,
    padding: "0 4px",
    borderRadius: 4,
    border: `1px solid ${borderColor}`,
    color,
    fontSize: 8.5,
    letterSpacing: "0.08em",
  };
}
