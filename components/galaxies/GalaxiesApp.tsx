"use client";

import { useState } from "react";
import BootScreen from "@/components/ui/BootScreen";
import NavShell from "@/components/ui/NavShell";
import AboutModal from "@/components/ui/AboutModal";
import { GALAXY_IDS, SCALE_LADDER, type GalaxyId } from "@/lib/galaxies";
import CosmicWebCanvas from "./CosmicWebCanvas";
import GalaxyStage from "./GalaxyStage";
import GalaxiesHud from "./GalaxiesHud";
import GalaxiesHonesty from "./GalaxiesHonesty";
import GalaxyExplorer from "./GalaxyExplorer";
import ScaleLadder from "./ScaleLadder";
import DeepFieldPanel from "./DeepFieldPanel";
import GalaxiesAttributionFooter from "./GalaxiesAttributionFooter";
import { useCosmicWeb } from "./useCosmicWeb";
import { SECTIONS, type GalaxiesSection } from "./galaxiesUi";

/**
 * Galaxies & Cosmic Web tab shell (the seventh "Beyond"-group world). Owns the
 * active section (Cosmic Web / Galaxy Explorer / Scale Ladder / Deep Field), the
 * selected catalog galaxy and the About panel.
 *
 * The centrepiece is the Cosmic Web: ~18,000 REAL SDSS DR17 galaxies loaded from
 * the committed static JSON, mapped to real 3D Cartesian Mpc positions by
 * lib/galaxies and drawn as ONE THREE.Points cloud. The other three sections are
 * 2D panels. Every fact traces to lib/galaxies or a cited source.
 */
export default function GalaxiesApp() {
  const [section, setSection] = useState<GalaxiesSection>("cosmic-web");
  const [galaxyId, setGalaxyId] = useState<GalaxyId>("andromeda");
  const [aboutOpen, setAboutOpen] = useState(false);
  // The Scale Ladder's active rung lives here because two views share it: the
  // panel's slider and the log axis on the centre stage.
  const [rung, setRung] = useState(SCALE_LADDER.length - 1);

  const web = useCosmicWeb();
  const showWeb = section === "cosmic-web";

  return (
    <main className="fixed inset-0 overflow-hidden bg-abyss">
      {/* the 3D cosmic web is the background layer, mounted only on its section */}
      {showWeb ? (
        web.loaded ? (
          <CosmicWebCanvas
            points={web.points}
            redshifts={web.redshifts}
            maxDistanceMpc={web.maxDistanceMpc}
          />
        ) : (
          <BootScreen label="Mapping 18,000 real galaxies" />
        )
      ) : (
        <div className="absolute inset-0 bg-gradient-to-b from-[#05060f] to-[#03040c]" />
      )}

      {/*
        Centre stage: the main screen of every section that is not the 3D cloud.
        Inset past both HUD columns and mounted only at lg and up, so it never
        hides behind a panel; below lg the panels carry their own compact image.
        z-20 keeps it above the backdrop and below the nav layer (z-40).
      */}
      {section !== "cosmic-web" && (
        <div className="pointer-events-none absolute bottom-[92px] left-[372px] right-[336px] top-[136px] z-20 hidden lg:block">
          <GalaxyStage
            section={section}
            galaxyId={galaxyId}
            rung={rung}
            onSelectRung={setRung}
          />
        </div>
      )}

      {/*
        Chrome overlay. z-40, not z-10: this wrapper is positioned with a
        z-index, so it forms a stacking context and NavShell's own z-40 is scoped
        INSIDE it. Keep it at the nav's level so the world switcher always sits
        above this tab's content: tab content below 40, nav at 40, modals at 55+.
      */}
      <div className="pointer-events-none absolute inset-0 z-40">
        <NavShell onAbout={() => setAboutOpen(true)} active="galaxies" />

        {/* top-centre: section switcher */}
        <div className="absolute inset-x-0 top-[60px] flex flex-col items-center gap-2 px-3 sm:top-[68px]">
          <SectionSwitcher section={section} onChange={setSection} />
          {showWeb && (
            <p className="hud-panel pointer-events-auto max-w-[92vw] rounded-full px-4 py-1.5 text-center font-mono text-[10px] leading-snug tracking-wide text-dim animate-hud-in sm:text-[11px]">
              18,000 real galaxies, SDSS DR17. Radial axis is redshift-space
              (cz/H0): clusters stretch into real fingers of God.
            </p>
          )}
        </div>

        {/*
          Left column: the active section's content. Below lg the honesty panel
          joins the bottom of this same scrolling column, because the two
          absolutely positioned columns are wider than a phone and used to sit
          one on top of the other, with the honesty text covering the galaxy.
        */}
        <div className="hud-scroll pointer-events-auto absolute left-3 top-32 z-10 flex max-h-[calc(100dvh-13rem)] w-[340px] max-w-[calc(100vw-1.5rem)] flex-col gap-3 overflow-y-auto animate-hud-in sm:left-5 sm:top-36">
          {section === "cosmic-web" && <GalaxiesHud web={web} />}
          {section === "explorer" && (
            <GalaxyExplorer id={galaxyId} ids={GALAXY_IDS} onChange={setGalaxyId} />
          )}
          {section === "scale-ladder" && (
            <ScaleLadder rung={rung} onSelectRung={setRung} />
          )}
          {section === "deep-field" && <DeepFieldPanel />}
          <GalaxiesHonesty section={section} className="lg:hidden" />
        </div>

        {/* right column: the load-bearing honesty panel (lg and up) */}
        <div className="hud-scroll pointer-events-auto absolute right-3 top-32 z-10 hidden max-h-[calc(100dvh-13rem)] w-[300px] flex-col gap-3 overflow-y-auto animate-hud-in sm:right-5 sm:top-36 lg:flex">
          <GalaxiesHonesty section={section} />
        </div>

        <GalaxiesAttributionFooter />
      </div>

      {aboutOpen && <AboutModal onClose={() => setAboutOpen(false)} />}
    </main>
  );
}

/** The four-view section switcher. */
function SectionSwitcher({
  section,
  onChange,
}: {
  section: GalaxiesSection;
  onChange: (s: GalaxiesSection) => void;
}) {
  return (
    <div
      role="tablist"
      aria-label="Choose a view"
      className="hud-panel pointer-events-auto flex max-w-[94vw] flex-wrap items-center justify-center gap-1 rounded-full p-1 animate-hud-in"
    >
      {SECTIONS.map((s) => {
        const active = s.id === section;
        return (
          <button
            key={s.id}
            type="button"
            role="tab"
            aria-selected={active}
            onClick={() => onChange(s.id)}
            className={`cursor-pointer rounded-full px-3 py-1.5 font-mono text-[11px] tracking-wide transition-colors duration-200 focus-visible:outline focus-visible:outline-2 focus-visible:outline-solar/70 ${
              active ? "bg-white/10 text-ice" : "text-faint hover:text-dim"
            }`}
          >
            {s.label}
          </button>
        );
      })}
    </div>
  );
}
