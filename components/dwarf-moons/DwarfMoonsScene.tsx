"use client";

import { useMemo, useRef } from "react";
import { useFrame } from "@react-three/fiber";
import { Html } from "@react-three/drei";
import * as THREE from "three";
import {
  DWARF_SYSTEMS,
  MOONS_BY_SYSTEM,
  dwarfGeocentric,
  dwarfMoonPositions,
  type DwarfMoon,
  type DwarfSystem,
} from "@/lib/dwarf-moons";
import {
  ILLUSTRATIVE_MOONS,
  MOON_COLORS,
  MOON_RADIUS_KM,
  SYSTEM_FALLBACK_COLOR,
  moonName,
  systemSkyGeometry,
} from "./dwarfMoonsUi";
import type { DwarfMoonsTextures } from "./useDwarfMoonsTextures";

/**
 * The telescope plane-of-sky view, and the centerpiece of the tab. It renders the
 * REAL orbital CONFIGURATION of each dwarf-planet moon system straight from
 * lib/dwarf-moons, in central-body radii (X = WEST = right, Y = NORTH = up,
 * Z = toward Earth = toward the orthographic camera). It is honest by construction
 * about the two ideas the brief demands:
 *
 *  1. PLUTO IS A BINARY. The plane-of-sky centre is the Pluto-Charon BARYCENTER,
 *     drawn as a small marker in EMPTY SPACE. Pluto (real New Horizons map) sits
 *     at its barycentricOffset and Charon (real map) opposite at its real position,
 *     both visibly circling that point (the wobble) as you play/scrub. The four
 *     small moons (Styx, Nix, Kerberos, Hydra) circle the same barycenter as
 *     labeled illustrative markers. Depth (front/behind Pluto) is honest by the
 *     depth buffer.
 *  2. TWO TIERS. Only Pluto and Charon carry real maps and real positions;
 *     everything else is a labeled illustrative tinted sphere/marker on a real
 *     orbit with an illustrative along-orbit phase. Makemake's MK2 additionally
 *     carries a loud "orbit poorly constrained" tag.
 *
 * Eris renders an illustrative Eris sphere + Dysnomia marker; Haumea an
 * illustrative TRIAXIAL ellipsoid (scaled by the measured semi-axes) + an
 * illustrative RING (at the measured ring radius) + Hiʻiaka and Namaka markers;
 * Makemake an illustrative sphere + the MK2 marker. Marker SIZE is enlarged for
 * legibility (a true-size toggle restores the honest, tiny angular size); the
 * central body stays at its true radius as the reference disk. When a moon falls
 * outside the framed field its direction and distance are shown at the edge rather
 * than dropped. Every physics call is guarded against null.
 */

/** Edge indicators sit in front of everything. */
const EDGE_Z = 2;

function clamp(x: number, lo: number, hi: number): number {
  return x < lo ? lo : x > hi ? hi : x;
}

interface DwarfMoonsSceneProps {
  system: DwarfSystem;
  textures: DwarfMoonsTextures;
  /** displayed instant (ms) as a ref, read per-frame for smooth animation */
  displayedMsRef: React.RefObject<number>;
  /** half-width of the framed field in central-body radii (drives marker sizing) */
  targetReq: number;
  /** true = markers enlarged for visibility; false = true angular size */
  exaggerate: boolean;
}

export default function DwarfMoonsScene({
  system,
  textures,
  displayedMsRef,
  targetReq,
  exaggerate,
}: DwarfMoonsSceneProps) {
  const sysData = DWARF_SYSTEMS[system];
  const allMoons = MOONS_BY_SYSTEM[system];
  // Charon is a binary component (real map, oriented); the rest are illustrative
  // markers on real orbits with illustrative phase.
  const markerMoons = useMemo(
    () => allMoons.filter((m) => m !== "Charon"),
    [allMoons]
  );
  const hasCharon = allMoons.includes("Charon");

  // Refs (keyed by moon; the moon set changes with the system).
  const centralRef = useRef<THREE.Group | null>(null); // central body (Pluto moves)
  const plutoBodyRef = useRef<THREE.Mesh | null>(null); // Pluto sphere (pole-oriented)
  const charonGroupRef = useRef<THREE.Group | null>(null); // Charon position group
  const charonBodyRef = useRef<THREE.Mesh | null>(null); // Charon sphere (pole-oriented)
  const markerRefs = useRef<Partial<Record<DwarfMoon, THREE.Group | null>>>({});
  const edgeRefs = useRef<Partial<Record<DwarfMoon, THREE.Group | null>>>({});
  const edgeTextRefs = useRef<Partial<Record<DwarfMoon, HTMLSpanElement | null>>>({});

  // Reused temporaries so the per-frame update never allocates.
  const tmpPole = useMemo(() => new THREE.Vector3(), []);
  const upY = useMemo(() => new THREE.Vector3(0, 1, 0), []);

  // Haumea's illustrative triaxial scale + ring radius (from the measured dims).
  const triaxialScale = useMemo<[number, number, number]>(() => {
    const t = sysData.triaxialSemiAxesKm;
    if (!t) return [1, 1, 1];
    const R = sysData.centralRadiusKm;
    // Long axis a -> X (west), short axis c -> Y (up), mid axis b -> Z; illustrative.
    return [t.a / R, t.c / R, t.b / R];
  }, [sysData]);
  const ringReq = sysData.ringRadiusReq ?? 0;

  // Marker radius per moon (in central-body radii). Enlarged mode keeps a roughly
  // constant, legible on-screen size (scaled with the framed field, capped) while
  // preserving the moons' real size ordering; true mode uses the honest angular
  // radius (tiny, on purpose). The central body stays at radius 1 (the reference).
  const markerRadii = useMemo<Partial<Record<DwarfMoon, number>>>(() => {
    const reqKm = sysData.centralRadiusKm;
    const maxRk = Math.max(...allMoons.map((m) => MOON_RADIUS_KM[m]));
    const enlargedBase = clamp(0.02 * targetReq, 0.1, 0.9);
    const out: Partial<Record<DwarfMoon, number>> = {};
    for (const m of allMoons) {
      const rk = MOON_RADIUS_KM[m];
      const trueR = rk / reqKm;
      const enlargedR = enlargedBase * (rk / maxRk);
      out[m] = exaggerate ? Math.max(enlargedR, 0.06) : trueR;
    }
    return out;
  }, [sysData, allMoons, targetReq, exaggerate]);

  // Per-frame: place the central body (Pluto at its barycentric offset; others at
  // origin), orient Pluto/Charon to Pluto's real pole, place every moon at its real
  // (x, y, z), and route any off-frame moon to an edge indicator. Off the React
  // path; every physics call guarded against null.
  useFrame(() => {
    const date = new Date(displayedMsRef.current);
    const positions = dwarfMoonPositions(system, date);
    if (!positions) return;

    // Central-body position: Pluto sits at its offset from the barycenter (the
    // wobble); the illustrative systems' bodies sit at the centre.
    const bary = positions.length > 0 ? positions[0].barycentricOffset : null;
    if (centralRef.current) {
      if (system === "Pluto" && bary) {
        centralRef.current.position.set(bary.x, bary.y, bary.z);
      } else {
        centralRef.current.position.set(0, 0, 0);
      }
    }

    // Orient Pluto (and Charon) to Pluto's real IAU pole in the plane of sky.
    if (system === "Pluto") {
      const geo = dwarfGeocentric(system, date);
      if (geo) {
        const sky = systemSkyGeometry(system, geo.raDeg, geo.decDeg);
        if (sky.poleSky) {
          tmpPole.set(sky.poleSky[0], sky.poleSky[1], sky.poleSky[2]);
          plutoBodyRef.current?.quaternion.setFromUnitVectors(upY, tmpPole);
          charonBodyRef.current?.quaternion.setFromUnitVectors(upY, tmpPole);
        }
      }
    }

    const field = targetReq * 1.06; // off-frame threshold (slightly past the edge)
    for (const p of positions) {
      if (p.moon === "Charon") {
        const g = charonGroupRef.current;
        if (g) g.position.set(p.x, p.y, p.z);
        continue;
      }
      const elong = Math.hypot(p.x, p.y);
      const off = elong > field;

      const marker = markerRefs.current[p.moon];
      if (marker) {
        marker.visible = !off;
        if (!off) marker.position.set(p.x, p.y, p.z);
      }

      const edge = edgeRefs.current[p.moon];
      if (edge) {
        edge.visible = off;
        if (off) {
          const k = (targetReq * 0.9) / (elong || 1);
          edge.position.set(p.x * k, p.y * k, EDGE_Z);
          const txt = edgeTextRefs.current[p.moon];
          if (txt) txt.textContent = `${p.moon} · ${elong.toFixed(0)} R`;
        }
      }
    }
  });

  return (
    <group>
      {/* central body (Pluto moves to its barycentric offset; others at centre) */}
      <group ref={centralRef}>
        {system === "Pluto" ? (
          <Body
            innerRef={plutoBodyRef}
            texture={textures.pluto}
            fallbackColor={SYSTEM_FALLBACK_COLOR.Pluto}
            scale={[1, 1, 1]}
          />
        ) : system === "Haumea" ? (
          <>
            <Body
              texture={null}
              fallbackColor={SYSTEM_FALLBACK_COLOR.Haumea}
              scale={triaxialScale}
              rotation={[0.15, 0.5, 0.1]}
            />
            <HaumeaRing ringReq={ringReq} />
          </>
        ) : (
          <Body
            texture={null}
            fallbackColor={SYSTEM_FALLBACK_COLOR[system]}
            scale={[1, 1, 1]}
          />
        )}

        <Html
          position={[0, 0, 0]}
          zIndexRange={[14, 0]}
          style={labelStyle("#e6ebf2", "translate(-50%, 12px)")}
        >
          <span>{sysData.centralBody}</span>
          {system !== "Pluto" && (
            <span style={tagStyle("rgba(150,160,175,0.9)", "rgba(150,160,175,0.4)")}>
              illustrative
            </span>
          )}
        </Html>
      </group>

      {/* Pluto-Charon barycenter: a marker in EMPTY SPACE at the plane-of-sky centre */}
      {system === "Pluto" && <BarycenterMarker targetReq={targetReq} />}

      {/* Charon: the other binary component (real map), oriented to Pluto's pole */}
      {hasCharon && (
        <group ref={charonGroupRef}>
          <Body
            innerRef={charonBodyRef}
            texture={textures.charon}
            fallbackColor={MOON_COLORS.Charon}
            scale={scaleFor(markerRadii.Charon ?? 0.5)}
          />
          <Html
            position={[0, 0, 0]}
            zIndexRange={[15, 0]}
            style={labelStyle(MOON_COLORS.Charon, "translate(-50%, 10px)")}
          >
            <span>{moonName("Charon")}</span>
          </Html>
        </group>
      )}

      <CompassLabels targetReq={targetReq} />

      {/* illustrative moon markers (real orbit, illustrative along-orbit phase) */}
      {markerMoons.map((moon) => (
        <group
          key={`marker-${moon}`}
          ref={(el) => {
            markerRefs.current[moon] = el;
          }}
        >
          <mesh renderOrder={2}>
            <sphereGeometry args={[markerRadii[moon] ?? 0.06, 24, 24]} />
            <meshBasicMaterial color={MOON_COLORS[moon]} toneMapped={false} />
          </mesh>
          <Html
            position={[0, 0, 0]}
            zIndexRange={[15, 0]}
            style={labelStyle(MOON_COLORS[moon], "translate(-50%, 8px)")}
          >
            <span>{moonName(moon)}</span>
            <MoonTierTag moon={moon} />
          </Html>
        </group>
      ))}

      {/* off-frame direction/distance indicators (Kerberos, Hydra, Hiʻiaka at wide spans) */}
      {markerMoons.map((moon) => (
        <group
          key={`edge-${moon}`}
          visible={false}
          ref={(el) => {
            edgeRefs.current[moon] = el;
          }}
        >
          <mesh renderOrder={4}>
            <circleGeometry args={[Math.max(0.04 * targetReq, 0.08), 20]} />
            <meshBasicMaterial color={MOON_COLORS[moon]} toneMapped={false} />
          </mesh>
          <Html
            position={[0, 0, 0]}
            zIndexRange={[16, 0]}
            style={labelStyle(MOON_COLORS[moon], "translate(-50%, -170%)", 9.5)}
          >
            <span
              ref={(el) => {
                edgeTextRefs.current[moon] = el;
              }}
            >
              {moon}
            </span>
          </Html>
        </group>
      ))}
    </group>
  );
}

// ─────────────────────────── central / moon bodies ─────────────────────────

function scaleFor(r: number): [number, number, number] {
  return [r, r, r];
}

/**
 * A body sphere: textured (Pluto / Charon) or a flat tinted illustrative sphere.
 * Rendered unlit (meshBasic) as an illustrative snapshot; the point of the tab is
 * the moon geometry, not each body's own phase. `scale` shapes it (a unit sphere
 * for the near-spherical bodies, the triaxial ratios for Haumea).
 */
function Body({
  innerRef,
  texture,
  fallbackColor,
  scale,
  rotation,
}: {
  innerRef?: React.RefObject<THREE.Mesh | null>;
  texture: THREE.Texture | null;
  fallbackColor: string;
  scale: [number, number, number];
  rotation?: [number, number, number];
}) {
  return (
    <mesh ref={innerRef ?? undefined} scale={scale} rotation={rotation} renderOrder={0}>
      <sphereGeometry args={[1, 96, 72]} />
      {texture ? (
        <meshBasicMaterial map={texture} toneMapped={false} />
      ) : (
        <meshBasicMaterial color={fallbackColor} toneMapped={false} />
      )}
    </mesh>
  );
}

/**
 * Haumea's illustrative ring at the measured ring radius (Ortiz et al. 2017),
 * drawn as a thin tilted torus. The ring plane orientation is illustrative (its
 * real pole is not modelled here). Labeled illustrative in the panels.
 */
function HaumeaRing({ ringReq }: { ringReq: number }) {
  if (!ringReq) return null;
  return (
    <group rotation={[-1.15, 0.35, 0]}>
      <mesh renderOrder={1}>
        <torusGeometry args={[ringReq, 0.035, 10, 128]} />
        <meshBasicMaterial
          color="#cfd6df"
          transparent
          opacity={0.5}
          toneMapped={false}
        />
      </mesh>
    </group>
  );
}

/**
 * The Pluto-Charon barycenter: a ring outline + crosshair at the plane-of-sky
 * centre, marking the point in EMPTY SPACE (outside Pluto) that both bodies orbit.
 * Sized to the framed field so it stays visible at any zoom.
 */
function BarycenterMarker({ targetReq }: { targetReq: number }) {
  const r = clamp(targetReq * 0.04, 0.12, 1.2);
  return (
    <group renderOrder={5}>
      <mesh>
        <ringGeometry args={[r * 0.8, r, 32]} />
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

/** A tier tag on an illustrative marker: loud for MK2, quiet for the rest. */
function MoonTierTag({ moon }: { moon: DwarfMoon }) {
  if (!ILLUSTRATIVE_MOONS.has(moon)) return null;
  if (moon === "MK2") {
    return (
      <span
        title="MK2's orbit is poorly constrained (near edge-on, few detections; Parker et al. 2016). Position is illustrative."
        style={tagStyle("rgba(224,168,119,0.98)", "rgba(201,143,90,0.55)")}
      >
        orbit uncertain
      </span>
    );
  }
  return (
    <span
      title="Orbit real (a, e, i, period cited); along-orbit position illustrative."
      style={tagStyle("rgba(160,170,185,0.9)", "rgba(160,170,185,0.4)")}
    >
      illus. phase
    </span>
  );
}

// ───────────────────────────── compass labels ──────────────────────────────

/**
 * Fixed N / S / E / W markers at the edges of the framed field. The plane-of-sky
 * convention never rotates: North up, South down, West right, East left (the same
 * X = west convention as lib/dwarf-moons). Rebuilt when the field is reframed.
 */
function CompassLabels({ targetReq }: { targetReq: number }) {
  const r = targetReq * 0.92;
  const marks: Array<{ key: string; pos: [number, number, number] }> = [
    { key: "N", pos: [0, r, -3] },
    { key: "S", pos: [0, -r, -3] },
    { key: "W", pos: [r, 0, -3] }, // +X = west = right
    { key: "E", pos: [-r, 0, -3] }, // -X = east = left
  ];
  return (
    <group>
      {marks.map((m) => (
        <Html
          key={m.key}
          position={m.pos}
          zIndexRange={[10, 0]}
          style={{
            pointerEvents: "none",
            userSelect: "none",
            transform: "translate(-50%, -50%)",
            fontFamily: "var(--font-plex-mono, monospace)",
            fontSize: 11,
            fontWeight: 600,
            letterSpacing: "0.1em",
            color: "rgba(180,190,205,0.55)",
            textShadow: "0 1px 3px rgba(0,0,0,0.9)",
          }}
        >
          {m.key}
        </Html>
      ))}
    </group>
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
