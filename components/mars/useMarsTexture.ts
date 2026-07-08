"use client";

import { useEffect, useState } from "react";
import * as THREE from "three";
import { prepTexture } from "@/components/globe/useBaseTextures";

/**
 * Expected Mars surface texture path.
 *
 * TODO(coordinator/mars-data-agent): the Mars data agent owns public/data/mars.
 * Drop the real equirectangular color/MOLA texture here (or update this path to
 * whatever filename they report) and the globe will use it automatically. Until
 * then the loader 404s and the globe renders a procedurally-tinted rusty Mars
 * so the build/scene never breaks.
 *
 * Preferred: an equirectangular (2:1) colorized MOLA shaded-relief or Viking
 * color mosaic, JPEG, 4096×2048 or 8192×4096.
 * Candidate sources the data agent may use: USGS Astrogeology / NASA PDS
 * (MOLA colorized shaded relief), NASA Scientific Visualization Studio.
 */
export const MARS_TEXTURE_CANDIDATES = [
  "/data/mars/mars-color.jpg",
  "/data/mars/mars-mola-colorized.jpg",
  "/textures/mars-mola-colorized.jpg",
] as const;

export interface MarsTextureState {
  /** the loaded surface texture, or null if none of the candidates exist yet */
  texture: THREE.Texture | null;
  /** true once we've finished probing (loaded or fell back) */
  ready: boolean;
  /** true when no real texture was found → shader uses the procedural fallback */
  usingFallback: boolean;
}

/**
 * Tries each candidate path in order; the first that loads wins. If none load
 * (data agent hasn't landed the texture yet) we return usingFallback = true and
 * the shader tints procedurally. Never throws, never blocks the scene.
 */
export function useMarsTexture(): MarsTextureState {
  const [state, setState] = useState<MarsTextureState>({
    texture: null,
    ready: false,
    usingFallback: false,
  });

  useEffect(() => {
    let cancelled = false;
    const loader = new THREE.TextureLoader();

    (async () => {
      for (const path of MARS_TEXTURE_CANDIDATES) {
        try {
          const tex = await loader.loadAsync(path);
          if (cancelled) {
            tex.dispose();
            return;
          }
          setState({ texture: prepTexture(tex), ready: true, usingFallback: false });
          return;
        } catch {
          // try the next candidate
        }
      }
      if (!cancelled) {
        setState({ texture: null, ready: true, usingFallback: true });
      }
    })();

    return () => {
      cancelled = true;
    };
  }, []);

  // dispose the texture on unmount
  useEffect(() => {
    return () => {
      state.texture?.dispose();
    };
    // only dispose the final texture instance
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [state.texture]);

  return state;
}
