import { describe, expect, it } from "vitest";
import { WORLDS } from "../worlds";
import { KNOWLEDGE_CARDS } from "./knowledge";
import { retrieve, scoreCard } from "./retrieve";
import { buildUserPrompt, contextBlock } from "./persona";
import { scriptedAnswer } from "./scripted";

describe("knowledge base", () => {
  it("has one card per world plus the curated app cards", () => {
    const worldCards = KNOWLEDGE_CARDS.filter((c) => c.world);
    expect(worldCards).toHaveLength(WORLDS.length);
    // Every world is represented and points at its real route.
    for (const w of WORLDS) {
      const card = KNOWLEDGE_CARDS.find((c) => c.world === w.id);
      expect(card, `card for ${w.id}`).toBeTruthy();
      expect(card?.href).toBe(w.href);
    }
  });

  it("has unique card ids", () => {
    const ids = KNOWLEDGE_CARDS.map((c) => c.id);
    expect(new Set(ids).size).toBe(ids.length);
  });

  it("reports the real world count in the count card", () => {
    const count = KNOWLEDGE_CARDS.find((c) => c.id === "count");
    expect(count?.body).toContain(String(WORLDS.length));
  });
});

describe("retrieve", () => {
  it("returns [] for an empty query", () => {
    expect(retrieve("")).toEqual([]);
    expect(retrieve("   ")).toEqual([]);
  });

  it("finds the right world by name", () => {
    const top = retrieve("tell me about galaxies")[0];
    expect(top?.world).toBe("galaxies");
  });

  it("finds a world by an alias keyword, not just its label", () => {
    // "black marble" is a keyword of Living Earth, not its label.
    const top = retrieve("where are the city lights")[0];
    expect(top?.world).toBe("living");
  });

  it("routes navigation questions to the navigate card", () => {
    const ids = retrieve("how do I get around and switch worlds").map((c) => c.id);
    expect(ids).toContain("navigate");
  });

  it("caps results at k", () => {
    expect(retrieve("earth moon mars sun galaxies", 2).length).toBeLessThanOrEqual(2);
  });

  it("scoreCard is 0 for an empty query", () => {
    expect(scoreCard("", KNOWLEDGE_CARDS[0])).toBe(0);
  });
});

describe("scriptedAnswer", () => {
  it("greets on hello without inventing facts", () => {
    const r = scriptedAnswer("hi there");
    expect(r.grounded).toBe(false);
    expect(r.text.toLowerCase()).toContain("sprocket");
  });

  it("answers a world question from grounding", () => {
    const r = scriptedAnswer("what can I see on Mars?");
    expect(r.grounded).toBe(true);
    expect(r.cards[0]?.world).toBe("mars");
    // The text is drawn from the card body, never fabricated.
    expect(r.text).toContain(r.cards[0].body.split(":")[0]);
  });

  it("admits uncertainty when nothing matches", () => {
    const r = scriptedAnswer("what is the price of bitcoin today");
    expect(r.grounded).toBe(false);
    expect(r.text.toLowerCase()).toMatch(/not sure|search/);
  });
});

describe("prompt building", () => {
  it("embeds retrieved context and the question", () => {
    const cards = retrieve("galaxies");
    const prompt = buildUserPrompt("what is the cosmic web?", cards);
    expect(prompt).toContain("CONTEXT:");
    expect(prompt).toContain("QUESTION: what is the cosmic web?");
  });

  it("contextBlock is explicit when there is no context", () => {
    expect(contextBlock([])).toContain("no matching context");
  });
});
