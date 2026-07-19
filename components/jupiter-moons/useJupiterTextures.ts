"use client";

import { useEffect, useState } from "react";
import * as THREE from "three";
import { prepTexture } from "@/components/globe/useBaseTextures";
import { GALILEAN_MOON_ORDER, type GalileanMoon } from "@/lib/jupiter-moons";

/**
 * Real, public-domain spacecraft maps already shipped in the repo (no new
 * download this phase, per docs/JUPITER_MOONS_DATA_SOURCES.md §2):
 *   Jupiter  - NASA/JPL/SSI Cassini "Best Map of Jupiter" (PIA07782)
 *   Io/Europa/Ganymede/Callisto - USGS Astrogeology Galileo/Voyager mosaics
 * Europa and Callisto are grayscale; Io and Ganymede are color.
 */
const JUPITER_TEXTURE = "/textures/planets/jupiter.jpg";
const MOON_TEXTURE: Record<GalileanMoon, string> = {
  Io: "/textures/moons/io.jpg",
  Europa: "/textures/moons/europa.jpg",
  Ganymede: "/textures/moons/ganymede.jpg",
  Callisto: "/textures/moons/callisto.jpg",
};

export interface JupiterTextures {
  jupiter: THREE.Texture | null;
  /** one texture per moon, in orbital order (Io -> Callisto); null if it 404s */
  moons: Record<GalileanMoon, THREE.Texture | null>;
}

export interface JupiterTexturesState {
  textures: JupiterTextures;
  /** true once probing has finished (loaded or fell back) */
  ready: boolean;
  /** true if Jupiter's own disk texture failed (the scene tints a fallback disk) */
  jupiterFallback: boolean;
}

const EMPTY: JupiterTextures = {
  jupiter: null,
  moons: { Io: null, Europa: null, Ganymede: null, Callisto: null },
};

/**
 * Loads the five reused textures once. Each load is independent and defensive:
 * a missing file leaves that texture null and the scene renders a flat tinted
 * fallback for it, so the build/scene never breaks. Disposes on unmount. Mirrors
 * useBaseTextures / useMoonTexture.
 */
export function useJupiterTextures(): JupiterTexturesState {
  const [state, setState] = useState<JupiterTexturesState>({
    textures: EMPTY,
    ready: false,
    jupiterFallback: false,
  });

  useEffect(() => {
    let cancelled = false;
    const loader = new THREE.TextureLoader();

    const tryLoad = async (path: string): Promise<THREE.Texture | null> => {
      try {
        const tex = await loader.loadAsync(path);
        return prepTexture(tex);
      } catch {
        return null;
      }
    };

    (async () => {
      const [jupiter, io, europa, ganymede, callisto] = await Promise.all([
        tryLoad(JUPITER_TEXTURE),
        tryLoad(MOON_TEXTURE.Io),
        tryLoad(MOON_TEXTURE.Europa),
        tryLoad(MOON_TEXTURE.Ganymede),
        tryLoad(MOON_TEXTURE.Callisto),
      ]);
      if (cancelled) {
        [jupiter, io, europa, ganymede, callisto].forEach((t) => t?.dispose());
        return;
      }
      setState({
        textures: {
          jupiter,
          moons: { Io: io, Europa: europa, Ganymede: ganymede, Callisto: callisto },
        },
        ready: true,
        jupiterFallback: jupiter === null,
      });
    })();

    return () => {
      cancelled = true;
    };
  }, []);

  // Dispose the loaded textures on unmount (once, on the final instances).
  useEffect(() => {
    return () => {
      state.textures.jupiter?.dispose();
      for (const m of GALILEAN_MOON_ORDER) state.textures.moons[m]?.dispose();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [state.textures]);

  return state;
}
