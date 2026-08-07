"use client";

import { Suspense, useEffect, useMemo, useRef } from "react";
import { Canvas, useFrame, useLoader } from "@react-three/fiber";
import { OrbitControls } from "@react-three/drei";
import * as THREE from "three";
import { depthClass, type Quake } from "@/lib/quakes";
import { DEPTH_COLOR, QUAKES_ACCENT } from "./quakesUi";

/**
 * Earth with every located epicentre from the live feed on it.
 *
 * The globe is deliberately dimmed. This tab is not about the surface, it is
 * about where the surface breaks, and a full-brightness Blue Marble drowns the
 * markers. Marker RADIUS scales with magnitude and COLOUR with hypocentre
 * depth, so the two things a seismologist reads first are the two things
 * encoded.
 *
 * We ship no plate-boundary overlay and draw none. Leave a week of real
 * epicentres on screen and the boundaries appear on their own, which is both
 * the honest way to show it and the way they were actually discovered.
 */

const R = 1;

/** Same lat/lon convention as every other globe tab in this app. */
function latLonToVec(lat: number, lon: number, radius = R): THREE.Vector3 {
  const la = (lat * Math.PI) / 180;
  const lo = (lon * Math.PI) / 180;
  const cl = Math.cos(la);
  return new THREE.Vector3(
    radius * cl * Math.cos(lo),
    radius * Math.sin(la),
    -radius * cl * Math.sin(lo)
  );
}

/**
 * Marker radius from magnitude, in globe radii.
 *
 * Deliberately NOT proportional to energy. Energy goes as 10^1.5M, so an
 * energy-true marker for a magnitude 7 would be thirty thousand times the area
 * of a magnitude 3 and would cover a continent. Even a plain m^2 scaling, which
 * the first version used, gave a magnitude 6 a radius of 17% of the Earth and
 * turned the Ring of Fire into one orange blob. This is a gentle m^1.35, chosen
 * so a whole week of the unfiltered feed stays legible: big events read as
 * bigger, and nothing swallows the map.
 */
function markerRadius(mag: number): number {
  const m = Number.isFinite(mag) ? Math.max(0, mag) : 0;
  return 0.0032 + 0.0016 * Math.pow(m, 1.35);
}

function Earth() {
  const map = useLoader(THREE.TextureLoader, "/textures/earth-day-blue-marble.jpg");
  return (
    <mesh>
      <sphereGeometry args={[R, 96, 72]} />
      {/*
        Muted, not blacked out. The epicentres are the subject, but a globe you
        cannot read is no use for spotting that the markers trace the plate
        boundaries, which is the whole point of the view.
      */}
      <meshStandardMaterial
        map={map}
        color="#9aa7bd"
        roughness={1}
        metalness={0}
      />
    </mesh>
  );
}

function Markers({
  quakes,
  selectedId,
  onSelect,
}: {
  quakes: Quake[];
  selectedId: string | null;
  onSelect: (q: Quake) => void;
}) {
  const meshRef = useRef<THREE.InstancedMesh>(null);
  const count = quakes.length;

  /**
   * One InstancedMesh for the whole catalogue. A full week of the unfiltered
   * feed is around two thousand events, and two thousand individual meshes is
   * two thousand draw calls: fine on a desktop GPU, miserable on a phone. This
   * is one draw call with a per-instance colour.
   */
  const dummy = useMemo(() => new THREE.Object3D(), []);
  const colors = useMemo(() => {
    const arr = new Float32Array(count * 3);
    const c = new THREE.Color();
    for (let i = 0; i < count; i++) {
      const cls = depthClass(quakes[i].depthKm) ?? "shallow";
      c.set(DEPTH_COLOR[cls]);
      arr[i * 3] = c.r;
      arr[i * 3 + 1] = c.g;
      arr[i * 3 + 2] = c.b;
    }
    return arr;
  }, [quakes, count]);

  useEffect(() => {
    const mesh = meshRef.current;
    if (!mesh) return;
    for (let i = 0; i < count; i++) {
      const q = quakes[i];
      dummy.position.copy(latLonToVec(q.latDeg, q.lonDeg, R * 1.008));
      const s = markerRadius(q.mag);
      dummy.scale.setScalar(s);
      dummy.updateMatrix();
      mesh.setMatrixAt(i, dummy.matrix);
    }
    mesh.instanceMatrix.needsUpdate = true;
    mesh.count = count;
  }, [quakes, count, dummy]);

  const selected = useMemo(
    () => quakes.find((q) => q.id === selectedId) ?? null,
    [quakes, selectedId]
  );

  if (count === 0) return null;

  return (
    <group>
      <instancedMesh
        ref={meshRef}
        args={[undefined, undefined, count]}
        onClick={(e) => {
          e.stopPropagation();
          if (typeof e.instanceId === "number" && quakes[e.instanceId]) {
            onSelect(quakes[e.instanceId]);
          }
        }}
        onPointerOver={(e) => {
          e.stopPropagation();
          document.body.style.cursor = "pointer";
        }}
        onPointerOut={() => {
          document.body.style.cursor = "";
        }}
      >
        <sphereGeometry args={[1, 10, 8]}>
          <instancedBufferAttribute
            attach="attributes-color"
            args={[colors, 3]}
          />
        </sphereGeometry>
        <meshBasicMaterial vertexColors transparent opacity={0.85} />
      </instancedMesh>

      {/* the selected event, drawn again on top so it reads clearly */}
      {selected && (
        <mesh
          position={latLonToVec(selected.latDeg, selected.lonDeg, R * 1.012)}
          scale={markerRadius(selected.mag) * 2.1}
        >
          <sphereGeometry args={[1, 16, 12]} />
          <meshBasicMaterial color={QUAKES_ACCENT} />
        </mesh>
      )}
    </group>
  );
}

/** A slow drift, so the far side comes around without anyone dragging. */
function AutoRotate({ enabled }: { enabled: boolean }) {
  const ref = useRef<number>(0);
  useFrame(({ scene }, delta) => {
    if (!enabled) return;
    ref.current += delta;
    scene.rotation.y += delta * 0.035;
  });
  return null;
}

export default function SeismicGlobe({
  quakes,
  selectedId,
  onSelect,
  autoRotate,
}: {
  quakes: Quake[];
  selectedId: string | null;
  onSelect: (q: Quake) => void;
  autoRotate: boolean;
}) {
  return (
    <Canvas
      className="absolute inset-0"
      dpr={[1, 2]}
      camera={{ position: [0, 0.7, 2.9], fov: 42, near: 0.1, far: 40 }}
      gl={{ powerPreference: "high-performance", antialias: true, alpha: false }}
      onCreated={({ gl }) => gl.setClearColor("#05060f")}
    >
      <ambientLight intensity={1.5} />
      <directionalLight position={[3, 2, 4]} intensity={0.5} />
      <Suspense fallback={null}>
        <Earth />
        <Markers quakes={quakes} selectedId={selectedId} onSelect={onSelect} />
      </Suspense>
      <AutoRotate enabled={autoRotate} />
      <OrbitControls
        enablePan={false}
        enableZoom
        minDistance={1.4}
        maxDistance={6}
        rotateSpeed={0.5}
      />
    </Canvas>
  );
}
