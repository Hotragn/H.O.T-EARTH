"use client";

import { useEffect, useRef } from "react";
import {
  isFiniteState,
  stepSwarm,
  type SpawnThreatCommand,
  type SwarmInput,
  type SwarmState,
  type SwarmStats,
} from "@/lib/swarm";

/**
 * The LIVE swarm view: a 2-D top-down tactical canvas driven by lib/swarm in a
 * requestAnimationFrame loop. Every frame it reads the current input (mode, live
 * slider scales, paused, and any click-spawned threats), calls stepSwarm(state,
 * dt, input) to advance the REAL algorithms, guards the result with isFiniteState,
 * and redraws. This is never a recording; the coordination runs every frame.
 *
 * State is held in refs owned by the parent so switching preset (which replaces
 * stateRef.current) or moving sliders never tears down this loop.
 */

/** agent colour by behaviour state. */
const AGENT_COLOR: Record<string, string> = {
  patrol: "#7ad7ff",
  seek: "#f2a63b",
  intercept: "#ff6b6b",
  return: "#8aa0ff",
  idle: "#6f7788",
};

/** threat colour by kind. */
const THREAT_COLOR: Record<string, string> = {
  debris: "#9aa2b1",
  rogue: "#c58fff",
  asteroid: "#d9a066",
  comet: "#7effc4",
};

export default function SwarmCanvas({
  stateRef,
  inputRef,
  pendingSpawnsRef,
  onStats,
}: {
  stateRef: React.RefObject<SwarmState>;
  inputRef: React.RefObject<SwarmInput>;
  pendingSpawnsRef: React.RefObject<SpawnThreatCommand[]>;
  onStats: (s: {
    score: number;
    wave: number;
    neutralized: number;
    breaches: number;
    stats: SwarmStats;
    mode: string;
  }) => void;
}) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const onStatsRef = useRef(onStats);
  onStatsRef.current = onStats;

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    let raf = 0;
    let last = performance.now();
    let statsAccum = 0;
    let dpr = 1;
    let cssW = 0;
    let cssH = 0;

    const resize = () => {
      const parent = canvas.parentElement;
      if (!parent) return;
      dpr = Math.min(window.devicePixelRatio || 1, 2);
      cssW = parent.clientWidth;
      cssH = parent.clientHeight;
      canvas.width = Math.max(1, Math.round(cssW * dpr));
      canvas.height = Math.max(1, Math.round(cssH * dpr));
    };
    resize();
    window.addEventListener("resize", resize);

    /** world unit -> CSS px scale + centre, from the arena bounds. */
    const view = () => {
      const st = stateRef.current;
      const b = st.config.bounds;
      const arena = Math.max(b.maxX - b.minX, b.maxY - b.minY) || 400;
      const scale = Math.min(cssW, cssH) / (arena * 1.08);
      return { scale, cx: cssW / 2, cy: cssH / 2 };
    };

    const loop = (t: number) => {
      const rawDt = (t - last) / 1000;
      last = t;
      // clamp dt so a background tab / stall never explodes the integration
      const dt = Math.min(0.05, Math.max(0, rawDt));

      const st = stateRef.current;

      // assemble this frame's input from the parent-owned input + click spawns
      const input: SwarmInput = { ...inputRef.current };
      const pending = pendingSpawnsRef.current;
      if (pending.length > 0) {
        input.spawnThreats = pending.slice();
        pending.length = 0;
      }

      if (isFiniteState(st)) {
        stepSwarm(st, dt, input);
      }

      // ── draw ──
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      ctx.clearRect(0, 0, cssW, cssH);

      const { scale, cx, cy } = view();
      const toX = (wx: number) => cx + wx * scale;
      const toY = (wy: number) => cy - wy * scale;
      const cfg = st.config;

      // arena border
      ctx.strokeStyle = "rgba(255,255,255,0.08)";
      ctx.lineWidth = 1;
      ctx.strokeRect(
        toX(cfg.bounds.minX),
        toY(cfg.bounds.maxY),
        (cfg.bounds.maxX - cfg.bounds.minX) * scale,
        (cfg.bounds.maxY - cfg.bounds.minY) * scale,
      );

      // base rings (defend / home) + base marker
      const bx = toX(cfg.base.x);
      const by = toY(cfg.base.y);
      ctx.strokeStyle = "rgba(122,215,255,0.10)";
      ctx.beginPath();
      ctx.arc(bx, by, cfg.defendRadius * scale, 0, Math.PI * 2);
      ctx.stroke();
      ctx.strokeStyle = "rgba(122,215,255,0.16)";
      ctx.beginPath();
      ctx.arc(bx, by, cfg.homeRadius * scale, 0, Math.PI * 2);
      ctx.stroke();
      // base diamond
      ctx.fillStyle = "#7ad7ff";
      ctx.save();
      ctx.translate(bx, by);
      ctx.rotate(Math.PI / 4);
      const bs = Math.max(6, cfg.baseRadius * scale);
      ctx.fillRect(-bs / 2, -bs / 2, bs, bs);
      ctx.restore();

      // obstacles
      for (const o of cfg.obstacles) {
        ctx.fillStyle = "rgba(120,130,150,0.16)";
        ctx.strokeStyle = "rgba(150,160,180,0.4)";
        ctx.beginPath();
        ctx.arc(toX(o.pos.x), toY(o.pos.y), o.radius * scale, 0, Math.PI * 2);
        ctx.fill();
        ctx.stroke();
      }

      // threats (with a small health arc)
      for (const th of st.threats) {
        const x = toX(th.pos.x);
        const y = toY(th.pos.y);
        const r = 5;
        ctx.fillStyle = THREAT_COLOR[th.kind] ?? "#9aa2b1";
        ctx.beginPath();
        ctx.arc(x, y, r, 0, Math.PI * 2);
        ctx.fill();
        const frac = th.maxHealth > 0 ? Math.max(0, th.health / th.maxHealth) : 0;
        ctx.strokeStyle = "rgba(255,255,255,0.65)";
        ctx.lineWidth = 1.5;
        ctx.beginPath();
        ctx.arc(x, y, r + 2.5, -Math.PI / 2, -Math.PI / 2 + frac * Math.PI * 2);
        ctx.stroke();
      }

      // agents (triangles pointing along velocity)
      for (const a of st.agents) {
        const x = toX(a.pos.x);
        const y = toY(a.pos.y);
        const heading = Math.atan2(-a.vel.y, a.vel.x); // screen y is flipped
        ctx.save();
        ctx.translate(x, y);
        ctx.rotate(heading);
        ctx.globalAlpha = 0.55 + 0.45 * Math.max(0, Math.min(1, a.energy));
        ctx.fillStyle = AGENT_COLOR[a.state] ?? "#7ad7ff";
        ctx.beginPath();
        ctx.moveTo(4.5, 0);
        ctx.lineTo(-3, 2.6);
        ctx.lineTo(-3, -2.6);
        ctx.closePath();
        ctx.fill();
        ctx.restore();
      }
      ctx.globalAlpha = 1;

      // ── throttled stats mirror to the HUD ──
      statsAccum += dt;
      if (statsAccum > 0.15) {
        statsAccum = 0;
        onStatsRef.current({
          score: st.score,
          wave: st.wave,
          neutralized: st.neutralized,
          breaches: st.breaches,
          stats: st.stats,
          mode: st.mode,
        });
      }

      raf = requestAnimationFrame(loop);
    };
    raf = requestAnimationFrame(loop);

    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener("resize", resize);
    };
  }, [stateRef, inputRef, pendingSpawnsRef]);

  // click / tap to spawn a threat at the pointed world position
  const onPointerDown = (e: React.PointerEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const rect = canvas.getBoundingClientRect();
    const sx = e.clientX - rect.left;
    const sy = e.clientY - rect.top;
    const st = stateRef.current;
    const b = st.config.bounds;
    const arena = Math.max(b.maxX - b.minX, b.maxY - b.minY) || 400;
    const scale = Math.min(rect.width, rect.height) / (arena * 1.08);
    if (scale <= 0) return;
    const wx = (sx - rect.width / 2) / scale;
    const wy = -(sy - rect.height / 2) / scale;
    pendingSpawnsRef.current.push({ pos: { x: wx, y: wy }, kind: "rogue" });
  };

  return (
    <canvas
      ref={canvasRef}
      onPointerDown={onPointerDown}
      className="absolute inset-0 h-full w-full cursor-crosshair"
      aria-label="Live swarm-defense simulation. Click to spawn a threat."
    />
  );
}
