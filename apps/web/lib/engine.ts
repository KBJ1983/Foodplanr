/**
 * Pricing engine (client prototype of the phase-1 engine). Pure functions.
 *
 *   plan (+ swaps) → recipes → scaled ingredient needs
 *   need × store  → valid offer in the planned week?  yes → offer packs
 *                                                    no  → baseline estimate
 *   per-store costs → strategies (Billigst / Færrest steder / Faste butikker)
 *
 * Every line remembers *why* it costs what it costs: `kind` ('offer' |
 * 'baseline') and, for offers, the offer itself with its validity period —
 * that is what the shopping list shows.
 */
import { formatQty, ingredientById, type Unit } from './ingredients';
import { STORES, storeById, type MealPlan, type StoreId } from './mock-data';
import type { MatchedOffer } from './offers';
import { recipeById, type Recipe } from './recipes';
import { addWeeks } from './week';

export type Strategy = 'cheapest' | 'fewestStops' | 'preferred';

export const STRATEGY_LABEL: Record<Strategy, string> = {
  cheapest: 'Billigst',
  fewestStops: 'Færrest steder',
  preferred: 'Faste butikker',
};

/** Day index → recipe id overrides ("byt ret"). */
export type Swaps = Record<number, string>;

export interface Need {
  ingredientId: string;
  name: string;
  qty: number;
  unit: Unit;
}

export interface LineCost {
  ingredientId: string;
  name: string;
  qty: number;
  unit: Unit;
  qtyLabel: string;
  store: StoreId;
  price: number;
  kind: 'offer' | 'baseline';
  /** What the same line would cost at this store's estimated normal price. */
  baselinePrice: number;
  offer?: {
    sourceId: string;
    heading: string;
    packPrice: number;
    packs: number;
    priceBefore: number | null;
    runFrom: string;
    runTill: string;
  };
  /** Set when the user moved the line away from the store the strategy chose. */
  movedFrom?: StoreId;
}

/** Per-line user decisions on the shopping list ("flyt til butik", "udsolgt"). */
export interface LineOverride {
  store?: StoreId;
  soldOut?: boolean;
}
export type LineOverrides = Record<string, LineOverride>;

export interface StoreGroup {
  store: StoreId;
  lines: LineCost[];
  total: number;
  offerLines: number;
}

export interface StrategyResult {
  strategy: Strategy;
  groups: StoreGroup[];
  total: number;
  /** Sum of estimated normal prices for the chosen lines. */
  baselineTotal: number;
  /** baselineTotal − total. */
  saved: number;
  offerLines: number;
  lineCount: number;
  /** Lines the user marked sold out (not in groups or totals). */
  soldOut: LineCost[];
}

// --- recipes & needs ---------------------------------------------------------

export function recipesForPlan(plan: MealPlan, swaps: Swaps = {}): Recipe[] {
  return plan.recipeIds.map((id, i) => recipeById(swaps[i] ?? id));
}

export function scaleFactor(recipe: Recipe, persons: number): number {
  return persons / recipe.servingsBase;
}

export function aggregateNeeds(recipes: readonly Recipe[], persons: number): Need[] {
  const map = new Map<string, Need>();
  for (const r of recipes) {
    const f = scaleFactor(r, persons);
    for (const line of r.lines) {
      const ing = ingredientById(line.ingredientId);
      const cur = map.get(ing.id) ?? { ingredientId: ing.id, name: ing.name, qty: 0, unit: ing.unit };
      cur.qty += line.qty * f;
      map.set(ing.id, cur);
    }
  }
  return [...map.values()].sort((a, b) => a.name.localeCompare(b.name, 'da'));
}

// --- offers & validity ----------------------------------------------------------

/** Offer is usable when its period overlaps the planned week [monday, next monday). */
export function offerValidInWeek(offer: Pick<MatchedOffer, 'runFrom' | 'runTill'>, weekStart: string): boolean {
  const weekFrom = new Date(`${weekStart}T00:00:00+02:00`).getTime();
  const weekTo = new Date(`${addWeeks(weekStart, 1)}T00:00:00+02:00`).getTime();
  const from = new Date(offer.runFrom).getTime();
  const till = new Date(offer.runTill).getTime();
  return from < weekTo && till > weekFrom;
}

function baselinePrice(need: Need, store: StoreId): number {
  const ing = ingredientById(need.ingredientId);
  const idx = storeById(store).priceIndex;
  const units = need.unit === 'pcs' ? Math.ceil(need.qty) : need.qty / 1000;
  return round2(units * ing.baseline * idx);
}

function offerPrice(need: Need, offer: MatchedOffer): { price: number; packs: number } | null {
  if (need.unit === 'pcs') {
    if (!offer.pieces) return null;
    const packs = Math.max(1, Math.ceil(need.qty / offer.pieces));
    return { price: round2(packs * offer.price), packs };
  }
  if (offer.sizeUnit !== need.unit || !offer.sizeMax) return null;
  const packs = Math.max(1, Math.ceil(need.qty / offer.sizeMax));
  return { price: round2(packs * offer.price), packs };
}

/** Cost of one need at one store, preferring the cheapest valid offer there. */
export function costAtStore(need: Need, store: StoreId, offers: readonly MatchedOffer[], weekStart: string): LineCost {
  const base = baselinePrice(need, store);
  let best: LineCost | null = null;
  for (const o of offers) {
    if (o.retailerExternalId !== store || o.ingredientId !== need.ingredientId) continue;
    if (!offerValidInWeek(o, weekStart)) continue;
    const p = offerPrice(need, o);
    if (!p) continue;
    if (!best || p.price < best.price) {
      best = {
        ingredientId: need.ingredientId,
        name: need.name,
        qty: need.qty,
        unit: need.unit,
        qtyLabel: formatQty(need.qty, need.unit),
        store,
        price: p.price,
        kind: 'offer',
        baselinePrice: base,
        offer: { sourceId: o.sourceId, heading: o.heading, packPrice: o.price, packs: p.packs, priceBefore: o.priceBefore, runFrom: o.runFrom, runTill: o.runTill },
      };
    }
  }
  // An "offer" that is dearer than the normal estimate is not a saving; keep it only when it wins.
  if (best && best.price <= base) return best;
  return { ingredientId: need.ingredientId, name: need.name, qty: need.qty, unit: need.unit, qtyLabel: formatQty(need.qty, need.unit), store, price: base, kind: 'baseline', baselinePrice: base };
}

// --- strategies ----------------------------------------------------------------

function group(lines: LineCost[], strategy: Strategy): StrategyResult {
  const byStore = new Map<StoreId, StoreGroup>();
  for (const l of lines) {
    const g = byStore.get(l.store) ?? { store: l.store, lines: [], total: 0, offerLines: 0 };
    g.lines.push(l);
    g.total = round2(g.total + l.price);
    if (l.kind === 'offer') g.offerLines++;
    byStore.set(l.store, g);
  }
  const groups = [...byStore.values()].sort((a, b) => b.total - a.total);
  const total = round2(groups.reduce((a, g) => a + g.total, 0));
  const baselineTotal = round2(lines.reduce((a, l) => a + l.baselinePrice, 0));
  return { strategy, groups, total, baselineTotal, saved: round2(baselineTotal - total), offerLines: lines.filter((l) => l.kind === 'offer').length, lineCount: lines.length, soldOut: [] };
}

const needOf = (l: LineCost): Need => ({ ingredientId: l.ingredientId, name: l.name, qty: l.qty, unit: l.unit });

/** Price of one line in every store (for the "flyt til" picker). */
export function storeOptions(line: LineCost, offers: readonly MatchedOffer[], weekStart: string): LineCost[] {
  return STORES.map((s) => costAtStore(needOf(line), s.id, offers, weekStart));
}

/**
 * Apply the user's per-line decisions to a strategy result: moved lines are
 * re-priced in the chosen store (offers there count), sold-out lines leave the
 * groups and totals but are kept in `soldOut` so they can be moved or restored.
 */
export function applyLineOverrides(result: StrategyResult, overrides: LineOverrides, offers: readonly MatchedOffer[], weekStart: string): StrategyResult {
  if (Object.keys(overrides).length === 0) return result;
  const kept: LineCost[] = [];
  const soldOut: LineCost[] = [];
  for (const l of result.groups.flatMap((g) => g.lines)) {
    const o = overrides[l.ingredientId];
    if (!o) {
      kept.push(l);
      continue;
    }
    if (o.soldOut) {
      soldOut.push(l);
      continue;
    }
    if (o.store && o.store !== l.store) {
      kept.push({ ...costAtStore(needOf(l), o.store, offers, weekStart), movedFrom: l.store });
    } else {
      kept.push(l);
    }
  }
  return { ...group(kept, result.strategy), soldOut };
}

export interface PricingInput {
  plan: MealPlan;
  persons: number;
  weekStart: string;
  offers: readonly MatchedOffer[];
  fixedStores: readonly StoreId[];
  swaps?: Swaps;
}

const ALL_STORES: readonly StoreId[] = STORES.map((s) => s.id);

export function priceStrategies(input: PricingInput): Record<Strategy, StrategyResult> {
  const needs = aggregateNeeds(recipesForPlan(input.plan, input.swaps), input.persons);
  const cost = (need: Need, store: StoreId) => costAtStore(need, store, input.offers, input.weekStart);

  const cheapestAmong = (stores: readonly StoreId[]) =>
    needs.map((need) => stores.map((s) => cost(need, s)).reduce((best, c) => (c.price < best.price ? c : best)));

  // fewestStops: the single store with the lowest total (every store carries everything at baseline).
  let bestStore: StoreId = ALL_STORES[0]!;
  let bestTotal = Number.POSITIVE_INFINITY;
  for (const s of ALL_STORES) {
    const t = needs.reduce((a, n) => a + cost(n, s).price, 0);
    if (t < bestTotal) {
      bestTotal = t;
      bestStore = s;
    }
  }

  const preferredStores = input.fixedStores.length ? input.fixedStores : ALL_STORES;
  return {
    cheapest: group(cheapestAmong(ALL_STORES), 'cheapest'),
    fewestStops: group(needs.map((n) => cost(n, bestStore)), 'fewestStops'),
    preferred: group(cheapestAmong(preferredStores), 'preferred'),
  };
}

/** Headline weekly price for archive cards: cheapest within the household's stores. */
export function planPrice(input: PricingInput): number {
  return priceStrategies(input).preferred.total;
}

/** Average dinner kcal per serving across the (possibly swapped) week. */
export function planDinnerKcal(plan: MealPlan, swaps: Swaps = {}): number {
  const rs = recipesForPlan(plan, swaps);
  return Math.round(rs.reduce((a, r) => a + r.kcalPerServing, 0) / rs.length);
}

/** Cost of one dinner (its own needs, cheapest within the household's stores). Days don't sum exactly to the week because packs are shared. */
export function dinnerCost(input: PricingInput, recipeId: string): number {
  return priceStrategies({ ...input, plan: { ...input.plan, recipeIds: [recipeId] }, swaps: {} }).preferred.total;
}

/** Week price difference if `dayIndex` is swapped to `recipeId` (positive = dearer). */
export function swapDelta(input: PricingInput, dayIndex: number, recipeId: string): number {
  const before = planPrice(input);
  const after = planPrice({ ...input, swaps: { ...(input.swaps ?? {}), [dayIndex]: recipeId } });
  return round2(after - before);
}

export function round2(n: number): number {
  return Math.round(n * 100) / 100;
}
