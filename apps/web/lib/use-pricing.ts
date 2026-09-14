'use client';

import { useMemo } from 'react';
import { applyLineOverrides, priceStrategies, type LineOverrides, type PricingInput, type Strategy, type StrategyResult, type Swaps } from './engine';
import type { MealPlan } from './mock-data';
import type { MatchedOffer } from './offers';
import { useOffersContext } from './offers-context';
import type { OffersMeta } from './offers-source';
import { persons, swapKey, useStore } from './store';

/** Offers for the session: snapshot from /api/offers when present, else fixtures. */
export function useOffers(): MatchedOffer[] {
  return useOffersContext().offers;
}

export function useOffersMeta(): OffersMeta {
  return useOffersContext().meta;
}

export interface Pricing {
  input: PricingInput;
  /** Strategy results with the user's list decisions (moves, sold out) applied. */
  results: Record<Strategy, StrategyResult>;
  active: StrategyResult;
  swaps: Swaps;
  lineOverrides: LineOverrides;
}

/** Everything a screen needs to price a plan for the household's week, stores, swaps and list decisions. */
export function usePricing(plan: MealPlan): Pricing {
  const { state, weekStart } = useStore();
  const offers = useOffers();
  const key = swapKey(plan.id, weekStart);
  const swaps = state.swaps[key] ?? {};
  const lineOverrides = state.lineOverrides[key] ?? {};
  const pers = persons(state);
  const stores = state.stores;
  const input = useMemo<PricingInput>(
    () => ({ plan, persons: pers, weekStart, offers, fixedStores: stores, swaps }),
    [plan, pers, weekStart, offers, stores, swaps],
  );
  const results = useMemo(() => {
    const raw = priceStrategies(input);
    return {
      cheapest: applyLineOverrides(raw.cheapest, lineOverrides, offers, weekStart),
      fewestStops: applyLineOverrides(raw.fewestStops, lineOverrides, offers, weekStart),
      preferred: applyLineOverrides(raw.preferred, lineOverrides, offers, weekStart),
    };
  }, [input, lineOverrides, offers, weekStart]);
  return { input, results, active: results[state.strategy], swaps, lineOverrides };
}
