"use client";

import { useEffect, useLayoutEffect, useMemo } from "react";
import { useThree } from "@react-three/fiber";
import { OrbitControls } from "@react-three/drei";
import * as THREE from "three";
import { PANORAMA_VERTICAL_FOV_DEG } from "./surfacesUi";

/**
 * The ground-truth companion to the rendered terrain: the REAL Curiosity 360
 * panorama (PIA25407, Mastcam, sol 3509). It is a CYLINDRICAL projection
 * (360 degrees around by ~98.8 degrees vertical), NOT equirectangular, so it is
 * mapped onto an open-ended cylinder band around the camera: on a cylinder of
 * radius R and height 2 R tan(vFov/2), a linear texture V coordinate lands each
 * pixel at y = R tan(elevation), which is exactly the cylindrical projection.
 * Nothing is stretched to the poles; the caps are left open (black), because
 * the photo has no data there. Colors are white-balanced by NASA (HUD label).
 * The camera sits at the cylinder axis and can only look around (no pan/zoom
 * translation, matching a tripod panorama).
 */

const RADIUS = 10;

interface MarsPanoramaSceneProps {
  panorama: THREE.Texture | null;
}

export default function MarsPanoramaScene({ panorama }: MarsPanoramaSceneProps) {
  const height =
    2 * RADIUS * Math.tan(((PANORAMA_VERTICAL_FOV_DEG / 2) * Math.PI) / 180);

  // Seen from inside (BackSide) the image would be mirrored; flip U to restore
  // the true left-right orientation of the photograph.
  const tex = useMemo(() => {
    if (panorama === null) return null;
    const t = panorama.clone();
    t.wrapS = THREE.RepeatWrapping;
    t.repeat.x = -1;
    t.needsUpdate = true;
    return t;
  }, [panorama]);

  // Dispose the flipped clone when it is replaced or the scene unmounts.
  useEffect(() => {
    return () => {
      tex?.dispose();
    };
  }, [tex]);

  return (
    <group>
      <PanoramaCamera />
      <OrbitControls
        target={[0, 0, 0.0001]}
        enablePan={false}
        enableZoom={false}
        rotateSpeed={-0.35}
      />
      {tex !== null ? (
        <mesh>
          <cylinderGeometry args={[RADIUS, RADIUS, height, 96, 1, true]} />
          {/* unlit: a photograph must not be re-lit by the scene */}
          <meshBasicMaterial map={tex} side={THREE.BackSide} toneMapped={false} />
        </mesh>
      ) : (
        // Defensive fallback if the committed JPEG failed to load.
        <mesh>
          <sphereGeometry args={[RADIUS, 16, 12]} />
          <meshBasicMaterial color="#1a0f08" side={THREE.BackSide} />
        </mesh>
      )}
    </group>
  );
}

/** Parks the camera at the panorama's tripod point (the cylinder axis). */
function PanoramaCamera() {
  const camera = useThree((s) => s.camera);
  useLayoutEffect(() => {
    camera.position.set(0, 0, 0.0002);
    camera.lookAt(0, 0, -1);
    camera.updateProjectionMatrix();
  }, [camera]);
  return null;
}
