"use client";

import { useLayoutEffect, useMemo } from "react";
import { useThree } from "@react-three/fiber";
import { OrbitControls } from "@react-three/drei";
import * as THREE from "three";
import { planetTint } from "@/lib/exoplanets";
import type { ExoSurfaceState } from "@/lib/exo-surfaces";
import {
  TERRAIN_SEED,
  discRadiusAtDistance,
  illustrativeTerrain,
  skyDirection,
  starSkyAltAz,
  type DayMode,
} from "./exoSurfacesUi";

/**
 * Standing on a rocky exoplanet: an ILLUSTRATIVE procedural terrain under a REAL
 * sky. What is REAL and computed (lib/exo-surfaces from measured parameters):
 *   - the host star drawn at its true angular diameter and illustrative Teff
 *     colour, at a chosen sky position, lighting the scene in the star's colour;
 *   - the sibling planets as discs at their real maximum apparent size at
 *     closest approach (largest-first), with moon-beating ones outlined.
 * What is ILLUSTRATIVE (labeled in the HUD/honesty panels): all terrain and
 * ground, the star/planet colours, the sky's fine texture, and the day-side /
 * terminator / night-side framing (which rests on the tidal-lock INFERENCE).
 *
 * Scene units are abstract; the physics enters ONLY through the angular sizes.
 */

const SKY_RADIUS = 900;
const STAR_DISTANCE = 700;
const SIBLING_DISTANCE = 620;

/** Brightness multiplier per illustrative day mode (rests on tidal-lock inference). */
function brightnessFor(mode: DayMode): number {
  if (mode === "night") return 0.06;
  if (mode === "terminator") return 0.4;
  return 1;
}

/** A vertical sky-dome gradient tinted by the star colour and brightness. */
function makeSkyTexture(hex: string, brightness: number): THREE.Texture {
  const canvas = document.createElement("canvas");
  canvas.width = 1;
  canvas.height = 128;
  const ctx = canvas.getContext("2d");
  if (ctx) {
    const base = new THREE.Color(hex);
    const zenith = base.clone().multiplyScalar(0.1 * brightness + 0.01);
    const horizon = base.clone().multiplyScalar(0.5 * brightness + 0.03);
    const g = ctx.createLinearGradient(0, 0, 0, 128);
    g.addColorStop(0, `#${zenith.getHexString()}`);
    g.addColorStop(1, `#${horizon.getHexString()}`);
    ctx.fillStyle = g;
    ctx.fillRect(0, 0, 1, 128);
  }
  const tex = new THREE.CanvasTexture(canvas);
  tex.colorSpace = THREE.SRGBColorSpace;
  return tex;
}

/** A soft radial glow sprite for the star's halo. */
function makeGlowTexture(hex: string): THREE.Texture {
  const size = 128;
  const canvas = document.createElement("canvas");
  canvas.width = size;
  canvas.height = size;
  const ctx = canvas.getContext("2d");
  if (ctx) {
    const c = new THREE.Color(hex);
    const rgb = `${Math.round(c.r * 255)},${Math.round(c.g * 255)},${Math.round(c.b * 255)}`;
    const g = ctx.createRadialGradient(64, 64, 4, 64, 64, 64);
    g.addColorStop(0, `rgba(${rgb},0.9)`);
    g.addColorStop(0.4, `rgba(${rgb},0.3)`);
    g.addColorStop(1, `rgba(${rgb},0)`);
    ctx.fillStyle = g;
    ctx.fillRect(0, 0, size, size);
  }
  const tex = new THREE.CanvasTexture(canvas);
  tex.colorSpace = THREE.SRGBColorSpace;
  return tex;
}

interface Props {
  state: ExoSurfaceState;
  dayMode: DayMode;
}

export default function ExoSurfaceScene({ state, dayMode }: Props) {
  const sky = state.hostStarSky;
  const starHex = sky?.color ?? "#ffcaa0";
  const brightness = brightnessFor(dayMode);

  // ── illustrative terrain (labeled) ────────────────────────────────────────
  const groundColor = useMemo(
    () => planetTint(state.equilibriumTempK, state.composition?.class ?? null),
    [state.equilibriumTempK, state.composition]
  );
  const geometry = useMemo(() => {
    const seed = TERRAIN_SEED[state.vantageId] ?? 0;
    const geo = new THREE.PlaneGeometry(240, 240, 120, 120);
    geo.rotateX(-Math.PI / 2);
    const pos = geo.getAttribute("position") as THREE.BufferAttribute;
    for (let i = 0; i < pos.count; i++) {
      pos.setY(i, illustrativeTerrain(pos.getX(i), pos.getZ(i), seed));
    }
    pos.needsUpdate = true;
    geo.computeVertexNormals();
    return geo;
  }, [state.vantageId]);

  const skyTexture = useMemo(
    () => makeSkyTexture(starHex, brightness),
    [starHex, brightness]
  );
  const glowTexture = useMemo(() => makeGlowTexture(starHex), [starHex]);

  // ── host star: true angular size, chosen sky position ─────────────────────
  const starDir = useMemo(() => {
    const { altitudeDeg, azimuthDeg } = starSkyAltAz(dayMode);
    return skyDirection(altitudeDeg, azimuthDeg);
  }, [dayMode]);
  const starVisible = starDir !== null && starDir[1] > -0.05;
  const starPos = useMemo<[number, number, number] | null>(() => {
    if (!starDir) return null;
    return [
      starDir[0] * STAR_DISTANCE,
      starDir[1] * STAR_DISTANCE,
      starDir[2] * STAR_DISTANCE,
    ];
  }, [starDir]);
  const starRadius = useMemo(
    () => discRadiusAtDistance(sky?.angularDiameterDeg ?? 0.53, STAR_DISTANCE),
    [sky]
  );

  // ── sibling planets as discs at their real max apparent size ──────────────
  const siblings = useMemo(() => {
    const discs = state.siblingDiscs?.discs ?? [];
    return discs.slice(0, 6).map((d, i) => {
      const azimuthDeg = -55 + i * 30;
      const altitudeDeg = 16 + (i % 3) * 11;
      const dir = skyDirection(altitudeDeg, azimuthDeg);
      const pos: [number, number, number] = dir
        ? [dir[0] * SIBLING_DISTANCE, dir[1] * SIBLING_DISTANCE, dir[2] * SIBLING_DISTANCE]
        : [0, 100, -SIBLING_DISTANCE];
      return {
        key: d.name ?? `sib-${i}`,
        pos,
        radius: Math.max(0.6, discRadiusAtDistance(d.maxAngularDiameterDeg, SIBLING_DISTANCE)),
        biggerThanMoon: d.timesMoon > 1,
      };
    });
  }, [state.siblingDiscs]);

  return (
    <group>
      <ExoCameraRig />
      <OrbitControls
        target={[0, 4, 0]}
        enablePan={false}
        minDistance={2}
        maxDistance={80}
        maxPolarAngle={Math.PI * 0.52}
        rotateSpeed={0.5}
        zoomSpeed={0.6}
      />

      <fog attach="fog" args={[starHex, 120, 900]} />

      {/* sky dome tinted by the star colour + brightness */}
      <mesh>
        <sphereGeometry args={[SKY_RADIUS, 32, 24]} />
        <meshBasicMaterial
          map={skyTexture}
          side={THREE.BackSide}
          fog={false}
          depthWrite={false}
        />
      </mesh>

      {/* the host star, drawn at its TRUE angular size and illustrative colour */}
      {starVisible && starPos && (
        <group position={starPos}>
          <mesh>
            <sphereGeometry args={[starRadius, 48, 32]} />
            <meshBasicMaterial color={starHex} toneMapped={false} fog={false} />
          </mesh>
          <sprite scale={[starRadius * 4, starRadius * 4, 1]}>
            <spriteMaterial
              map={glowTexture}
              transparent
              depthWrite={false}
              fog={false}
            />
          </sprite>
        </group>
      )}

      {/* sibling planets as discs at their real maximum apparent size */}
      {siblings.map((s) => (
        <group key={s.key} position={s.pos}>
          <mesh>
            <circleGeometry args={[s.radius, 48]} />
            <meshBasicMaterial color="#b9c2d0" fog={false} toneMapped={false} />
          </mesh>
          {s.biggerThanMoon && (
            <mesh>
              <ringGeometry args={[s.radius * 1.05, s.radius * 1.18, 48]} />
              <meshBasicMaterial
                color="#e0a25e"
                transparent
                opacity={0.8}
                fog={false}
                side={THREE.DoubleSide}
              />
            </mesh>
          )}
        </group>
      ))}

      {/* lighting: a directional key in the star colour + a dim tinted ambient */}
      {starDir && (
        <directionalLight
          position={[starDir[0] * 100, Math.max(2, starDir[1] * 100), starDir[2] * 100]}
          color={starHex}
          intensity={1.4 * brightness}
        />
      )}
      <hemisphereLight
        args={[starHex, "#0a0906", 0.25 + 0.5 * brightness]}
      />

      {/* illustrative ground */}
      <mesh geometry={geometry}>
        <meshStandardMaterial color={groundColor} roughness={1} metalness={0} />
      </mesh>
    </group>
  );
}

/** Near-ground eye on the illustrative plain. */
function ExoCameraRig() {
  const camera = useThree((s) => s.camera);
  useLayoutEffect(() => {
    camera.position.set(0, 4, 16);
    camera.lookAt(0, 8, -60);
    camera.updateProjectionMatrix();
  }, [camera]);
  return null;
}
