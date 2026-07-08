"use client";

import { useEffect, useRef, useState } from "react";
import { Canvas, useFrame, useThree } from "@react-three/fiber";
import { OrbitControls } from "@react-three/drei";
import type * as THREE from "three";
import { latLonToVector3 } from "@/lib/geo";
import type { HistoricalCity } from "@/lib/chrono-cities";
import type { HistoricalEvent } from "@/lib/chrono-events";
import ChronoGlobe from "./ChronoGlobe";
import ChronoCityPoints from "./ChronoCityPoints";
import ChronoEventPoints from "./ChronoEventPoints";
import PrecessionStars from "./PrecessionStars";
import { useChronoTexture } from "./useChronoTexture";

// Open on a mid-Atlantic, whole-civilization framing (same idiom as Living).
const INITIAL_CAMERA = latLonToVector3(20, -20, 3.0);

// Deep-zoom envelope: from a generous full-orbit view (far) down to a close
// regional view (near). Far→near maps to LOD 0 (aggregate) → 1 (city labels).
const MIN_DISTANCE = 1.18;
const MAX_DISTANCE = 6.0;

export type LodLevel = "far" | "mid" | "close";

/** Camera distance → discrete LOD band for progressive detail reveal. */
export function lodForDistance(d: number): LodLevel {
  if (d > 3.2) return "far";
  if (d > 1.9) return "mid";
  return "close";
}

interface ChronoCanvasProps {
  cities: HistoricalCity[] | null;
  events: HistoricalEvent[] | null;
  simYearRef: React.RefObject<number>;
  /** called (throttled) when the LOD band changes, for the HUD */
  onLodChange: (lod: LodLevel) => void;
  onFallbackTexture: (usingFallback: boolean) => void;
}

/**
 * Reports the camera-distance LOD band up to the HUD when it changes, and keeps
 * the globe/city detail responsive to zoom. Runs inside the Canvas so it can
 * read the live camera each frame; throttled to band changes only (no
 * per-frame React state churn).
 */
function LodReporter({ onLodChange }: { onLodChange: (lod: LodLevel) => void }) {
  const { camera } = useThree();
  const last = useRef<LodLevel | null>(null);
  useFrame(() => {
    const d = camera.position.length();
    const lod = lodForDistance(d);
    if (lod !== last.current) {
      last.current = lod;
      onLodChange(lod);
    }
  });
  return null;
}

function ChronoScene({
  cities,
  events,
  simYearRef,
  onFallbackTexture,
}: Omit<ChronoCanvasProps, "onLodChange">) {
  const { texture, usingFallback } = useChronoTexture();
  // surface the fallback flag to the HUD footer whenever it changes (effect,
  // not during render, to avoid cross-component setState-in-render warnings)
  useEffect(() => {
    onFallbackTexture(usingFallback);
  }, [usingFallback, onFallbackTexture]);

  return (
    <>
      <PrecessionStars simYearRef={simYearRef} />
      <ChronoGlobe
        surfaceTexture={texture}
        usingFallback={usingFallback}
        simYearRef={simYearRef}
      />
      {cities && <ChronoCityPoints cities={cities} simYearRef={simYearRef} />}
      {events && <ChronoEventPoints events={events} simYearRef={simYearRef} />}
    </>
  );
}

export default function ChronoCanvas(props: ChronoCanvasProps) {
  const [interacted, setInteracted] = useState(false);

  return (
    <Canvas
      className="absolute inset-0"
      dpr={[1, 2]}
      camera={{ position: INITIAL_CAMERA, fov: 42, near: 0.05, far: 400 }}
      gl={{ powerPreference: "high-performance", antialias: true, alpha: false }}
      onCreated={({ gl }) => gl.setClearColor("#05060a")}
    >
      <LodReporter onLodChange={props.onLodChange} />
      <ChronoScene
        cities={props.cities}
        events={props.events}
        simYearRef={props.simYearRef}
        onFallbackTexture={props.onFallbackTexture}
      />
      <OrbitControls
        makeDefault
        enablePan={false}
        enableDamping
        dampingFactor={0.08}
        rotateSpeed={0.42}
        zoomSpeed={0.7}
        minDistance={MIN_DISTANCE}
        maxDistance={MAX_DISTANCE}
        autoRotate={!interacted}
        autoRotateSpeed={0.18}
        onStart={() => setInteracted(true)}
      />
    </Canvas>
  );
}
