import { PLANS, type MealPlan, type StoreId } from './mock-data';
import { planPrice } from './strategy';

export interface MatchCriteria {
  weeklyBudget: number;
  kcalPerDay: number;
  stores: readonly StoreId[];
  ingredientPrefs: readonly string[];
}

/** Plans compatible with the household's answers. Example logic; the engine replaces it. */
export function matchingPlans(c: MatchCriteria): MealPlan[] {
  return PLANS.filter((p) => {
    if (planPrice(p, c.stores) > c.weeklyBudget * 1.1) return false;
    if (Math.abs(p.kcalPerDay - c.kcalPerDay) > 400) return false;
    if (c.ingredientPrefs.includes('Vegetar') && !p.tags.includes('grøn')) return false;
    return true;
  });
}

/**
 * The archive headline number. With a pool of 6 example plans the real count is
 * tiny, so we scale it to the size of the planned catalogue (≈150) to convey the
 * intended feel of the screen. Marked as an estimate in the UI.
 */
export function matchingCountDisplay(c: MatchCriteria): number {
  const ratio = matchingPlans(c).length / PLANS.length;
  return Math.round(150 * ratio);
}
