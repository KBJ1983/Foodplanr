import { planPrice } from './engine';
import { PLANS, type MealPlan, type StoreId } from './mock-data';
import type { MatchedOffer } from './offers';

export interface MatchCriteria {
  weeklyBudget: number;
  kcalPerDay: number;
  stores: readonly StoreId[];
  ingredientPrefs: readonly string[];
  persons: number;
  weekStart: string;
  offers: readonly MatchedOffer[];
}

/** Plans compatible with the household's answers. Example logic; the engine replaces it. */
export function matchingPlans(c: MatchCriteria): MealPlan[] {
  return PLANS.filter((p) => {
    const price = planPrice({ plan: p, persons: c.persons, weekStart: c.weekStart, offers: c.offers, fixedStores: c.stores });
    if (price > c.weeklyBudget * 1.1) return false;
    if (Math.abs(p.kcalPerDay - c.kcalPerDay) > 400) return false;
    if (c.ingredientPrefs.includes('Vegetar') && !p.tags.includes('grøn')) return false;
    return true;
  });
}

/**
 * The archive headline number. With a pool of six example plans the real count is
 * tiny, so we scale it to the size of the planned catalogue (≈150) to convey the
 * intended feel of the screen. Marked as an estimate in the UI.
 */
export function matchingCountDisplay(c: MatchCriteria): number {
  const ratio = matchingPlans(c).length / PLANS.length;
  return Math.round(150 * ratio);
}
