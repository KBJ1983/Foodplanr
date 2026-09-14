import { normalizeQuantity, parseQuantityFromHeading, type NormalizedOffer } from '@madplan/domain';
import { readJsonFixture } from '../fixtures.js';
import type { AdapterContext, OfferAdapter, WhitelistedRecord } from '../types.js';
import {
  SallingFoodWasteStoreSchema,
  type SallingFoodWasteStore,
  type SallingWhitelistedRecord,
} from './types.js';

export interface SallingClient {
  foodWasteByZip(zip: string): Promise<SallingFoodWasteStore[]>;
}

export class FixtureSallingClient implements SallingClient {
  async foodWasteByZip(zip: string): Promise<SallingFoodWasteStore[]> {
    const raw = await readJsonFixture<unknown[]>(import.meta.url, 'fixtures', 'food-waste.json');
    return raw.map((s) => SallingFoodWasteStoreSchema.parse(s)).filter((s) => s.store.address?.zip === zip);
  }
}

/**
 * Live client is intentionally not implemented in phase 0: Terms have not been
 * reviewed (status `pending`). Implement in phase 2 after docs/legal/salling.md
 * is filled in. Keep the interface so the runner does not change.
 */
export class LiveSallingClient implements SallingClient {
  constructor(_bearerToken: string) {}
  foodWasteByZip(): Promise<SallingFoodWasteStore[]> {
    return Promise.reject(new Error('LiveSallingClient not implemented (phase 2, after Terms review)'));
  }
}

export function toWhitelisted(s: SallingFoodWasteStore): SallingWhitelistedRecord[] {
  const [lng, lat] = s.store.coordinates ?? [null, null];
  return s.clearances.map((c) => ({
    store_id: s.store.id,
    store_brand: s.store.brand,
    store_zip: s.store.address?.zip ?? null,
    store_lat: lat ?? null,
    store_lng: lng ?? null,
    ean: c.offer.ean ?? c.product.ean ?? null,
    heading: c.product.description,
    price: c.offer.newPrice,
    price_before: c.offer.originalPrice ?? null,
    currency: c.offer.currency ?? 'DKK',
    run_till: c.offer.endTime,
    stock: c.offer.stock ?? null,
    stock_unit: c.offer.stockUnit ?? null,
  }));
}

export function normalizeSallingRecord(r: SallingWhitelistedRecord, now = new Date()): NormalizedOffer[] {
  if (r.currency && r.currency !== 'DKK') return [];
  const qty = normalizeQuantity(r.price, parseQuantityFromHeading(r.heading));
  return [
    {
      source: 'salling',
      sourceId: `${r.store_id}:${r.ean ?? r.heading}`,
      retailerExternalId: r.store_brand.toLowerCase(),
      catalogExternalId: null,
      storeExternalId: r.store_id,
      heading: r.heading,
      price: r.price,
      priceBefore: r.price_before,
      currency: 'DKK',
      runFrom: now.toISOString(),
      runTill: r.run_till,
      ean: r.ean,
      kind: 'food_waste',
      bundleIndex: 0,
      normalizedBy: 'rule',
      ...qty,
    },
  ];
}

export class SallingAdapter implements OfferAdapter {
  readonly source = 'salling' as const;
  constructor(private readonly client: SallingClient) {}

  async fetch(ctx: AdapterContext): Promise<WhitelistedRecord[]> {
    const zips = ctx.zips ?? [];
    const out: WhitelistedRecord[] = [];
    for (const zip of zips) {
      const stores = await this.client.foodWasteByZip(zip);
      for (const s of stores) out.push(...toWhitelisted(s));
    }
    ctx.logger?.info(`[salling] ${zips.length} zips → ${out.length} clearances`);
    return out;
  }

  normalize(record: WhitelistedRecord): NormalizedOffer[] {
    return normalizeSallingRecord(record as SallingWhitelistedRecord);
  }
}
