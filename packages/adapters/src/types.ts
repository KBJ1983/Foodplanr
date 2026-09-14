import type { NormalizedOffer } from '@madplan/domain';
import type { RunMode, SourceId } from '@madplan/legal';

export interface AdapterContext {
  mode: RunMode;
  /** Optional filter: only these retailers (source-side ids). */
  dealerIds?: readonly string[];
  /** Optional filter for Salling food waste: zip codes with active users. */
  zips?: readonly string[];
  logger?: Pick<Console, 'info' | 'warn' | 'error'>;
}

/**
 * A record that contains *only* keys from the source's `approved_fields`.
 * The runner re-validates this with `whitelistRecord(strict)` — an adapter
 * that leaks a key fails loudly.
 */
export type WhitelistedRecord = Record<string, unknown>;

export interface OfferAdapter {
  readonly source: SourceId;
  /** Fetch whitelisted records. Must never call the network in `fixtures` mode. */
  fetch(ctx: AdapterContext): Promise<WhitelistedRecord[]>;
  /** Pure: whitelisted record → 0..n normalised offers (n>1 for bundles). */
  normalize(record: WhitelistedRecord): NormalizedOffer[];
}

export interface IngestStats {
  source: SourceId;
  mode: RunMode;
  fetched: number;
  normalized: number;
  bundlesSplit: number;
  unitPriceKinds: Record<string, number>;
  durationMs: number;
}

export interface IngestResult {
  offers: NormalizedOffer[];
  stats: IngestStats;
}
