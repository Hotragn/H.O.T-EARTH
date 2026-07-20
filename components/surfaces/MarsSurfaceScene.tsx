"use client";

import { useLayoutEffect, useMemo, useRef } from "react";
import { useFrame, useThree } from "@react-three/fiber";
import { OrbitControls } from "@react-three/drei";
import * as THREE from "three";
import {
  marsSkyStory,
  marsSunPosition,
  type MarsSkyRegime,
  type SurfaceSite,
} from "@/lib/surfaces";
import type { DecodedDem } from "./useSurfacesAssets";
import { skyDirection } from "./surfacesUi";

/**
 * Standing on Mars: the REAL Gale Crater MOLA DEM as a 3D mesh (real meter
 * scaling from the sidecar metadata; world units are kilometers), under a sky
 * dome lit from the REAL live sun position (lib/surfaces marsSunPosition at the
 * displayed instant) and colored by marsSkyStory's regime. The sun disk sits at
 * its true altitude/azimuth; a blue forward-scatter glow appears in the
 * blue-sunset and twilight regimes (an artistic rendering of the real, cited
 * Curiosity sol 956 phenomenon; the HUD carries the label). Vertical
 * exaggeration is a labeled toggle (1x true scale by default).
 */

const SKY_RADIUS_KM = 900;
const SUN_DISTANCE_KM = 850;

/** Sky gradient stops per regime: [zenith, mid, horizon]. Rendering suggestion
 * derived from marsSkyStory's suggestedPalette (itself labeled artistic). */
const SKY_STOPS: Record<MarsSkyRegime, [string, string, string]> = {
  "butterscotch-day": ["#8a6a44", "#c9a06a", "#d8a978"],
  "blue-sunset": ["#3d3a44", "#8a6a55", "#b5834f"],
  twilight: ["#141824", "#2e3644", "#4a5d78"],
  night: ["#05070c", "#0a0d14", "#141824"],
};

function makeGradientTexture(stops: [string, string, string]): THREE.Texture {
  const canvas = document.createElement("canvas");
  canvas.width = 1;
  canvas.height = 128;
  const ctx = canvas.getContext("2d");
  if (ctx) {
    const g = ctx.createLinearGradient(0, 0, 0, 128);
    g.addColorStop(0, stops[0]);
    g.addColorStop(0.62, stops[1]);
    g.addColorStop(1, stops[2]);
    ctx.fillStyle = g;
    ctx.fillRect(0, 0, 1, 128);
  }
  const tex = new THREE.CanvasTexture(canvas);
  tex.colorSpace = THREE.SRGBColorSpace;
  return tex;
}

/** Soft radial sprite texture (sun disk / glow). */
function makeRadialTexture(inner: string, outer: string): THREE.Texture {
  const size = 128;
  const canvas = document.createElement("canvas");
  canvas.width = size;
  canvas.height = size;
  const ctx = canvas.getContext("2d");
  if (ctx) {
    const g = ctx.createRadialGradient(64, 64, 4, 64, 64, 64);
    g.addColorStop(0, inner);
    g.addColorStop(1, outer);
    ctx.fillStyle = g;
    ctx.fillRect(0, 0, size, size);
  }
  const tex = new THREE.CanvasTexture(canvas);
  tex.colorSpace = THREE.SRGBColorSpace;
  return tex;
}

/** Places the camera just above the terrain at the tile center (near-ground,
 * first-person-style eye height; re-seats when the exaggeration changes). */
function CameraRig({ eyeY }: { eyeY: number }) {
  const camera = useThree((s) => s.camera);
  useLayoutEffect(() => {
    camera.position.set(1.6, eyeY + 0.4, 1.6);
    camera.lookAt(0, eyeY, 0);
    camera.updateProjectionMatrix();
  }, [camera, eyeY]);
  return null;
}

interface MarsSurfaceSceneProps {
  site: SurfaceSite;
  dem: DecodedDem | null;
  exaggeration: number;
  displayedMsRef: React.RefObject<number>;
}

export default function MarsSurfaceScene({
  site,
  dem,
  exaggeration,
  displayedMsRef,
}: MarsSurfaceSceneProps) {
  // ── terrain mesh from the real DEM (kilometer units, real meter heights) ──
  const { geometry, centerHeightKm } = useMemo(() => {
    if (dem === null) {
      // Labeled fallback: a flat plane (the HUD shows the DEM failed to load).
      const flat = new THREE.PlaneGeometry(236, 236, 1, 1);
      flat.rotateX(-Math.PI / 2);
      return { geometry: flat, centerHeightKm: 0.5 };
    }
    const { heightsM, size, meta } = dem;
    const seg = 255; // 256x256 vertices sampled from the 512 grid
    const geo = new THREE.PlaneGeometry(meta.widthKm, meta.heightKm, seg, seg);
    geo.rotateX(-Math.PI / 2); // XZ plane, +Y up; +Z is south (row order)
    const pos = geo.getAttribute("position") as THREE.BufferAttribute;
    let center = 0.5;
    for (let vy = 0; vy <= seg; vy++) {
      const sy = Math.min(size - 1, Math.round((vy / seg) * (size - 1)));
      for (let vx = 0; vx <= seg; vx++) {
        const sx = Math.min(size - 1, Math.round((vx / seg) * (size - 1)));
        const elevM = heightsM[sy * size + sx];
        // heights relative to the tile's minimum, in km (real scaling)
        const hKm = (elevM - meta.elevMinM) / 1000;
        pos.setY(vy * (seg + 1) + vx, hKm);
        if (vy === Math.floor(seg / 2) && vx === Math.floor(seg / 2)) {
          center = hKm;
        }
      }
    }
    pos.needsUpdate = true;
    geo.computeVertexNormals();
    return { geometry: geo, centerHeightKm: center };
  }, [dem]);

  const eyeY = centerHeightKm * exaggeration + 0.25;

  // ── live sun + sky ─────────────────────────────────────────────────────────
  const sunRef = useRef<THREE.Sprite>(null);
  const glowRef = useRef<THREE.Sprite>(null);
  const lightRef = useRef<THREE.DirectionalLight>(null);
  const ambientRef = useRef<THREE.AmbientLight>(null);
  const skyMatRef = useRef<THREE.MeshBasicMaterial>(null);
  const lastRegime = useRef<MarsSkyRegime | null>(null);

  const textures = useMemo(
    () => ({
      sun: makeRadialTexture("rgba(255,248,235,1)", "rgba(255,235,200,0)"),
      glow: makeRadialTexture("rgba(120,160,215,0.55)", "rgba(90,130,190,0)"),
      gradients: Object.fromEntries(
        (Object.keys(SKY_STOPS) as MarsSkyRegime[]).map((r) => [
          r,
          makeGradientTexture(SKY_STOPS[r]),
        ])
      ) as Record<MarsSkyRegime, THREE.Texture>,
    }),
    []
  );

  useFrame(() => {
    const ms = displayedMsRef.current;
    if (!Number.isFinite(ms)) return;
    const sun = marsSunPosition(site, new Date(ms));
    if (sun === null) return;
    const dir = skyDirection(sun.altitudeDeg, sun.azimuthDeg);
    if (dir === null) return;

    const sx = dir[0] * SUN_DISTANCE_KM;
    const sy = eyeY + dir[1] * SUN_DISTANCE_KM;
    const sz = dir[2] * SUN_DISTANCE_KM;
    if (sunRef.current) {
      sunRef.current.position.set(sx, sy, sz);
      sunRef.current.visible = sun.altitudeDeg > -2;
    }
    const story = marsSkyStory(sun.altitudeDeg);
    if (glowRef.current) {
      glowRef.current.position.set(sx, sy, sz);
      glowRef.current.visible =
        story !== null &&
        (story.regime === "blue-sunset" || story.regime === "twilight");
    }
    if (lightRef.current) {
      lightRef.current.position.set(dir[0] * 100, dir[1] * 100, dir[2] * 100);
      const t = Math.max(0, Math.sin((sun.altitudeDeg * Math.PI) / 180));
      lightRef.current.intensity = 0.25 + 2.1 * t;
      lightRef.current.visible = sun.altitudeDeg > -6;
    }
    if (ambientRef.current) {
      const t = Math.max(0, Math.min(1, (sun.altitudeDeg + 6) / 16));
      ambientRef.current.intensity = 0.06 + 0.34 * t;
    }
    if (story !== null && skyMatRef.current && story.regime !== lastRegime.current) {
      lastRegime.current = story.regime;
      skyMatRef.current.map = textures.gradients[story.regime];
      skyMatRef.current.needsUpdate = true;
    }
  });

  return (
    <group>
      <CameraRig eyeY={eyeY} />
      {/* subtle look/orbit controls anchored near the ground at the tile center */}
      <OrbitControls
        target={[0, eyeY, 0]}
        enablePan={false}
        minDistance={0.15}
        maxDistance={60}
        maxPolarAngle={Math.PI * 0.54}
        rotateSpeed={0.5}
        zoomSpeed={0.6}
      />

      {/* sky dome, colored by the regime gradient */}
      <mesh>
        <sphereGeometry args={[SKY_RADIUS_KM, 32, 24]} />
        <meshBasicMaterial
          ref={skyMatRef}
          map={textures.gradients["butterscotch-day"]}
          side={THREE.BackSide}
          fog={false}
          depthWrite={false}
        />
      </mesh>

      {/* the sun disk at its true alt/az, plus the blue forward-scatter glow */}
      <sprite ref={glowRef} scale={[160, 160, 1]}>
        <spriteMaterial
          map={textures.glow}
          transparent
          depthWrite={false}
          fog={false}
        />
      </sprite>
      <sprite ref={sunRef} scale={[34, 34, 1]}>
        <spriteMaterial
          map={textures.sun}
          transparent
          depthWrite={false}
          fog={false}
        />
      </sprite>

      <ambientLight ref={ambientRef} intensity={0.3} color="#e8c9a4" />
      <directionalLight ref={lightRef} intensity={1.6} color="#ffe0bd" />

      {/* the real terrain (Y scaled by the labeled exaggeration factor) */}
      <mesh geometry={geometry} scale={[1, exaggeration, 1]}>
        <meshStandardMaterial color="#a5714c" roughness={1} metalness={0} />
      </mesh>
    </group>
  );
}
