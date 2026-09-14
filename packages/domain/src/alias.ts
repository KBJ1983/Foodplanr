/**
 * Pass 2 normalisation — alias rules: offer heading → ingredient id.
 *
 * Rules are ordered; the first match wins, so put specific patterns before
 * general ones ("hakkede tomater" before "tomater"). Rule-based matches carry a
 * fixed confidence; anything below the engine's threshold goes to the admin
 * queue instead of into prices. The LLM pass (pass 3) only sees the heading
 * and quantity of *unmatched* offers.
 */
export interface AliasRule {
  pattern: RegExp;
  ingredientId: string;
  /** 0..1, default 0.85 for hand-written rules. */
  confidence?: number;
}

export interface AliasMatch {
  ingredientId: string;
  confidence: number;
  /** Which rule matched (for the admin queue). */
  ruleIndex: number;
}

export const DEFAULT_RULE_CONFIDENCE = 0.85;

/** Lower-case, collapse whitespace, strip punctuation that never carries meaning. */
export function normalizeHeading(heading: string): string {
  return heading
    .toLowerCase()
    .replace(/[®™*]/g, '')
    .replace(/\s+/g, ' ')
    .trim();
}

export function matchHeading(heading: string, rules: readonly AliasRule[]): AliasMatch | null {
  const h = normalizeHeading(heading);
  for (let i = 0; i < rules.length; i++) {
    const r = rules[i]!;
    if (r.pattern.test(h)) return { ingredientId: r.ingredientId, confidence: r.confidence ?? DEFAULT_RULE_CONFIDENCE, ruleIndex: i };
  }
  return null;
}

/** Build a rule from plain keywords (word-boundary, case-insensitive). Danish letters are word chars here. */
export function rule(ingredientId: string, keywords: readonly string[], opts: { exclude?: readonly string[]; confidence?: number } = {}): AliasRule {
  const esc = (s: string) => s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  const words = keywords.map(esc).join('|');
  const excl = opts.exclude?.length ? `(?!.*(?:${opts.exclude.map(esc).join('|')}))` : '';
  const pattern = new RegExp(`^${excl}.*(?<![a-zæøå])(?:${words})`, 'i');
  const out: AliasRule = { pattern, ingredientId };
  if (opts.confidence !== undefined) out.confidence = opts.confidence;
  return out;
}
