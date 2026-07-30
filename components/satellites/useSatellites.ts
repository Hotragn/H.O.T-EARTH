"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import {
  eciToGeodetic,
  gstime,
  json2satrec,
  propagate,
  type SatRec,
} from "satellite.js";
import {
  R_EARTH_KM,
  parseCatalog,
  type SatCatalog,
  type SatRecord,
} from "@/lib/satellites";

/**
 * Loads the committed CelesTrak mirror and propagates it with SGP4.
 *
 * SGP4 is the model these element sets are defined for, so it does the
 * propagating rather than lib/satellites (which stays pure geometry). Positions
 * are recomputed on a timer rather than every frame: propagating ~4,800 objects
 * at 60 Hz would burn the frame budget for no visible gain, since nothing moves
 * perceptibly between frames at globe scale.
 */

/** Globe radius in scene units, matching the other Earth-family tabs. */
const R = 1;

export interface SatellitesState {
  catalog: SatCatalog | null;
  failed: boolean;
  /** xyz triples in scene units, one per shipped object, or null while loading. */
  positions: Float32Array | null;
  /** Per-object colour, parallel to positions. */
  colors: Float32Array | null;
  /** How many objects actually resolved to a position this tick. */
  resolved: number;
  /** The instant the current positions correspond to. */
  at: Date;
}

/** Build an OMM record satellite.js accepts from our compact catalogue row. */
function toOmm(o: SatRecord) {
  return {
    OBJECT_NAME: o.n,
    OBJECT_ID: String(o.i),
    NORAD_CAT_ID: o.i,
    EPOCH: o.e,
    MEAN_MOTION: o.mm,
    ECCENTRICITY: o.ec,
    INCLINATION: o.in,
    RA_OF_ASC_NODE: o.ra,
    ARG_OF_PERICENTER: o.ap,
    MEAN_ANOMALY: o.ma,
    EPHEMERIS_TYPE: 0 as const,
    CLASSIFICATION_TYPE: "U" as const,
    ELEMENT_SET_NO: 999,
    REV_AT_EPOCH: 0,
    BSTAR: o.bs,
    MEAN_MOTION_DOT: 0,
    MEAN_MOTION_DDOT: 0,
  };
}

export function useSatellites(
  colorFor: (o: SatRecord) => [number, number, number],
  visible: (o: SatRecord) => boolean,
  altExaggeration = 1,
): SatellitesState {
  const [catalog, setCatalog] = useState<SatCatalog | null>(null);
  const [failed, setFailed] = useState(false);
  const [tick, setTick] = useState(0);
  const satrecs = useRef<Array<SatRec | null>>([]);

  useEffect(() => {
    let alive = true;
    fetch("/data/satellites/catalog.json")
      .then((r) => r.json())
      .then((j) => {
        if (!alive) return;
        const c = parseCatalog(j);
        if (!c) {
          setFailed(true);
          return;
        }
        // Build the SGP4 records once; a bad element set becomes null and is skipped.
        satrecs.current = c.objects.map((o) => {
          try {
            const rec = json2satrec(toOmm(o));
            return rec && rec.error === 0 ? rec : null;
          } catch {
            return null;
          }
        });
        setCatalog(c);
      })
      .catch(() => alive && setFailed(true));
    return () => {
      alive = false;
    };
  }, []);

  // Recompute positions a few times a second.
  useEffect(() => {
    if (!catalog) return;
    const id = window.setInterval(() => setTick((t) => t + 1), 250);
    return () => window.clearInterval(id);
  }, [catalog]);

  const state = useMemo<SatellitesState>(() => {
    const at = new Date();
    if (!catalog) {
      return { catalog, failed, positions: null, colors: null, resolved: 0, at };
    }
    const n = catalog.objects.length;
    const pos = new Float32Array(n * 3);
    const col = new Float32Array(n * 3);
    const gmst = gstime(at);
    let resolved = 0;

    for (let k = 0; k < n; k++) {
      const o = catalog.objects[k];
      const rec = satrecs.current[k];
      if (!rec || !visible(o)) continue;
      let lat: number, lon: number, hKm: number;
      try {
        const pv = propagate(rec, at);
        if (!pv || !pv.position) continue;
        const g = eciToGeodetic(pv.position, gmst);
        lat = g.latitude;
        lon = g.longitude;
        hKm = g.height;
      } catch {
        continue;
      }
      if (!isFinite(lat) || !isFinite(lon) || !isFinite(hKm)) continue;

      const r = R * (1 + (hKm / R_EARTH_KM) * altExaggeration);
      const cl = Math.cos(lat);
      // Same lat/lon to xyz convention as the other globe tabs.
      pos[k * 3] = r * cl * Math.cos(lon);
      pos[k * 3 + 1] = r * Math.sin(lat);
      pos[k * 3 + 2] = -r * cl * Math.sin(lon);

      const [cr, cg, cb] = colorFor(o);
      col[k * 3] = cr;
      col[k * 3 + 1] = cg;
      col[k * 3 + 2] = cb;
      resolved++;
    }
    return { catalog, failed, positions: pos, colors: col, resolved, at };
    // `tick` drives recomputation; the callbacks are stable per render by design.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [catalog, failed, tick, altExaggeration, colorFor, visible]);

  return state;
}
