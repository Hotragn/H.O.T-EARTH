"use client";

import { Canvas } from "@react-three/fiber";
import type { ExoSurfaceState } from "@/lib/exo-surfaces";
import ExoSurfaceScene from "./ExoSurfaceScene";
import ExoGasGiantScene from "./ExoGasGiantScene";
import type { DayMode } from "./exoSurfacesUi";

interface ExoSurfacesCanvasProps {
  state: ExoSurfaceState;
  dayMode: DayMode;
}

/**
 * One perspective canvas hosting the ground-level alien-sky view. Rocky worlds
 * get an illustrative terrain under the real, computed sky (ExoSurfaceScene);
 * the gas-giant vantage has NO surface, so it renders the honest cloud-top /
 * falling-through scene instead (ExoGasGiantScene). Scene units are abstract
 * (the sky dome radius); real physics enters only through the angular sizes.
 */
export default function ExoSurfacesCanvas({ state, dayMode }: ExoSurfacesCanvasProps) {
  return (
    <Canvas
      className="absolute inset-0"
      dpr={[1, 2]}
      camera={{ position: [0, 3, 14], fov: 60, near: 0.1, far: 5000 }}
      gl={{ powerPreference: "high-performance", antialias: true, alpha: false }}
      onCreated={({ gl }) => gl.setClearColor("#05060a")}
    >
      {state.hasSurface ? (
        <ExoSurfaceScene state={state} dayMode={dayMode} />
      ) : (
        <ExoGasGiantScene state={state} />
      )}
    </Canvas>
  );
}
