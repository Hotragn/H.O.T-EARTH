"use client";

import { useState } from "react";
import { Crosshair } from "@phosphor-icons/react";
import type { Observer } from "@/lib/tonight";
import { PRESET_PLACES } from "./tonightUi";

/**
 * Where you are. A preset place, typed coordinates, or the device location.
 *
 * Geolocation is optional and never required: the tab loads with a preset and
 * says so, a denial degrades back to that preset with a visible message, and the
 * coordinates never leave the browser (there is no server to send them to). The
 * choice is remembered in localStorage by the parent, because re-picking your
 * own city on every visit is the fastest way to make a page like this useless.
 */
export default function ObserverPicker({
  observer,
  label,
  onChange,
}: {
  observer: Observer;
  label: string;
  onChange: (o: Observer, label: string) => void;
}) {
  const [geoError, setGeoError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const isPreset = PRESET_PLACES.some((p) => p.label === label);

  const useMyLocation = () => {
    setGeoError(null);
    if (typeof navigator === "undefined" || !navigator.geolocation) {
      setGeoError("This browser does not offer geolocation");
      return;
    }
    setBusy(true);
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setBusy(false);
        onChange(
          { latDeg: pos.coords.latitude, lonDeg: pos.coords.longitude },
          "My location"
        );
      },
      () => {
        setBusy(false);
        setGeoError("Location permission denied");
      },
      { enableHighAccuracy: false, timeout: 8000 }
    );
  };

  return (
    <section
      aria-label="Observing location"
      className="hud-panel rounded-2xl p-3.5"
    >
      <div className="flex flex-wrap items-center gap-2">
        <label className="sr-only" htmlFor="tonight-place">
          Preset place
        </label>
        <select
          id="tonight-place"
          value={isPreset ? label : "custom"}
          onChange={(e) => {
            const place = PRESET_PLACES.find((p) => p.label === e.target.value);
            if (place) {
              onChange({ latDeg: place.latDeg, lonDeg: place.lonDeg }, place.label);
            }
          }}
          className="cursor-pointer rounded-lg border border-line bg-black/30 px-2.5 py-1.5 font-mono text-[11px] text-dim focus-visible:outline focus-visible:outline-2 focus-visible:outline-solar/70"
        >
          {!isPreset && <option value="custom">{label}</option>}
          {PRESET_PLACES.map((p) => (
            <option key={p.label} value={p.label}>
              {p.label}
            </option>
          ))}
        </select>

        <NumField
          label="lat"
          value={observer.latDeg}
          min={-90}
          max={90}
          onCommit={(v) => onChange({ ...observer, latDeg: v }, "Custom")}
        />
        <NumField
          label="lon"
          value={observer.lonDeg}
          min={-180}
          max={180}
          onCommit={(v) => onChange({ ...observer, lonDeg: v }, "Custom")}
        />

        <button
          type="button"
          onClick={useMyLocation}
          disabled={busy}
          title="Optional. Your coordinates stay in the browser; this app has no server to send them to."
          className="flex cursor-pointer items-center gap-1.5 rounded-lg border border-line bg-black/20 px-2.5 py-1.5 font-mono text-[10px] text-dim transition-colors duration-200 hover:text-ice disabled:opacity-50 focus-visible:outline focus-visible:outline-2 focus-visible:outline-solar/70"
        >
          <Crosshair size={13} weight="light" aria-hidden />
          {busy ? "locating" : "Use my location"}
        </button>
      </div>

      {geoError && (
        <p className="mt-2 font-mono text-[10px] text-solar">
          {geoError}. Staying on {label}, which works just as well: pick any place
          above or type coordinates.
        </p>
      )}
    </section>
  );
}

function NumField({
  label,
  value,
  min,
  max,
  onCommit,
}: {
  label: string;
  value: number;
  min: number;
  max: number;
  onCommit: (v: number) => void;
}) {
  const [text, setText] = useState<string | null>(null);
  return (
    <label className="flex items-center gap-1 font-mono text-[10px] text-faint">
      {label}
      <input
        type="number"
        value={text ?? value.toFixed(2)}
        min={min}
        max={max}
        step={0.01}
        onChange={(e) => setText(e.target.value)}
        onBlur={() => {
          if (text === null) return;
          const v = parseFloat(text);
          setText(null);
          if (Number.isFinite(v)) onCommit(Math.min(max, Math.max(min, v)));
        }}
        className="w-[4.5rem] rounded-md border border-line bg-black/30 px-1.5 py-1 text-[11px] text-dim focus-visible:outline focus-visible:outline-2 focus-visible:outline-solar/70"
      />
    </label>
  );
}
