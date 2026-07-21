"use client";

import { useEffect, useState } from "react";
import * as THREE from "three";
import { MILKY_WAY_TEXTURE_PATH } from "@/lib/star-facts";

/**
 * Loads the real ESO Milky Way panorama (credit per NIGHT_SKY docs) once,
 * defensively, as the equirectangular background the lensing render bends. A
 * missing file degrades to null and the shader falls back to a dim starfield
 * tint, never throwing and never blocking the route. Same-origin static file
 * only: no API keys, no runtime network.
 */
export function useLensTexture(): THREE.Texture | null {
  const [texture, setTexture] = useState<THREE.Texture | null>(null);

  useEffect(() => {
    let cancelled = false;
    const loader = new THREE.TextureLoader();
    loader
      .loadAsync(MILKY_WAY_TEXTURE_PATH)
      .then((tex) => {
        if (cancelled) {
          tex.dispose();
          return;
        }
        tex.colorSpace = THREE.SRGBColorSpace;
        tex.wrapS = THREE.RepeatWrapping;
        tex.wrapT = THREE.ClampToEdgeWrapping;
        tex.minFilter = THREE.LinearFilter;
        tex.magFilter = THREE.LinearFilter;
        tex.anisotropy = 4;
        setTexture(tex);
      })
      .catch(() => {
        /* graceful: shader renders a dim starfield instead */
      });
    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    return () => {
      texture?.dispose();
    };
  }, [texture]);

  return texture;
}
