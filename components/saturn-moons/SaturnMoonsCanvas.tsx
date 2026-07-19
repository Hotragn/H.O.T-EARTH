"use client";

import { useLayoutEffect } from "react";
import { Canvas, useThree } from "@react-three/fiber";
import { Stars } from "@react-three/drei";
import * as THREE from "three";
import SaturnMoonsScene from "./SaturnMoonsScene";
import type { SaturnTextures } from "./useSaturnTextures";

interface SaturnMoonsCanvasProps {
  textures: SaturnTextures;
  saturnFallback: boolean;
  displayedMsRef: React.RefObject<number>;
  /** half-width of the framed field in Saturn radii */
  targetReq: number;
  exaggerate: boolean;
}

export default function SaturnMoonsCanvas(props: SaturnMoonsCanvasProps) {
  return (
    <Canvas
      className="absolute inset-0"
      // Orthographic (no perspective distortion): a true plane-of-sky projection,
      // so a moon always appears at exactly its computed (x, y) and z only decides
      // whether it is in front of or behind Saturn's disk and rings.
      orthographic
      dpr={[1, 2]}
      camera={{ position: [0, 0, 200], near: 0.1, far: 2000, zoom: 40 }}
      gl={{ powerPreference: "high-performance", antialias: true, alpha: false }}
      onCreated={({ gl }) => gl.setClearColor("#05060a")}
    >
      <PlaneOfSkyCamera targetReq={props.targetReq} />
      <Stars radius={120} depth={40} count={2400} factor={2.2} saturation={0} fade speed={0.12} />
      <SaturnMoonsScene
        textures={props.textures}
        saturnFallback={props.saturnFallback}
        displayedMsRef={props.displayedMsRef}
        targetReq={props.targetReq}
        exaggerate={props.exaggerate}
      />
    </Canvas>
  );
}

/**
 * Fits the orthographic camera so the framed field (targetReq Saturn radii each
 * side of centre, plus a margin) fills the viewport width, and locks it looking
 * straight down the line of sight (-Z), North up. No rotation, so the compass
 * convention stays fixed. Refits on resize and when the zoom preset changes.
 */
function PlaneOfSkyCamera({ targetReq }: { targetReq: number }) {
  const camera = useThree((s) => s.camera);
  const width = useThree((s) => s.size.width);
  const height = useThree((s) => s.size.height);

  useLayoutEffect(() => {
    const cam = camera as THREE.OrthographicCamera;
    const margin = 1.12;
    // fiber's default orthographic frustum is the canvas pixel size, so world
    // units map to pixels at zoom=1; this makes ±(targetReq*margin) fill the width.
    cam.zoom = width / 2 / (targetReq * margin);
    cam.position.set(0, 0, 200);
    cam.up.set(0, 1, 0);
    cam.lookAt(0, 0, 0);
    cam.near = 0.1;
    cam.far = 2000;
    cam.updateProjectionMatrix();
  }, [camera, width, height, targetReq]);

  return null;
}
