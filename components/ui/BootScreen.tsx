"use client";

/** Full-viewport boot state shown while the 3D bundle / textures load. */
export default function BootScreen({
  label = "Waking the twin",
}: {
  label?: string;
}) {
  return (
    <div className="fixed inset-0 z-20 flex flex-col items-center justify-center bg-abyss">
      <div className="relative flex h-24 w-24 items-center justify-center">
        <div className="absolute inset-0 rounded-full border border-line" />
        <div
          className="absolute inset-0 animate-spin rounded-full border border-transparent border-t-solar/80"
          style={{ animationDuration: "1.6s" }}
        />
        <div className="h-2 w-2 rounded-full bg-solar animate-pulse-dot" />
      </div>
      <p className="mt-8 font-display text-sm font-medium tracking-[0.28em] text-ice">
        H.O.T EARTH
      </p>
      <p className="mt-2 font-mono text-[11px] uppercase tracking-[0.18em] text-faint">
        {label}
      </p>
    </div>
  );
}
