import type { SourceId } from '@madplan/legal';

/** Base units everything is normalised to. Weight in grams, volume in millilitres, or count. */
export type SizeUnit = 'g' | 'ml' | 'pcs';

export type UnitPriceKind =
  /** exact size known → price per kg / l */
  | 'exact'
  /** size given as a range → price per kg / l computed on the largest size */
  | 'range_max'
  /** only piece count known → price per piece */
  | 'pcs'
  /** nothing usable → no unit price */
  | 'unknown';

export type OfferKind = 'weekly' | 'food_waste';

export type NormalizedBy = 'rule' | 'llm' | 'manual';

/** Quantity as delivered by a source, before normalisation. All fields optional. */
export interface RawQuantity {
  /** Unit symbol as the source spells it, e.g. 'kg', 'g', 'l', 'stk'. */
  unit?: string | null;
  /** SI unit symbol the source resolved to, e.g. 'g', 'ml'. */
  siUnit?: string | null;
  /** Factor to go from `unit` to `siUnit`. e.g. kg → g = 1000. */
  siFactor?: number | null;
  sizeFrom?: number | null;
  sizeTo?: number | null;
  piecesFrom?: number | null;
  piecesTo?: number | null;
}

export interface NormalizedQuantity {
  /** Total amount (size × pieces) in base unit, min of range. */
  sizeMin: number | null;
  /** Total amount (size × pieces) in base unit, max of range. */
  sizeMax: number | null;
  sizeUnit: SizeUnit | null;
  pieces: number | null;
  /** DKK per kg, per litre, or per piece — see `unitPriceKind`. */
  unitPriceDkk: number | null;
  unitPriceKind: UnitPriceKind;
}

/**
 * The only shape that is ever written to the `offer` table. No free-form
 * third-party content beyond `heading` (the product name) is present.
 */
export interface NormalizedOffer extends NormalizedQuantity {
  source: SourceId;
  /** Source's own id, suffixed with `#<n>` for split bundles. */
  sourceId: string;
  /** Source's retailer/dealer id; resolved to our `retailer.id` on write. */
  retailerExternalId: string;
  catalogExternalId: string | null;
  storeExternalId: string | null;
  heading: string;
  price: number;
  priceBefore: number | null;
  currency: 'DKK';
  /** ISO-8601 timestamps. */
  runFrom: string;
  runTill: string;
  ean: string | null;
  kind: OfferKind;
  /** 0 for a plain offer; 1..n for the n-th variant of an "X eller Y" bundle. */
  bundleIndex: number;
  normalizedBy: NormalizedBy;
}
