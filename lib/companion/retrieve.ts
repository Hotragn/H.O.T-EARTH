import { KNOWLEDGE_CARDS, type KnowledgeCard } from "./knowledge";

/**
 * Very common words carry no retrieval signal and, worse, inflate cards whose
 * curated phrasing happens to contain them ("what is this", "how many"). We
 * drop them so scoring rests on the meaningful terms of the question.
 */
const STOPWORDS = new Set([
  "the", "a", "an", "is", "are", "was", "were", "be", "of", "to", "in", "on",
  "for", "and", "or", "i", "me", "my", "you", "your", "it", "this", "that",
  "these", "those", "what", "which", "who", "whom", "whose", "how", "do",
  "does", "did", "can", "could", "would", "should", "will", "tell", "about",
  "please", "show", "give", "see", "at", "as", "with", "today", "now", "here",
  "there", "get", "got", "have", "has", "want", "know", "am", "any", "some",
]);

function tokenize(query: string): string[] {
  return query
    .toLowerCase()
    .split(/[^a-z0-9]+/)
    .filter((t) => t.length > 1 && !STOPWORDS.has(t));
}

function words(s: string): Set<string> {
  return new Set(s.toLowerCase().split(/[^a-z0-9]+/).filter(Boolean));
}

/**
 * Score one knowledge card against a query. For each meaningful query token we
 * take the strongest signal the card offers (an exact curated term beats a word
 * in the title, which beats a word in the prose body) and sum across tokens.
 * Containment-based and deterministic, so retrieval is unit-testable and free
 * of the noise a fuzzy-subsequence match would add for unrelated questions.
 */
export function scoreCard(query: string, card: KnowledgeCard): number {
  const tokens = tokenize(query);
  if (tokens.length === 0) return 0;

  const termWords = card.terms.map((t) => ({ raw: t.toLowerCase(), words: words(t) }));
  const titleWords = words(card.title);
  const bodyWords = words(card.body);

  let total = 0;
  for (const token of tokens) {
    let best = 0;
    for (const term of termWords) {
      if (term.raw === token) best = Math.max(best, 200);
      else if (term.words.has(token)) best = Math.max(best, 120);
      else if (term.raw.includes(token)) best = Math.max(best, 70);
    }
    if (titleWords.has(token)) best = Math.max(best, 90);
    if (bodyWords.has(token)) best = Math.max(best, 35);
    total += best;
  }
  return total;
}

/**
 * Retrieve the top-k grounding cards for a query, best first. Returns [] for an
 * empty or no-match query (null-safety contract: the caller then gives a
 * generic "I'm not sure" answer rather than inventing one).
 */
export function retrieve(query: string, k = 4): KnowledgeCard[] {
  const q = query.trim();
  if (q.length === 0) return [];
  return KNOWLEDGE_CARDS.map((card) => ({ card, score: scoreCard(q, card) }))
    .filter((r) => r.score >= 35)
    .sort((a, b) => b.score - a.score)
    .slice(0, k)
    .map((r) => r.card);
}
