/**
 * Tjek dealer id → our retailer (mirrors `retailer.tjek_dealer_id`). Filled in
 * after the first live run: `pnpm ingest dealers --live` prints id + name for
 * every dealer the API returns. Offers from unmapped dealers are skipped (and
 * counted) until an admin maps them. Fixture dealer ids are included so the
 * fixture path works through the same code.
 */
import type { StoreId } from './mock-data';

export const TJEK_DEALER_TO_STORE: Record<string, StoreId> = {
  // fixtures
  'fx-netto': 'netto',
  'fx-rema': 'rema',
  'fx-lidl': 'lidl',
  // live ids go here, e.g. '9ba51': 'netto',
};
