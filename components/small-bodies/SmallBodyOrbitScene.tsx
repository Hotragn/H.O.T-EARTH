"use client";

import { useEffect, useMemo, useState } from "react";
import { Html } from "@react-three/drei";
import * as THREE from "three";
import {
  PLANET_ORDER,
  PLANETS,
  heliocentricPosition as planetPosition,
  type PlanetName,
} from "@/lib/planets";
import {
  cometActivity,
  compressRadius,
  orbitPath,
  type CompressionOptions,
} from "@/lib/small-bodies";
import {
  ASTEROID_COLOR,
  COMET_COLOR,
  EARTH_REF_COLOR,
  OPEN_ORBIT_COLOR,
  PHA_COLOR,
  PLANET_REF_COLOR,
  type SmallBodyObject,
} from "@/lib/small-body-facts";

const DAY_MS = 86_400_000;
const YEAR_DAYS = 365.25;
const DEG2RAD = Math.PI / 180;

/**
 * One shared, log-compressed radial scale for BOTH the planet reference orbits
 * (Mercury→Jupiter) and the small-body orbits, so everything lives in one frame.
 * innerAU 0.1 (inside every perihelion) → outerAU 50 map to scene radii 1.4→11;
 * log is monotonic and extrapolates, so a long-period aphelion (tens–thousands of
 * AU) still maps to a finite, larger radius. ANGLES are the real heliocentric
 * longitudes; only the RADIUS is compressed — the HUD says so.
 */
const ORRERY_OPTS: CompressionOptions = {
  mode: "log",
  minRadius: 1.4,
  maxRadius: 11,
  innerAU: 0.1,
  outerAU: 50,
};

/** Inner planets + Jupiter — the reference frame for the inner Solar System. */
const REF_PLANETS: PlanetName[] = ["Mercury", "Venus", "Earth", "Mars", "Jupiter"];

interface OrbitVis {
  obj: SmallBodyObject;
  line: THREE.Line;
  /** perihelion scene point (min heliocentric distance along the drawn path) */
  peri: { x: number; z: number };
  /** perihelion heliocentric distance [AU] */
  qAU: number;
  color: string;
  /** the path is drawn as an open arc (near-parabolic or hyperbolic) */
  open: boolean;
  /**
   * The body is GENUINELY unbound (e > 1 / hyperbolic / interstellar) — passes
   * through once and never returns. Distinct from `open`: a bound long-period
   * comet (e.g. NEOWISE e≈0.999) is drawn as an arc but is NOT unbound.
   */
  unbound: boolean;
}

interface SmallBodyOrbitSceneProps {
  objects: SmallBodyObject[];
  onFocus: (o: SmallBodyObject) => void;
}

/** Colour for a body's orbit + marker. */
function colorFor(o: SmallBodyObject): string {
  if (o.interstellar || o.elements.hyperbolic) return OPEN_ORBIT_COLOR;
  return o.kind === "comet" ? COMET_COLOR : ASTEROID_COLOR;
}

/**
 * The inner-Solar-System orbit view — the 3D centerpiece. The Sun sits at centre;
 * the planet reference orbits (Mercury→Jupiter, Earth highlighted) and every
 * small body's REAL orbit share one compressed radial scale. Bound asteroids and
 * comets draw as CLOSED ellipses; hyperbolic / interstellar visitors draw as OPEN
 * arcs (visually distinct, labelled "unbound — passing through, not orbiting").
 * Comets get an illustrative anti-sunward tail at perihelion whose length/opacity
 * scale with cometActivity(q).
 *
 * The catalogue carries no mean-anomaly / time-of-perihelion, so a live position
 * cannot be computed — we degrade gracefully: orbit SHAPES are always drawn, and
 * each body is marked at its perihelion (clickable), never at a faked "now".
 *
 * All line geometries/materials are built once and disposed on unmount; the tails
 * and markers are declarative (r3f disposes them). Nothing allocates per frame.
 */
export default function SmallBodyOrbitScene({
  objects,
  onFocus,
}: SmallBodyOrbitSceneProps) {
  // Planet reference orbits — built once (independent of the object filter).
  const planetOrbits = useMemo(() => buildPlanetOrbits(), []);
  useEffect(() => {
    return () => {
      for (const p of planetOrbits) {
        p.line.geometry.dispose();
        (p.line.material as THREE.Material).dispose();
      }
    };
  }, [planetOrbits]);

  // Small-body orbits — rebuilt when the filtered object set changes.
  const orbits = useMemo(() => buildOrbits(objects), [objects]);
  useEffect(() => {
    return () => {
      for (const o of orbits) {
        o.line.geometry.dispose();
        (o.line.material as THREE.Material).dispose();
      }
    };
  }, [orbits]);

  return (
    <group>
      <Sun />

      {/* planet reference orbits (Mercury→Jupiter) */}
      {planetOrbits.map((p) => (
        <group key={`planet-${p.name}`}>
          <primitive object={p.line} />
          <Html
            position={[p.labelX, 0, p.labelZ]}
            center
            distanceFactor={12}
            zIndexRange={[11, 0]}
            style={{ pointerEvents: "none", userSelect: "none" }}
          >
            <div
              style={{
                whiteSpace: "nowrap",
                fontFamily: "var(--font-plex-mono, monospace)",
                fontSize: 9.5,
                letterSpacing: "0.04em",
                color: p.earth ? EARTH_REF_COLOR : "#7f93c8",
                opacity: p.earth ? 0.95 : 0.7,
              }}
            >
              {p.name} · {p.au < 1 ? p.au.toFixed(2) : p.au.toFixed(1)} AU
            </div>
          </Html>
        </group>
      ))}

      {/* small-body orbits, perihelion markers + comet tails */}
      {orbits.map((o) => (
        <group key={o.obj.designation ?? o.obj.name}>
          <primitive object={o.line} />
          <CometTail vis={o} />
          <BodyMarker vis={o} onFocus={() => onFocus(o.obj)} />
        </group>
      ))}
    </group>
  );
}

// ─────────────────────────────── building ───────────────────────────────────

interface PlanetOrbitVis {
  name: PlanetName;
  line: THREE.Line;
  au: number;
  earth: boolean;
  labelX: number;
  labelZ: number;
}

/** Trace each reference planet's real orbit (sampled over one period), compressed. */
function buildPlanetOrbits(): PlanetOrbitVis[] {
  const out: PlanetOrbitVis[] = [];
  const base = Date.now();
  for (const name of REF_PLANETS) {
    const periodDays = PLANETS[name].physical.orbitalPeriodYears * YEAR_DAYS;
    const samples = 128;
    const pts = new Float32Array(samples * 3);
    for (let i = 0; i < samples; i++) {
      const d = new Date(base + (i / samples) * periodDays * DAY_MS);
      const pos = planetPosition(name, d);
      const r = compressRadius(pos.distanceAU, ORRERY_OPTS);
      const lam = pos.longitudeDeg * DEG2RAD;
      pts[i * 3] = r * Math.cos(lam);
      pts[i * 3 + 1] = 0;
      pts[i * 3 + 2] = -r * Math.sin(lam);
    }
    const geo = new THREE.BufferGeometry();
    geo.setAttribute("position", new THREE.BufferAttribute(pts, 3));
    const earth = name === "Earth";
    const mat = new THREE.LineBasicMaterial({
      color: earth ? EARTH_REF_COLOR : PLANET_REF_COLOR,
      transparent: true,
      opacity: earth ? 0.75 : 0.42,
    });
    const line = new THREE.LineLoop(geo, mat);
    const au = PLANETS[name].elements.a;
    const rLabel = compressRadius(au, ORRERY_OPTS);
    out.push({
      name,
      line,
      au,
      earth,
      labelX: rLabel * Math.cos(0.6),
      labelZ: -rLabel * Math.sin(0.6),
    });
  }
  return out;
}

/** Build the drawn orbit, perihelion marker + tail data for each object. */
function buildOrbits(objects: SmallBodyObject[]): OrbitVis[] {
  const out: OrbitVis[] = [];
  for (const obj of objects) {
    const path = orbitPath(obj.elements, ORRERY_OPTS);
    if (!path || path.points.length < 2) continue;

    const pts = new Float32Array(path.points.length * 3);
    let periIdx = 0;
    let periDist = Infinity;
    for (let i = 0; i < path.points.length; i++) {
      const p = path.points[i];
      pts[i * 3] = p.x;
      pts[i * 3 + 1] = 0;
      pts[i * 3 + 2] = p.z;
      if (p.distanceAU < periDist) {
        periDist = p.distanceAU;
        periIdx = i;
      }
    }

    const geo = new THREE.BufferGeometry();
    geo.setAttribute("position", new THREE.BufferAttribute(pts, 3));
    const open = !path.closed;
    const color = colorFor(obj);
    const mat = new THREE.LineBasicMaterial({
      color,
      transparent: true,
      opacity: open ? 0.55 : obj.kind === "comet" ? 0.3 : 0.36,
    });
    const line = open
      ? new THREE.Line(geo, mat)
      : (new THREE.LineLoop(geo, mat) as unknown as THREE.Line);

    const periPt = path.points[periIdx];
    const unbound =
      obj.interstellar ||
      obj.elements.hyperbolic ||
      (obj.elements.e !== null && obj.elements.e > 1);
    out.push({
      obj,
      line,
      peri: { x: periPt.x, z: periPt.z },
      qAU: periDist,
      color,
      open,
      unbound,
    });
  }
  return out;
}

// ─────────────────────────────── pieces ─────────────────────────────────────

function Sun() {
  return (
    <group>
      <mesh>
        <sphereGeometry args={[0.32, 48, 48]} />
        <meshBasicMaterial color="#ffcf6b" toneMapped={false} />
      </mesh>
      <mesh scale={1.7}>
        <sphereGeometry args={[0.32, 32, 32]} />
        <meshBasicMaterial
          color="#f2a63b"
          transparent
          opacity={0.16}
          blending={THREE.AdditiveBlending}
          depthWrite={false}
          toneMapped={false}
        />
      </mesh>
      <pointLight intensity={1.4} distance={0} decay={0} color="#fff3d6" />
    </group>
  );
}

/**
 * Illustrative anti-sunward comet tail at perihelion. Direction is the outward
 * radial (away-from-Sun) unit vector in the ecliptic projection — physically
 * anti-sunward — and length/opacity scale with cometActivity(q). Only drawn for
 * comets active at perihelion (q < ~3 AU). Purely illustrative; labelled so.
 */
function CometTail({ vis }: { vis: OrbitVis }) {
  const { obj, peri, qAU } = vis;
  const activity = cometActivity(qAU);
  const isComet = obj.kind === "comet";
  const geometry = useMemo(() => {
    if (!isComet || activity <= 0) return null;
    const len = 0.6 + 2.2 * activity;
    const rad = 0.16 + 0.24 * activity;
    // Cone default apex at +Y; we orient +Y toward the Sun so the wide base points
    // outward (anti-sunward) — a comet tail widens away from the nucleus.
    const outward = new THREE.Vector3(peri.x, 0, peri.z);
    if (outward.lengthSq() === 0) return null;
    outward.normalize();
    const g = new THREE.ConeGeometry(rad, len, 20, 1, true);
    g.translate(0, -len / 2, 0); // apex at origin, base at -Y
    const q = new THREE.Quaternion().setFromUnitVectors(
      new THREE.Vector3(0, 1, 0),
      outward.clone().negate() // +Y → toward the Sun; base (-Y) → anti-sunward
    );
    g.applyQuaternion(q);
    g.translate(peri.x, 0, peri.z);
    return g;
  }, [isComet, activity, peri.x, peri.z]);

  useEffect(() => {
    return () => {
      geometry?.dispose();
    };
  }, [geometry]);

  if (!geometry) return null;
  return (
    <mesh geometry={geometry}>
      <meshBasicMaterial
        color="#8fe9ff"
        transparent
        opacity={0.1 + 0.28 * activity}
        blending={THREE.AdditiveBlending}
        depthWrite={false}
        side={THREE.DoubleSide}
        toneMapped={false}
      />
    </mesh>
  );
}

function BodyMarker({
  vis,
  onFocus,
}: {
  vis: OrbitVis;
  onFocus: () => void;
}) {
  const [hovered, setHovered] = useState(false);
  const { obj, peri, color, unbound } = vis;
  const r = 0.085;

  return (
    <group position={[peri.x, 0, peri.z]}>
      {/* visible marker dot */}
      <mesh>
        <sphereGeometry args={[r, 20, 20]} />
        <meshBasicMaterial color={color} toneMapped={false} />
      </mesh>
      {/* PHA ring — a calm amber halo, factual not alarming */}
      {obj.pha && (
        <mesh rotation={[-Math.PI / 2, 0, 0]}>
          <ringGeometry args={[r * 1.7, r * 2.3, 28]} />
          <meshBasicMaterial
            color={PHA_COLOR}
            transparent
            opacity={0.75}
            side={THREE.DoubleSide}
            depthWrite={false}
            toneMapped={false}
          />
        </mesh>
      )}
      {/* larger invisible hit target */}
      <mesh
        onClick={(e) => {
          e.stopPropagation();
          onFocus();
        }}
        onPointerOver={(e) => {
          e.stopPropagation();
          setHovered(true);
          document.body.style.cursor = "pointer";
        }}
        onPointerOut={() => {
          setHovered(false);
          document.body.style.cursor = "auto";
        }}
      >
        <sphereGeometry args={[Math.max(r * 3, 0.3), 12, 12]} />
        <meshBasicMaterial transparent opacity={0} depthWrite={false} />
      </mesh>
      <Html
        position={[0, r + 0.22, 0]}
        center
        distanceFactor={10}
        zIndexRange={[18, 0]}
        style={{ pointerEvents: "none", userSelect: "none" }}
      >
        <div
          style={{
            whiteSpace: "nowrap",
            textAlign: "center",
            fontFamily: "var(--font-plex-mono, monospace)",
            fontSize: 10,
            lineHeight: 1.25,
            transform: `scale(${hovered ? 1.08 : 1})`,
            transition: "transform 0.15s ease",
          }}
        >
          <div style={{ color, fontWeight: 600 }}>{obj.name}</div>
          {unbound && (
            <div style={{ color: OPEN_ORBIT_COLOR, fontSize: 8.5 }}>
              unbound — passing through
            </div>
          )}
        </div>
      </Html>
    </group>
  );
}
