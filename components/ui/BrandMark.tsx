"use client";

import { useId } from "react";

/**
 * The H.O.T EARTH brand mark: a day/night terminator disc with a body on a
 * tilted orbit. Inline SVG so it stays crisp at any size and matches the
 * hand-authored source in brand/logo-mark.svg. Decorative (aria-hidden); the
 * adjacent wordmark carries the accessible name.
 */
export default function BrandMark({ size = 22 }: { size?: number }) {
  const clip = useId();
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 64 64"
      fill="none"
      aria-hidden
      className="shrink-0"
    >
      <defs>
        <clipPath id={clip}>
          <circle cx="32" cy="32" r="19" />
        </clipPath>
      </defs>
      <g clipPath={`url(#${clip})`}>
        <rect x="13" y="13" width="38" height="38" fill="#f2a63b" />
        <ellipse cx="43" cy="32" rx="13" ry="22" fill="#0b0e16" />
      </g>
      <circle cx="32" cy="32" r="19" fill="none" stroke="#ffffff" strokeOpacity="0.14" />
      <g transform="rotate(-24 32 32)">
        <ellipse
          cx="32"
          cy="32"
          rx="28"
          ry="10"
          fill="none"
          stroke="#f2a63b"
          strokeOpacity="0.5"
          strokeWidth="1.4"
        />
        <circle cx="60" cy="32" r="5" fill="#f2a63b" opacity="0.18" />
        <circle cx="60" cy="32" r="2.6" fill="#f2a63b" />
      </g>
    </svg>
  );
}
