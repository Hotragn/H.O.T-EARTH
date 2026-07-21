"use client";

import { useEffect, useState } from "react";
import {
  cosmicWebPointsFromRows,
  type CosmicWebPoint,
  type CosmicWebRow,
} from "@/lib/galaxies";
import {
  COSMIC_WEB_META_PATH,
  COSMIC_WEB_PATH,
  SDSS_ACK,
  SDSS_CITATION,
} from "./galaxiesUi";

/**
 * Loads the committed SDSS DR17 cosmic-web catalog once, defensively, exactly
 * like the sibling loaders (useExoSystems): fetch public/data/galaxies/
 * cosmic-web.json (an array of { ra, dec, z }) and its meta file, map the rows
 * through lib/galaxies `cosmicWebPointsFromRows` (which drops any invalid or
 * blueshifted row and never throws) into 3D Cartesian Mpc points, and hand back
 * the points plus the citation strings.
 *
 * The JSON field names (ra, dec) are mapped to the lib's `raDeg` / `decDeg`
 * shape here. A missing or broken file degrades to an empty array + the fallback
 * citation; it never throws and never blocks the route. No API keys, no runtime
 * network beyond this same-origin static file.
 */

interface RawRow {
  ra?: number | null;
  dec?: number | null;
  z?: number | null;
}

interface CosmicWebMeta {
  count?: number;
  z_range?: [number, number];
  citation?: string;
  acknowledgment?: string;
  source?: string;
}

export interface CosmicWebState {
  /** the 3D points (empty until loaded) */
  points: CosmicWebPoint[];
  /** raw redshifts aligned with `points` (for colouring) */
  redshifts: number[];
  /** true once the fetch settled (success or graceful failure) */
  loaded: boolean;
  /** number of galaxies actually plotted */
  count: number;
  /** measured z-range of the plotted set, or null */
  zRange: [number, number] | null;
  /** the largest radial distance among points [Mpc], for camera framing */
  maxDistanceMpc: number;
  citation: string;
  acknowledgment: string;
}

const EMPTY: CosmicWebState = {
  points: [],
  redshifts: [],
  loaded: false,
  count: 0,
  zRange: null,
  maxDistanceMpc: 0,
  citation: SDSS_CITATION,
  acknowledgment: SDSS_ACK,
};

export function useCosmicWeb(): CosmicWebState {
  const [state, setState] = useState<CosmicWebState>(EMPTY);

  useEffect(() => {
    let cancelled = false;

    Promise.all([
      fetch(COSMIC_WEB_PATH)
        .then((r) => (r.ok ? r.json() : null))
        .catch(() => null),
      fetch(COSMIC_WEB_META_PATH)
        .then((r) => (r.ok ? r.json() : null))
        .catch(() => null),
    ]).then(([raw, metaRaw]) => {
      if (cancelled) return;

      const meta = (metaRaw ?? {}) as CosmicWebMeta;
      const rawRows: RawRow[] = Array.isArray(raw) ? (raw as RawRow[]) : [];

      // Map the { ra, dec, z } JSON shape onto the lib's CosmicWebRow, keeping
      // z alongside so we can colour each kept point by its real redshift. We
      // convert row-by-row (rather than in bulk) so points[] and redshifts[]
      // stay index-aligned even as invalid/blueshifted rows are dropped.
      const points: CosmicWebPoint[] = [];
      const redshifts: number[] = [];
      let maxDistanceMpc = 0;
      let zMin = Infinity;
      let zMax = -Infinity;

      for (const row of rawRows) {
        if (!row) continue;
        const libRow: CosmicWebRow = {
          raDeg: row.ra ?? null,
          decDeg: row.dec ?? null,
          z: row.z ?? null,
        };
        const [p] = cosmicWebPointsFromRows([libRow]);
        if (!p) continue;
        const z = row.z as number;
        points.push(p);
        redshifts.push(z);
        if (p.distanceMpc > maxDistanceMpc) maxDistanceMpc = p.distanceMpc;
        if (z < zMin) zMin = z;
        if (z > zMax) zMax = z;
      }

      setState({
        points,
        redshifts,
        loaded: true,
        count: points.length,
        zRange:
          points.length > 0 && Number.isFinite(zMin) && Number.isFinite(zMax)
            ? [zMin, zMax]
            : meta.z_range ?? null,
        maxDistanceMpc,
        citation:
          meta.citation && meta.citation.length > 0 ? meta.citation : SDSS_CITATION,
        acknowledgment:
          meta.acknowledgment && meta.acknowledgment.length > 0
            ? meta.acknowledgment
            : SDSS_ACK,
      });
    });

    return () => {
      cancelled = true;
    };
  }, []);

  return state;
}
