/**
 * Shopping strategies over a plan's items and example per-store prices.
 *
 *   cheapest    – every item at its cheapest store (any number of stops)
 *   fewestStops – one store that carries everything, lowest total
 *   preferred   – only the user's fixed stores, cheapest among them
 *
 * Pure functions, unit-tested. The real engine (phase 1) will feed real offers
 * into the same shape.
 */
import { STORES, type MealPlan, type PlanItem, type StoreId } from './mock-data';

export type Strategy = 'cheapest' | 'fewestStops' | 'preferred';

export interface StoreGroup {
  store: StoreId;
  items: { name: string; qty: string; price: number }[];
  total: number;
}

export interface StrategyResult {
  strategy: Strategy;
  groups: StoreGroup[];
  total: number;
  /** Items that no allowed store carries. */
  missing: PlanItem[];
}

function cheapestStoreFor(item: PlanItem, allowed: readonly StoreId[]): { store: StoreId; price: number } | null {
  let best: { store: StoreId; price: number } | null = null;
  for (const s of allowed) {
    const price = item.prices[s];
    if (price === undefined) continue;
    if (!best || price < best.price) best = { store: s, price };
  }
  return best;
}

function group(items: MealPlan['items'], pick: (item: PlanItem) => { store: StoreId; price: number } | null, strategy: Strategy): StrategyResult {
  const byStore = new Map<StoreId, StoreGroup>();
  const missing: PlanItem[] = [];
  for (const item of items) {
    const choice = pick(item);
    if (!choice) {
      missing.push(item);
      continue;
    }
    const g = byStore.get(choice.store) ?? { store: choice.store, items: [], total: 0 };
    g.items.push({ name: item.name, qty: item.qty, price: choice.price });
    g.total += choice.price;
    byStore.set(choice.store, g);
  }
  const groups = [...byStore.values()].sort((a, b) => b.total - a.total);
  return { strategy, groups, total: groups.reduce((acc, g) => acc + g.total, 0), missing };
}

export function cheapest(plan: MealPlan, allowed: readonly StoreId[] = STORES.map((s) => s.id)): StrategyResult {
  return group(plan.items, (item) => cheapestStoreFor(item, allowed), 'cheapest');
}

export function fewestStops(plan: MealPlan, allowed: readonly StoreId[] = STORES.map((s) => s.id)): StrategyResult {
  // Prefer a single store carrying everything; else the store covering most items, cheapest total.
  let best: { store: StoreId; covered: number; total: number } | null = null;
  for (const s of allowed) {
    let covered = 0;
    let total = 0;
    for (const item of plan.items) {
      const price = item.prices[s];
      if (price !== undefined) {
        covered++;
        total += price;
      }
    }
    if (covered === 0) continue;
    if (!best || covered > best.covered || (covered === best.covered && total < best.total)) {
      best = { store: s, covered, total };
    }
  }
  if (!best) return { strategy: 'fewestStops', groups: [], total: 0, missing: [...plan.items] };
  const store = best.store;
  return group(plan.items, (item) => (item.prices[store] === undefined ? null : { store, price: item.prices[store]! }), 'fewestStops');
}

export function preferred(plan: MealPlan, fixedStores: readonly StoreId[]): StrategyResult {
  if (fixedStores.length === 0) return { ...cheapest(plan), strategy: 'preferred' };
  return { ...group(plan.items, (item) => cheapestStoreFor(item, fixedStores), 'preferred') };
}

export function allStrategies(plan: MealPlan, fixedStores: readonly StoreId[]): Record<Strategy, StrategyResult> {
  return {
    cheapest: cheapest(plan),
    fewestStops: fewestStops(plan),
    preferred: preferred(plan, fixedStores),
  };
}

/** Headline weekly price for archive cards: cheapest within the user's stores, else overall. */
export function planPrice(plan: MealPlan, fixedStores: readonly StoreId[]): number {
  return preferred(plan, fixedStores).total;
}

export const STRATEGY_LABEL: Record<Strategy, string> = {
  cheapest: 'Billigst',
  fewestStops: 'Færrest steder',
  preferred: 'Faste butikker',
};
