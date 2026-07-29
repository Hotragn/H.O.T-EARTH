"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  motion,
  useInView,
  useReducedMotion,
  useScroll,
  useSpring,
} from "motion/react";
import { ArrowDown, ArrowRight, Rocket } from "@phosphor-icons/react";
import { WORLD_GROUPS, WORLDS, getWorldsInGroup } from "@/lib/worlds";
import BrandMark from "@/components/ui/BrandMark";
import { Button, buttonVariants } from "@/components/ui/shadcn/button";
import RocketLaunch from "./RocketLaunch";
import PlanetStage from "./PlanetStage";

/** Remembered so the tour never nags a returning visitor. */
export const WELCOME_SEEN_KEY = "hot-earth:welcome-seen";

/**
 * One stop on the tour. Each maps to a real world group and shows a body we
 * actually ship a texture for, so nothing on this page is a stock illustration.
 */
const STOPS = [
  {
    group: "earth" as const,
    body: "Earth",
    texture: "/textures/earth-day-blue-marble.jpg",
    tilt: 0.41,
    glow: "#4aa3ff",
    credit: "NASA Blue Marble",
    headline: "Start where you live",
    copy: "A globe carrying today's NASA satellite imagery, with the day and night sides divided by a terminator computed from real solar geometry rather than drawn on. Scrub time and it moves exactly as the Sun does.",
  },
  {
    group: "solar-system" as const,
    body: "Mars",
    texture: "/textures/mars-mola-colorized.jpg",
    tilt: 0.44,
    glow: "#e07a4a",
    credit: "USGS / MOLA elevation",
    headline: "Then the neighbourhood",
    copy: "Fourteen worlds on real orbits from JPL ephemerides: Mars with its measured seasonal CO₂ cycle, the Moon's true libration, Jupiter's moons casting real shadow transits, and Saturn's rings at their actual tilt.",
  },
  {
    group: "beyond" as const,
    body: "Andromeda",
    texture: "/textures/galaxies/andromeda.jpg",
    tilt: 0.2,
    glow: "#c9a6ff",
    credit: "ESA/Hubble, CC BY 4.0",
    headline: "And then everything else",
    copy: "Eight worlds past the Solar System: 18,000 real SDSS galaxies mapped in 3D, the black holes the Event Horizon Telescope actually photographed, pulsars ticking at their measured spin, and 282 gravitational-wave detections you can hear.",
  },
];

export default function WelcomeApp() {
  const router = useRouter();
  const reduce = useReducedMotion();
  const [launching, setLaunching] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  const { scrollYProgress } = useScroll({ container: scrollRef });
  const progress = useSpring(scrollYProgress, { stiffness: 90, damping: 24 });

  const markSeen = useCallback(() => {
    try {
      window.localStorage.setItem(WELCOME_SEEN_KEY, "1");
    } catch {
      /* private mode: the tour simply shows again, which is harmless */
    }
  }, []);

  useEffect(() => {
    markSeen();
  }, [markSeen]);

  const enter = useCallback(() => {
    markSeen();
    setLaunching(true);
    if (reduce) router.push("/");
  }, [markSeen, reduce, router]);

  const skip = useCallback(() => {
    markSeen();
    router.push("/");
  }, [markSeen, router]);

  return (
    <main className="relative h-dvh w-full overflow-hidden bg-abyss text-ice">
      {/* scroll progress */}
      <motion.div
        aria-hidden
        className="fixed left-0 top-0 z-50 h-px w-full origin-left bg-gradient-to-r from-solar to-solar/30"
        style={{ scaleX: progress }}
      />

      {/* slim brand bar: orientation, and a way out */}
      <header className="fixed inset-x-0 top-0 z-40 flex items-center justify-between px-5 py-4 sm:px-7">
        <Link href="/" onClick={markSeen} className="flex items-center gap-2.5">
          <BrandMark size={20} />
          <span className="font-display text-[13px] font-semibold tracking-[0.22em] text-ice">
            H.O.T EARTH
          </span>
        </Link>
        <Button variant="ghost" size="sm" onClick={skip}>
          Skip
        </Button>
      </header>

      <div ref={scrollRef} className="hud-scroll h-full overflow-y-auto scroll-smooth">
        {/* ---------------- hero ---------------- */}
        <section className="relative flex min-h-dvh flex-col items-center justify-center px-6 py-24 text-center">
          <Starfield />
          {/* a single warm bloom so the rocket sits in space, not on a black rectangle */}
          <div
            aria-hidden
            className="pointer-events-none absolute left-1/2 top-1/2 h-[85vmin] w-[85vmin] -translate-x-1/2 -translate-y-1/2 rounded-full opacity-[0.16] blur-3xl"
            style={{
              background:
                "radial-gradient(circle, #f2a63b 0%, rgba(242,166,59,0.25) 42%, transparent 68%)",
            }}
          />

          <motion.div
            initial={reduce ? {} : { opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.75, ease: [0.22, 1, 0.36, 1] }}
            className="relative z-10 flex flex-col items-center"
          >
            <RocketLaunch launching={launching} onLaunchComplete={() => router.push("/")} />

            <p className="mt-4 font-mono text-[10px] uppercase tracking-[0.32em] text-solar">
              An honest digital twin
            </p>
            <h1 className="mt-3 max-w-[18ch] font-display text-[clamp(2.5rem,7vw,4.75rem)] font-semibold leading-[1.02] tracking-[-0.03em]">
              Enter the universe
            </h1>
            <p className="mt-5 max-w-xl text-[15px] leading-relaxed text-dim">
              Twenty-six worlds built on real physics and real public data. No
              invented numbers, no API keys, nothing to sign up for.
            </p>

            <div className="mt-9 flex flex-wrap items-center justify-center gap-3">
              <Button size="lg" onClick={enter} disabled={launching}>
                <Rocket size={18} weight="fill" />
                {launching ? "Launching…" : "Launch"}
              </Button>
              <a href="#tour" className={buttonVariants({ variant: "outline", size: "lg" })}>
                Take the tour
              </a>
            </div>

            {/* real, checkable numbers instead of marketing adjectives */}
            <dl className="mt-12 flex flex-wrap items-center justify-center gap-x-8 gap-y-3 font-mono text-[10px] uppercase tracking-[0.18em] text-faint">
              {/* Derived or timeless only: a hardcoded test count would rot. */}
              {[
                [`${WORLDS.length}`, "worlds"],
                [`${WORLD_GROUPS.length}`, "groups"],
                ["0", "api keys"],
                ["MIT", "licensed"],
              ].map(([v, k]) => (
                <div key={k} className="flex items-baseline gap-2">
                  <dt className="sr-only">{k}</dt>
                  <dd className="font-display text-base tracking-normal text-ice">{v}</dd>
                  <span>{k}</span>
                </div>
              ))}
            </dl>
          </motion.div>

          <motion.a
            href="#tour"
            aria-label="Scroll to the tour"
            className="absolute bottom-8 left-1/2 z-10 -translate-x-1/2 text-faint transition-colors hover:text-ice"
            animate={reduce ? {} : { y: [0, 6, 0] }}
            transition={{ duration: 2.4, repeat: Infinity, ease: "easeInOut" }}
          >
            <ArrowDown size={18} />
          </motion.a>
        </section>

        {/* ---------------- the three stops ---------------- */}
        <div id="tour">
          {STOPS.map((stop, i) => (
            <Stop key={stop.group} stop={stop} index={i} />
          ))}
        </div>

        {/* ---------------- final ---------------- */}
        <section className="relative flex min-h-[85dvh] flex-col items-center justify-center gap-7 px-6 py-28 text-center">
          <div
            aria-hidden
            className="pointer-events-none absolute left-1/2 top-1/2 h-[70vmin] w-[70vmin] -translate-x-1/2 -translate-y-1/2 rounded-full opacity-[0.12] blur-3xl"
            style={{
              background:
                "radial-gradient(circle, #f2a63b 0%, transparent 65%)",
            }}
          />
          <div className="relative z-10 flex flex-col items-center gap-7">
            <h2 className="max-w-[24ch] font-display text-[clamp(1.75rem,4vw,2.75rem)] font-semibold leading-[1.1] tracking-[-0.02em]">
              That is the tour. The rest is yours.
            </h2>
            <p className="max-w-xl text-sm leading-relaxed text-dim">
              Press <Kbd>⌘</Kbd>
              <span className="mx-0.5 text-faint">/</span>
              <Kbd>Ctrl</Kbd>
              <span className="mx-1 text-faint">+</span>
              <Kbd>K</Kbd> anywhere to search every world, or <Kbd>[</Kbd> and{" "}
              <Kbd>]</Kbd> to step between them. Sprocket, the robot in the
              corner, answers from the app&apos;s own data.
            </p>
            <div className="flex flex-wrap justify-center gap-3">
              <Button size="lg" onClick={enter} disabled={launching}>
                <Rocket size={18} weight="fill" />
                Enter the universe
              </Button>
              <Link
                href="/gravitational-waves"
                className={buttonVariants({ variant: "outline", size: "lg" })}
              >
                Hear a black-hole merger
              </Link>
            </div>
            <p className="mt-2 max-w-lg text-[11px] leading-relaxed text-faint">
              Every image on this page is a real dataset we ship: NASA Blue
              Marble, USGS MOLA elevation for Mars, and ESA/Hubble&apos;s
              Andromeda (CC BY 4.0). The rotation is set for looks; the real
              orbital mechanics are in the world tabs.
            </p>
          </div>
        </section>
      </div>
    </main>
  );
}

function Kbd({ children }: { children: React.ReactNode }) {
  return (
    <kbd className="rounded-md border border-line bg-white/[0.05] px-1.5 py-0.5 font-mono text-[10px] text-dim">
      {children}
    </kbd>
  );
}

function Stop({ stop, index }: { stop: (typeof STOPS)[number]; index: number }) {
  const ref = useRef<HTMLElement>(null);
  // Mount the canvas only when the section is near the viewport, so we never
  // hold three WebGL contexts open at once.
  const near = useInView(ref, { margin: "60% 0px 60% 0px" });
  const inView = useInView(ref, { margin: "-20% 0px -20% 0px" });
  const reduce = useReducedMotion();
  const group = WORLD_GROUPS.find((g) => g.id === stop.group)!;
  const worlds = getWorldsInGroup(stop.group);
  const flip = index % 2 === 1;

  return (
    <section
      ref={ref}
      className="relative flex min-h-[92dvh] items-center border-t border-line/60 px-6 py-20"
      aria-label={group.label}
    >
      <div className="mx-auto grid w-full max-w-6xl items-center gap-12 lg:grid-cols-[minmax(0,1fr)_minmax(0,1.05fr)] lg:gap-16">
        {/* body */}
        <motion.div
          initial={reduce ? {} : { opacity: 0, scale: 0.92 }}
          animate={inView ? { opacity: 1, scale: 1 } : { opacity: 0.45, scale: 0.96 }}
          transition={{ duration: 0.85, ease: [0.22, 1, 0.36, 1] }}
          className={`relative mx-auto aspect-square w-full max-w-[400px] ${flip ? "lg:order-2" : ""}`}
        >
          {/* atmospheric bloom, so the body has depth instead of sitting on flat black */}
          <div
            aria-hidden
            className="pointer-events-none absolute inset-[-18%] rounded-full opacity-25 blur-3xl"
            style={{
              background: `radial-gradient(circle, ${stop.glow} 0%, transparent 62%)`,
            }}
          />
          {near && (
            <PlanetStage
              texture={stop.texture}
              tilt={stop.tilt}
              className="absolute inset-0"
            />
          )}
          <span className="pointer-events-none absolute -bottom-6 left-1/2 -translate-x-1/2 whitespace-nowrap font-mono text-[9px] uppercase tracking-[0.2em] text-faint">
            {stop.body} · {stop.credit}
          </span>
        </motion.div>

        {/* copy */}
        <motion.div
          initial={reduce ? {} : { opacity: 0, y: 26 }}
          animate={inView ? { opacity: 1, y: 0 } : { opacity: 0.5, y: 10 }}
          transition={{ duration: 0.75, ease: [0.22, 1, 0.36, 1], delay: 0.06 }}
          className="min-w-0"
        >
          <div className="flex items-center gap-3">
            <span className="font-display text-[11px] tabular-nums text-solar">
              0{index + 1}
            </span>
            <span className="h-px w-8 bg-solar/40" />
            <p className="font-mono text-[10px] uppercase tracking-[0.24em] text-faint">
              {group.label} · {worlds.length} worlds
            </p>
          </div>

          <h2 className="mt-4 max-w-[20ch] font-display text-[clamp(1.6rem,3.6vw,2.5rem)] font-semibold leading-[1.1] tracking-[-0.02em]">
            {stop.headline}
          </h2>
          <p className="mt-4 max-w-xl text-[14px] leading-relaxed text-dim">
            {stop.copy}
          </p>

          <div className="mt-7 grid gap-2.5 sm:grid-cols-2">
            {worlds.slice(0, 4).map((w) => (
              <Link
                key={w.id}
                href={w.href}
                className="group flex items-start gap-3 rounded-xl border border-line bg-white/[0.02] p-3.5 transition-all duration-200 hover:-translate-y-0.5 hover:border-white/20 hover:bg-white/[0.05]"
              >
                <span
                  aria-hidden
                  className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full"
                  style={{ backgroundColor: w.accent }}
                />
                <span className="min-w-0">
                  <span className="flex items-center gap-1.5 text-[13px] font-medium text-ice">
                    {w.label}
                    <ArrowRight
                      size={12}
                      className="-translate-x-1 opacity-0 transition-all duration-200 group-hover:translate-x-0 group-hover:opacity-60"
                    />
                  </span>
                  <span className="mt-1 line-clamp-2 block text-[11px] leading-snug text-faint">
                    {w.blurb}
                  </span>
                </span>
              </Link>
            ))}
          </div>
          {worlds.length > 4 && (
            <p className="mt-3 font-mono text-[10px] uppercase tracking-[0.16em] text-faint">
              + {worlds.length - 4} more in {group.label}
            </p>
          )}
        </motion.div>
      </div>
    </section>
  );
}

/** A quiet, static starfield. Deterministic so it never flickers on re-render. */
function Starfield() {
  const stars = useRef<Array<{
    x: number;
    y: number;
    r: number;
    o: number;
  }> | null>(null);
  if (!stars.current) {
    let seed = 7;
    const rnd = () => {
      seed = (seed * 1103515245 + 12345) % 2147483648;
      return seed / 2147483648;
    };
    stars.current = Array.from({ length: 110 }, () => ({
      x: rnd() * 100,
      y: rnd() * 100,
      r: 0.4 + rnd() * 1.1,
      o: 0.18 + rnd() * 0.5,
    }));
  }
  return (
    <svg
      aria-hidden
      className="pointer-events-none absolute inset-0 h-full w-full"
      preserveAspectRatio="none"
      viewBox="0 0 100 100"
    >
      {stars.current.map((s, i) => (
        <circle key={i} cx={s.x} cy={s.y} r={s.r * 0.11} fill="#edf0f5" opacity={s.o} />
      ))}
    </svg>
  );
}
