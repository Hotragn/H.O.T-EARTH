import { describe, expect, it } from "vitest";
import {
  createSwarm,
  distinctTargets,
  isFiniteState,
  PRESETS,
  stepSwarm,
  SWARM_ALGORITHMS,
  SWARM_MODEL_NOTE,
  type SwarmInput,
  type SwarmState,
} from "./swarm";

const len = (x: number, y: number) => Math.hypot(x, y);

/** Snapshot just the agent kinematics (what determinism guarantees). */
function snapshot(state: SwarmState) {
  return state.agents.map((a) => ({ x: a.pos.x, y: a.pos.y, vx: a.vel.x, vy: a.vel.y }));
}

// ─────────────────────────────────────────────────────────────────────────────
// Honesty
// ─────────────────────────────────────────────────────────────────────────────

describe("honesty note", () => {
  it("states plainly it is a simulation / not a real defense system", () => {
    expect(SWARM_MODEL_NOTE).toMatch(/simulation/i);
    expect(SWARM_MODEL_NOTE).toMatch(/not a real defense system/i);
    expect(SWARM_MODEL_NOTE).toMatch(/not real robots|not real telemetry|not mission/i);
  });

  it("cites Reynolds (1987) for the flocking model", () => {
    const cited = SWARM_ALGORITHMS.map((a) => a.citation).join(" ");
    expect(cited).toMatch(/Reynolds/);
    expect(cited).toMatch(/1987/);
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// Determinism
// ─────────────────────────────────────────────────────────────────────────────

describe("determinism", () => {
  it("same seed + same stepped inputs => identical trajectories", () => {
    const cfg = { seed: 20260720, agentCount: 30, mode: "intercept" as const };
    const a = createSwarm(cfg);
    const b = createSwarm(cfg);

    // Initial layout must already match.
    expect(snapshot(a)).toEqual(snapshot(b));

    const inputAt = (i: number): SwarmInput | undefined => {
      if (i === 3) return { spawnThreat: { pos: { x: 90, y: -40 } } };
      if (i === 10) return { spawnThreats: [{ pos: { x: -80, y: 60 } }, { pos: { x: 20, y: 120 } }] };
      if (i === 25) return { mode: "defend", cohesionScale: 1.7 };
      return undefined;
    };

    for (let i = 0; i < 300; i++) {
      stepSwarm(a, 0.1, inputAt(i));
      stepSwarm(b, 0.1, inputAt(i));
    }

    expect(snapshot(a)).toEqual(snapshot(b));
    expect(a.score).toBe(b.score);
    expect(a.threats.length).toBe(b.threats.length);
    expect(a.time).toBeCloseTo(b.time, 9);
  });

  it("uses no Math.random / Date.now: a different seed diverges", () => {
    const a = createSwarm({ seed: 1, agentCount: 20 });
    const b = createSwarm({ seed: 2, agentCount: 20 });
    expect(snapshot(a)).not.toEqual(snapshot(b));
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// Boundedness / stability
// ─────────────────────────────────────────────────────────────────────────────

describe("boundedness & stability", () => {
  it("no NaN/Infinity, respects maxSpeed, stays in bounds over many steps", () => {
    const state = createSwarm(
      {
        seed: 7,
        agentCount: 50,
        mode: "intercept",
        autoSpawn: true,
        spawnInterval: 2,
        obstacles: [{ pos: { x: 40, y: 40 }, radius: 25 }],
      },
    );
    const { bounds, maxSpeed } = state.config;

    for (let i = 0; i < 1500; i++) stepSwarm(state, 0.1);

    expect(isFiniteState(state)).toBe(true);
    for (const a of state.agents) {
      // effective top speed is <= maxSpeed (energy only lowers it)
      expect(len(a.vel.x, a.vel.y)).toBeLessThanOrEqual(maxSpeed + 1e-6);
      expect(a.pos.x).toBeGreaterThanOrEqual(bounds.minX - 1e-6);
      expect(a.pos.x).toBeLessThanOrEqual(bounds.maxX + 1e-6);
      expect(a.pos.y).toBeGreaterThanOrEqual(bounds.minY - 1e-6);
      expect(a.pos.y).toBeLessThanOrEqual(bounds.maxY + 1e-6);
      expect(a.energy).toBeGreaterThanOrEqual(0);
      expect(a.energy).toBeLessThanOrEqual(1);
    }
  });

  it("agents outside the world are steered back inside", () => {
    const state = createSwarm({ seed: 3, agentCount: 12, mode: "patrol", autoSpawn: false });
    // Shove everyone hard against the +X wall / outside it.
    for (const a of state.agents) {
      a.pos = { x: state.config.bounds.maxX + 50, y: 0 };
      a.vel = { x: state.config.maxSpeed, y: 0 };
    }
    for (let i = 0; i < 200; i++) stepSwarm(state, 0.1);
    for (const a of state.agents) {
      expect(a.pos.x).toBeLessThanOrEqual(state.config.bounds.maxX + 1e-6);
    }
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// Flocking (Reynolds boids)
// ─────────────────────────────────────────────────────────────────────────────

describe("flocking (Reynolds boids)", () => {
  it("cohesion pulls a spread-out swarm together (avg pairwise distance falls)", () => {
    const state = createSwarm({
      seed: 42,
      agentCount: 25,
      mode: "patrol",
      autoSpawn: false,
      spawnRadius: 70,
      // everyone sees everyone (global cohesion target ~ centroid), no wander noise.
      cohesionRadius: 500,
      alignmentRadius: 500,
      separationRadius: 14,
      // separation must be competitive with cohesion because both steering
      // forces are direction-normalized to maxSpeed; too-weak separation lets
      // cohesion collapse the flock to a point.
      cohesionWeight: 1.3,
      separationWeight: 2.2,
      alignmentWeight: 0.8,
      wanderWeight: 0,
      homeRadius: 10_000, // no base pull; isolate pure boids
    });

    const before = state.stats.avgPairwiseDistance;
    for (let i = 0; i < 400; i++) stepSwarm(state, 0.1);
    const after = state.stats.avgPairwiseDistance;

    expect(before).toBeGreaterThan(0);
    expect(after).toBeLessThan(before * 0.8); // meaningfully tighter
    expect(state.stats.cohesion).toBeGreaterThan(0); // finite, positive
    expect(isFiniteState(state)).toBe(true);

    // Separation still keeps them apart — no collapse to a single point.
    expect(state.stats.minAgentDistance).toBeGreaterThan(1);
  });

  it("separation-dominant swarm disperses and never collapses to a point", () => {
    const state = createSwarm({
      seed: 99,
      agentCount: 25,
      mode: "patrol",
      autoSpawn: false,
      spawnRadius: 8, // start almost on top of each other
      separationRadius: 34,
      separationWeight: 3.0,
      cohesionWeight: 0.2,
      alignmentWeight: 0.4,
      wanderWeight: 0,
      homeRadius: 10_000,
    });

    const before = state.stats.avgPairwiseDistance;
    for (let i = 0; i < 400; i++) stepSwarm(state, 0.1);
    const after = state.stats.avgPairwiseDistance;

    expect(after).toBeGreaterThan(before); // pushed apart
    expect(state.stats.minAgentDistance).toBeGreaterThan(2);
    expect(isFiniteState(state)).toBe(true);
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// Task allocation + interception
// ─────────────────────────────────────────────────────────────────────────────

describe("distributed task allocation & interception", () => {
  it("agents spread across multiple threats, intercept, and raise the score", () => {
    const state = createSwarm({
      seed: 5,
      agentCount: 12,
      mode: "intercept",
      autoSpawn: false,
      sensorRadius: 400,
      threatSpeed: 5, // slow so they don't reach base before interception
      maxAgentsPerThreat: 3,
      healthPerAgent: 25,
    });

    // Three well-separated threats.
    stepSwarm(state, 0.1, {
      spawnThreats: [
        { pos: { x: 90, y: 0 }, health: 60 },
        { pos: { x: -70, y: 40 }, health: 60 },
        { pos: { x: 10, y: 90 }, health: 60 },
      ],
    });

    // After a few steps of allocation, agents should be on >= 2 distinct threats.
    for (let i = 0; i < 6; i++) stepSwarm(state, 0.1);
    expect(distinctTargets(state).length).toBeGreaterThanOrEqual(2);

    // No single threat hoards more than the whole swarm.
    const counts = new Map<number, number>();
    for (const a of state.agents) {
      if (a.target !== null) counts.set(a.target, (counts.get(a.target) ?? 0) + 1);
    }
    const maxOnOne = Math.max(...counts.values());
    expect(maxOnOne).toBeLessThan(state.agents.length);

    const scoreBefore = state.score;
    let steps = 0;
    while (state.neutralized === 0 && steps < 800) {
      stepSwarm(state, 0.1);
      steps++;
    }

    expect(state.neutralized).toBeGreaterThanOrEqual(1);
    expect(state.score).toBeGreaterThan(scoreBefore);
    expect(steps).toBeLessThan(800);
  });

  it("clears an entire wave of threats given enough time", () => {
    const state = createSwarm({
      seed: 11,
      agentCount: 30,
      mode: "intercept",
      autoSpawn: false,
      threatSpeed: 4,
      sensorRadius: 500,
    });
    stepSwarm(state, 0.1, {
      spawnThreats: [
        { pos: { x: 100, y: 20 }, health: 50 },
        { pos: { x: -90, y: -30 }, health: 50 },
        { pos: { x: 0, y: 110 }, health: 50 },
      ],
    });

    for (let i = 0; i < 1200 && state.threats.length > 0; i++) stepSwarm(state, 0.1);
    expect(state.threats.length).toBe(0);
    expect(state.neutralized).toBeGreaterThanOrEqual(3);
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// Consensus / local-only (no central controller)
// ─────────────────────────────────────────────────────────────────────────────

describe("leaderless / local-only coordination", () => {
  it("an agent does NOT claim a threat outside its sensor radius", () => {
    const state = createSwarm({
      seed: 1,
      agentCount: 1,
      mode: "intercept",
      autoSpawn: false,
      spawnRadius: 0, // single agent sits exactly at base (0,0)
      sensorRadius: 20,
    });

    // Threat far beyond the sensor: must remain unclaimed (locality).
    stepSwarm(state, 0.1, { spawnThreat: { pos: { x: 100, y: 0 }, health: 50 } });
    expect(state.agents[0].target).toBeNull();

    // Threat inside the sensor: now it is claimed — proves the decision is local.
    stepSwarm(state, 0.1, { spawnThreat: { pos: { x: 12, y: 0 }, health: 50 } });
    const claimed = state.agents[0].target;
    expect(claimed).not.toBeNull();
    // It claimed the NEAR threat, not the far one.
    const near = state.threats.find((t) => Math.hypot(t.pos.x, t.pos.y) < 30);
    expect(claimed).toBe(near?.id);
  });

  it("distributes claims across threats using per-target capacity thresholds", () => {
    const state = createSwarm({
      seed: 8,
      agentCount: 9,
      mode: "intercept",
      autoSpawn: false,
      sensorRadius: 500,
      threatSpeed: 0, // hold threats still for a clean allocation check
      maxAgentsPerThreat: 3,
      healthPerAgent: 20, // capacity = ceil(60/20)=3
    });
    stepSwarm(state, 0.1, {
      spawnThreats: [
        { pos: { x: 120, y: 0 }, health: 60 },
        { pos: { x: -120, y: 0 }, health: 60 },
        { pos: { x: 0, y: 120 }, health: 60 },
      ],
    });
    // one allocation pass
    stepSwarm(state, 0.1);
    // 9 agents, 3 threats, capacity 3 each => all three threats get claimed.
    expect(distinctTargets(state).length).toBe(3);
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// Presets & input contract
// ─────────────────────────────────────────────────────────────────────────────

describe("presets & game input", () => {
  it("ships the three documented presets", () => {
    expect(Object.keys(PRESETS)).toEqual(
      expect.arrayContaining(["tight-flock", "dispersed-patrol", "aggressive-intercept"]),
    );
  });

  it("a preset can be applied by name and overridden", () => {
    const s = createSwarm({ seed: 4, agentCount: 10 }, "aggressive-intercept");
    expect(s.mode).toBe("intercept");
    expect(s.config.maxSpeed).toBe(PRESETS["aggressive-intercept"].maxSpeed);
  });

  it("input can switch mode and spawn threats mid-game", () => {
    const s = createSwarm({ seed: 4, agentCount: 10, autoSpawn: false, mode: "patrol" });
    stepSwarm(s, 0.1, { mode: "defend", spawnThreat: { pos: { x: 50, y: 50 } } });
    expect(s.mode).toBe("defend");
    expect(s.threats.length).toBe(1);
  });

  it("a paused step does not advance the clock", () => {
    const s = createSwarm({ seed: 4, agentCount: 10 });
    const t0 = s.time;
    stepSwarm(s, 0.1, { paused: true });
    expect(s.time).toBe(t0);
  });
});
