/**
 * Offer fixtures in the exact shape the ingest pipeline produces
 * (`NormalizedOffer` from @madplan/domain, plus the pass-2/3 match
 * `ingredientId`). They are OUR OWN test data — Tjek is `pending` in the rights
 * registry, so no real offer is used. Validity is relative to the current week
 * so the prototype always shows live, next-week and expired offers.
 *
 * When Tjek is approved, the web app reads the same shape from the `offer`
 * table instead of this file. Nothing else changes.
 */
import type { NormalizedOffer } from '@madplan/domain';
import type { StoreId } from './mock-data';
import { addWeeks, mondayOf } from './week';

export interface MatchedOffer extends NormalizedOffer {
  /** Pass 2/3 match onto our ontology (offer.ingredient_id). */
  ingredientId: string;
  retailerExternalId: StoreId;
}

interface Def {
  store: StoreId;
  ingredientId: string;
  heading: string;
  price: number;
  priceBefore?: number;
  /** Pack size in the ingredient's base unit (g / ml) or piece count. */
  size: number;
  unit: 'g' | 'ml' | 'pcs';
  /** 0 = this week, 1 = next week, -1 = last week (expired). */
  week?: number;
}

const DEFS: Def[] = [
  // Rema 1000 — this week
  { store: 'rema', ingredientId: 'kyllingelaar', heading: 'Kyllingelår 1 kg', price: 39, priceBefore: 55, size: 1000, unit: 'g' },
  { store: 'rema', ingredientId: 'hakket-oksekoed', heading: 'Hakket oksekød 8-12% 500 g', price: 35, priceBefore: 45, size: 500, unit: 'g' },
  { store: 'rema', ingredientId: 'kartofler', heading: 'Kartofler 2 kg', price: 15, size: 2000, unit: 'g' },
  { store: 'rema', ingredientId: 'ost-revet', heading: 'Revet ost 400 g', price: 28, priceBefore: 36, size: 400, unit: 'g' },
  { store: 'rema', ingredientId: 'kokosmaelk', heading: 'Kokosmælk 400 ml', price: 7, size: 400, unit: 'ml' },
  { store: 'rema', ingredientId: 'rodfrugter', heading: 'Rodfrugter 1 kg', price: 14, size: 1000, unit: 'g' },
  // Lidl — this week
  { store: 'lidl', ingredientId: 'torskefilet', heading: 'Torskefilet 800 g', price: 59, priceBefore: 89, size: 800, unit: 'g' },
  { store: 'lidl', ingredientId: 'pasta', heading: 'Pasta 1 kg', price: 12, size: 1000, unit: 'g' },
  { store: 'lidl', ingredientId: 'hakkede-tomater', heading: 'Hakkede tomater 400 g', price: 4, size: 400, unit: 'g' },
  { store: 'lidl', ingredientId: 'tortillas', heading: 'Tortillas 8 stk', price: 15, size: 8, unit: 'pcs' },
  { store: 'lidl', ingredientId: 'mozzarella', heading: 'Mozzarella 2 x 125 g', price: 15, size: 250, unit: 'g' },
  { store: 'lidl', ingredientId: 'aeg', heading: 'Æg str. M/L 10 stk', price: 22, size: 10, unit: 'pcs' },
  { store: 'lidl', ingredientId: 'fuldkornspasta', heading: 'Fuldkornspasta 500 g', price: 9, size: 500, unit: 'g' },
  // Netto — this week
  { store: 'netto', ingredientId: 'hakket-kalv-flaesk', heading: 'Hakket kalv & flæsk 500 g', price: 30, priceBefore: 39, size: 500, unit: 'g' },
  { store: 'netto', ingredientId: 'fiskefars', heading: 'Fiskefars 500 g', price: 30, size: 500, unit: 'g' },
  { store: 'netto', ingredientId: 'creme-fraiche', heading: 'Creme fraiche 200 g', price: 6, size: 200, unit: 'g' },
  { store: 'netto', ingredientId: 'ris', heading: 'Ris 1 kg', price: 15, size: 1000, unit: 'g' },
  { store: 'netto', ingredientId: 'bagekartofler', heading: 'Bagekartofler 1 kg', price: 12, size: 1000, unit: 'g' },
  // føtex — this week
  { store: 'foetex', ingredientId: 'laksefilet', heading: 'Laksefilet 500 g', price: 69, priceBefore: 89, size: 500, unit: 'g' },
  { store: 'foetex', ingredientId: 'kikaerter', heading: 'Kikærter 3 x 400 g', price: 15, size: 1200, unit: 'g' },
  { store: 'foetex', ingredientId: 'groenkaal', heading: 'Grønkål 300 g', price: 12, size: 300, unit: 'g' },
  // next week
  { store: 'rema', ingredientId: 'kyllingebryst', heading: 'Kyllingebrystfilet 900 g', price: 59, priceBefore: 79, size: 900, unit: 'g', week: 1 },
  { store: 'lidl', ingredientId: 'hakket-oksekoed', heading: 'Hakket oksekød 1 kg', price: 65, size: 1000, unit: 'g', week: 1 },
  { store: 'netto', ingredientId: 'svampe', heading: 'Champignon 500 g', price: 18, size: 500, unit: 'g', week: 1 },
  // last week (expired — must never be used)
  { store: 'netto', ingredientId: 'kyllingelaar', heading: 'Kyllingelår 1 kg', price: 45, size: 1000, unit: 'g', week: -1 },
];

function toOffer(d: Def, idx: number, currentMonday: string): MatchedOffer {
  const monday = addWeeks(currentMonday, d.week ?? 0);
  const runFrom = `${monday}T00:00:00+02:00`;
  const sunday = addWeeks(monday, 1);
  const runTill = `${sunday}T00:00:00+02:00`; // exclusive end = next Monday 00:00
  const isPcs = d.unit === 'pcs';
  const unitPrice = isPcs ? d.price / d.size : d.price / (d.size / 1000);
  return {
    source: 'tjek',
    sourceId: `fx-${idx + 1}`,
    retailerExternalId: d.store,
    catalogExternalId: `fx-cat-${d.store}`,
    storeExternalId: null,
    heading: d.heading,
    price: d.price,
    priceBefore: d.priceBefore ?? null,
    currency: 'DKK',
    runFrom,
    runTill,
    sizeMin: isPcs ? null : d.size,
    sizeMax: isPcs ? null : d.size,
    sizeUnit: d.unit,
    pieces: isPcs ? d.size : 1,
    unitPriceDkk: Math.round(unitPrice * 10_000) / 10_000,
    unitPriceKind: isPcs ? 'pcs' : 'exact',
    ean: null,
    kind: 'weekly',
    bundleIndex: 0,
    normalizedBy: 'manual',
    ingredientId: d.ingredientId,
  };
}

/** All fixture offers, dated relative to `today`. */
export function fixtureOffers(today: Date = new Date()): MatchedOffer[] {
  const monday = mondayOf(today);
  return DEFS.map((d, i) => toOffer(d, i, monday));
}
