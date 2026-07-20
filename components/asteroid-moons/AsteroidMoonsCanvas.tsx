"use client";

import { useLayoutEffect } from "react";
import { Canvas, useThree } from "@react-three/fiber";
import * as THREE from "three";
import type { AsteroidSystem } from "@/lib/asteroid-moons";
import AsteroidMoonsScene from "./AsteroidMoonsScene";
import type { AsteroidMoonsTextures } from "./useAsteroidMoonsTextures";

interface AsteroidMoonsCanvasProps {
  system: AsteroidSystem;
  textures: AsteroidMoonsTextures;
  displayedMsRef: React.RefObject<number>;
  /** half-width of the framed field in primary radii. */
  targetReq: number;
  exaggerate: boolean;
}

export default function AsteroidMoonsCanvas(props: AsteroidMoonsCanvasProps) {
  return (
    <Canvas
      className="absolute inset-0"
      // Orthographic and face-on (no perspective distortion): this is a SCHEMATIC
      // mutual-orbit diagram, not a plane-of-sky projection. The camera looks
      // straight down the +Z axis at the adopted orbit plane (X right, Y up), so a
      // body always appears at exactly its computed (x, y) about the barycenter.
      // There is no sky here, so there is no compass and no starfield.
      orthographic
      dpr={[1, 2]}
      camera={{ position: [0, 0, 600], near: 0.1, far: 4000, zoom: 40 }}
      gl={{ powerPreference: "high-performance", antialias: true, alpha: false }}
      onCreated={({ gl }) => gl.setClearColor("#05060a")}
    >
      <FaceOnCamera targetReq={props.targetReq} />
      <AsteroidMoonsScene
        system={props.system}
        textures={props.textures}
        displayedMsRef={props.displayedMsRef}
        targetReq={props.targetReq}
        exaggerate={props.exaggerate}
      />
    </Canvas>
  );
}

/**
 * Fits the orthographic camera so the framed field (targetReq primary radii each
 * side of centre, plus a margin) fills the viewport width, looking straight at the
 * adopted orbit plane. No rotation (a schematic plane, not the sky). Refits on
 * resize and when the zoom preset (or system) changes.
 */
function FaceOnCamera({ targetReq }: { targetReq: number }) {
  const camera = useThree((s) => s.camera);
  const width = useThree((s) => s.size.width);
  const height = useThree((s) => s.size.height);

  useLayoutEffect(() => {
    const cam = camera as THREE.OrthographicCamera;
    const margin = 1.14;
    // fiber's default orthographic frustum is the canvas pixel size, so world
    // units map to pixels at zoom=1; this makes +/-(targetReq*margin) fill the width.
    cam.zoom = width / 2 / (targetReq * margin);
    cam.position.set(0, 0, 600);
    cam.up.set(0, 1, 0);
    cam.lookAt(0, 0, 0);
    cam.near = 0.1;
    cam.far = 4000;
    cam.updateProjectionMatrix();
  }, [camera, width, height, targetReq]);

  return null;
}
