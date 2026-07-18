"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import NavShell from "@/components/ui/NavShell";
import AboutModal from "@/components/ui/AboutModal";
import { orbitPath } from "@/lib/small-bodies";
import {
  SMALL_BODIES_PATH,
  approachesForObject,
  catalogStats,
  filterObjects,
  parseSmallBodyCatalog,
  type FilterId,
  type SmallBodyCatalog,
  type SmallBodyObject,
} from "@/lib/small-body-facts";
import SmallBodyOrbitCanvas from "./SmallBodyOrbitCanvas";
import SmallBodyOverview from "./SmallBodyOverview";
import SmallBodyBrowser from "./SmallBodyBrowser";
import SmallBodyCloseApproaches from "./SmallBodyCloseApproaches";
import SmallBodyDetailCanvas from "./SmallBodyDetailCanvas";
import SmallBodyHud from "./SmallBodyHud";
import SmallBodyAttributionFooter from "./SmallBodyAttributionFooter";

/**
 * Comets & Asteroids tab shell. One client bundle serves three views:
 *   • the ORBIT VIEW (default) — the inner-Solar-System 3D centerpiece: the Sun,
 *     the planet reference orbits (Mercury→Jupiter), and every (filtered) small
 *     body's real orbit — closed ellipses for bound bodies, open arcs for the
 *     hyperbolic / interstellar ones — with illustrative comet tails;
 *   • two full overlays — the OBJECT BROWSER (searchable/filterable grid) and the
 *     CLOSE-APPROACHES panel (the real CNEOS list, Apophis highlighted);
 *   • a per-object DETAIL view — an illustrative lump or real map/photo plus the
 *     measured elements, physical parameters and computed classification.
 *
 * The catalogue is fetched once and parsed defensively — a missing/broken file
 * degrades to a graceful empty state, never a crash. There is no animation clock:
 * the catalogue carries no epoch anchor, so positions are honestly not shown.
 */
export default function SmallBodyApp() {
  const [catalog, setCatalog] = useState<SmallBodyCatalog | null>(null);
  const [loaded, setLoaded] = useState(false);
  const [aboutOpen, setAboutOpen] = useState(false);

  const [focus, setFocus] = useState<SmallBodyObject | null>(null);
  const [panel, setPanel] = useState<"none" | "browse" | "approaches">("none");
  const [filter, setFilter] = useState<FilterId>("all");

  // ── Defensive data load (never blocks / crashes the route) ─────────────────
  useEffect(() => {
    let cancelled = false;
    fetch(SMALL_BODIES_PATH)
      .then((r) => (r.ok ? r.json() : null))
      .catch(() => null)
      .then((raw) => {
        if (cancelled) return;
        setCatalog(parseSmallBodyCatalog(raw));
        setLoaded(true);
      });
    return () => {
      cancelled = true;
    };
  }, []);

  const objects = useMemo(() => catalog?.objects ?? [], [catalog]);
  const closeApproaches = catalog?.close_approaches ?? [];
  const stats = useMemo(() => catalogStats(objects), [objects]);
  const filtered = useMemo(() => filterObjects(objects, filter), [objects, filter]);

  // How many of the (filtered) bodies have elements too sparse to draw an orbit.
  const omittedCount = useMemo(
    () => filtered.filter((o) => orbitPath(o.elements) === null).length,
    [filtered]
  );

  const openObject = useCallback((o: SmallBodyObject) => {
    setPanel("none");
    setFocus(o);
  }, []);

  const backToOrbit = useCallback(() => setFocus(null), []);

  const focusApproaches = useMemo(
    () => (focus ? approachesForObject(closeApproaches, focus) : []),
    [focus, closeApproaches]
  );

  return (
    <main className="fixed inset-0 overflow-hidden bg-abyss">
      {/* ── Scene layer ── */}
      {focus ? (
        <SmallBodyDetailCanvas key={focus.designation ?? focus.name} object={focus} />
      ) : (
        <SmallBodyOrbitCanvas objects={filtered} onFocus={openObject} />
      )}

      {/* ── HUD layer ── (content first, NavShell last so its dropdowns paint
          above the full-height overlays) */}
      <div className="pointer-events-none absolute inset-0 z-10">
        {focus ? (
          <SmallBodyHud object={focus} approaches={focusApproaches} onBack={backToOrbit} />
        ) : panel === "browse" ? (
          <SmallBodyBrowser
            objects={objects}
            loaded={loaded}
            filter={filter}
            onFilter={setFilter}
            onOpen={openObject}
            onClose={() => setPanel("none")}
          />
        ) : panel === "approaches" ? (
          <SmallBodyCloseApproaches
            approaches={closeApproaches}
            objects={objects}
            onOpen={openObject}
            onClose={() => setPanel("none")}
          />
        ) : (
          <SmallBodyOverview
            stats={stats}
            filter={filter}
            onFilter={setFilter}
            onOpenBrowser={() => setPanel("browse")}
            onOpenApproaches={() => setPanel("approaches")}
            closeApproachCount={closeApproaches.length}
            omittedCount={omittedCount}
          />
        )}

        <SmallBodyAttributionFooter focus={focus} />

        <NavShell onAbout={() => setAboutOpen(true)} active="small-bodies" />
      </div>

      {aboutOpen && <AboutModal onClose={() => setAboutOpen(false)} />}
    </main>
  );
}
