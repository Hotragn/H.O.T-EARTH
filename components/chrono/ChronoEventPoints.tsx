"use client";

import { useEffect, useMemo, useRef } from "react";
import { useFrame } from "@react-three/fiber";
import * as THREE from "three";
import { latLonToVector3Into } from "@/lib/geo";
import { GLOBE_RADIUS } from "@/components/globe/EarthGlobe";
import {
  eventIntensity,
  type EventCategory,
  type HistoricalEvent,
} from "@/lib/chrono-events";
import { CHRONO_EVENT_FRAGMENT, CHRONO_EVENT_VERTEX } from "./shaders";

/**
 * All dated events in ONE THREE.Points draw call. Each marker pulses in and
 * fades out over its event's span (aIntensity, updated on a low-frequency
 * cadence). Category selects a tasteful hue. No per-frame allocations.
 */

const ALTITUDE = GLOBE_RADIUS * 1.01;
const REFRESH_MS = 200;

const CATEGORY_HUE: Record<EventCategory, number> = {
  conflict: 0.0,
  science: 0.25,
  exploration: 0.45,
  culture: 0.65,
  disaster: 0.82,
  founding: 1.0,
};

interface ChronoEventPointsProps {
  events: HistoricalEvent[];
  simYearRef: React.RefObject<number>;
}

export default function ChronoEventPoints({
  events,
  simYearRef,
}: ChronoEventPointsProps) {
  const count = events.length;

  const { geometry, intensityAttr } = useMemo(() => {
    const positions = new Float32Array(count * 3);
    const intensities = new Float32Array(count);
    const hues = new Float32Array(count);
    for (let i = 0; i < count; i++) {
      const e = events[i];
      latLonToVector3Into(e.lat, e.lon, ALTITUDE, positions, i * 3);
      intensities[i] = 0;
      hues[i] = CATEGORY_HUE[e.category] ?? 0.65;
    }
    const geo = new THREE.BufferGeometry();
    geo.setAttribute("position", new THREE.BufferAttribute(positions, 3));
    const intensityAttribute = new THREE.BufferAttribute(intensities, 1);
    intensityAttribute.setUsage(THREE.DynamicDrawUsage);
    geo.setAttribute("aIntensity", intensityAttribute);
    geo.setAttribute("aHue", new THREE.BufferAttribute(hues, 1));
    geo.boundingSphere = new THREE.Sphere(new THREE.Vector3(), ALTITUDE);
    return { geometry: geo, intensityAttr: intensityAttribute };
  }, [events, count]);

  const material = useMemo(
    () =>
      new THREE.ShaderMaterial({
        uniforms: {
          uTime: { value: 0 },
          uPixelScale: { value: 1000 },
        },
        vertexShader: CHRONO_EVENT_VERTEX,
        fragmentShader: CHRONO_EVENT_FRAGMENT,
        transparent: true,
        blending: THREE.AdditiveBlending,
        depthWrite: false,
      }),
    []
  );

  useEffect(() => {
    return () => {
      geometry.dispose();
      material.dispose();
    };
  }, [geometry, material]);

  const last = useRef({ at: 0, year: Number.NaN });

  useFrame((state) => {
    material.uniforms.uTime.value = state.clock.elapsedTime;
    const cam = state.camera as THREE.PerspectiveCamera;
    material.uniforms.uPixelScale.value =
      (state.size.height * state.viewport.dpr) /
      (2 * Math.tan((cam.fov * Math.PI) / 360));

    const now = Date.now();
    const year = simYearRef.current ?? 2026;
    if (now - last.current.at > REFRESH_MS || year !== last.current.year) {
      last.current.at = now;
      last.current.year = year;
      const arr = intensityAttr.array as Float32Array;
      for (let i = 0; i < count; i++) {
        arr[i] = eventIntensity(events[i], year);
      }
      intensityAttr.needsUpdate = true;
    }
  });

  return (
    <points
      geometry={geometry}
      material={material}
      frustumCulled={false}
      raycast={() => null}
    />
  );
}
