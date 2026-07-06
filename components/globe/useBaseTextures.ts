"use client";

import { useEffect, useState } from "react";
import * as THREE from "three";

export interface BaseTextures {
  day: THREE.Texture;
  night: THREE.Texture;
}

export function prepTexture(tex: THREE.Texture) {
  tex.colorSpace = THREE.SRGBColorSpace;
  // avoid the visible seam at +/-180 lon (SphereGeometry UV seam gotcha)
  tex.wrapS = THREE.RepeatWrapping;
  tex.anisotropy = 8;
  return tex;
}

/**
 * Loads the static NASA base maps (Blue Marble day + Black Marble night),
 * shared by the Earth tab and the Living Earth tab.
 *
 * Downloaded once (2026-07-06) from the NASA GIBS WMS:
 *   day:   LAYERS=BlueMarble_ShadedRelief_Bathymetry (Blue Marble Next
 *          Generation, NASA Visible Earth / Earth Observatory)
 *   night: LAYERS=VIIRS_Black_Marble&TIME=2016-01-01 (Black Marble 2016
 *          composite, NASA Earth Observatory)
 * via https://gibs.earthdata.nasa.gov/wms/epsg4326/best/wms.cgi
 *   ?SERVICE=WMS&VERSION=1.1.1&REQUEST=GetMap&SRS=EPSG:4326
 *   &BBOX=-180,-90,180,90&WIDTH=4096&HEIGHT=2048&FORMAT=image/jpeg
 * Full provenance + licenses: docs/DATA_SOURCES.md.
 */
export function useBaseTextures(): {
  base: BaseTextures | null;
  bootError: string | null;
} {
  const [base, setBase] = useState<BaseTextures | null>(null);
  const [bootError, setBootError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    const loader = new THREE.TextureLoader();
    Promise.all([
      loader.loadAsync("/textures/earth-day-blue-marble.jpg"),
      loader.loadAsync("/textures/earth-night-black-marble.jpg"),
    ])
      .then(([day, night]) => {
        if (cancelled) {
          day.dispose();
          night.dispose();
          return;
        }
        setBase({ day: prepTexture(day), night: prepTexture(night) });
      })
      .catch((err) => {
        if (!cancelled) {
          setBootError(
            err instanceof Error ? err.message : "Failed to load base textures"
          );
        }
      });
    return () => {
      cancelled = true;
    };
  }, []);

  return { base, bootError };
}
