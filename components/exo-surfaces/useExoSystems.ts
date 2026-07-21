"use client";

import { useEffect, useState } from "react";
import {
  EXO_SYSTEMS_PATH,
  NASA_EXOPLANET_ARCHIVE_ACK,
  parseExoCatalog,
  type ExoCatalog,
} from "@/lib/exo-facts";
import type { ExoSystem } from "@/lib/exoplanets";

/**
 * Loads the committed exoplanet catalogue once, defensively, exactly like the
 * Exoplanets tab (ExoApp): fetch public/data/exoplanets/systems.json, parse it
 * with the shared defensive parser, and hand back the plain `systems` array so
 * it can be passed straight into lib/exo-surfaces (`exoSurfaceState(id, systems)`).
 * The parsed ExoSystemData is structurally the physics `ExoSystem` (hostname,
 * distance_ly, star, planets), so no re-shaping is needed.
 *
 * A missing or broken file degrades to an empty array + the fallback
 * acknowledgment; it never throws and never blocks the route. No API keys, no
 * runtime network beyond this same-origin static file.
 */
export interface ExoSystemsState {
  /** the loaded systems, ready to pass to lib/exo-surfaces (empty until loaded) */
  systems: ExoSystem[];
  /** true once the fetch settled (success or graceful failure) */
  loaded: boolean;
  /** the archive acknowledgment to display (from the file, else the constant) */
  acknowledgment: string;
}

export function useExoSystems(): ExoSystemsState {
  const [catalog, setCatalog] = useState<ExoCatalog | null>(null);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    let cancelled = false;
    fetch(EXO_SYSTEMS_PATH)
      .then((r) => (r.ok ? r.json() : null))
      .catch(() => null)
      .then((raw) => {
        if (cancelled) return;
        setCatalog(parseExoCatalog(raw));
        setLoaded(true);
      });
    return () => {
      cancelled = true;
    };
  }, []);

  return {
    // ExoSystemData[] is a structural ExoSystem[] (extra display fields are fine)
    systems: (catalog?.systems ?? []) as unknown as ExoSystem[],
    loaded,
    acknowledgment:
      catalog?.meta.acknowledgment && catalog.meta.acknowledgment.length > 0
        ? catalog.meta.acknowledgment
        : NASA_EXOPLANET_ARCHIVE_ACK,
  };
}
