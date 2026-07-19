import { describe, expect, it } from "vitest";
import {
  DWARF_MOONS,
  DWARF_SYSTEMS,
  MOONS_BY_SYSTEM,
  PLUTO_BARYCENTER_FRACTION,
  PLUTO_CHARON_MASS_RATIO,
  currentDwarfPhenomena,
  diskContains,
  dwarfGeocentric,
  dwarfMoonPosition,
  dwarfMoonPositions,
  dwarfMoonsState,
  julianDate,
  julianEphemerisDate,
  plutoBarycentricOffset,
  type DwarfMoon,
  type DwarfSystem,
} from "./dwarf-moons";

const DAY_MS = 86_400_000;

/**
 * Physics acceptance tests for lib/dwarf-moons.ts — the Pluto / Eris / Haumea /
 * Makemake moon-configuration library (the dwarf-planet sibling of
 * lib/other-moons.test.ts).
 *
 * TWO TIERS, kept explicit (see the module header):
 *   • PLUTO = REAL positions (Brozović & Jacobson 2024 mean elements). Charon's
 *     a = 19600 km is the Pluto–Charon SEPARATION and the pair are a BINARY whose
 *     barycenter lies OUTSIDE Pluto; the small moons orbit that barycenter.
 *   • ERIS / HAUMEA / MAKEMAKE = REAL orbit (a, e, i, period cited) but the
 *     along-orbit PHASE and node are an ADOPTED illustrative convention
 *     (`phaseReal` = false); Makemake's MK2 is additionally poorly constrained.
 *
 * These systems are UNRESOLVABLE from Earth (Pluto's disk ~0.1″), so phenomenon
 * flags are geometric only. Cross-check JPL Horizons offline (never called here).
 */

const ALL_SYSTEMS: DwarfSystem[] = ["Pluto", "Eris", "Haumea", "Makemake"];

// Central-body radii used to normalise the moon coordinates.
const R_PLUTO = 1188.3;
const R_ERIS = 1163;
const R_HAUMEA = 797.4;
const R_MAKEMAKE = 715;

// Expected max apparent elongation ≈ a / central-radius (semi-major axis in
// central-body radii). Charon's is the raw SEPARATION; from the barycenter it is
// (1−f)× this — checked separately below.
const EXPECTED_A_REQ: Record<DwarfMoon, number> = {
  Charon: 19600 / R_PLUTO, // 16.49
  Styx: 43200 / R_PLUTO, // 36.35
  Nix: 49300 / R_PLUTO, // 41.49
  Kerberos: 58300 / R_PLUTO, // 49.06
  Hydra: 65200 / R_PLUTO, // 54.87
  Dysnomia: 37273 / R_ERIS, // 32.05
  Namaka: 25657 / R_HAUMEA, // 32.17
  Hiiaka: 49880 / R_HAUMEA, // 62.55
  MK2: 22250 / R_MAKEMAKE, // 31.12
};

describe("system geocentric — real distances, tiny disks, tilt flag", () => {
  it("plausible real RA/Dec/distance for every system, disks unresolvable", () => {
    // Sample two years monthly; RA/Dec/distance come from cited SBDB heliocentric
    // theory (lib/dwarf-planets), so they are real for all four systems.
    for (const system of ALL_SYSTEMS) {
      for (let mo = 0; mo < 24; mo++) {
        const date = new Date(Date.UTC(2024, 0, 1) + mo * 30 * DAY_MS);
        const g = dwarfGeocentric(system, date)!;
        expect(g.raDeg).toBeGreaterThanOrEqual(0);
        expect(g.raDeg).toBeLessThan(360);
        expect(Math.abs(g.decDeg)).toBeLessThanOrEqual(90);
        // All four are distant TNOs (Pluto ~28–51 AU, the rest farther).
        expect(g.distanceAU).toBeGreaterThan(27);
        expect(g.distanceAU).toBeLessThan(100);
        // Utterly unresolvable: sub-arcsecond disks.
        expect(g.angularDiameterArcsec).toBeLessThan(0.25);
        expect(g.unresolvableFromEarth).toBe(true);
        expect(g.positionReal).toBe(true); // parent position is real for all
        expect(Number.isFinite(g.systemTiltDeg)).toBe(true);
        expect(Math.abs(g.systemTiltDeg)).toBeLessThanOrEqual(90);
      }
    }
  });

  it("tier flags on geocentric: phaseReal & tiltReal only for Pluto", () => {
    const date = new Date(Date.UTC(2026, 0, 1));
    expect(dwarfGeocentric("Pluto", date)!.phaseReal).toBe(true);
    expect(dwarfGeocentric("Pluto", date)!.tiltReal).toBe(true);
    for (const s of ["Eris", "Haumea", "Makemake"] as DwarfSystem[]) {
      expect(dwarfGeocentric(s, date)!.phaseReal).toBe(false);
      expect(dwarfGeocentric(s, date)!.tiltReal).toBe(false);
    }
  });

  it("Pluto's disk is ~0.1 arcsec (the unresolvable headline)", () => {
    const g = dwarfGeocentric("Pluto", new Date(Date.UTC(2026, 0, 1)))!;
    expect(g.angularDiameterArcsec).toBeGreaterThan(0.05);
    expect(g.angularDiameterArcsec).toBeLessThan(0.15);
  });
});

describe("each moon's max apparent elongation ≈ its orbital radius", () => {
  it("stored semiMajorAxisReq matches a / central-radius", () => {
    for (const m of Object.keys(EXPECTED_A_REQ) as DwarfMoon[]) {
      expect(DWARF_MOONS[m].semiMajorAxisReq).toBeCloseTo(EXPECTED_A_REQ[m], 2);
    }
    // The pinned Pluto values, to one decimal.
    expect(DWARF_MOONS.Charon.semiMajorAxisReq).toBeCloseTo(16.5, 1);
    expect(DWARF_MOONS.Styx.semiMajorAxisReq).toBeCloseTo(36.4, 1);
    expect(DWARF_MOONS.Nix.semiMajorAxisReq).toBeCloseTo(41.5, 1);
    expect(DWARF_MOONS.Kerberos.semiMajorAxisReq).toBeCloseTo(49.1, 1);
    expect(DWARF_MOONS.Hydra.semiMajorAxisReq).toBeCloseTo(54.9, 1);
    // Eris Dysnomia ~32.
    expect(DWARF_MOONS.Dysnomia.semiMajorAxisReq).toBeCloseTo(32.0, 1);
  });

  it("max apparent separation over one orbit ≈ the orbital radius", () => {
    // The small barycentric moons reach ~a at the ansae; Charon reaches (1−f)·a
    // from the barycenter because Pluto–Charon is a binary (see below).
    const f = PLUTO_BARYCENTER_FRACTION;
    for (const system of ALL_SYSTEMS) {
      for (const m of MOONS_BY_SYSTEM[system]) {
        const d = DWARF_MOONS[m];
        const period = d.siderealPeriodDays;
        let maxSep = 0;
        for (let k = 0; k < 400; k++) {
          const date = new Date(Date.UTC(2026, 0, 1) + (k * period * DAY_MS) / 400);
          const p = dwarfMoonPosition(system, m, date)!;
          maxSep = Math.max(maxSep, Math.hypot(p.x, p.y));
        }
        const expected = d.primaryComponent
          ? (1 - f) * d.semiMajorAxisReq // Charon from the barycenter
          : d.semiMajorAxisReq;
        expect(maxSep).toBeGreaterThan(expected * 0.9);
        expect(maxSep).toBeLessThan(expected * (1 + d.eccentricity) + 0.2);
      }
    }
  });
});

describe("Pluto–Charon BINARY: the barycenter is OUTSIDE Pluto", () => {
  it("f·a_Charon (~2128 km) exceeds Pluto's radius (1188.3 km)", () => {
    expect(PLUTO_CHARON_MASS_RATIO).toBeCloseTo(0.1218, 4);
    expect(PLUTO_BARYCENTER_FRACTION).toBeCloseTo(0.1218 / 1.1218, 6);
    const baryDistKm = PLUTO_BARYCENTER_FRACTION * DWARF_MOONS.Charon.semiMajorAxisKm;
    expect(baryDistKm).toBeGreaterThan(2100);
    expect(baryDistKm).toBeGreaterThan(R_PLUTO); // OUTSIDE Pluto — the headline
    // …and in Pluto radii the offset is ~1.79 (f·16.49).
    expect(baryDistKm / R_PLUTO).toBeCloseTo(1.79, 1);
  });

  it("Pluto's offset is anti-phase to Charon, with |Pluto|:|Charon| = q:1", () => {
    const f = PLUTO_BARYCENTER_FRACTION;
    for (const dstr of [Date.UTC(2026, 0, 1), Date.UTC(2028, 6, 1), Date.UTC(2031, 2, 3, 5)]) {
      const date = new Date(dstr);
      const positions = dwarfMoonPositions("Pluto", date)!;
      const charon = positions.find((p) => p.moon === "Charon")!;
      const offset = charon.barycentricOffset!;
      // Anti-phase: Pluto's offset points opposite Charon's sky position.
      const cDotO = charon.x * offset.x + charon.y * offset.y + charon.z * offset.z;
      expect(cDotO).toBeLessThan(0);
      // Magnitude ratio |Pluto offset| / |Charon| = f/(1−f) = q.
      const offMag = Math.hypot(offset.x, offset.y, offset.z);
      const charMag = Math.hypot(charon.x, charon.y, charon.z);
      expect(offMag / charMag).toBeCloseTo(f / (1 - f), 6);
      expect(offMag / charMag).toBeCloseTo(PLUTO_CHARON_MASS_RATIO, 4);
    }
  });

  it("plutoBarycentricOffset matches the offset carried on every Pluto moon", () => {
    const date = new Date(Date.UTC(2026, 5, 15, 9));
    const off = plutoBarycentricOffset("Pluto", date)!;
    for (const p of dwarfMoonPositions("Pluto", date)!) {
      expect(p.barycentricOffset!.x).toBeCloseTo(off.x, 12);
      expect(p.barycentricOffset!.y).toBeCloseTo(off.y, 12);
      expect(p.barycentricOffset!.z).toBeCloseTo(off.z, 12);
    }
    // Non-Pluto systems have no modelled wobble.
    expect(plutoBarycentricOffset("Eris", date)).toBeNull();
    expect(dwarfMoonPositions("Eris", date)![0].barycentricOffset).toBeNull();
  });

  it("Charon–Pluto separation stays ~a (16.5 Req) despite the barycenter split", () => {
    const date = new Date(Date.UTC(2026, 0, 1));
    const positions = dwarfMoonPositions("Pluto", date)!;
    const charon = positions.find((p) => p.moon === "Charon")!;
    const off = charon.barycentricOffset!; // = Pluto's position vs barycenter
    // Charon relative to Pluto = Charon(bary) − Pluto(bary).
    const sep = Math.hypot(charon.x - off.x, charon.y - off.y, charon.z - off.z);
    // Projected onto the sky it is ≤ a; near this epoch it is a large fraction of it.
    expect(sep).toBeLessThan(DWARF_MOONS.Charon.semiMajorAxisReq + 1e-6);
    expect(sep).toBeGreaterThan(1); // well outside Pluto's unit disk
  });
});

describe("data tiers: phaseReal / orbitUncertain / hasRealEphemeris", () => {
  it("Pluto moons are phaseReal; the others are not", () => {
    for (const m of MOONS_BY_SYSTEM.Pluto) {
      expect(DWARF_MOONS[m].phaseReal).toBe(true);
    }
    for (const s of ["Eris", "Haumea", "Makemake"] as DwarfSystem[]) {
      for (const m of MOONS_BY_SYSTEM[s]) expect(DWARF_MOONS[m].phaseReal).toBe(false);
    }
    // The flag propagates to the position records.
    const date = new Date(Date.UTC(2026, 0, 1));
    expect(dwarfMoonPosition("Pluto", "Charon", date)!.phaseReal).toBe(true);
    expect(dwarfMoonPosition("Eris", "Dysnomia", date)!.phaseReal).toBe(false);
    expect(dwarfMoonPosition("Haumea", "Hiiaka", date)!.phaseReal).toBe(false);
  });

  it("hasRealEphemeris is true only for Pluto", () => {
    expect(DWARF_SYSTEMS.Pluto.hasRealEphemeris).toBe(true);
    expect(DWARF_SYSTEMS.Eris.hasRealEphemeris).toBe(false);
    expect(DWARF_SYSTEMS.Haumea.hasRealEphemeris).toBe(false);
    expect(DWARF_SYSTEMS.Makemake.hasRealEphemeris).toBe(false);
  });

  it("orbitUncertain is true only for Makemake's MK2", () => {
    for (const m of Object.keys(DWARF_MOONS) as DwarfMoon[]) {
      expect(DWARF_MOONS[m].orbitUncertain).toBe(m === "MK2");
    }
    expect(dwarfMoonPosition("Makemake", "MK2", new Date(Date.UTC(2026, 0, 1)))!.orbitUncertain).toBe(
      true
    );
  });
});

describe("Pluto moons carry REAL distinct J2000 phases (not zeroed)", () => {
  const norm = (d: number) => ((d % 360) + 360) % 360;

  it("Pluto's epoch mean longitudes are distinct and not all zero", () => {
    const moons = MOONS_BY_SYSTEM.Pluto;
    const lam0 = moons.map((m) => {
      const d = DWARF_MOONS[m];
      return norm(d.meanAnomalyEpochDeg + d.argPeriapsisDeg + d.nodeDeg);
    });
    // Guard against a schematic 0-at-epoch regression.
    expect(moons.every((m) => DWARF_MOONS[m].meanAnomalyEpochDeg === 0)).toBe(false);
    for (let i = 0; i < lam0.length; i++) {
      for (let j = i + 1; j < lam0.length; j++) {
        let gap = Math.abs(lam0[i] - lam0[j]);
        gap = Math.min(gap, 360 - gap);
        expect(gap).toBeGreaterThan(3);
      }
    }
  });

  it("the illustrative systems ADOPT a zeroed epoch phase (documented convention)", () => {
    for (const s of ["Eris", "Haumea", "Makemake"] as DwarfSystem[]) {
      for (const m of MOONS_BY_SYSTEM[s]) {
        expect(DWARF_MOONS[m].meanAnomalyEpochDeg).toBe(0);
        expect(DWARF_MOONS[m].nodeDeg).toBe(0);
        expect(DWARF_MOONS[m].argPeriapsisDeg).toBe(0);
      }
    }
  });

  it("phase actually advances with time (moons move at their REAL period)", () => {
    // Charon (~6.39 d): a couple of days visibly moves it.
    const a = dwarfMoonPosition("Pluto", "Charon", new Date(Date.UTC(2026, 0, 1)))!;
    const b = dwarfMoonPosition("Pluto", "Charon", new Date(Date.UTC(2026, 0, 3)))!;
    expect(Math.abs(a.x - b.x) + Math.abs(a.y - b.y)).toBeGreaterThan(1);
    // Even an illustrative-phase moon moves at its real rate (Dysnomia ~15.8 d).
    const c = dwarfMoonPosition("Eris", "Dysnomia", new Date(Date.UTC(2026, 0, 1)))!;
    const e = dwarfMoonPosition("Eris", "Dysnomia", new Date(Date.UTC(2026, 0, 5)))!;
    expect(Math.abs(c.x - e.x) + Math.abs(c.y - e.y)).toBeGreaterThan(1);
  });

  it("node precession drifts Kerberos/Hydra over a decade (integer orbits)", () => {
    for (const m of ["Kerberos", "Hydra"] as DwarfMoon[]) {
      const period = DWARF_MOONS[m].siderealPeriodDays;
      const t0 = Date.UTC(2000, 0, 1, 12, 0, 0);
      const wholeOrbits = Math.round((10 * 365.25) / period);
      const p0 = dwarfMoonPosition("Pluto", m, new Date(t0))!;
      const p1 = dwarfMoonPosition("Pluto", m, new Date(t0 + wholeOrbits * period * DAY_MS))!;
      // After integer orbits M returns, but the node regression leaves a residual.
      expect(Math.abs(p0.x - p1.x) + Math.abs(p0.y - p1.y)).toBeGreaterThan(0.02);
    }
  });
});

describe("rotation FACTS surfaced for the UI (data only)", () => {
  it("tidal locks: Charon and Dysnomia; chaotic small Pluto moons", () => {
    expect(DWARF_MOONS.Charon.tidallyLocked).toBe(true);
    expect(DWARF_MOONS.Dysnomia.tidallyLocked).toBe(true);
    for (const m of ["Styx", "Nix", "Kerberos", "Hydra"] as DwarfMoon[]) {
      expect(DWARF_MOONS[m].chaoticRotator).toBe(true);
      expect(DWARF_MOONS[m].tidallyLocked).toBe(false);
    }
    expect(DWARF_MOONS.Charon.chaoticRotator).toBe(false);
  });

  it("Pluto is flagged a retrograde rotator; the others are not", () => {
    expect(DWARF_SYSTEMS.Pluto.retrogradeRotator).toBe(true);
    for (const s of ["Eris", "Haumea", "Makemake"] as DwarfSystem[]) {
      expect(DWARF_SYSTEMS[s].retrogradeRotator).toBe(false);
    }
  });

  it("Charon is the binary primary; the others are not", () => {
    expect(DWARF_MOONS.Charon.primaryComponent).toBe(true);
    for (const m of Object.keys(DWARF_MOONS) as DwarfMoon[]) {
      if (m !== "Charon") expect(DWARF_MOONS[m].primaryComponent).toBe(false);
    }
  });
});

describe("cited constants, radii, ring & pole", () => {
  it("central-body radii and the Pluto pole are the cited values", () => {
    expect(DWARF_SYSTEMS.Pluto.centralRadiusKm).toBe(1188.3);
    expect(DWARF_SYSTEMS.Eris.centralRadiusKm).toBe(1163);
    expect(DWARF_SYSTEMS.Makemake.centralRadiusKm).toBe(715);
    expect(DWARF_SYSTEMS.Pluto.poleRaJ2000Deg).toBeCloseTo(132.993, 3);
    expect(DWARF_SYSTEMS.Pluto.poleDecJ2000Deg).toBeCloseTo(-6.163, 3);
    // The illustrative systems have no pinned pole.
    expect(DWARF_SYSTEMS.Eris.poleRaJ2000Deg).toBeUndefined();
  });

  it("Haumea carries the cited ring radius and triaxial shape", () => {
    expect(DWARF_SYSTEMS.Haumea.ringRadiusKm).toBe(2285);
    expect(DWARF_SYSTEMS.Haumea.ringRadiusReq).toBeCloseTo(2285 / R_HAUMEA, 4);
    const t = DWARF_SYSTEMS.Haumea.triaxialSemiAxesKm!;
    expect(t.a).toBe(1160);
    expect(t.b).toBe(852);
    expect(t.c).toBe(513);
  });

  it("sidereal periods match the cited values", () => {
    expect(DWARF_MOONS.Charon.siderealPeriodDays).toBeCloseTo(6.387222, 5);
    expect(DWARF_MOONS.Dysnomia.siderealPeriodDays).toBeCloseTo(15.785899, 5);
    expect(DWARF_MOONS.Hiiaka.siderealPeriodDays).toBeCloseTo(49.462, 3);
    expect(DWARF_MOONS.Namaka.siderealPeriodDays).toBeCloseTo(18.2783, 4);
    expect(DWARF_MOONS.MK2.siderealPeriodDays).toBeCloseTo(18.023, 3);
  });

  it("frames: Pluto moons pluto-equator; the others ecliptic-illustrative", () => {
    for (const m of MOONS_BY_SYSTEM.Pluto) expect(DWARF_MOONS[m].frame).toBe("pluto-equator");
    for (const s of ["Eris", "Haumea", "Makemake"] as DwarfSystem[]) {
      for (const m of MOONS_BY_SYSTEM[s]) expect(DWARF_MOONS[m].frame).toBe("ecliptic-illustrative");
    }
    // Every moon shares the J2000 element epoch.
    for (const m of Object.keys(DWARF_MOONS) as DwarfMoon[]) {
      expect(DWARF_MOONS[m].epochUnixMs).toBe(Date.UTC(2000, 0, 1, 12, 0, 0));
    }
  });

  it("diskContains: unit-radius sphere test", () => {
    expect(diskContains(0.99, 0)).toBe(true);
    expect(diskContains(1.01, 0)).toBe(false);
    expect(diskContains(0, 0.5)).toBe(true);
  });

  it("julianDate / julianEphemerisDate: J2000 and ΔT offset", () => {
    expect(julianDate(new Date(Date.UTC(2000, 0, 1, 12, 0, 0)))).toBeCloseTo(2451545.0, 6);
    const d = new Date(Date.UTC(2020, 0, 1));
    expect((julianEphemerisDate(d) - julianDate(d)) * 86_400).toBeCloseTo(69.184, 3);
  });
});

describe("phenomena snapshot consistency (geometric, usually empty)", () => {
  it("currentDwarfPhenomena flags always match the position flags", () => {
    for (const system of ALL_SYSTEMS) {
      for (let d = 0; d < 60; d++) {
        const date = new Date(Date.UTC(2026, 0, 1) + d * DAY_MS);
        const now = currentDwarfPhenomena(system, date)!;
        const positions = dwarfMoonPositions(system, date)!;
        for (const ev of now) {
          const p = positions.find((q) => q.moon === ev.moon)!;
          if (ev.type === "transit") expect(p.inTransit).toBe(true);
          if (ev.type === "shadow_transit") expect(p.inShadowTransit).toBe(true);
          if (ev.type === "occultation") expect(p.inOccultation).toBe(true);
          if (ev.type === "eclipse") expect(p.inEclipse).toBe(true);
          expect(ev.phaseReal).toBe(p.phaseReal);
        }
      }
    }
  });

  it("frontOfDisk always agrees with the sign of the central-relative Z", () => {
    // For the illustrative systems the central body sits at the barycenter, so
    // frontOfDisk === z > 0. (Pluto's central body is offset, so it is exempted.)
    for (const system of ["Eris", "Haumea", "Makemake"] as DwarfSystem[]) {
      for (let h = 0; h < 80; h++) {
        const arr = dwarfMoonPositions(system, new Date(Date.UTC(2026, 0, 1) + h * 12 * 3_600_000))!;
        for (const p of arr) expect(p.frontOfDisk).toBe(p.z > 0);
      }
    }
  });
});

describe("determinism & null-safety", () => {
  it("dwarfMoonPositions is deterministic", () => {
    const d = new Date(Date.UTC(2026, 6, 4, 12, 0, 0));
    for (const system of ALL_SYSTEMS) {
      const a = dwarfMoonPositions(system, d)!;
      const b = dwarfMoonPositions(system, d)!;
      for (let i = 0; i < a.length; i++) {
        expect(a[i].x).toBe(b[i].x);
        expect(a[i].y).toBe(b[i].y);
        expect(a[i].z).toBe(b[i].z);
        expect(a[i].shadowX).toBe(b[i].shadowX);
      }
    }
  });

  it("returns each system's moons in orbital order", () => {
    expect(dwarfMoonPositions("Pluto", new Date(Date.UTC(2026, 0, 1)))!.map((p) => p.moon)).toEqual([
      "Charon",
      "Styx",
      "Nix",
      "Kerberos",
      "Hydra",
    ]);
    expect(dwarfMoonPositions("Haumea", new Date(Date.UTC(2026, 0, 1)))!.map((p) => p.moon)).toEqual([
      "Namaka",
      "Hiiaka",
    ]);
    expect(dwarfMoonPositions("Makemake", new Date(Date.UTC(2026, 0, 1)))!.map((p) => p.moon)).toEqual(
      ["MK2"]
    );
  });

  it("dwarfMoonPosition rejects a moon that does not belong to the system", () => {
    const date = new Date(Date.UTC(2026, 0, 1));
    expect(dwarfMoonPosition("Pluto", "Dysnomia", date)).toBeNull();
    expect(dwarfMoonPosition("Eris", "Charon", date)).toBeNull();
    expect(dwarfMoonPosition("Haumea", "MK2", date)).toBeNull();
    expect(dwarfMoonPosition("Pluto", "Charon", date)).not.toBeNull();
  });

  it("invalid dates yield null (never throw)", () => {
    const bad = new Date(NaN);
    for (const system of ALL_SYSTEMS) {
      expect(dwarfMoonPositions(system, bad)).toBeNull();
      expect(dwarfGeocentric(system, bad)).toBeNull();
      expect(currentDwarfPhenomena(system, bad)).toBeNull();
      expect(dwarfMoonsState(system, bad)).toBeNull();
    }
    expect(dwarfMoonPosition("Pluto", "Charon", bad)).toBeNull();
    expect(plutoBarycentricOffset("Pluto", bad)).toBeNull();
  });

  it("dwarfMoonsState bundles geocentric, positions, phenomena and tier flag", () => {
    const s = dwarfMoonsState("Pluto", new Date(Date.UTC(2026, 0, 1)))!;
    expect(s.positions.length).toBe(5);
    expect(s.geocentric.distanceAU).toBeGreaterThan(27);
    expect(s.hasRealEphemeris).toBe(true);
    expect(s.barycentricOffset).not.toBeNull();
    expect(Array.isArray(s.current)).toBe(true);

    const e = dwarfMoonsState("Makemake", new Date(Date.UTC(2026, 0, 1)))!;
    expect(e.hasRealEphemeris).toBe(false);
    expect(e.barycentricOffset).toBeNull();
    expect(e.positions[0].orbitUncertain).toBe(true);
  });
});
