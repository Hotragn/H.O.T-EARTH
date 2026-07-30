"use client";

import { Suspense, useEffect, useMemo, useRef } from "react";
import { Canvas, useFrame, useLoader } from "@react-three/fiber";
import { OrbitControls } from "@react-three/drei";
import * as THREE from "three";

/**
 * Earth plus the tracked catalogue as a single point cloud.
 *
 * One THREE.Points object holds every object, so thousands of satellites cost one
 * draw call. Positions are supplied already propagated (SGP4, see useSatellites);
 * this component only uploads them to the GPU. The markers are a fixed pixel size
 * and are labelled as markers, not physical scale: a Starlink satellite drawn to
 * scale on this globe would be far smaller than a pixel.
 */
function Earth() {
  const map = useLoader(THREE.TextureLoader, "/textures/earth-day-blue-marble.jpg");
  return (
    <>
      <mesh>
        <sphereGeometry args={[1, 96, 72]} />
        <meshStandardMaterial map={map} roughness={1} metalness={0} />
      </mesh>
      {/* a faint shell so the LEO cloud reads as being above a surface */}
      <mesh scale={1.02}>
        <sphereGeometry args={[1, 64, 48]} />
        <meshBasicMaterial color="#4aa3ff" transparent opacity={0.05} side={THREE.BackSide} />
      </mesh>
    </>
  );
}

function Cloud({
  positions,
  colors,
}: {
  positions: Float32Array;
  colors: Float32Array;
}) {
  const geom = useRef<THREE.BufferGeometry>(null);

  useEffect(() => {
    const g = geom.current;
    if (!g) return;
    g.setAttribute("position", new THREE.BufferAttribute(positions, 3));
    g.setAttribute("color", new THREE.BufferAttribute(colors, 3));
    g.computeBoundingSphere();
  }, [positions, colors]);

  // Positions are replaced wholesale each tick; flag the attribute as dirty.
  useFrame(() => {
    const g = geom.current;
    const attr = g?.getAttribute("position") as THREE.BufferAttribute | undefined;
    if (attr && attr.array !== positions) {
      g!.setAttribute("position", new THREE.BufferAttribute(positions, 3));
      g!.setAttribute("color", new THREE.BufferAttribute(colors, 3));
    } else if (attr) {
      attr.needsUpdate = true;
    }
  });

  return (
    <points>
      <bufferGeometry ref={geom} />
      <pointsMaterial
        size={2.4}
        sizeAttenuation={false}
        vertexColors
        transparent
        opacity={0.95}
        depthWrite={false}
      />
    </points>
  );
}

export default function SatellitesCanvas({
  positions,
  colors,
  className = "",
}: {
  positions: Float32Array | null;
  colors: Float32Array | null;
  className?: string;
}) {
  const light = useMemo(() => [4, 2, 4] as [number, number, number], []);
  return (
    <div className={className}>
      <Canvas camera={{ position: [0, 0.9, 3.1], fov: 45 }} dpr={[1, 1.75]}>
        <ambientLight intensity={0.5} />
        <directionalLight position={light} intensity={1.7} />
        <Suspense fallback={null}>
          <Earth />
        </Suspense>
        {positions && colors && <Cloud positions={positions} colors={colors} />}
        <OrbitControls
          enablePan={false}
          minDistance={1.4}
          maxDistance={12}
          rotateSpeed={0.45}
          zoomSpeed={0.7}
        />
      </Canvas>
    </div>
  );
}
