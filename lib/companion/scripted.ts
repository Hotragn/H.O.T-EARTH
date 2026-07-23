import { COMPANION_NAME } from "./persona";
import { retrieve } from "./retrieve";
import type { KnowledgeCard } from "./knowledge";

export interface ScriptedReply {
  text: string;
  /** Cards backing the answer, so the UI can offer navigation chips. */
  cards: KnowledgeCard[];
  /** True when we found real grounding; false for the generic "not sure". */
  grounded: boolean;
}

const GREETING =
  `Hi, I'm ${COMPANION_NAME}. Ask me about any of the worlds here, or how to get around. I run locally in your browser and answer only from this app's own data, so I keep it honest.`;

function isGreeting(q: string): boolean {
  return /^\s*(hi|hey|hello|yo|sup|howdy|greetings)\b/i.test(q);
}

/**
 * A deterministic, model-free answer built straight from the knowledge base.
 * This is both the pre-download experience and the fallback wherever WebGPU is
 * unavailable, so it must never fabricate: it only ever echoes retrieved cards.
 */
export function scriptedAnswer(question: string): ScriptedReply {
  const q = question.trim();
  if (q.length === 0 || isGreeting(q)) {
    return { text: GREETING, cards: [], grounded: false };
  }

  const cards = retrieve(q, 3);
  if (cards.length === 0) {
    return {
      text: "I'm not sure about that one. Try the Worlds grid or press Cmd/Ctrl+K to search all worlds, and I'll point you the right way.",
      cards: [],
      grounded: false,
    };
  }

  // Lead with the strongest card, then add at most one supporting line.
  const [lead, ...rest] = cards;
  const support = rest.find((c) => c.body !== lead.body);
  const text = support ? `${lead.body} ${support.body}` : lead.body;
  return { text, cards, grounded: true };
}
