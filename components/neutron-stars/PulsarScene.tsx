"use client";

import { useEffect, useMemo, useRef } from "react";
import { useFrame, useThree } from "@react-three/fiber";
import { OrbitControls } from "@react-three/drei";
import * as THREE from "three";
import type { NeutronStarState } from "@/lib/neutron-stars";
import { flashRate, visualSpinRevPerSec } from "./neutronStarsUi";

/**
 * The lighthouse scene (illustrative render of the REAL lighthouse model). A
 * small neutron-star sphere spins about its axis at a VISUALLY-SCALED rate (a
 * real 716 Hz pulsar would be an invisible blur, so the mesh spin is capped and
 * the true frequency is shown in the HUD). Two magnetic-beam cones emerge from
 * the poles, MISALIGNED from the spin axis (the real geometry), and co-rotate.
 *
 * The PULSE is timing-real: the beam brightness and the star glow are modulated
 * at the pulsar's REAL spin frequency (rate-limited only for visual/photosafety,
 * with the true rate carried by the pulse-train plot, the readout and the audio).
 * This split (timing real, visual spin scaled) is labeled in the HUD.
 *
 * Everything is a handful of meshes with additive cones, so it is GPU-cheap. No
 * lib value is touched without a null guard.
 */
export default function PulsarScene({
  state,
  accent,
  background,
}: {
  state: NeutronStarState;
  accent: string;
  background: THREE.Texture | null;
}) {
  const scene = useThree((s) => s.scene);

  // Dim starfield backdrop (or a plain dark background if the texture is absent).
  useEffect(() => {
    if (background) {
      scene.background = background;
    } else {
      scene.background = new THREE.Color("#03040c");
    }
    return () => {
      scene.background = null;
    };
  }, [scene, background]);

  const accentColor = useMemo(() => new THREE.Color(accent), [accent]);

  // Visual (scaled) spin and REAL flash cadence.
  const spinRad = useMemo(
    () => visualSpinRevPerSec(state.spinFrequencyHz) * Math.PI * 2,
    [state.spinFrequencyHz]
  );
  const flash = useMemo(
    () => flashRate(state.spinFrequencyHz),
    [state.spinFrequencyHz]
  );

  // Magnetic-axis misalignment from the spin axis (illustrative lighthouse tilt).
  const tiltRad = (32 * Math.PI) / 180;

  const spinGroup = useRef<THREE.Group>(null);
  const beamMatA = useRef<THREE.MeshBasicMaterial>(null);
  const beamMatB = useRef<THREE.MeshBasicMaterial>(null);
  const poleMat = useRef<THREE.MeshStandardMaterial>(null);
  const glow = useRef<THREE.PointLight>(null);

  const clock = useRef(0);

  useFrame((_, delta) => {
    const d = Math.min(delta, 0.05); // clamp huge frames (tab refocus)
    clock.current += d;

    // Visually-scaled spin of the whole magnetic structure.
    if (spinGroup.current) spinGroup.current.rotation.y += spinRad * d;

    // REAL-cadence pulse: a sharp bright sweep once per (rate-limited) real
    // period. phase in [0,1); brightness spikes near phase 0.
    const phase = (clock.current * flash.hz) % 1;
    // narrow bright window: exp falloff around the pulse peak
    const pulse = Math.exp(-Math.pow((phase < 0.5 ? phase : phase - 1) / 0.12, 2));
    const beamOpacity = 0.12 + 0.7 * pulse;
    if (beamMatA.current) beamMatA.current.opacity = beamOpacity;
    if (beamMatB.current) beamMatB.current.opacity = beamOpacity;
    if (poleMat.current) poleMat.current.emissiveIntensity = 1.2 + 3.5 * pulse;
    if (glow.current) glow.current.intensity = 2 + 10 * pulse;
  });

  return (
    <group>
      {/* soft base lighting so the illustrative surface reads as a sphere */}
      <ambientLight intensity={0.25} />
      <pointLight position={[4, 3, 5]} intensity={1.2} color="#bcd6ff" />
      <pointLight ref={glow} position={[0, 0, 0]} intensity={4} color={accent} distance={12} decay={2} />

      {/* the spinning magnetic structure (star + poles + beams co-rotate) */}
      <group ref={spinGroup}>
        {/* illustrative neutron-star surface */}
        <mesh>
          <sphereGeometry args={[1, 64, 64]} />
          <meshStandardMaterial
            color="#20304a"
            emissive={accentColor}
            emissiveIntensity={0.35}
            roughness={0.5}
            metalness={0.2}
          />
        </mesh>

        {/* magnetic axis, tilted from the spin axis (the real lighthouse offset) */}
        <group rotation={[tiltRad, 0, 0]}>
          {/* two hot magnetic poles */}
          <mesh position={[0, 1, 0]}>
            <sphereGeometry args={[0.34, 32, 32]} />
            <meshStandardMaterial
              ref={poleMat}
              color={accentColor}
              emissive={accentColor}
              emissiveIntensity={2}
            />
          </mesh>
          <mesh position={[0, -1, 0]}>
            <sphereGeometry args={[0.34, 32, 32]} />
            <meshStandardMaterial
              color={accentColor}
              emissive={accentColor}
              emissiveIntensity={2}
            />
          </mesh>

          {/* two beam cones along the magnetic axis (illustrative) */}
          <mesh position={[0, 4, 0]}>
            <coneGeometry args={[1.1, 7, 40, 1, true]} />
            <meshBasicMaterial
              ref={beamMatA}
              color={accentColor}
              transparent
              opacity={0.4}
              side={THREE.DoubleSide}
              blending={THREE.AdditiveBlending}
              depthWrite={false}
            />
          </mesh>
          <mesh position={[0, -4, 0]} rotation={[Math.PI, 0, 0]}>
            <coneGeometry args={[1.1, 7, 40, 1, true]} />
            <meshBasicMaterial
              ref={beamMatB}
              color={accentColor}
              transparent
              opacity={0.4}
              side={THREE.DoubleSide}
              blending={THREE.AdditiveBlending}
              depthWrite={false}
            />
          </mesh>
        </group>
      </group>

      {/* the fixed "Earth" marker the beam sweeps past */}
      <EarthMarker />

      <OrbitControls
        enablePan={false}
        enableZoom
        minDistance={4}
        maxDistance={14}
        autoRotate
        autoRotateSpeed={0.3}
        rotateSpeed={0.5}
        target={[0, 0, 0]}
      />
    </group>
  );
}

/** A small blue marker standing in for Earth, the direction the beam sweeps past. */
function EarthMarker() {
  return (
    <mesh position={[6.5, 1.2, 3]}>
      <sphereGeometry args={[0.16, 24, 24]} />
      <meshStandardMaterial
        color="#4aa3ff"
        emissive="#4aa3ff"
        emissiveIntensity={0.8}
      />
    </mesh>
  );
}
