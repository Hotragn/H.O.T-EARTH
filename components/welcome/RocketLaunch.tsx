"use client";

import { motion, useReducedMotion } from "motion/react";

/**
 * The rocket that carries you into the universe.
 *
 * An original SVG (no third-party art), animated with Motion. It has two states:
 * `idle`, where it hovers with a soft exhaust flicker, and `launch`, where it
 * climbs off the screen. `prefers-reduced-motion` collapses both to a still
 * rocket, and the launch resolves immediately so navigation never depends on an
 * animation the visitor has asked not to see.
 */
export default function RocketLaunch({
  launching,
  onLaunchComplete,
}: {
  launching: boolean;
  onLaunchComplete?: () => void;
}) {
  const reduce = useReducedMotion();

  return (
    <motion.div
      aria-hidden
      className="pointer-events-none relative h-[190px] w-[120px]"
      initial={false}
      animate={
        launching
          ? reduce
            ? { opacity: 0 }
            : { y: "-125vh", scale: 0.55, transition: { duration: 1.5, ease: [0.4, 0, 0.2, 1] } }
          : reduce
            ? { y: 0 }
            : { y: [0, -9, 0], transition: { duration: 4.5, repeat: Infinity, ease: "easeInOut" } }
      }
      onAnimationComplete={() => {
        if (launching) onLaunchComplete?.();
      }}
    >
      <svg viewBox="0 0 120 190" className="h-full w-full">
        <defs>
          <linearGradient id="rk-body" x1="0" y1="0" x2="1" y2="0">
            <stop offset="0%" stopColor="#c3cbd9" />
            <stop offset="45%" stopColor="#f2f5fa" />
            <stop offset="100%" stopColor="#94a0b3" />
          </linearGradient>
          <linearGradient id="rk-flame" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#fff3d6" />
            <stop offset="45%" stopColor="#f2a63b" />
            <stop offset="100%" stopColor="#f2a63b" stopOpacity="0" />
          </linearGradient>
        </defs>

        {/* exhaust, only while thrusting */}
        {(launching || !reduce) && (
          <motion.g
            initial={{ opacity: launching ? 1 : 0.75, scaleY: 1 }}
            animate={
              reduce
                ? { opacity: launching ? 1 : 0.6 }
                : launching
                  ? { opacity: 1, scaleY: [1, 1.85, 1.5], transition: { duration: 0.5 } }
                  : { opacity: [0.5, 0.9, 0.5], scaleY: [0.85, 1.1, 0.85], transition: { duration: 0.5, repeat: Infinity } }
            }
            style={{ originY: 0 }}
          >
            <path d="M52 148 L60 190 L68 148 Z" fill="url(#rk-flame)" />
          </motion.g>
        )}

        {/* fins: swept back, darker than the body so they read as behind it */}
        <path d="M41 112 L24 148 L41 138 Z" fill="#b5641a" />
        <path d="M79 112 L96 148 L79 138 Z" fill="#b5641a" />
        {/* body: slimmer, taller cone for a less toy-like silhouette */}
        <path
          d="M60 4 C73 24 80 60 80 94 L80 138 L40 138 L40 94 C40 60 47 24 60 4 Z"
          fill="url(#rk-body)"
        />
        {/* specular edge highlight down the left flank */}
        <path
          d="M52 26 C47 46 45 70 45 94 L45 132"
          stroke="#ffffff"
          strokeOpacity="0.45"
          strokeWidth="2"
          fill="none"
          strokeLinecap="round"
        />
        {/* shadowed right flank, for volume */}
        <path
          d="M60 4 C73 24 80 60 80 94 L80 138 L70 138 L70 94 C70 58 66 24 60 4 Z"
          fill="#05060a"
          fillOpacity="0.18"
        />
        {/* nose cone accent */}
        <path d="M60 4 C66 13 69 22 71 31 L49 31 C51 22 54 13 60 4 Z" fill="#f2a63b" fillOpacity="0.9" />
        {/* window: a little terminator disc, tying the rocket to the brand mark */}
        <circle cx="60" cy="72" r="13" fill="#05060a" />
        <clipPath id="rk-win">
          <circle cx="60" cy="72" r="11" />
        </clipPath>
        <g clipPath="url(#rk-win)">
          <rect x="49" y="61" width="22" height="22" fill="#4aa3ff" />
          <ellipse cx="68" cy="72" rx="9" ry="13" fill="#0b0e16" />
        </g>
        <circle cx="60" cy="72" r="11" fill="none" stroke="#8fa3bd" strokeWidth="1.5" />
        {/* nozzle */}
        <path d="M46 140 L74 140 L69 150 L51 150 Z" fill="#7d8798" />
      </svg>
    </motion.div>
  );
}
