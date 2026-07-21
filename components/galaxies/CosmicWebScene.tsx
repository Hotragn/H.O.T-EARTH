"use client";

import { useEffect, useMemo, useRef } from "react";
import { OrbitControls } from "@react-three/drei";
import * as THREE from "three";
import type { CosmicWebPoint } from "@/lib/galaxies";
import { redshiftColor } from "./galaxiesUi";

/**
 * The cosmic-web point cloud: the ~18,000 REAL SDSS DR17 galaxies plotted at
 * their real 3D Cartesian Mpc coordinates (RA/Dec + Hubble distance from
 * redshift, computed by lib/galaxies). Rendered as a SINGLE THREE.Points object
 * (one draw call, GPU-cheap) with per-point vertex colours mapping to redshift.
 *
 * The observer (Milky Way) sits at the origin, marked. The whole slice is a thin
 * equatorial wedge, so the cloud fans out from the origin like a pie slice. The
 * radial axis is redshift-space (cz/H0), labelled in the HUD.
 *
 * Correct-by-construction: positions and colours are filled from the already
 * validated points/redshifts arrays (both index-aligned, both finite), scaled to
 * a fixed on-screen radius. Guarded against an empty set.
 */
export default function CosmicWebScene({
  points,
  redshifts,
  maxDistanceMpc,
}: {
  points: CosmicWebPoint[];
  redshifts: number[];
  maxDistanceMpc: number;
}) {
  // Scale real Mpc -> scene units so the whole cloud fits in a ~10-unit radius.
  const scale = useMemo(() => {
    if (!Number.isFinite(maxDistanceMpc) || maxDistanceMpc <= 0) return 0.015;
    return 10 / maxDistanceMpc;
  }, [maxDistanceMpc]);

  const geometry = useMemo(() => {
    const geo = new THREE.BufferGeometry();
    const n = points.length;
    const positions = new Float32Array(n * 3);
    const colors = new Float32Array(n * 3);
    for (let i = 0; i < n; i++) {
      const p = points[i];
      positions[i * 3] = p.x * scale;
      positions[i * 3 + 1] = p.z * scale; // map celestial +z (NCP) to scene up
      positions[i * 3 + 2] = p.y * scale;
      const [r, g, b] = redshiftColor(redshifts[i]);
      colors[i * 3] = r;
      colors[i * 3 + 1] = g;
      colors[i * 3 + 2] = b;
    }
    geo.setAttribute("position", new THREE.BufferAttribute(positions, 3));
    geo.setAttribute("color", new THREE.BufferAttribute(colors, 3));
    return geo;
  }, [points, redshifts, scale]);

  // Dispose the geometry when it is replaced or the scene unmounts.
  useEffect(() => {
    return () => {
      geometry.dispose();
    };
  }, [geometry]);

  const pointsRef = useRef<THREE.Points>(null);

  return (
    <group>
      <ambientLight intensity={0.6} />

      {/* the real galaxy cloud: ONE Points object */}
      {points.length > 0 && (
        <points ref={pointsRef} geometry={geometry}>
          <pointsMaterial
            vertexColors
            size={0.055}
            sizeAttenuation
            transparent
            opacity={0.9}
            depthWrite={false}
            blending={THREE.AdditiveBlending}
          />
        </points>
      )}

      {/* the observer: the Milky Way at the origin */}
      <mesh>
        <sphereGeometry args={[0.12, 24, 24]} />
        <meshBasicMaterial color="#ffd27a" />
      </mesh>
      <pointLight position={[0, 0, 0]} intensity={1.2} color="#ffd27a" distance={4} />

      <OrbitControls
        enablePan={false}
        enableZoom
        minDistance={2}
        maxDistance={26}
        autoRotate
        autoRotateSpeed={0.25}
        rotateSpeed={0.5}
        target={[0, 0, 0]}
      />
    </group>
  );
}
