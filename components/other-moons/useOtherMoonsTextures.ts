"use client";

import { useEffect, useState } from "react";
import * as THREE from "three";
import { prepTexture } from "@/components/globe/useBaseTextures";
import type { OtherMoon, OtherPlanet } from "@/lib/other-moons";

/**
 * Real textures already shipped in the repo (no new download this phase, per
 * docs/OTHER_MOONS_DATA_SOURCES.md §2):
 *   Mars disk    - NASA/USGS MOLA colorized shaded relief (public domain;
 *                  color = ELEVATION, not a visible photo)
 *   Uranus disk  - Solar System Scope, CC-BY 4.0 (attribution REQUIRED; stylized)
 *   Neptune disk - Solar System Scope, CC-BY 4.0 (attribution REQUIRED; stylized)
 *   8 moon maps  - Phobos/Deimos (Viking, PD; irregular bodies), the five Uranian
 *                  moons (Voyager 2 1986, PD; southern hemisphere, northern gaps),
 *                  Triton (Voyager 2 1989, PD; synthetic northern fill).
 * Proteus and Nereid have NO map: they render as labeled illustrative tinted
 * spheres in the scene, so no texture is loaded for them.
 *
 * The Uranus/Neptune CC-BY credit is a license condition, surfaced in-app (system
 * panel, footer, About). Each load is defensive: a missing file leaves that
 * texture null and the scene renders a flat tinted fallback, so the build/scene
 * never breaks. Mirrors useSaturnTextures.
 */
const PLANET_TEXTURE: Record<OtherPlanet, string> = {
  Mars: "/textures/mars-mola-colorized.jpg",
  Uranus: "/textures/planets/uranus.jpg",
  Neptune: "/textures/planets/neptune.jpg",
};

/** The eight moons that HAVE a shipped surface map (Proteus / Nereid do not). */
const MAPPED_MOONS = [
  "Phobos",
  "Deimos",
  "Miranda",
  "Ariel",
  "Umbriel",
  "Titania",
  "Oberon",
  "Triton",
] as const;
type MappedMoon = (typeof MAPPED_MOONS)[number];

const MOON_TEXTURE: Record<MappedMoon, string> = {
  Phobos: "/textures/moons/phobos.jpg",
  Deimos: "/textures/moons/deimos.jpg",
  Miranda: "/textures/moons/miranda.jpg",
  Ariel: "/textures/moons/ariel.jpg",
  Umbriel: "/textures/moons/umbriel.jpg",
  Titania: "/textures/moons/titania.jpg",
  Oberon: "/textures/moons/oberon.jpg",
  Triton: "/textures/moons/triton.jpg",
};

export interface OtherMoonsTextures {
  /** one disk texture per planet; null if it 404s (scene tints a fallback) */
  planets: Record<OtherPlanet, THREE.Texture | null>;
  /**
   * one texture per MAPPED moon; a moon absent from this record (Proteus,
   * Nereid) has no map and is drawn as an illustrative tinted sphere.
   */
  moons: Partial<Record<OtherMoon, THREE.Texture | null>>;
}

export interface OtherMoonsTexturesState {
  textures: OtherMoonsTextures;
  /** true once probing has finished (loaded or fell back) */
  ready: boolean;
}

const EMPTY: OtherMoonsTextures = {
  planets: { Mars: null, Uranus: null, Neptune: null },
  moons: {},
};

/**
 * Loads the eleven reused textures once (three planet disks + eight moon maps).
 * Each load is independent and defensive; disposes on unmount. Mirrors
 * useSaturnTextures / useBaseTextures. All are equirectangular maps, so each goes
 * through prepTexture (sRGB + seam wrap).
 */
export function useOtherMoonsTextures(): OtherMoonsTexturesState {
  const [state, setState] = useState<OtherMoonsTexturesState>({
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
      const [mars, uranus, neptune, ...moonTex] = await Promise.all([
        tryLoad(PLANET_TEXTURE.Mars),
        tryLoad(PLANET_TEXTURE.Uranus),
        tryLoad(PLANET_TEXTURE.Neptune),
        ...MAPPED_MOONS.map((m) => tryLoad(MOON_TEXTURE[m])),
      ]);

      if (cancelled) {
        [mars, uranus, neptune, ...moonTex].forEach((t) => t?.dispose());
        return;
      }

      const moons: Partial<Record<OtherMoon, THREE.Texture | null>> = {};
      MAPPED_MOONS.forEach((m, i) => {
        moons[m] = moonTex[i];
      });

      setState({
        textures: {
          planets: { Mars: mars, Uranus: uranus, Neptune: neptune },
          moons,
        },
        ready: true,
      });
    })();

    return () => {
      cancelled = true;
    };
  }, []);

  // Dispose the loaded textures on unmount (once, on the final instances).
  useEffect(() => {
    return () => {
      state.textures.planets.Mars?.dispose();
      state.textures.planets.Uranus?.dispose();
      state.textures.planets.Neptune?.dispose();
      for (const m of MAPPED_MOONS) state.textures.moons[m]?.dispose();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [state.textures]);

  return state;
}
