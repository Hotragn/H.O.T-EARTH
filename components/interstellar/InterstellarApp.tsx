"use client";

import { useCallback, useEffect, useState } from "react";
import NavShell from "@/components/ui/NavShell";
import AboutModal from "@/components/ui/AboutModal";
import InterstellarBackdrop from "./InterstellarBackdrop";
import SectionSwitcher from "./SectionSwitcher";
import Arrival from "./Arrival";
import VisitorsSection from "./VisitorsSection";
import SwarmSection from "./SwarmSection";
import RobotGuideMascot from "./RobotGuideMascot";
import AudioToggle from "./AudioToggle";
import InterstellarAttributionFooter from "./InterstellarAttributionFooter";
import { ARRIVAL_SEEN_KEY, type Section } from "./interstellarUi";

/**
 * The Interstellar page hub. Unlike the data tabs, this page has THREE internal
 * sub-sections switched here (not via the global nav): Arrival (a skippable
 * cinematic intro), The Visitors (real interstellar objects, 3D), and Swarm
 * Defense (a live swarm-robotics game). Only the active section's heavy view is
 * mounted. Cross-cutting chrome (backdrop, robot mascot, audio toggle, footer,
 * the About modal) lives here so it persists across sections.
 *
 * Honesty posture is set here and reinforced inside every section: this is a
 * movie-INSPIRED homage with original assets (no copyrighted film material); the
 * swarm is a live model labeled as an educational game; audio is off by default.
 */
export default function InterstellarApp() {
  // Start on Arrival the first visit; skip straight to the Visitors after that.
  const [section, setSection] = useState<Section>("arrival");
  const [aboutOpen, setAboutOpen] = useState(false);
  const [audioOn, setAudioOn] = useState(false);

  // Respect a remembered skip so Arrival does not gate every visit.
  useEffect(() => {
    try {
      if (window.localStorage.getItem(ARRIVAL_SEEN_KEY) === "1") {
        setSection("visitors");
      }
    } catch {
      /* localStorage may be unavailable (private mode); default to Arrival */
    }
  }, []);

  const rememberSeen = useCallback(() => {
    try {
      window.localStorage.setItem(ARRIVAL_SEEN_KEY, "1");
    } catch {
      /* ignore */
    }
  }, []);

  // Enter / skip Arrival: remember it and reveal the Visitors.
  const enterFromArrival = useCallback(() => {
    rememberSeen();
    setSection("visitors");
  }, [rememberSeen]);

  const onSelectSection = useCallback((next: Section) => {
    setSection(next);
  }, []);

  return (
    <main className="fixed inset-0 overflow-hidden bg-abyss">
      {/* real NASA/ESA galactic-center video backdrop, behind everything */}
      <InterstellarBackdrop />

      {/* the active heavy section */}
      {section === "visitors" && <VisitorsSection />}
      {section === "swarm" && <SwarmSection />}

      {/* chrome overlay (pointer-events-none wrapper; children opt back in) */}
      <div className="pointer-events-none absolute inset-0 z-10">
        <NavShell onAbout={() => setAboutOpen(true)} active="interstellar" />

        {/* internal sub-section switcher (this page's own nav) */}
        <div className="absolute inset-x-0 top-[60px] flex flex-col items-center gap-2 px-3 sm:top-[68px]">
          <SectionSwitcher section={section} onSelect={onSelectSection} />
        </div>

        {/* persistent original-robot mascot + audio toggle */}
        <RobotGuideMascot section={section} />
        <AudioToggle on={audioOn} onToggle={() => setAudioOn((v) => !v)} />

        {section !== "arrival" && <InterstellarAttributionFooter />}
      </div>

      {/* Arrival is a full-screen skippable overlay (original, no film assets) */}
      {section === "arrival" && (
        <Arrival onEnter={enterFromArrival} onSkip={enterFromArrival} />
      )}

      {aboutOpen && <AboutModal onClose={() => setAboutOpen(false)} />}
    </main>
  );
}
