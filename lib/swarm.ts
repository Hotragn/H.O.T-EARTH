/**
 * swarm.ts — real-time SWARM ROBOTICS simulation engine (H.O.T "Interstellar").
 *
 * ────────────────────────────────────────────────────────────────────────────
 * HONESTY NOTE (read this).
 * This is a LIVE simulation of REAL, published swarm-robotics algorithms, run
 * every frame — it is NOT a pre-recorded animation and nothing about the
 * coordination is faked. It is an educational MODEL of how autonomous robotic
 * swarms coordinate, dressed up in an illustrative space / planetary-defense
 * GAME scenario (a swarm surveying and intercepting incoming "threats" such as
 * debris or rogue bodies approaching a base). It is NOT a real defense system,
 * NOT real robots, NOT a real mission, and NOT real telemetry. The physics here
 * is toy 2-D point-mass steering, not orbital mechanics. See SWARM_MODEL_NOTE.
 *
 * REAL ALGORITHMS IMPLEMENTED (named where they are used below):
 *  - Reynolds boids flocking — separation, alignment, cohesion, each a steering
 *    force with tunable weight + neighbourhood radius.
 *      Reynolds, C. W. (1987). "Flocks, Herds, and Schools: A Distributed
 *      Behavioral Model." Computer Graphics (SIGGRAPH '87) 21(4):25–34.
 *  - Steering behaviours — seek, arrival, obstacle avoidance, boundary contain,
 *    wander.
 *      Reynolds, C. W. (1999). "Steering Behaviors For Autonomous Characters."
 *      Game Developers Conference 1999.
 *  - Decentralized multi-robot task allocation — a local greedy "nearest
 *    available" rule with a per-target threshold/capacity so agents spread
 *    across several threats instead of mobbing one. This is the greedy /
 *    threshold family of the MRTA taxonomy.
 *      Gerkey, B. & Matarić, M. (2004). "A Formal Analysis and Taxonomy of Task
 *      Allocation in Multi-Robot Systems." Int. J. Robotics Research 23(9).
 *      Response-threshold division of labour: Bonabeau, Theraulaz &
 *      Deneubourg (1996).
 *  - Leaderless / local consensus — there is NO central controller. Every agent
 *    decides using ONLY information about neighbours / threats inside a finite
 *    radius (see `sensorRadius`, and the per-agent neighbour loops). This local
 *    interaction rule is the defining property of swarm robotics.
 *      Olfati-Saber & Murray (2004), "Consensus Problems in Networks of Agents."
 *
 * DETERMINISM: no `Math.random`, no `Date.now`, no network. All stochasticity
 * flows from a seeded PRNG (mulberry32) whose state lives inside SwarmState, so
 * the same seed + same stepped inputs reproduces the exact same trajectory.
 * Framework-free pure TypeScript; a react-three-fiber frontend renders it.
 *
 * Unit-tested in lib/swarm.test.ts.
 */

// ─────────────────────────────────────────────────────────────────────────────
// Public disclaimer string for the UI.
// ─────────────────────────────────────────────────────────────────────────────

export const SWARM_MODEL_NOTE =
  "Live simulation of real swarm-robotics algorithms — Reynolds boids flocking " +
  "(1987), decentralized greedy/threshold task allocation, and leaderless local " +
  "consensus (no central controller). It is an educational model applied to an " +
  "illustrative space-defense game, NOT a real defense system, not real robots, " +
  "and not mission telemetry. The 2-D physics is simplified point-mass steering.";

/** Machine-readable list of the real algorithms + citations, for an "about" panel. */
export const SWARM_ALGORITHMS: ReadonlyArray<{ name: string; citation: string }> = [
  {
    name: "Boids flocking (separation / alignment / cohesion)",
    citation:
      "Reynolds, C. W. (1987). Flocks, Herds, and Schools: A Distributed " +
      "Behavioral Model. SIGGRAPH '87.",
  },
  {
    name: "Steering behaviours (seek, arrival, obstacle avoidance, wander)",
    citation:
      "Reynolds, C. W. (1999). Steering Behaviors For Autonomous Characters. GDC 1999.",
  },
  {
    name: "Decentralized multi-robot task allocation (greedy + threshold)",
    citation:
      "Gerkey & Matarić (2004), A Formal Analysis and Taxonomy of Task Allocation " +
      "in Multi-Robot Systems; Bonabeau, Theraulaz & Deneubourg (1996), response " +
      "thresholds.",
  },
  {
    name: "Leaderless local consensus (finite interaction radius, no controller)",
    citation: "Olfati-Saber & Murray (2004), Consensus Problems in Networks of Agents.",
  },
];

// ─────────────────────────────────────────────────────────────────────────────
// Types
// ─────────────────────────────────────────────────────────────────────────────

export interface Vec2 {
  x: number;
  y: number;
}

export type SwarmMode = "patrol" | "defend" | "intercept";
export type ThreatKind = "debris" | "rogue" | "asteroid" | "comet";
export type AgentState = "patrol" | "return" | "seek" | "intercept" | "idle";

export interface SwarmAgent {
  id: number;
  pos: Vec2;
  vel: Vec2;
  /** id of the threat this agent has locally claimed, or null. Recomputed each step. */
  target: number | null;
  state: AgentState;
  /** 0..1 energy budget; drains with speed, regenerates near base. */
  energy: number;
  /** internal wander heading (radians) for the Reynolds wander behaviour. */
  wanderAngle: number;
}

export interface Threat {
  id: number;
  pos: Vec2;
  vel: Vec2;
  health: number;
  maxHealth: number;
  kind: ThreatKind;
  /** number of agents currently targeting this threat (recomputed each step). */
  assigned: number;
}

export interface Obstacle {
  pos: Vec2;
  radius: number;
}

export interface Bounds {
  minX: number;
  minY: number;
  maxX: number;
  maxY: number;
}

export interface SwarmStats {
  /** mean distance over all agent pairs (falls as the swarm coheres). */
  avgPairwiseDistance: number;
  /** smallest distance between any two agents (stays > 0 while separation holds). */
  minAgentDistance: number;
  /** RMS distance of agents from their centroid; lower = tighter cluster. */
  radiusOfGyration: number;
  /** convenience cohesion index 1/(1+Rg) in (0,1]; higher = tighter. */
  cohesion: number;
  avgSpeed: number;
  avgEnergy: number;
  aliveThreats: number;
  assignedAgents: number;
}

export interface SwarmConfig {
  seed: number;
  agentCount: number;
  bounds: Bounds;
  /** the object being defended / surveyed (threats home toward it). */
  base: Vec2;
  mode: SwarmMode;

  // Reynolds boids (1987)
  separationRadius: number;
  alignmentRadius: number;
  cohesionRadius: number;
  separationWeight: number;
  alignmentWeight: number;
  cohesionWeight: number;

  // steering behaviours (Reynolds 1999)
  seekWeight: number;
  avoidWeight: number;
  wanderWeight: number;
  boundaryMargin: number;
  boundaryWeight: number;
  arrivalRadius: number;
  maxSpeed: number;
  maxForce: number;

  // sensing / task allocation
  sensorRadius: number;
  interceptRadius: number;
  damageRate: number;
  maxAgentsPerThreat: number;
  /** capacity of a threat = clamp(ceil(health / this), 1, maxAgentsPerThreat). */
  healthPerAgent: number;
  homeRadius: number;
  defendRadius: number;
  baseRadius: number;

  // threat spawning / waves
  autoSpawn: boolean;
  spawnInterval: number;
  threatsPerWave: number;
  maxConcurrentThreats: number;
  threatSpeed: number;
  threatHealth: number;

  // agents / energy
  spawnRadius: number;
  energyDrain: number;
  energyRegen: number;

  obstacles: Obstacle[];
  obstacleMargin: number;
}

export interface SwarmState {
  config: SwarmConfig;
  agents: SwarmAgent[];
  threats: Threat[];
  mode: SwarmMode;
  score: number;
  wave: number;
  time: number;
  neutralized: number;
  breaches: number;
  stats: SwarmStats;
  /** mulberry32 PRNG state (integer). The ONLY source of randomness. */
  rng: number;
  nextAgentId: number;
  nextThreatId: number;
  spawnTimer: number;
  /** live multipliers driven by player input (e.g. a cohesion slider). */
  weightScale: { cohesion: number; separation: number; alignment: number };
}

export interface SpawnThreatCommand {
  pos: Vec2;
  vel?: Vec2;
  kind?: ThreatKind;
  health?: number;
}

/** Player / frontend command applied at the top of a step (the GAME input contract). */
export interface SwarmInput {
  /** switch global behaviour mode. */
  mode?: SwarmMode;
  /** if true, this step advances nothing (stats still refresh). */
  paused?: boolean;
  /** spawn a threat at a point (e.g. where the player clicked). */
  spawnThreat?: SpawnThreatCommand;
  /** spawn several threats at once. */
  spawnThreats?: SpawnThreatCommand[];
  /** multiply the cohesion weight (a "flock tightness" slider). */
  cohesionScale?: number;
  /** multiply the separation weight. */
  separationScale?: number;
  /** multiply the alignment weight. */
  alignmentScale?: number;
}

// ─────────────────────────────────────────────────────────────────────────────
// Seeded PRNG — mulberry32. Deterministic; state stored on SwarmState.rng.
// ─────────────────────────────────────────────────────────────────────────────

/** Advance the PRNG and return a float in [0, 1). Mutates state.rng. */
function rand(state: SwarmState): number {
  let a = state.rng | 0;
  a = (a + 0x6d2b79f5) | 0;
  state.rng = a;
  let t = Math.imul(a ^ (a >>> 15), 1 | a);
  t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
  return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
}

/** Uniform float in [lo, hi). */
function randRange(state: SwarmState, lo: number, hi: number): number {
  return lo + (hi - lo) * rand(state);
}

// ─────────────────────────────────────────────────────────────────────────────
// Small vector helpers (pure; never return NaN).
// ─────────────────────────────────────────────────────────────────────────────

const EPS = 1e-9;

const v = (x: number, y: number): Vec2 => ({ x, y });
const add = (a: Vec2, b: Vec2): Vec2 => ({ x: a.x + b.x, y: a.y + b.y });
const sub = (a: Vec2, b: Vec2): Vec2 => ({ x: a.x - b.x, y: a.y - b.y });
const scale = (a: Vec2, s: number): Vec2 => ({ x: a.x * s, y: a.y * s });
const len = (a: Vec2): number => Math.hypot(a.x, a.y);
const dist = (a: Vec2, b: Vec2): number => Math.hypot(a.x - b.x, a.y - b.y);

/** Unit vector; returns {0,0} for a (near-)zero input so we never divide by ~0. */
function norm(a: Vec2): Vec2 {
  const l = Math.hypot(a.x, a.y);
  if (l < EPS) return { x: 0, y: 0 };
  return { x: a.x / l, y: a.y / l };
}

/** Clamp a vector's magnitude to `max`. */
function limit(a: Vec2, max: number): Vec2 {
  const l = Math.hypot(a.x, a.y);
  if (l <= max || l < EPS) return a;
  const s = max / l;
  return { x: a.x * s, y: a.y * s };
}

const clamp = (x: number, lo: number, hi: number): number =>
  x < lo ? lo : x > hi ? hi : x;

// ─────────────────────────────────────────────────────────────────────────────
// Defaults & presets
// ─────────────────────────────────────────────────────────────────────────────

export const DEFAULT_CONFIG: SwarmConfig = {
  seed: 1,
  agentCount: 40,
  bounds: { minX: -200, minY: -200, maxX: 200, maxY: 200 },
  base: { x: 0, y: 0 },
  mode: "patrol",

  separationRadius: 16,
  alignmentRadius: 34,
  cohesionRadius: 46,
  separationWeight: 1.7,
  alignmentWeight: 1.0,
  cohesionWeight: 1.0,

  seekWeight: 1.8,
  avoidWeight: 2.4,
  wanderWeight: 0.6,
  boundaryMargin: 32,
  boundaryWeight: 2.6,
  arrivalRadius: 34,
  maxSpeed: 60,
  maxForce: 220,

  sensorRadius: 260,
  interceptRadius: 12,
  damageRate: 55,
  maxAgentsPerThreat: 6,
  healthPerAgent: 40,
  homeRadius: 90,
  defendRadius: 130,
  baseRadius: 8,

  autoSpawn: true,
  spawnInterval: 4,
  threatsPerWave: 2,
  maxConcurrentThreats: 6,
  threatSpeed: 22,
  threatHealth: 100,

  spawnRadius: 60,
  energyDrain: 0.02,
  energyRegen: 0.15,

  obstacles: [],
  obstacleMargin: 22,
};

/**
 * Tunable presets so the UI has good defaults. Each is a partial config merged
 * over DEFAULT_CONFIG by `createSwarm`.
 */
export const PRESETS: Record<string, Partial<SwarmConfig>> = {
  // A dense, strongly-cohering flock that loiters near the base and patrols.
  "tight-flock": {
    mode: "patrol",
    cohesionWeight: 1.8,
    alignmentWeight: 1.3,
    separationWeight: 1.3,
    cohesionRadius: 70,
    alignmentRadius: 55,
    wanderWeight: 0.35,
    maxSpeed: 46,
  },
  // A spread-out sensor net: separation dominant, weak cohesion, roams wide.
  "dispersed-patrol": {
    mode: "patrol",
    cohesionWeight: 0.35,
    alignmentWeight: 0.6,
    separationWeight: 2.6,
    separationRadius: 30,
    wanderWeight: 1.1,
    homeRadius: 150,
    maxSpeed: 52,
  },
  // Fast, goal-driven interceptors that fan out onto multiple threats.
  "aggressive-intercept": {
    mode: "intercept",
    seekWeight: 2.6,
    cohesionWeight: 0.6,
    separationWeight: 1.4,
    maxSpeed: 82,
    maxForce: 300,
    damageRate: 70,
    maxAgentsPerThreat: 4,
  },
};

// ─────────────────────────────────────────────────────────────────────────────
// Construction
// ─────────────────────────────────────────────────────────────────────────────

function resolveConfig(partial: Partial<SwarmConfig>): SwarmConfig {
  return {
    ...DEFAULT_CONFIG,
    ...partial,
    bounds: { ...DEFAULT_CONFIG.bounds, ...(partial.bounds ?? {}) },
    base: { ...DEFAULT_CONFIG.base, ...(partial.base ?? {}) },
    obstacles: (partial.obstacles ?? DEFAULT_CONFIG.obstacles).map((o) => ({
      pos: { ...o.pos },
      radius: o.radius,
    })),
  };
}

function emptyStats(): SwarmStats {
  return {
    avgPairwiseDistance: 0,
    minAgentDistance: 0,
    radiusOfGyration: 0,
    cohesion: 1,
    avgSpeed: 0,
    avgEnergy: 1,
    aliveThreats: 0,
    assignedAgents: 0,
  };
}

/**
 * Build a fresh, deterministic swarm. Pass a preset name and/or config overrides.
 * The seed fully determines the initial layout and all future randomness.
 */
export function createSwarm(
  config: Partial<SwarmConfig> = {},
  preset?: keyof typeof PRESETS | string,
): SwarmState {
  const presetCfg = preset && PRESETS[preset] ? PRESETS[preset] : {};
  const cfg = resolveConfig({ ...presetCfg, ...config });

  const state: SwarmState = {
    config: cfg,
    agents: [],
    threats: [],
    mode: cfg.mode,
    score: 0,
    wave: 0,
    time: 0,
    neutralized: 0,
    breaches: 0,
    stats: emptyStats(),
    rng: cfg.seed | 0,
    nextAgentId: 0,
    nextThreatId: 0,
    spawnTimer: 0,
    weightScale: { cohesion: 1, separation: 1, alignment: 1 },
  };

  // Spawn agents uniformly in a disk around the base (sqrt for area-uniformity).
  for (let i = 0; i < cfg.agentCount; i++) {
    const angle = randRange(state, 0, Math.PI * 2);
    const r = cfg.spawnRadius * Math.sqrt(rand(state));
    const heading = randRange(state, 0, Math.PI * 2);
    const speed = randRange(state, 0, cfg.maxSpeed * 0.3);
    state.agents.push({
      id: state.nextAgentId++,
      pos: { x: cfg.base.x + Math.cos(angle) * r, y: cfg.base.y + Math.sin(angle) * r },
      vel: { x: Math.cos(heading) * speed, y: Math.sin(heading) * speed },
      target: null,
      state: "patrol",
      energy: 1,
      wanderAngle: randRange(state, 0, Math.PI * 2),
    });
  }

  recomputeStats(state);
  return state;
}

/** Spawn one threat at an explicit position (used by player input). */
function spawnThreatAt(state: SwarmState, cmd: SpawnThreatCommand): Threat {
  const cfg = state.config;
  const kind = cmd.kind ?? "debris";
  const health = cmd.health ?? cfg.threatHealth;
  const vel = cmd.vel ?? scale(norm(sub(cfg.base, cmd.pos)), cfg.threatSpeed);
  const threat: Threat = {
    id: state.nextThreatId++,
    pos: { x: cmd.pos.x, y: cmd.pos.y },
    vel: { x: vel.x, y: vel.y },
    health,
    maxHealth: health,
    kind,
    assigned: 0,
  };
  state.threats.push(threat);
  return threat;
}

/** Spawn a threat from a random point on the arena perimeter, homing to base. */
function spawnThreatFromEdge(state: SwarmState): void {
  const cfg = state.config;
  const half = Math.min(
    (cfg.bounds.maxX - cfg.bounds.minX) / 2,
    (cfg.bounds.maxY - cfg.bounds.minY) / 2,
  );
  const angle = randRange(state, 0, Math.PI * 2);
  const r = half * 0.92;
  const pos = v(
    clamp(cfg.base.x + Math.cos(angle) * r, cfg.bounds.minX, cfg.bounds.maxX),
    clamp(cfg.base.y + Math.sin(angle) * r, cfg.bounds.minY, cfg.bounds.maxY),
  );
  const kinds: ThreatKind[] = ["debris", "rogue", "asteroid", "comet"];
  const kind = kinds[Math.floor(rand(state) * kinds.length)] ?? "debris";
  const healthMul = kind === "asteroid" ? 1.6 : kind === "comet" ? 0.7 : 1;
  spawnThreatAt(state, { pos, kind, health: cfg.threatHealth * healthMul });
}

// ─────────────────────────────────────────────────────────────────────────────
// Step
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Advance the simulation by `dt` seconds. Mutates and returns `state` (the same
 * object) so a frontend can keep one reference. Deterministic for a given seed +
 * identical `dt`/`input` sequence.
 */
export function stepSwarm(state: SwarmState, dt: number, input?: SwarmInput): SwarmState {
  if (input) applyInput(state, input);
  if (input?.paused || dt <= 0) {
    recomputeStats(state);
    return state;
  }

  const cfg = state.config;

  // 1. Waves — spawn threats deterministically over time (skip if autoSpawn off).
  if (cfg.autoSpawn) advanceSpawning(state, dt);

  // 2. Threats home toward the base (simple constant-speed pursuit of the base).
  for (const th of state.threats) {
    th.vel = scale(norm(sub(cfg.base, th.pos)), cfg.threatSpeed);
    th.pos = add(th.pos, scale(th.vel, dt));
  }

  // 3. Decentralized task allocation — each agent locally claims a threat.
  allocate(state);

  // Build a threat lookup once for the force / interception passes.
  const threatById = new Map<number, Threat>();
  for (const th of state.threats) threatById.set(th.id, th);

  // 4. Compute steering for every agent (boids + seek + avoid + wander), then
  //    integrate. Consensus/local-only: each agent reads only neighbours and
  //    threats inside finite radii — there is no central controller.
  for (let i = 0; i < state.agents.length; i++) {
    const agent = state.agents[i];
    const force = computeSteering(state, agent, i, threatById);

    // accel = force (mass 1); semi-implicit Euler.
    const limited = limit(force, cfg.maxForce);
    agent.vel = add(agent.vel, scale(limited, dt));

    // energy scales the usable top speed but never exceeds maxSpeed.
    const effMax = cfg.maxSpeed * (0.5 + 0.5 * agent.energy);
    agent.vel = limit(agent.vel, effMax);

    agent.pos = add(agent.pos, scale(agent.vel, dt));

    // Hard wall as a safety net so an agent can never leave the arena; the
    // boundary steering force above turns them around before they hit it.
    if (agent.pos.x < cfg.bounds.minX) {
      agent.pos.x = cfg.bounds.minX;
      if (agent.vel.x < 0) agent.vel.x = 0;
    } else if (agent.pos.x > cfg.bounds.maxX) {
      agent.pos.x = cfg.bounds.maxX;
      if (agent.vel.x > 0) agent.vel.x = 0;
    }
    if (agent.pos.y < cfg.bounds.minY) {
      agent.pos.y = cfg.bounds.minY;
      if (agent.vel.y < 0) agent.vel.y = 0;
    } else if (agent.pos.y > cfg.bounds.maxY) {
      agent.pos.y = cfg.bounds.maxY;
      if (agent.vel.y > 0) agent.vel.y = 0;
    }

    // Energy: drains with motion, regenerates when loitering near base.
    const speed = len(agent.vel);
    agent.energy -= cfg.energyDrain * (0.25 + speed / cfg.maxSpeed) * dt;
    if (dist(agent.pos, cfg.base) < cfg.homeRadius) {
      agent.energy += cfg.energyRegen * dt;
    }
    agent.energy = clamp(agent.energy, 0, 1);
  }

  // 5. Interceptions — an agent within interceptRadius of its claimed threat
  //    damages it; dead threats are neutralized and score the swarm.
  resolveInterceptions(state, dt, threatById);

  // 6. Threats that reach the base breach it (removed; small score penalty).
  handleBaseHits(state);

  // 7. Metrics + clock.
  recomputeStats(state);
  state.time += dt;
  return state;
}

function applyInput(state: SwarmState, input: SwarmInput): void {
  if (input.mode) state.mode = input.mode;
  if (typeof input.cohesionScale === "number") {
    state.weightScale.cohesion = Math.max(0, input.cohesionScale);
  }
  if (typeof input.separationScale === "number") {
    state.weightScale.separation = Math.max(0, input.separationScale);
  }
  if (typeof input.alignmentScale === "number") {
    state.weightScale.alignment = Math.max(0, input.alignmentScale);
  }
  if (input.spawnThreat) spawnThreatAt(state, input.spawnThreat);
  if (input.spawnThreats) for (const c of input.spawnThreats) spawnThreatAt(state, c);
}

function advanceSpawning(state: SwarmState, dt: number): void {
  const cfg = state.config;
  state.spawnTimer += dt;
  if (state.spawnTimer < cfg.spawnInterval) return;
  state.spawnTimer -= cfg.spawnInterval;
  if (state.threats.length >= cfg.maxConcurrentThreats) return;
  state.wave++;
  const room = cfg.maxConcurrentThreats - state.threats.length;
  const n = Math.min(cfg.threatsPerWave, room);
  for (let i = 0; i < n; i++) spawnThreatFromEdge(state);
}

// ─────────────────────────────────────────────────────────────────────────────
// Decentralized task allocation (greedy nearest-available + per-target threshold)
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Each agent independently picks the NEAREST threat it can sense whose current
 * claim count is below that threat's capacity (a threshold). If every sensed
 * threat is already at capacity it falls back to the nearest sensed threat
 * (overflow). If nothing is in sensor range, it stays unassigned (target=null)
 * — the locality guarantee.
 *
 * Agents are processed in a stable id order and each increments the claim count
 * it takes, so later agents see earlier claims. This is a sequential-greedy
 * approximation of a decentralized auction / response-threshold division of
 * labour — no central solver computes a global optimum.
 */
function allocate(state: SwarmState): void {
  const cfg = state.config;

  for (const th of state.threats) th.assigned = 0;

  const capacity = new Map<number, number>();
  for (const th of state.threats) {
    capacity.set(
      th.id,
      clamp(Math.ceil(th.health / cfg.healthPerAgent), 1, cfg.maxAgentsPerThreat),
    );
  }

  for (const agent of state.agents) {
    let nearest: Threat | null = null;
    let nearestD = Infinity;
    let nearestUnder: Threat | null = null;
    let nearestUnderD = Infinity;

    for (const th of state.threats) {
      const d = dist(agent.pos, th.pos);
      if (d > cfg.sensorRadius) continue; // LOCAL perception only
      if (d < nearestD) {
        nearestD = d;
        nearest = th;
      }
      const cap = capacity.get(th.id) ?? 1;
      if (th.assigned < cap && d < nearestUnderD) {
        nearestUnderD = d;
        nearestUnder = th;
      }
    }

    const chosen = nearestUnder ?? nearest;
    if (chosen) {
      agent.target = chosen.id;
      chosen.assigned++;
    } else {
      agent.target = null;
    }
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// Steering (Reynolds boids 1987 + steering behaviours 1999)
// ─────────────────────────────────────────────────────────────────────────────

/** Steering vector that drives velocity toward `desiredVel` (desired - current). */
function steerTo(agent: SwarmAgent, desiredVel: Vec2): Vec2 {
  return { x: desiredVel.x - agent.vel.x, y: desiredVel.y - agent.vel.y };
}

function computeSteering(
  state: SwarmState,
  agent: SwarmAgent,
  index: number,
  threatById: Map<number, Threat>,
): Vec2 {
  const cfg = state.config;
  const agents = state.agents;
  const ws = state.weightScale;

  // ── Boids neighbour scan: separation, alignment, cohesion (Reynolds 1987) ──
  let sepX = 0,
    sepY = 0,
    sepN = 0;
  let aliX = 0,
    aliY = 0,
    aliN = 0;
  let cohX = 0,
    cohY = 0,
    cohN = 0;

  for (let j = 0; j < agents.length; j++) {
    if (j === index) continue;
    const o = agents[j];
    const dx = agent.pos.x - o.pos.x;
    const dy = agent.pos.y - o.pos.y;
    const d = Math.hypot(dx, dy);

    if (d < cfg.separationRadius) {
      if (d > EPS) {
        // push away, weighted by 1/d so closer neighbours push harder.
        const w = 1 / d;
        sepX += (dx / d) * w;
        sepY += (dy / d) * w;
      } else {
        // exact overlap: deterministic golden-angle jitter (no PRNG in hot loop).
        const a = index * 2.399963229728653;
        sepX += Math.cos(a);
        sepY += Math.sin(a);
      }
      sepN++;
    }
    if (d < cfg.alignmentRadius) {
      aliX += o.vel.x;
      aliY += o.vel.y;
      aliN++;
    }
    if (d < cfg.cohesionRadius) {
      cohX += o.pos.x;
      cohY += o.pos.y;
      cohN++;
    }
  }

  let fx = 0;
  let fy = 0;

  if (sepN > 0) {
    const desired = scale(norm({ x: sepX, y: sepY }), cfg.maxSpeed);
    const s = steerTo(agent, desired);
    const w = cfg.separationWeight * ws.separation;
    fx += s.x * w;
    fy += s.y * w;
  }
  if (aliN > 0) {
    const desired = scale(norm({ x: aliX / aliN, y: aliY / aliN }), cfg.maxSpeed);
    const s = steerTo(agent, desired);
    const w = cfg.alignmentWeight * ws.alignment;
    fx += s.x * w;
    fy += s.y * w;
  }
  if (cohN > 0) {
    const center = { x: cohX / cohN, y: cohY / cohN };
    const desired = scale(norm(sub(center, agent.pos)), cfg.maxSpeed);
    const s = steerTo(agent, desired);
    const w = cfg.cohesionWeight * ws.cohesion;
    fx += s.x * w;
    fy += s.y * w;
  }

  // ── Goal seeking with arrival (Reynolds 1999) ──
  const seekPoint = pickSeekPoint(state, agent, threatById);
  if (seekPoint) {
    const toGoal = sub(seekPoint, agent.pos);
    const d = len(toGoal);
    let speed = cfg.maxSpeed;
    if (d < cfg.arrivalRadius) speed = cfg.maxSpeed * (d / cfg.arrivalRadius); // decelerate in
    const desired = scale(norm(toGoal), speed);
    const s = steerTo(agent, desired);
    fx += s.x * cfg.seekWeight;
    fy += s.y * cfg.seekWeight;
    agent.state = agent.target !== null ? "seek" : "return";
  } else {
    agent.state = state.mode === "patrol" ? "patrol" : "idle";
  }

  // ── Obstacle avoidance (Reynolds 1999) ──
  for (const obs of cfg.obstacles) {
    const away = sub(agent.pos, obs.pos);
    const d = len(away);
    const zone = obs.radius + cfg.obstacleMargin;
    if (d < zone) {
      const strength = 1 - d / zone; // stronger the deeper you are
      const desired = scale(norm(away), cfg.maxSpeed);
      const s = steerTo(agent, desired);
      const w = cfg.avoidWeight * (0.5 + strength);
      fx += s.x * w;
      fy += s.y * w;
    }
  }

  // ── Boundary containment (steer back inward before the hard wall) ──
  let bx = 0;
  let by = 0;
  const m = cfg.boundaryMargin;
  if (agent.pos.x < cfg.bounds.minX + m) bx = 1;
  else if (agent.pos.x > cfg.bounds.maxX - m) bx = -1;
  if (agent.pos.y < cfg.bounds.minY + m) by = 1;
  else if (agent.pos.y > cfg.bounds.maxY - m) by = -1;
  if (bx !== 0 || by !== 0) {
    const desired = scale(norm({ x: bx, y: by }), cfg.maxSpeed);
    const s = steerTo(agent, desired);
    fx += s.x * cfg.boundaryWeight;
    fy += s.y * cfg.boundaryWeight;
  }

  // ── Wander (Reynolds 1999): smooth random-walk heading, only when idle-ish ──
  if (cfg.wanderWeight > 0 && !seekPoint) {
    agent.wanderAngle += randRange(state, -0.5, 0.5);
    const desired = scale(v(Math.cos(agent.wanderAngle), Math.sin(agent.wanderAngle)), cfg.maxSpeed);
    const s = steerTo(agent, desired);
    fx += s.x * cfg.wanderWeight;
    fy += s.y * cfg.wanderWeight;
  }

  return { x: fx, y: fy };
}

/**
 * Where should this agent steer as its goal?
 *  - intercept mode: chase the claimed threat anywhere in sensor range.
 *  - defend mode: chase the claimed threat only once it enters the defend ring,
 *    otherwise hold station near base.
 *  - patrol mode: ignore threats; only pull home if it has wandered too far.
 */
function pickSeekPoint(
  state: SwarmState,
  agent: SwarmAgent,
  threatById: Map<number, Threat>,
): Vec2 | null {
  const cfg = state.config;
  const th = agent.target !== null ? threatById.get(agent.target) : undefined;

  if (th) {
    if (state.mode === "intercept") return th.pos;
    if (state.mode === "defend" && dist(th.pos, cfg.base) <= cfg.defendRadius) return th.pos;
  }

  // No active pursuit: return toward base if we have strayed beyond the ring.
  if (dist(agent.pos, cfg.base) > cfg.homeRadius) return cfg.base;
  return null;
}

// ─────────────────────────────────────────────────────────────────────────────
// Interception & base breaches
// ─────────────────────────────────────────────────────────────────────────────

function resolveInterceptions(
  state: SwarmState,
  dt: number,
  threatById: Map<number, Threat>,
): void {
  const cfg = state.config;

  for (const agent of state.agents) {
    if (agent.target === null) continue;
    const th = threatById.get(agent.target);
    if (!th) {
      agent.target = null;
      continue;
    }
    if (dist(agent.pos, th.pos) <= cfg.interceptRadius) {
      th.health -= cfg.damageRate * dt;
      agent.state = "intercept";
    }
  }

  if (state.threats.length === 0) return;

  const survivors: Threat[] = [];
  for (const th of state.threats) {
    if (th.health <= 0) {
      state.neutralized++;
      state.score += 100 + Math.round(th.maxHealth / 2);
      for (const a of state.agents) if (a.target === th.id) a.target = null;
    } else {
      survivors.push(th);
    }
  }
  state.threats = survivors;
}

function handleBaseHits(state: SwarmState): void {
  const cfg = state.config;
  if (state.threats.length === 0) return;
  const survivors: Threat[] = [];
  for (const th of state.threats) {
    if (dist(th.pos, cfg.base) <= cfg.baseRadius) {
      state.breaches++;
      state.score = Math.max(0, state.score - 50);
      for (const a of state.agents) if (a.target === th.id) a.target = null;
    } else {
      survivors.push(th);
    }
  }
  state.threats = survivors;
}

// ─────────────────────────────────────────────────────────────────────────────
// Metrics
// ─────────────────────────────────────────────────────────────────────────────

function recomputeStats(state: SwarmState): void {
  const agents = state.agents;
  const n = agents.length;

  let speedSum = 0;
  let energySum = 0;
  let cx = 0;
  let cy = 0;
  for (const a of agents) {
    speedSum += len(a.vel);
    energySum += a.energy;
    cx += a.pos.x;
    cy += a.pos.y;
  }

  let avgPair = 0;
  let minD = 0;
  let rg = 0;
  if (n >= 2) {
    cx /= n;
    cy /= n;
    let pairSum = 0;
    let pairs = 0;
    let smallest = Infinity;
    let sqSum = 0;
    for (let i = 0; i < n; i++) {
      const dxc = agents[i].pos.x - cx;
      const dyc = agents[i].pos.y - cy;
      sqSum += dxc * dxc + dyc * dyc;
      for (let j = i + 1; j < n; j++) {
        const d = dist(agents[i].pos, agents[j].pos);
        pairSum += d;
        pairs++;
        if (d < smallest) smallest = d;
      }
    }
    avgPair = pairs > 0 ? pairSum / pairs : 0;
    minD = smallest === Infinity ? 0 : smallest;
    rg = Math.sqrt(sqSum / n);
  }

  let assigned = 0;
  for (const a of agents) if (a.target !== null) assigned++;

  state.stats = {
    avgPairwiseDistance: avgPair,
    minAgentDistance: minD,
    radiusOfGyration: rg,
    cohesion: 1 / (1 + rg),
    avgSpeed: n > 0 ? speedSum / n : 0,
    avgEnergy: n > 0 ? energySum / n : 1,
    aliveThreats: state.threats.length,
    assignedAgents: assigned,
  };
}

// ─────────────────────────────────────────────────────────────────────────────
// Small read-only helpers a frontend / tests may want.
// ─────────────────────────────────────────────────────────────────────────────

/** Distinct threat ids currently claimed by at least one agent. */
export function distinctTargets(state: SwarmState): number[] {
  const set = new Set<number>();
  for (const a of state.agents) if (a.target !== null) set.add(a.target);
  return [...set];
}

/** True iff every finite check passes for all agents/threats (no NaN/Infinity). */
export function isFiniteState(state: SwarmState): boolean {
  const ok = (x: number) => Number.isFinite(x);
  for (const a of state.agents) {
    if (!ok(a.pos.x) || !ok(a.pos.y) || !ok(a.vel.x) || !ok(a.vel.y) || !ok(a.energy)) {
      return false;
    }
  }
  for (const t of state.threats) {
    if (!ok(t.pos.x) || !ok(t.pos.y) || !ok(t.vel.x) || !ok(t.vel.y) || !ok(t.health)) {
      return false;
    }
  }
  return true;
}
