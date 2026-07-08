"use client";

import { useEffect, useState } from "react";
import * as THREE from "three";
import { prepTexture } from "@/components/globe/useBaseTextures";
import type { MoonName } from "@/lib/moons";

/**
 * Loads a major moon's equirectangular surface texture from
 * `/textures/moons/{name}.jpg` (all public-domain NASA / JPL / USGS this phase).
 * Mirrors usePlanetTexture / useMoonTexture: if the texture 404s the globe falls
 * back to a procedurally-tinted sphere so the scene never breaks. Disposes the
 * texture on unmount / when replaced; never throws, never blocks the scene.
 *
 * Honesty note on the maps (surfaced in the HUD via lib/moon-facts TEXTURE_CAVEAT):
 * the Titan map is a Cassini near-IR surface map (haze-penetrating, not the
 * visible orange atmosphere); Triton's northern hemisphere is USGS synthetic
 * interpolation; Europa/Callisto are grayscale mosaics.
 */
export interface MoonTextureState {
  texture: THREE.Texture | null;
  ready: boolean;
  usingFallback: boolean;
}

export function moonTexturePath(name: MoonName): string {
  return `/textures/moons/${name.toLowerCase()}.jpg`;
}

export function useMoonSurfaceTexture(name: MoonName): MoonTextureState {
  const [state, setState] = useState<MoonTextureState>({
    texture: null,
    ready: false,
    usingFallback: false,
  });

  useEffect(() => {
    let cancelled = false;
    setState({ texture: null, ready: false, usingFallback: false });
    const loader = new THREE.TextureLoader();
    loader
      .loadAsync(moonTexturePath(name))
      .then((tex) => {
        if (cancelled) {
          tex.dispose();
          return;
        }
        setState({ texture: prepTexture(tex), ready: true, usingFallback: false });
      })
      .catch(() => {
        if (!cancelled) {
          setState({ texture: null, ready: true, usingFallback: true });
        }
      });
    return () => {
      cancelled = true;
    };
  }, [name]);

  // dispose the texture on unmount / when it is replaced
  useEffect(() => {
    return () => {
      state.texture?.dispose();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [state.texture]);

  return state;
}
