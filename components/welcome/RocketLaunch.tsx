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

        {/* fins */}
        <path d="M40 118 L26 146 L40 140 Z" fill="#f2a63b" />
        <path d="M80 118 L94 146 L80 140 Z" fill="#f2a63b" />
        {/* body */}
        <path
          d="M60 6 C74 26 82 62 82 96 L82 140 L38 140 L38 96 C38 62 46 26 60 6 Z"
          fill="url(#rk-body)"
        />
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
