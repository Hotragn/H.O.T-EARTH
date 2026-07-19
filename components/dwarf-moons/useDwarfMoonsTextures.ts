"use client";

import { useEffect, useState } from "react";
import * as THREE from "three";
import { prepTexture } from "@/components/globe/useBaseTextures";

/**
 * Real textures already shipped in the repo (no new download this phase, per
 * docs/DWARF_MOONS_DATA_SOURCES.md): the two New Horizons global maps
 *   Pluto  - NASA/JHUAPL/SwRI (New Horizons 2015, public domain)
 *   Charon - NASA/JHUAPL/SwRI (New Horizons 2015, public domain)
 *
 * These are the ONLY two real maps in this tab. Every other body (Styx, Nix,
 * Kerberos, Hydra, Dysnomia, Hiʻiaka, Namaka, MK2, and the bodies Eris, Haumea
 * and Makemake) has no map and renders as a labeled illustrative tinted sphere,
 * so no texture is loaded for them. Ceres has no moons and is not used.
 *
 * Each load is defensive: a missing file leaves that texture null and the scene
 * renders a flat tinted fallback, so the build/scene never breaks. Both maps are
 * equirectangular, so each goes through prepTexture (sRGB + seam wrap). Mirrors
 * useOtherMoonsTextures / useBaseTextures.
 */
const PLUTO_TEXTURE = "/textures/dwarf-planets/pluto.jpg";
const CHARON_TEXTURE = "/textures/dwarf-planets/charon.jpg";

export interface DwarfMoonsTextures {
  /** Pluto's real New Horizons map; null if it 404s (scene tints a fallback). */
  pluto: THREE.Texture | null;
  /** Charon's real New Horizons map; null if it 404s (scene tints a fallback). */
  charon: THREE.Texture | null;
}

export interface DwarfMoonsTexturesState {
  textures: DwarfMoonsTextures;
  /** true once probing has finished (loaded or fell back) */
  ready: boolean;
}

const EMPTY: DwarfMoonsTextures = { pluto: null, charon: null };

/**
 * Loads the two reused New Horizons maps once (Pluto + Charon). Each load is
 * independent and defensive; disposes on unmount. Mirrors useOtherMoonsTextures.
 */
export function useDwarfMoonsTextures(): DwarfMoonsTexturesState {
  const [state, setState] = useState<DwarfMoonsTexturesState>({
    textures: EMPTY,
    ready: false,
  });

  useEffect(() => {
    let cancelled = false;
    const loader = new THREE.TextureLoader();

    const tryLoad = async (path: string): Promise<THREE.Texture | null> => {
      try {
        return prepTexture(await loader.loadAsync(path));
      } catch {
        return null;
      }
    };

    (async () => {
      const [pluto, charon] = await Promise.all([
        tryLoad(PLUTO_TEXTURE),
        tryLoad(CHARON_TEXTURE),
      ]);

      if (cancelled) {
        pluto?.dispose();
        charon?.dispose();
        return;
      }

      setState({ textures: { pluto, charon }, ready: true });
    })();

    return () => {
      cancelled = true;
    };
  }, []);

  // Dispose the loaded textures on unmount (once, on the final instances).
  useEffect(() => {
    return () => {
      state.textures.pluto?.dispose();
      state.textures.charon?.dispose();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [state.textures]);

  return state;
}
