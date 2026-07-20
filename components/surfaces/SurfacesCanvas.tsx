"use client";

import { Canvas } from "@react-three/fiber";
import type { SurfaceSite, SurfaceWorld } from "@/lib/surfaces";
import type { SurfacesAssets } from "./useSurfacesAssets";
import MarsSurfaceScene from "./MarsSurfaceScene";
import MarsPanoramaScene from "./MarsPanoramaScene";
import TitanSurfaceScene from "./TitanSurfaceScene";

export type MarsViewMode = "terrain" | "panorama";

interface SurfacesCanvasProps {
  world: SurfaceWorld;
  site: SurfaceSite;
  marsView: MarsViewMode;
  /** labeled vertical exaggeration factor for the Mars DEM (1 or 2) */
  exaggeration: number;
  assets: SurfacesAssets;
  displayedMsRef: React.RefObject<number>;
}

/**
 * One perspective canvas hosting the three ground-level views (Mars terrain,
 * Mars panorama, Titan). A near-ground first-person-style camera; each scene
 * mounts its own controls and sky. World units are kilometers.
 */
export default function SurfacesCanvas({
  world,
  site,
  marsView,
  exaggeration,
  assets,
  displayedMsRef,
}: SurfacesCanvasProps) {
  return (
    <Canvas
      className="absolute inset-0"
      dpr={[1, 2]}
      camera={{ position: [0.9, 0.6, 0.9], fov: 62, near: 0.005, far: 3000 }}
      gl={{ powerPreference: "high-performance", antialias: true, alpha: false }}
      onCreated={({ gl }) => gl.setClearColor("#05060a")}
    >
      {world === "mars" && marsView === "terrain" && (
        <MarsSurfaceScene
          site={site}
          dem={assets.dem}
          exaggeration={exaggeration}
          displayedMsRef={displayedMsRef}
        />
      )}
      {world === "mars" && marsView === "panorama" && (
        <MarsPanoramaScene panorama={assets.panorama} />
      )}
      {world === "titan" && (
        <TitanSurfaceScene
          site={site}
          saturnTexture={assets.saturn}
          ringsTexture={assets.saturnRings}
          displayedMsRef={displayedMsRef}
        />
      )}
    </Canvas>
  );
}
