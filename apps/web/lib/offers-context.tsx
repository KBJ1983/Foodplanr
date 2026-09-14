'use client';

import { createContext, useContext, useEffect, useMemo, useState, type ReactNode } from 'react';
import { fixtureOffers, type MatchedOffer } from './offers';
import type { OffersMeta, OffersPayload } from './offers-source';

interface Ctx {
  offers: MatchedOffer[];
  meta: OffersMeta;
  loading: boolean;
}

const FALLBACK_META: OffersMeta = {
  kind: 'fixtures',
  sourceLabel: 'egne testdata i tilbudsavis-format (ingen rigtige tilbud endnu)',
  legalStatus: 'pending',
  fetchedAt: null,
  total: 0,
  matched: 0,
  unmatched: 0,
  unmappedDealers: [],
  minConfidence: 0.7,
};

const OffersContext = createContext<Ctx | null>(null);

/** Fetches offers + provenance from /api/offers once; fixtures until the response lands. */
export function OffersProvider({ children }: { children: ReactNode }) {
  const initial = useMemo(() => fixtureOffers(), []);
  const [payload, setPayload] = useState<OffersPayload | null>(null);

  useEffect(() => {
    let cancelled = false;
    fetch('/api/offers')
      .then((r) => (r.ok ? (r.json() as Promise<OffersPayload>) : Promise.reject(new Error(String(r.status)))))
      .then((p) => {
        if (!cancelled) setPayload(p);
      })
      .catch(() => {
        /* keep fixtures */
      });
    return () => {
      cancelled = true;
    };
  }, []);

  const value = useMemo<Ctx>(
    () => ({
      offers: payload?.offers ?? initial,
      meta: payload?.meta ?? { ...FALLBACK_META, total: initial.length, matched: initial.length },
      loading: payload === null,
    }),
    [payload, initial],
  );
  return <OffersContext.Provider value={value}>{children}</OffersContext.Provider>;
}

export function useOffersContext(): Ctx {
  const ctx = useContext(OffersContext);
  if (!ctx) throw new Error('useOffersContext must be used inside OffersProvider');
  return ctx;
}
