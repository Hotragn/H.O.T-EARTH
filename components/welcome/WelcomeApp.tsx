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
import { WORLD_GROUPS, getWorldsInGroup } from "@/lib/worlds";
import { Button, buttonVariants } from "@/components/ui/shadcn/button";
import {
  Card,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/shadcn/card";
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
    credit: "NASA Blue Marble",
    headline: "Start where you live",
    copy: "A globe carrying today's NASA satellite imagery, with the day and night sides divided by a terminator computed from real solar geometry rather than drawn on. Scrub time and it moves exactly as the Sun does.",
  },
  {
    group: "solar-system" as const,
    body: "Mars",
    texture: "/textures/mars-mola-colorized.jpg",
    tilt: 0.44,
    credit: "USGS / MOLA elevation",
    headline: "Then the neighbourhood",
    copy: "Fourteen worlds on real orbits from JPL ephemerides: Mars with its measured seasonal CO₂ cycle, the Moon's true libration, Jupiter's moons casting real shadow transits, and Saturn's rings at their actual tilt.",
  },
  {
    group: "beyond" as const,
    body: "Andromeda",
    texture: "/textures/galaxies/andromeda.jpg",
    tilt: 0.2,
    credit: "ESA/Hubble, CC BY 4.0",
    headline: "And then everything else",
    copy: "Eight worlds beyond the Solar System: 18,000 real SDSS galaxies mapped in 3D, the black holes the Event Horizon Telescope actually photographed, pulsars ticking at their measured spin, and 282 gravitational-wave detections you can hear.",
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
    // Reduced motion skips the flight; otherwise the rocket clears the frame first.
    if (reduce) router.push("/");
  }, [markSeen, reduce, router]);

  return (
    <main className="relative h-dvh w-full overflow-hidden bg-abyss text-ice">
      {/* scroll progress */}
      <motion.div
        aria-hidden
        className="fixed left-0 top-0 z-50 h-0.5 origin-left bg-solar"
        style={{ scaleX: progress, width: "100%" }}
      />

      {/* skip: always reachable, never trapped in the tour */}
      <div className="fixed right-4 top-4 z-50 flex items-center gap-2">
        <Button
          variant="ghost"
          size="sm"
          onClick={() => {
            markSeen();
            router.push("/");
          }}
        >
          Skip the tour
        </Button>
      </div>

      <div
        ref={scrollRef}
        className="hud-scroll h-full overflow-y-auto scroll-smooth"
      >
        {/* ---------- hero: the rocket ---------- */}
        <section className="relative flex min-h-dvh flex-col items-center justify-center px-6 text-center">
          <Starfield />
          <motion.div
            initial={reduce ? {} : { opacity: 0, y: 18 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7, ease: [0.22, 1, 0.36, 1] }}
            className="relative z-10 flex flex-col items-center"
          >
            <RocketLaunch
              launching={launching}
              onLaunchComplete={() => router.push("/")}
            />
            <h1 className="mt-2 font-display text-3xl font-semibold tracking-tight sm:text-5xl">
              Enter the universe
            </h1>
            <p className="mt-4 max-w-xl text-sm leading-relaxed text-dim sm:text-base">
              Twenty-six worlds, built on real physics and real public data. No
              invented numbers, no API keys, nothing you have to sign up for.
            </p>
            <div className="mt-8 flex flex-wrap items-center justify-center gap-3">
              <Button size="lg" onClick={enter} disabled={launching}>
                <Rocket size={18} weight="fill" />
                {launching ? "Launching…" : "Launch"}
              </Button>
              <a
                href="#tour"
                className={buttonVariants({ variant: "outline", size: "lg" })}
              >
                Take the tour
              </a>
            </div>
            <motion.a
              href="#tour"
              className="mt-14 flex flex-col items-center gap-1 text-faint transition-colors hover:text-ice"
              animate={reduce ? {} : { y: [0, 6, 0] }}
              transition={{ duration: 2.4, repeat: Infinity, ease: "easeInOut" }}
            >
              <span className="font-mono text-[10px] uppercase tracking-[0.2em]">
                or scroll
              </span>
              <ArrowDown size={16} />
            </motion.a>
          </motion.div>
        </section>

        {/* ---------- the three stops ---------- */}
        <div id="tour">
          {STOPS.map((stop, i) => (
            <Stop key={stop.group} stop={stop} index={i} />
          ))}
        </div>

        {/* ---------- final ---------- */}
        <section className="flex min-h-[80dvh] flex-col items-center justify-center gap-6 px-6 py-24 text-center">
          <h2 className="font-display text-2xl font-semibold sm:text-3xl">
            That is the tour. The rest is yours to explore.
          </h2>
          <p className="max-w-xl text-sm leading-relaxed text-dim">
            Press <Kbd>⌘</Kbd>/<Kbd>Ctrl</Kbd>+<Kbd>K</Kbd> anywhere to search all
            twenty-six worlds, or <Kbd>[</Kbd> and <Kbd>]</Kbd> to step between
            them. Sprocket, the little robot in the corner, answers questions from
            the app&apos;s own data.
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
          <p className="mt-4 max-w-lg text-[11px] leading-relaxed text-faint">
            Every image on this page is a real dataset we ship: NASA Blue Marble,
            USGS MOLA elevation for Mars, and ESA/Hubble&apos;s Andromeda (CC BY
            4.0). The rotation you see is set for looks; the real orbital mechanics
            are in the world tabs.
          </p>
        </section>
      </div>
    </main>
  );
}

function Kbd({ children }: { children: React.ReactNode }) {
  return (
    <kbd className="rounded border border-line bg-white/[0.04] px-1.5 py-0.5 font-mono text-[10px] text-dim">
      {children}
    </kbd>
  );
}

function Stop({
  stop,
  index,
}: {
  stop: (typeof STOPS)[number];
  index: number;
}) {
  const ref = useRef<HTMLElement>(null);
  // Mount the canvas only when the section is near the viewport, so we never
  // hold three WebGL contexts open at once.
  const near = useInView(ref, { margin: "60% 0px 60% 0px" });
  const inView = useInView(ref, { margin: "-25% 0px -25% 0px" });
  const reduce = useReducedMotion();
  const group = WORLD_GROUPS.find((g) => g.id === stop.group)!;
  const worlds = getWorldsInGroup(stop.group);
  const flip = index % 2 === 1;

  return (
    <section
      ref={ref}
      className="flex min-h-dvh items-center px-6 py-16"
      aria-label={group.label}
    >
      <div
        className={`mx-auto grid w-full max-w-6xl items-center gap-10 lg:grid-cols-2 ${
          flip ? "lg:[&>*:first-child]:order-2" : ""
        }`}
      >
        {/* body */}
        <motion.div
          initial={reduce ? {} : { opacity: 0, scale: 0.9 }}
          animate={inView ? { opacity: 1, scale: 1 } : { opacity: 0.35, scale: 0.95 }}
          transition={{ duration: 0.8, ease: [0.22, 1, 0.36, 1] }}
          className="relative mx-auto aspect-square w-full max-w-[420px]"
        >
          {near && (
            <PlanetStage
              texture={stop.texture}
              tilt={stop.tilt}
              className="absolute inset-0"
            />
          )}
          <span className="pointer-events-none absolute bottom-1 left-1/2 -translate-x-1/2 font-mono text-[9px] uppercase tracking-[0.18em] text-faint">
            {stop.body} · {stop.credit}
          </span>
        </motion.div>

        {/* copy */}
        <motion.div
          initial={reduce ? {} : { opacity: 0, y: 28 }}
          animate={inView ? { opacity: 1, y: 0 } : { opacity: 0.4, y: 12 }}
          transition={{ duration: 0.7, ease: [0.22, 1, 0.36, 1], delay: 0.05 }}
          className="min-w-0"
        >
          <p className="font-mono text-[10px] uppercase tracking-[0.22em] text-solar">
            {group.label} · {worlds.length} worlds
          </p>
          <h2 className="mt-2 font-display text-2xl font-semibold sm:text-3xl">
            {stop.headline}
          </h2>
          <p className="mt-3 max-w-xl text-sm leading-relaxed text-dim">
            {stop.copy}
          </p>

          <div className="mt-6 grid gap-2 sm:grid-cols-2">
            {worlds.slice(0, 4).map((w) => (
              <Link key={w.id} href={w.href} className="group">
                <Card className="h-full hover:border-solar/40">
                  <CardHeader className="p-3.5">
                    <CardTitle className="flex items-center gap-2 text-sm">
                      <span
                        aria-hidden
                        className="h-1.5 w-1.5 rounded-full"
                        style={{ backgroundColor: w.accent }}
                      />
                      {w.label}
                      <ArrowRight
                        size={13}
                        className="opacity-0 transition-opacity duration-200 group-hover:opacity-70"
                      />
                    </CardTitle>
                    <CardDescription className="line-clamp-2 text-[11px]">
                      {w.blurb}
                    </CardDescription>
                  </CardHeader>
                </Card>
              </Link>
            ))}
          </div>
          {worlds.length > 4 && (
            <p className="mt-3 text-[11px] text-faint">
              and {worlds.length - 4} more in {group.label}.
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
    stars.current = Array.from({ length: 90 }, () => ({
      x: rnd() * 100,
      y: rnd() * 100,
      r: 0.4 + rnd() * 1.1,
      o: 0.2 + rnd() * 0.55,
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
        <circle key={i} cx={s.x} cy={s.y} r={s.r * 0.12} fill="#edf0f5" opacity={s.o} />
      ))}
    </svg>
  );
}
