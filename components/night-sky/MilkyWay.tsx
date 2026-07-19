"use client";

import { useEffect, useMemo, useState } from "react";
import * as THREE from "three";
import {
  MILKY_WAY_TEXTURE_PATH,
  galacticToEquatorialColumns,
} from "@/lib/star-facts";
import { MILKY_WAY_RADIUS } from "./constants";

/**
 * The Milky Way panorama (ESO/S. Brunier, CC BY 4.0) as a dim BackSide sphere.
 *
 * ⚠ The source image is equirectangular in GALACTIC coordinates, so left as-is
 * its band would NOT line up with the real (equatorial J2000) stars. We rotate
 * the backdrop into the equatorial frame using the standard IAU galactic pole
 * (RA 192.859°, Dec +27.128°) and centre (RA 266.405°, Dec −28.936°): the
 * rotation is built in lib/star-facts (galacticToEquatorialColumns) and applied
 * as the sphere's orientation, so the luminous band traces the real galactic
 * plane across the star field. Kept deliberately dim so the stars stay the
 * subject. If the texture is missing, the sky simply renders without it.
 */
export default function MilkyWay() {
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
        tex.anisotropy = 4;
        setTexture(tex);
      })
      .catch(() => {
        /* graceful: no backdrop */
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

  // Galactic → equatorial orientation (built once from the IAU constants).
  const quaternion = useMemo(() => {
    const { c1, c2, c3 } = galacticToEquatorialColumns();
    const m = new THREE.Matrix4().makeBasis(
      new THREE.Vector3(c1[0], c1[1], c1[2]),
      new THREE.Vector3(c2[0], c2[1], c2[2]),
      new THREE.Vector3(c3[0], c3[1], c3[2])
    );
    return new THREE.Quaternion().setFromRotationMatrix(m);
  }, []);

  if (!texture) return null;

  return (
    <mesh quaternion={quaternion} renderOrder={-10} raycast={() => null}>
      <sphereGeometry args={[MILKY_WAY_RADIUS, 64, 48]} />
      <meshBasicMaterial
        map={texture}
        side={THREE.BackSide}
        color={"#7f86a8"}
        transparent
        opacity={0.5}
        depthWrite={false}
        depthTest={false}
        toneMapped={false}
      />
    </mesh>
  );
}
