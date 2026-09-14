'use client';

import { useMemo } from 'react';
import { priceStrategies, type PricingInput, type Strategy, type StrategyResult, type Swaps } from './engine';
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
  results: Record<Strategy, StrategyResult>;
  active: StrategyResult;
  swaps: Swaps;
}

/** Everything a screen needs to price a plan for the household's week, stores and swaps. */
export function usePricing(plan: MealPlan): Pricing {
  const { state, weekStart } = useStore();
  const offers = useOffers();
  const swaps = state.swaps[swapKey(plan.id, weekStart)] ?? {};
  const pers = persons(state);
  const stores = state.stores;
  const input = useMemo<PricingInput>(
    () => ({ plan, persons: pers, weekStart, offers, fixedStores: stores, swaps }),
    [plan, pers, weekStart, offers, stores, swaps],
  );
  const results = useMemo(() => priceStrategies(input), [input]);
  return { input, results, active: results[state.strategy], swaps };
}
