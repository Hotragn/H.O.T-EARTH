"use client";

import { useEffect, useState } from "react";
import * as THREE from "three";

/**
 * Real textures already shipped in the repo (no new download this phase, per
 * docs/ASTEROID_MOONS_DATA_SOURCES.md). Only two are loaded into the WebGL scene,
 * both single-view mission photos of the PRIMARY body:
 *   Didymos - NASA / JHU-APL (DART approach imagery, public domain)
 *   Ida     - NASA / JPL     (Galileo flyby imagery, public domain)
 *
 * These are single-view photos shown FLAT on the face-on primary disk, NOT
 * equirectangular surface maps, so they are prepped for sRGB only (no seam-wrap).
 * The scene labels them "single-view photo, shown flat".
 *
 * The third reused texture, comet 67P/Churyumov-Gerasimenko
 * (churyumov-gerasimenko.jpg, ESA/Rosetta/NAVCAM, CC BY-SA 3.0 IGO), is used ONLY
 * in the comet honesty panel and is rendered there as a plain <img> with its
 * mandatory credit, so it is not loaded into WebGL here.
 *
 * Every other body (all moons, and the un-mapped primaries Sylvia, Kleopatra,
 * Antiope, Kalliope, Eugenia, Patroclus) has no map and is a labeled illustrative
 * shape/marker, so no texture is loaded for it. Each load is defensive: a missing
 * file leaves that texture null and the scene draws a flat tinted fallback, so the
 * build/scene never breaks. Mirrors useDwarfMoonsTextures.
 */
const DIDYMOS_TEXTURE = "/textures/small-bodies/didymos.jpg";
const IDA_TEXTURE = "/textures/small-bodies/ida.jpg";

export interface AsteroidMoonsTextures {
  /** Didymos real DART photo; null if it 404s (scene tints a fallback). */
  didymos: THREE.Texture | null;
  /** Ida real Galileo photo; null if it 404s (scene tints a fallback). */
  ida: THREE.Texture | null;
}

export interface AsteroidMoonsTexturesState {
  textures: AsteroidMoonsTextures;
  /** true once probing has finished (loaded or fell back). */
  ready: boolean;
}

const EMPTY: AsteroidMoonsTextures = { didymos: null, ida: null };

/** sRGB prep for a flat single-view photo (no seam-wrap: these are not maps). */
function prepFlat(tex: THREE.Texture): THREE.Texture {
  tex.colorSpace = THREE.SRGBColorSpace;
  tex.anisotropy = 8;
  return tex;
}

/**
 * Loads the two reused public-domain primary photos once (Didymos + Ida). Each
 * load is independent and defensive; disposes on unmount. Mirrors
 * useDwarfMoonsTextures.
 */
export function useAsteroidMoonsTextures(): AsteroidMoonsTexturesState {
  const [state, setState] = useState<AsteroidMoonsTexturesState>({
    textures: EMPTY,
    ready: false,
  });

  useEffect(() => {
    let cancelled = false;
    const loader = new THREE.TextureLoader();

    const tryLoad = async (path: string): Promise<THREE.Texture | null> => {
      try {
        return prepFlat(await loader.loadAsync(path));
      } catch {
        return null;
      }
    };

    (async () => {
      const [didymos, ida] = await Promise.all([
        tryLoad(DIDYMOS_TEXTURE),
        tryLoad(IDA_TEXTURE),
      ]);

      if (cancelled) {
        didymos?.dispose();
        ida?.dispose();
        return;
      }

      setState({ textures: { didymos, ida }, ready: true });
    })();

    return () => {
      cancelled = true;
    };
  }, []);

  // Dispose the loaded textures on unmount (once, on the final instances).
  useEffect(() => {
    return () => {
      state.textures.didymos?.dispose();
      state.textures.ida?.dispose();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [state.textures]);

  return state;
}
