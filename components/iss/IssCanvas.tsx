"use client";

import { useState } from "react";
import { Canvas } from "@react-three/fiber";
import { OrbitControls, Stars } from "@react-three/drei";
import type * as THREE from "three";
import { latLonToVector3 } from "@/lib/geo";
import type { GroundTrackPoint } from "@/lib/iss";
import type { Observer } from "@/lib/iss-facts";
import IssScene, { type IssSample } from "./IssScene";

// Open over the mid-Atlantic, pulled back enough to read the whole globe with
// the low-orbit station and its ground track wrapping around it.
const INITIAL_CAMERA = latLonToVector3(15, -55, 3.1);

interface IssCanvasProps {
  dayTexture: THREE.Texture;
  nightTexture: THREE.Texture;
  iss: IssSample | null;
  altExaggeration: number;
  groundTrack: GroundTrackPoint[];
  observer: Observer;
}

export default function IssCanvas(props: IssCanvasProps) {
  const [interacted, setInteracted] = useState(false);
  return (
    <Canvas
      className="absolute inset-0"
      dpr={[1, 2]}
      camera={{ position: INITIAL_CAMERA, fov: 42, near: 0.1, far: 300 }}
      gl={{ powerPreference: "high-performance", antialias: true, alpha: false }}
      onCreated={({ gl }) => gl.setClearColor("#05060a")}
    >
      <Stars radius={80} depth={40} count={4000} factor={2.6} saturation={0} fade speed={0.25} />
      <IssScene
        dayTexture={props.dayTexture}
        nightTexture={props.nightTexture}
        iss={props.iss}
        altExaggeration={props.altExaggeration}
        groundTrack={props.groundTrack}
        observer={props.observer}
      />
      <OrbitControls
        makeDefault
        enablePan={false}
        enableDamping
        dampingFactor={0.08}
        rotateSpeed={0.45}
        zoomSpeed={0.65}
        minDistance={1.35}
        maxDistance={8}
        autoRotate={!interacted}
        autoRotateSpeed={0.2}
        onStart={() => setInteracted(true)}
      />
    </Canvas>
  );
}
