"use client";

import { useLayoutEffect, useMemo, useRef } from "react";
import { useFrame, useThree } from "@react-three/fiber";
import { OrbitControls } from "@react-three/drei";
import * as THREE from "three";
import {
  saturnInTitanSky,
  titanSunPosition,
  type SurfaceSite,
} from "@/lib/surfaces";
import { skyDirection } from "./surfacesUi";

/**
 * Standing on Titan, the honest-cinematic tier. The TERRAIN here is
 * ILLUSTRATIVE (a deterministic procedural plain of low hills beside a flat
 * dark lakebed; no human-scale Titan imagery exists; the HUD carries the
 * label). What is REAL: the dim orange light level (~0.1% of Earth's daylight,
 * Huygens DISR), the sun's computed position (real ~15.95 Earth-day solar-day
 * rate, adopted phase epoch, labeled), and Saturn's geometry: FIXED in the sky
 * by tidal locking, at its real alt/az for the site, drawn at its real ~5.65
 * degree apparent diameter (~11x the Moon). At the real Huygens site Saturn is
 * below the horizon (altitude about -74 degrees), so it is honestly absent;
 * only the labeled "Sub-Saturn viewpoint" shows it, with the haze caveat and
 * with the rings nearly edge-on (Titan orbits in Saturn's ring plane).
 * World units are kilometers.
 */

const SKY_RADIUS_KM = 300;
const SATURN_DISTANCE_KM = 250;
const SUN_SPRITE_DISTANCE_KM = 280;

/** Deterministic illustrative height field (km): low hills, flattening into a
 * lakebed toward -X. Pure sines; no data pretensions whatsoever. */
function titanHillsKm(x: number, z: number): number {
  const hills =
    0.09 * Math.sin(x * 0.55 + 1.7) * Math.cos(z * 0.42 - 0.6) +
    0.05 * Math.sin(x * 1.35 - 0.4) * Math.sin(z * 1.1 + 2.1) +
    0.02 * Math.sin(x * 3.1 + z * 2.4);
    // lakebed mask: smooth step down to flat for x < -6
  const m = 1 / (1 + Math.exp(-(x + 6) * 1.2));
  return Math.max(0, hills + 0.1) * m;
}

function makeTitanSkyTexture(): THREE.Texture {
  const canvas = document.createElement("canvas");
  canvas.width = 1;
  canvas.height = 128;
  const ctx = canvas.getContext("2d");
  if (ctx) {
    const g = ctx.createLinearGradient(0, 0, 0, 128);
    g.addColorStop(0, "#160d05"); // zenith: near-dark through the haze
    g.addColorStop(0.6, "#3a2410");
    g.addColorStop(1, "#5c3a16"); // horizon: dim orange haze glow
    ctx.fillStyle = g;
    ctx.fillRect(0, 0, 1, 128);
  }
  const tex = new THREE.CanvasTexture(canvas);
  tex.colorSpace = THREE.SRGBColorSpace;
  return tex;
}

function makeSunSmudgeTexture(): THREE.Texture {
  const size = 128;
  const canvas = document.createElement("canvas");
  canvas.width = size;
  canvas.height = size;
  const ctx = canvas.getContext("2d");
  if (ctx) {
    const g = ctx.createRadialGradient(64, 64, 2, 64, 64, 64);
    g.addColorStop(0, "rgba(255,230,190,0.85)");
    g.addColorStop(0.35, "rgba(230,170,100,0.35)");
    g.addColorStop(1, "rgba(200,140,70,0)");
    ctx.fillStyle = g;
    ctx.fillRect(0, 0, size, size);
  }
  const tex = new THREE.CanvasTexture(canvas);
  tex.colorSpace = THREE.SRGBColorSpace;
  return tex;
}

interface TitanSurfaceSceneProps {
  site: SurfaceSite;
  saturnTexture: THREE.Texture | null;
  ringsTexture: THREE.Texture | null;
  displayedMsRef: React.RefObject<number>;
}

export default function TitanSurfaceScene({
  site,
  saturnTexture,
  ringsTexture,
  displayedMsRef,
}: TitanSurfaceSceneProps) {
  // ── illustrative terrain (labeled) ────────────────────────────────────────
  const geometry = useMemo(() => {
    const geo = new THREE.PlaneGeometry(60, 60, 160, 160);
    geo.rotateX(-Math.PI / 2);
    const pos = geo.getAttribute("position") as THREE.BufferAttribute;
    for (let i = 0; i < pos.count; i++) {
      pos.setY(i, titanHillsKm(pos.getX(i), pos.getZ(i)));
    }
    pos.needsUpdate = true;
    geo.computeVertexNormals();
    return geo;
  }, []);

  const skyTexture = useMemo(() => makeTitanSkyTexture(), []);
  const sunTexture = useMemo(() => makeSunSmudgeTexture(), []);

  // ── Saturn: FIXED in the sky (tidal lock), real alt/az + real size ────────
  const saturn = useMemo(() => saturnInTitanSky(site), [site]);
  const saturnPos = useMemo(() => {
    if (saturn === null || !saturn.visible) return null;
    const dir = skyDirection(saturn.altitudeDeg, saturn.azimuthDeg);
    if (dir === null) return null;
    return new THREE.Vector3(
      dir[0] * SATURN_DISTANCE_KM,
      0.5 + dir[1] * SATURN_DISTANCE_KM,
      dir[2] * SATURN_DISTANCE_KM
    );
  }, [saturn]);
  // real angular diameter -> world size at the sky-dome distance
  const saturnRadiusKm = useMemo(() => {
    if (saturn === null) return 0;
    return (
      SATURN_DISTANCE_KM *
      Math.tan(((saturn.angularDiameterDeg / 2) * Math.PI) / 180)
    );
  }, [saturn]);

  // ── the sun smudge tracks the computed (adopted-phase, labeled) position ──
  const sunRef = useRef<THREE.Sprite>(null);
  const hemiRef = useRef<THREE.HemisphereLight>(null);
  useFrame(() => {
    const ms = displayedMsRef.current;
    if (!Number.isFinite(ms)) return;
    const sun = titanSunPosition(site, new Date(ms));
    if (sun === null) return;
    const dir = skyDirection(sun.altitudeDeg, sun.azimuthDeg);
    if (dir === null) return;
    if (sunRef.current) {
      sunRef.current.position.set(
        dir[0] * SUN_SPRITE_DISTANCE_KM,
        0.5 + dir[1] * SUN_SPRITE_DISTANCE_KM,
        dir[2] * SUN_SPRITE_DISTANCE_KM
      );
      sunRef.current.visible = sun.altitudeDeg > -3;
    }
    if (hemiRef.current) {
      // ~0.1% of Earth's daylight: everything stays dim even at local noon
      const t = Math.max(0, Math.sin((sun.altitudeDeg * Math.PI) / 180));
      hemiRef.current.intensity = 0.05 + 0.35 * t;
    }
  });

  return (
    <group>
      <TitanCameraRig />
      <OrbitControls
        target={[0, 0.35, 0]}
        enablePan={false}
        minDistance={0.1}
        maxDistance={20}
        maxPolarAngle={Math.PI * 0.54}
        rotateSpeed={0.5}
        zoomSpeed={0.6}
      />

      <fog attach="fog" args={["#43290f", 8, 220]} />

      {/* dim hazy sky dome */}
      <mesh>
        <sphereGeometry args={[SKY_RADIUS_KM, 32, 24]} />
        <meshBasicMaterial
          map={skyTexture}
          side={THREE.BackSide}
          fog={false}
          depthWrite={false}
        />
      </mesh>

      {/* the sun as a bright smudge through the haze (Huygens DISR basis) */}
      <sprite ref={sunRef} scale={[70, 70, 1]}>
        <spriteMaterial map={sunTexture} transparent depthWrite={false} fog={false} />
      </sprite>

      {/* Saturn, only where it is really above the horizon (sub-Saturn view) */}
      {saturn !== null && saturn.visible && saturnPos !== null && (
        <group position={saturnPos}>
          <mesh rotation={[0.05, Math.PI, 0]}>
            <sphereGeometry args={[saturnRadiusKm, 48, 32]} />
            {saturnTexture !== null ? (
              <meshBasicMaterial map={saturnTexture} toneMapped={false} />
            ) : (
              <meshBasicMaterial color="#c9b083" />
            )}
          </mesh>
          {/* rings nearly edge-on: Titan orbits in Saturn's ring plane */}
          <mesh rotation={[Math.PI / 2 - 0.045, 0, 0]}>
            <ringGeometry args={[saturnRadiusKm * 1.24, saturnRadiusKm * 2.27, 96]} />
            {ringsTexture !== null ? (
              <meshBasicMaterial
                map={ringsTexture}
                transparent
                opacity={0.9}
                side={THREE.DoubleSide}
                toneMapped={false}
              />
            ) : (
              <meshBasicMaterial
                color="#b9a77f"
                transparent
                opacity={0.5}
                side={THREE.DoubleSide}
              />
            )}
          </mesh>
        </group>
      )}

      {/* very dim ambient: ~0.1% Earth daylight, orange haze all around */}
      <hemisphereLight
        ref={hemiRef}
        args={["#7a4d1e", "#171009", 0.25]}
      />

      {/* illustrative ground: damp plain + hills; flat dark lakebed at -X */}
      <mesh geometry={geometry}>
        <meshStandardMaterial color="#4d3418" roughness={1} metalness={0} />
      </mesh>
      <mesh position={[-18, 0.005, 0]} rotation={[-Math.PI / 2, 0, 0]}>
        <circleGeometry args={[11, 48]} />
        <meshStandardMaterial color="#171208" roughness={0.35} metalness={0} />
      </mesh>
    </group>
  );
}

/** Near-ground eye on the illustrative plain. */
function TitanCameraRig() {
  const camera = useThree((s) => s.camera);
  useLayoutEffect(() => {
    camera.position.set(1.4, 0.75, 1.4);
    camera.lookAt(0, 0.35, 0);
    camera.updateProjectionMatrix();
  }, [camera]);
  return null;
}
