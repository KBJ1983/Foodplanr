/**
 * Bundle splitting for headings like "Kyllingefilet eller kalkunbryst" or
 * "Pepsi, Faxe Kondi eller Mirinda". Each variant becomes its own offer row
 * (same price/period) so ingredient matching can treat them independently.
 */

const OR_SPLIT = /\s+(?:eller|el\.|or)\s+/i;
const LIST_SPLIT = /\s*,\s*/;

export function splitBundleHeading(heading: string): string[] {
  const trimmed = heading.trim();
  if (!trimmed) return [];
  if (!OR_SPLIT.test(trimmed)) return [trimmed];

  const [head, ...rest] = trimmed.split(OR_SPLIT);
  const tail = rest.join(' eller ');
  const parts = [...(head ?? '').split(LIST_SPLIT), tail]
    .map((p) => p.trim().replace(/[,;]+$/, ''))
    .filter((p) => p.length > 0);

  // Deduplicate while keeping order.
  const seen = new Set<string>();
  const out: string[] = [];
  for (const p of parts) {
    const key = p.toLowerCase();
    if (!seen.has(key)) {
      seen.add(key);
      out.push(p);
    }
  }
  return out.length > 0 ? out : [trimmed];
}
