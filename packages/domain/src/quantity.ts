/**
 * Pass 1 normalisation — rules only, no external lookups.
 *
 *   quantity → size_min/size_max (base unit), pieces, unit_price_dkk, unit_price_kind
 *
 * Unit price is DKK per kg or per litre when a size is known, DKK per piece
 * when only a piece count is known, otherwise null.
 */
import type { NormalizedQuantity, RawQuantity, SizeUnit } from './types.js';
import { round4, toBaseAmount } from './units.js';

const NUMBER = String.raw`(\d+(?:[.,]\d+)?)`;
const UNIT = String.raw`(kg|g|gr|mg|ml|cl|dl|l|ltr|stk|pcs|pk)`;

// "2 x 400 g", "2x400g", "3 × 1 l"
const RE_MULTI = new RegExp(`(\\d+)\\s*[x×]\\s*${NUMBER}\\s*${UNIT}\\b`, 'i');
// "400-500 g", "400/500 g"
const RE_RANGE = new RegExp(`${NUMBER}\\s*[-–/]\\s*${NUMBER}\\s*${UNIT}\\b`, 'i');
// "500 g", "0,5 l", "1 kg"
const RE_SINGLE = new RegExp(`(?<![\\d,.])${NUMBER}\\s*${UNIT}\\b`, 'i');

function num(s: string): number {
  return Number(s.replace(',', '.'));
}

/**
 * Fallback for sources that put the amount in the product name only.
 * Returns null when nothing recognisable is found.
 */
export function parseQuantityFromHeading(heading: string): RawQuantity | null {
  const multi = RE_MULTI.exec(heading);
  if (multi) {
    return {
      piecesFrom: Number(multi[1]),
      piecesTo: Number(multi[1]),
      sizeFrom: num(multi[2]!),
      sizeTo: num(multi[2]!),
      unit: multi[3]!,
    };
  }
  const range = RE_RANGE.exec(heading);
  if (range) {
    const a = num(range[1]!);
    const b = num(range[2]!);
    return { sizeFrom: Math.min(a, b), sizeTo: Math.max(a, b), unit: range[3]!, piecesFrom: 1, piecesTo: 1 };
  }
  const single = RE_SINGLE.exec(heading);
  if (single) {
    const v = num(single[1]!);
    return { sizeFrom: v, sizeTo: v, unit: single[2]!, piecesFrom: 1, piecesTo: 1 };
  }
  return null;
}

function unitPriceDenominator(unit: SizeUnit, amount: number): number {
  // g → kg, ml → l, pcs → pcs
  return unit === 'pcs' ? amount : amount / 1000;
}

export function normalizeQuantity(price: number, q: RawQuantity | null | undefined): NormalizedQuantity {
  const empty: NormalizedQuantity = {
    sizeMin: null,
    sizeMax: null,
    sizeUnit: null,
    pieces: null,
    unitPriceDkk: null,
    unitPriceKind: 'unknown',
  };
  if (!q || !Number.isFinite(price) || price <= 0) return empty;

  const piecesFrom = q.piecesFrom ?? q.piecesTo ?? null;
  const piecesTo = q.piecesTo ?? q.piecesFrom ?? null;
  const pieces = piecesTo && piecesTo > 0 ? piecesTo : piecesFrom && piecesFrom > 0 ? piecesFrom : null;

  const sizeFrom = q.sizeFrom ?? q.sizeTo ?? null;
  const sizeTo = q.sizeTo ?? q.sizeFrom ?? null;

  if (sizeFrom !== null && sizeTo !== null && sizeFrom > 0 && sizeTo > 0) {
    const si = { unit: q.siUnit, factor: q.siFactor };
    const from = toBaseAmount(Math.min(sizeFrom, sizeTo), q.unit, si);
    const to = toBaseAmount(Math.max(sizeFrom, sizeTo), q.unit, si);
    if (from && to && from.unit === to.unit) {
      // A "size" in pieces (e.g. unit 'stk') is really a piece count.
      if (from.unit === 'pcs') {
        const count = to.value * (pieces ?? 1);
        return {
          sizeMin: null,
          sizeMax: null,
          sizeUnit: 'pcs',
          pieces: count,
          unitPriceDkk: round4(price / count),
          unitPriceKind: 'pcs',
        };
      }
      const mult = pieces ?? 1;
      const sizeMin = round4(from.value * mult);
      const sizeMax = round4(to.value * mult);
      const isRange = sizeMin !== sizeMax || (piecesFrom !== null && piecesTo !== null && piecesFrom !== piecesTo);
      return {
        sizeMin,
        sizeMax,
        sizeUnit: from.unit,
        pieces: pieces ?? 1,
        unitPriceDkk: round4(price / unitPriceDenominator(from.unit, sizeMax)),
        unitPriceKind: isRange ? 'range_max' : 'exact',
      };
    }
  }

  if (pieces !== null) {
    return {
      sizeMin: null,
      sizeMax: null,
      sizeUnit: 'pcs',
      pieces,
      unitPriceDkk: round4(price / pieces),
      unitPriceKind: 'pcs',
    };
  }

  return empty;
}
