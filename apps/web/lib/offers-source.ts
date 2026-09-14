/**
 * Server-side offer source for the web app.
 *
 *   1. If an ingest snapshot exists (data/offers/latest.json, written by
 *      `pnpm ingest --source=tjek --live --out ...`), read it, map dealers to
 *      our retailers and match headings to the ontology (pass 2 aliases).
 *   2. Otherwise fall back to our fixture offers.
 *
 * The snapshot holds only whitelisted, normalised fields (NormalizedOffer). It
 * is git-ignored: real offer data is never committed to the public repo.
 */
import { existsSync, readFileSync, statSync } from 'node:fs';
import { resolve } from 'node:path';
import { matchHeading, type NormalizedOffer } from '@madplan/domain';
import { getSource } from '@madplan/legal';
import { ALIAS_RULES } from './aliases';
import { TJEK_DEALER_TO_STORE } from './dealers';
import { fixtureOffers, type MatchedOffer } from './offers';

export interface OffersMeta {
  kind: 'fixtures' | 'snapshot';
  /** Human label for the PriceSource line. */
  sourceLabel: string;
  legalStatus: string;
  fetchedAt: string | null;
  total: number;
  matched: number;
  unmatched: number;
  unmappedDealers: string[];
  /** Below this confidence a match is not used for prices (admin queue). */
  minConfidence: number;
}

export interface OffersPayload {
  offers: MatchedOffer[];
  meta: OffersMeta;
}

interface Snapshot {
  source: string;
  mode: string;
  fetchedAt: string;
  offers: NormalizedOffer[];
}

export const MIN_CONFIDENCE = 0.7;

function snapshotPath(): string {
  return process.env.OFFERS_SNAPSHOT ?? resolve(process.cwd(), '..', '..', 'data', 'offers', 'latest.json');
}

export function loadOffers(): OffersPayload {
  const path = snapshotPath();
  const tjek = getSource('tjek');

  if (existsSync(path)) {
    const snap = JSON.parse(readFileSync(path, 'utf8')) as Snapshot;
    const unmapped = new Set<string>();
    const offers: MatchedOffer[] = [];
    let unmatched = 0;
    for (const o of snap.offers) {
      const store = TJEK_DEALER_TO_STORE[o.retailerExternalId];
      if (!store) {
        unmapped.add(o.retailerExternalId);
        continue;
      }
      const m = matchHeading(o.heading, ALIAS_RULES);
      if (!m || m.confidence < MIN_CONFIDENCE) {
        unmatched++;
        continue;
      }
      offers.push({ ...o, retailerExternalId: store, ingredientId: m.ingredientId });
    }
    return {
      offers,
      meta: {
        kind: 'snapshot',
        sourceLabel: snap.mode === 'live' ? tjek.display_name : `${tjek.display_name} (fixtures via ingest)`,
        legalStatus: tjek.legal_status,
        fetchedAt: snap.fetchedAt ?? new Date(statSync(path).mtimeMs).toISOString(),
        total: snap.offers.length,
        matched: offers.length,
        unmatched,
        unmappedDealers: [...unmapped],
        minConfidence: MIN_CONFIDENCE,
      },
    };
  }

  const offers = fixtureOffers();
  return {
    offers,
    meta: {
      kind: 'fixtures',
      sourceLabel: 'egne testdata i tilbudsavis-format (ingen rigtige tilbud endnu)',
      legalStatus: tjek.legal_status,
      fetchedAt: null,
      total: offers.length,
      matched: offers.length,
      unmatched: 0,
      unmappedDealers: [],
      minConfidence: MIN_CONFIDENCE,
    },
  };
}
