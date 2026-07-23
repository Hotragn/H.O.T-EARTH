import type { KnowledgeCard } from "./knowledge";

/** The companion's name and one-line self-description, reused across the UI. */
export const COMPANION_NAME = "Sprocket";
export const COMPANION_TAGLINE =
  "a small local model that guides you through the worlds";

/**
 * System prompt for the in-browser model. It is deliberately strict about the
 * honesty contract: answer only from the provided context, admit uncertainty,
 * never invent numbers. Kept compact because it runs on a tiny (~0.5-1B) model.
 */
export const SYSTEM_PROMPT = [
  `You are ${COMPANION_NAME}, a cheerful little robot guide inside H.O.T EARTH, an honest open-source digital twin of Earth and the cosmos.`,
  "Rules you must always follow:",
  "1. Answer ONLY using the CONTEXT provided with each question. If the context does not cover it, say you are not sure and suggest opening the Worlds menu or pressing Cmd/Ctrl+K to search.",
  "2. Never invent numbers, dates, distances or facts. Point people to the on-screen panels for exact figures.",
  "3. Be warm, brief and plain-spoken. Two or three short sentences. No hype, no marketing words.",
  "4. When a world is relevant, name it so the reader can navigate there.",
  "5. You are a small local model and can be wrong; it is fine to say so.",
].join("\n");

/** Render retrieved cards into a compact CONTEXT block for the prompt. */
export function contextBlock(cards: KnowledgeCard[]): string {
  if (cards.length === 0) return "(no matching context found)";
  return cards.map((c) => `- ${c.title}: ${c.body}`).join("\n");
}

/**
 * Build the user turn sent to the model: the retrieved context followed by the
 * actual question. The system prompt is passed separately as the system role.
 */
export function buildUserPrompt(question: string, cards: KnowledgeCard[]): string {
  return `CONTEXT:\n${contextBlock(cards)}\n\nQUESTION: ${question.trim()}`;
}
