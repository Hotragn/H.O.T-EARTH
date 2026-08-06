"use client";

import { getGalaxy, type GalaxyId } from "@/lib/galaxies";
import { DEEP_FIELD_IMAGE, GALAXY_IMAGE, type GalaxiesSection } from "./galaxiesUi";
import ImagePlate from "./ImagePlate";
import ScaleRuler from "./ScaleRuler";

/**
 * The centre stage: what the MAIN SCREEN shows for each section of this tab.
 *
 * Before this existed, only the Cosmic Web section put anything in the middle of
 * the screen (its point cloud). The other three sections rendered entirely
 * inside the 340px left HUD column, so the whole centre of the display was an
 * empty gradient: a full-screen tab with a thumbnail of Andromeda in the corner.
 * Each section now owns the middle of the screen:
 *
 *  - Galaxy Explorer -> the selected galaxy's real telescope image, large, with
 *    its verbatim credit, or the honest "we do not ship one" note
 *  - Scale Ladder    -> the whole ladder on one computed log axis
 *  - Deep Field      -> the JWST SMACS 0723 field, large
 *  - Cosmic Web      -> nothing here, the 3D point cloud already IS the stage
 *
 * It is mounted only at lg and above, because below that the HUD column covers
 * the centre of the viewport and the panels keep their own compact image.
 */
export default function GalaxyStage({
  section,
  galaxyId,
  rung,
  onSelectRung,
}: {
  section: GalaxiesSection;
  galaxyId: GalaxyId;
  rung: number;
  onSelectRung: (i: number) => void;
}) {
  const galaxy = getGalaxy(galaxyId);
  const img = GALAXY_IMAGE[galaxyId];

  if (section === "cosmic-web") return null;

  return (
    <div className="flex h-full w-full items-center justify-center">
      {section === "explorer" &&
        (img && galaxy ? (
          <ImagePlate
            img={img}
            alt={`Telescope image of ${galaxy.name}. ${img.label}`}
            variant="stage"
            className="max-h-full animate-hud-in"
          />
        ) : (
          <div className="hud-panel max-w-xl rounded-2xl p-6 text-center animate-hud-in">
            <p className="font-mono text-[11px] uppercase tracking-[0.2em] text-faint">
              no shipped image
            </p>
            <p className="mt-2.5 text-[12px] leading-relaxed text-dim">
              We do not ship a close-up of {galaxy?.name ?? "this galaxy"} yet,
              and we would rather show nothing here than show a picture of
              something else. The measurements in the panel beside this are still
              real.
            </p>
          </div>
        ))}

      {section === "scale-ladder" && (
        <div className="w-full animate-hud-in">
          <ScaleRuler rung={rung} onSelect={onSelectRung} />
        </div>
      )}

      {section === "deep-field" && (
        <ImagePlate
          img={DEEP_FIELD_IMAGE}
          alt="JWST first deep field, galaxy cluster SMACS 0723"
          variant="stage"
          className="max-h-full animate-hud-in"
        />
      )}
    </div>
  );
}
