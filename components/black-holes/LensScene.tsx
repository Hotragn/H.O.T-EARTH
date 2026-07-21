"use client";

import { useEffect, useMemo, useRef } from "react";
import { useFrame, useThree } from "@react-three/fiber";
import { OrbitControls } from "@react-three/drei";
import * as THREE from "three";
import type { BlackHoleState } from "@/lib/black-holes";
import { apparentShadowRadius } from "./blackHolesUi";
import { LENS_FRAGMENT, LENS_VERTEX } from "./lensShaders";

/**
 * The gravitational-lensing scene: a single full-viewport fragment-shader quad
 * (clip-space, so it always fills the screen) plus an OrbitControls rig so the
 * camera can be dragged and slowly auto-orbits. The shader bends the real Milky
 * Way panorama with the point-mass thin-lens equation; the shadow / photon ring
 * / disk inner edge come from the real Schwarzschild ratios of the selected
 * black hole (see lensShaders.ts). The overall apparent size is illustrative.
 *
 * The heavy work is one texture fetch + arithmetic per pixel (no loop), so it is
 * GPU-cheap. Camera basis, resolution and time are pushed through uniforms each
 * frame; the material is built once and never rebuilt.
 */
export default function LensScene({
  state,
  background,
  accent,
}: {
  state: BlackHoleState;
  background: THREE.Texture | null;
  accent: string;
}) {
  const camera = useThree((s) => s.camera);
  const size = useThree((s) => s.size);

  // Geometry ratios (real Schwarzschild). shadow radius = sqrt(27)/2 r_s;
  // ISCO 3 r_s => 1.1547 shadow radii; photon sphere maps to the shadow edge.
  const shadowR = apparentShadowRadius(state.schwarzschildRadiusM);
  const iscoR = shadowR * (3 / (Math.sqrt(27) / 2)); // = shadowR * 1.1547
  const diskOuter = iscoR * 3.4; // illustrative outer extent

  const diskColorVec = useMemo(() => {
    const c = new THREE.Color(accent);
    // warm the accent toward accretion-orange so it reads as glowing gas
    c.lerp(new THREE.Color("#ff7a2c"), 0.55);
    return c;
  }, [accent]);

  const material = useMemo(
    () =>
      new THREE.ShaderMaterial({
        uniforms: {
          uResolution: { value: new THREE.Vector2(1, 1) },
          uTime: { value: 0 },
          uBg: { value: null as THREE.Texture | null },
          uHasBg: { value: 0 },
          uForward: { value: new THREE.Vector3(0, 0, -1) },
          uRight: { value: new THREE.Vector3(1, 0, 0) },
          uUp: { value: new THREE.Vector3(0, 1, 0) },
          uTanHalfFov: { value: Math.tan((60 * Math.PI) / 180 / 2) },
          uShadowR: { value: 0.16 },
          uThetaE: { value: 0.16 },
          uIscoR: { value: 0.18 },
          uDiskOuter: { value: 0.6 },
          uDiskTilt: { value: 0.32 },
          uDiskColor: { value: new THREE.Color("#ff7a2c") },
        },
        vertexShader: LENS_VERTEX,
        fragmentShader: LENS_FRAGMENT,
        depthTest: false,
        depthWrite: false,
      }),
    // built once; everything varies through uniforms
    // eslint-disable-next-line react-hooks/exhaustive-deps
    []
  );

  useEffect(() => () => material.dispose(), [material]);

  // Push the per-object geometry + colour into uniforms when the selection
  // changes (no material rebuild).
  useEffect(() => {
    const u = material.uniforms;
    u.uShadowR.value = shadowR;
    u.uThetaE.value = shadowR; // Einstein ring near the shadow edge (illustrative)
    u.uIscoR.value = iscoR;
    u.uDiskOuter.value = diskOuter;
    (u.uDiskColor.value as THREE.Color).copy(diskColorVec);
  }, [material, shadowR, iscoR, diskOuter, diskColorVec]);

  // Bind the background texture when it arrives.
  useEffect(() => {
    const u = material.uniforms;
    u.uBg.value = background;
    u.uHasBg.value = background ? 1 : 0;
  }, [material, background]);

  // Resolution + fov whenever the viewport changes.
  useEffect(() => {
    const u = material.uniforms;
    (u.uResolution.value as THREE.Vector2).set(
      Math.max(1, size.width),
      Math.max(1, size.height)
    );
    if ((camera as THREE.PerspectiveCamera).isPerspectiveCamera) {
      const fov = (camera as THREE.PerspectiveCamera).fov;
      u.uTanHalfFov.value = Math.tan((fov * Math.PI) / 180 / 2);
    }
  }, [material, size, camera]);

  // Per-frame: feed the orbiting camera basis + time.
  const fwd = useRef(new THREE.Vector3());
  const right = useRef(new THREE.Vector3());
  const up = useRef(new THREE.Vector3());
  useFrame((_, delta) => {
    const u = material.uniforms;
    u.uTime.value += delta;
    camera.getWorldDirection(fwd.current);
    up.current.set(0, 1, 0).applyQuaternion(camera.quaternion);
    right.current.crossVectors(fwd.current, up.current).normalize();
    up.current.crossVectors(right.current, fwd.current).normalize();
    (u.uForward.value as THREE.Vector3).copy(fwd.current);
    (u.uRight.value as THREE.Vector3).copy(right.current);
    (u.uUp.value as THREE.Vector3).copy(up.current);
  });

  return (
    <group>
      <mesh material={material} frustumCulled={false} renderOrder={-1}>
        <planeGeometry args={[2, 2]} />
      </mesh>
      <OrbitControls
        enablePan={false}
        enableZoom={false}
        autoRotate
        autoRotateSpeed={0.35}
        rotateSpeed={0.4}
        target={[0, 0, 0]}
      />
    </group>
  );
}
