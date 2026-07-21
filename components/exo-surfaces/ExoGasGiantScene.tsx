"use client";

import { useLayoutEffect, useMemo } from "react";
import { useThree } from "@react-three/fiber";
import { OrbitControls } from "@react-three/drei";
import * as THREE from "three";
import type { ExoSurfaceState } from "@/lib/exo-surfaces";
import { discRadiusAtDistance, skyDirection, starSkyAltAz } from "./exoSurfacesUi";

/**
 * The honest gas-giant vantage (51 Pegasi b): there is NO solid surface to stand
 * on, so this scene draws NO ground. Instead it frames the view at the cloud-top
 * level: layered, receding translucent cloud decks below a real, computed sky
 * (the host star at its true angular size and illustrative colour). No terrain,
 * no standing gravity; the HUD/honesty panels say so plainly.
 */

const SKY_RADIUS = 1200;
const STAR_DISTANCE = 900;

function makeSkyTexture(hex: string): THREE.Texture {
  const canvas = document.createElement("canvas");
  canvas.width = 1;
  canvas.height = 128;
  const ctx = canvas.getContext("2d");
  if (ctx) {
    const base = new THREE.Color(hex);
    const top = base.clone().multiplyScalar(0.14);
    const bottom = base.clone().multiplyScalar(0.55);
    const g = ctx.createLinearGradient(0, 0, 0, 128);
    g.addColorStop(0, `#${top.getHexString()}`);
    g.addColorStop(1, `#${bottom.getHexString()}`);
    ctx.fillStyle = g;
    ctx.fillRect(0, 0, 1, 128);
  }
  const tex = new THREE.CanvasTexture(canvas);
  tex.colorSpace = THREE.SRGBColorSpace;
  return tex;
}

export default function ExoGasGiantScene({ state }: { state: ExoSurfaceState }) {
  const sky = state.hostStarSky;
  const starHex = sky?.color ?? "#fff4ea";

  const skyTexture = useMemo(() => makeSkyTexture(starHex), [starHex]);

  const starDir = useMemo(() => {
    const { altitudeDeg, azimuthDeg } = starSkyAltAz("day");
    return skyDirection(altitudeDeg, azimuthDeg);
  }, []);
  const starPos = useMemo<[number, number, number] | null>(() => {
    if (!starDir) return null;
    return [starDir[0] * STAR_DISTANCE, starDir[1] * STAR_DISTANCE, starDir[2] * STAR_DISTANCE];
  }, [starDir]);
  const starRadius = discRadiusAtDistance(sky?.angularDiameterDeg ?? 0.53, STAR_DISTANCE);

  // Receding cloud decks BELOW the viewpoint: no surface, only falling cloud tops.
  const decks = useMemo(
    () =>
      [0, 1, 2, 3].map((i) => ({
        y: -30 - i * 55,
        r: 220 + i * 160,
        opacity: 0.5 - i * 0.1,
        tint: new THREE.Color(starHex)
          .clone()
          .multiplyScalar(0.5 - i * 0.08)
          .getHexString(),
      })),
    [starHex]
  );

  return (
    <group>
      <GasGiantCameraRig />
      <OrbitControls
        target={[0, -10, -40]}
        enablePan={false}
        minDistance={2}
        maxDistance={120}
        rotateSpeed={0.5}
        zoomSpeed={0.6}
      />

      <fog attach="fog" args={[starHex, 200, 1400]} />

      <mesh>
        <sphereGeometry args={[SKY_RADIUS, 32, 24]} />
        <meshBasicMaterial map={skyTexture} side={THREE.BackSide} fog={false} depthWrite={false} />
      </mesh>

      {starPos && (
        <group position={starPos}>
          <mesh>
            <sphereGeometry args={[starRadius, 48, 32]} />
            <meshBasicMaterial color={starHex} toneMapped={false} fog={false} />
          </mesh>
        </group>
      )}

      {/* falling-through cloud tops: NO ground, decks recede downward */}
      {decks.map((d, i) => (
        <mesh key={i} position={[0, d.y, -40]} rotation={[-Math.PI / 2, 0, 0]}>
          <circleGeometry args={[d.r, 64]} />
          <meshBasicMaterial
            color={`#${d.tint}`}
            transparent
            opacity={d.opacity}
            side={THREE.DoubleSide}
            fog
            depthWrite={false}
          />
        </mesh>
      ))}

      <hemisphereLight args={[starHex, "#0a0906", 0.8]} />
    </group>
  );
}

function GasGiantCameraRig() {
  const camera = useThree((s) => s.camera);
  useLayoutEffect(() => {
    camera.position.set(0, 8, 26);
    camera.lookAt(0, -6, -60);
    camera.updateProjectionMatrix();
  }, [camera]);
  return null;
}
