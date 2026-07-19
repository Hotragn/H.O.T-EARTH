"use client";

import { useEffect, useState } from "react";
import * as THREE from "three";
import { prepTexture } from "@/components/globe/useBaseTextures";
import { SATURN_MOON_ORDER, type SaturnMoon } from "@/lib/saturn-moons";

/**
 * Real textures already shipped in the repo (no new download this phase, per
 * docs/SATURN_MOONS_DATA_SOURCES.md §2):
 *   Saturn disk  - Solar System Scope, CC-BY 4.0 (attribution REQUIRED)
 *   Saturn rings - Solar System Scope, CC-BY 4.0 (attribution REQUIRED)
 *   7 moon maps  - NASA/JPL/USGS/SSI Cassini global mosaics (public domain);
 *                  Titan's is a near-IR (938 nm) haze-penetrating product.
 * The Saturn + ring credit is a license condition, surfaced in-app (ring panel,
 * footer, About). Each load is defensive: a missing file leaves that texture null
 * and the scene renders a flat tinted fallback, so the build/scene never breaks.
 */
const SATURN_TEXTURE = "/textures/planets/saturn.jpg";
const RING_TEXTURE = "/textures/planets/saturn-rings.png";
const MOON_TEXTURE: Record<SaturnMoon, string> = {
  Mimas: "/textures/moons/mimas.jpg",
  Enceladus: "/textures/moons/enceladus.jpg",
  Tethys: "/textures/moons/tethys.jpg",
  Dione: "/textures/moons/dione.jpg",
  Rhea: "/textures/moons/rhea.jpg",
  Titan: "/textures/moons/titan.jpg",
  Iapetus: "/textures/moons/iapetus.jpg",
};

export interface SaturnTextures {
  saturn: THREE.Texture | null;
  /** ring color strip (alpha PNG); mapped radially inner→outer in the scene */
  rings: THREE.Texture | null;
  /** one texture per moon, in orbital order (Mimas -> Iapetus); null if it 404s */
  moons: Record<SaturnMoon, THREE.Texture | null>;
}

export interface SaturnTexturesState {
  textures: SaturnTextures;
  /** true once probing has finished (loaded or fell back) */
  ready: boolean;
  /** true if Saturn's own disk texture failed (the scene tints a fallback disk) */
  saturnFallback: boolean;
}

const EMPTY_MOONS: Record<SaturnMoon, THREE.Texture | null> = {
  Mimas: null,
  Enceladus: null,
  Tethys: null,
  Dione: null,
  Rhea: null,
  Titan: null,
  Iapetus: null,
};

const EMPTY: SaturnTextures = {
  saturn: null,
  rings: null,
  moons: { ...EMPTY_MOONS },
};

/**
 * Loads the nine reused textures once (Saturn disk + ring strip + seven moons).
 * Each load is independent and defensive; disposes on unmount. Mirrors
 * useJupiterTextures / useBaseTextures. The ring strip is NOT run through
 * prepTexture (that repeat-wraps equirectangular maps); it only needs sRGB, set
 * where it is consumed.
 */
export function useSaturnTextures(): SaturnTexturesState {
  const [state, setState] = useState<SaturnTexturesState>({
    textures: EMPTY,
    ready: false,
    saturnFallback: false,
  });

  useEffect(() => {
    let cancelled = false;
    const loader = new THREE.TextureLoader();

    const tryLoad = async (
      path: string,
      prep = true
    ): Promise<THREE.Texture | null> => {
      try {
        const tex = await loader.loadAsync(path);
        if (prep) return prepTexture(tex);
        tex.colorSpace = THREE.SRGBColorSpace;
        return tex;
      } catch {
        return null;
      }
    };

    (async () => {
      const [saturn, rings, mimas, enceladus, tethys, dione, rhea, titan, iapetus] =
        await Promise.all([
          tryLoad(SATURN_TEXTURE),
          tryLoad(RING_TEXTURE, false),
          tryLoad(MOON_TEXTURE.Mimas),
          tryLoad(MOON_TEXTURE.Enceladus),
          tryLoad(MOON_TEXTURE.Tethys),
          tryLoad(MOON_TEXTURE.Dione),
          tryLoad(MOON_TEXTURE.Rhea),
          tryLoad(MOON_TEXTURE.Titan),
          tryLoad(MOON_TEXTURE.Iapetus),
        ]);
      if (cancelled) {
        [saturn, rings, mimas, enceladus, tethys, dione, rhea, titan, iapetus].forEach(
          (t) => t?.dispose()
        );
        return;
      }
      setState({
        textures: {
          saturn,
          rings,
          moons: {
            Mimas: mimas,
            Enceladus: enceladus,
            Tethys: tethys,
            Dione: dione,
            Rhea: rhea,
            Titan: titan,
            Iapetus: iapetus,
          },
        },
        ready: true,
        saturnFallback: saturn === null,
      });
    })();

    return () => {
      cancelled = true;
    };
  }, []);

  // Dispose the loaded textures on unmount (once, on the final instances).
  useEffect(() => {
    return () => {
      state.textures.saturn?.dispose();
      state.textures.rings?.dispose();
      for (const m of SATURN_MOON_ORDER) state.textures.moons[m]?.dispose();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [state.textures]);

  return state;
}
