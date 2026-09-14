import { readJsonFixture } from '../fixtures';
import { TjekCatalogSchema, TjekDealerSchema, TjekOfferSchema } from './types';
import type { TjekCatalog, TjekDealer, TjekOffer } from './types';

export interface TjekClient {
  listDealers(): Promise<TjekDealer[]>;
  listCatalogs(dealerIds: readonly string[]): Promise<TjekCatalog[]>;
  listOffers(catalogId: string, offset: number, limit: number): Promise<TjekOffer[]>;
}

/** Reads our own invented fixtures. No network, ever. */
export class FixtureTjekClient implements TjekClient {
  async listDealers(): Promise<TjekDealer[]> {
    const raw = await readJsonFixture<unknown[]>(import.meta.url, 'fixtures', 'dealers.json');
    return raw.map((d) => TjekDealerSchema.parse(d));
  }

  async listCatalogs(dealerIds: readonly string[]): Promise<TjekCatalog[]> {
    const raw = await readJsonFixture<unknown[]>(import.meta.url, 'fixtures', 'catalogs.json');
    const all = raw.map((c) => TjekCatalogSchema.parse(c));
    return dealerIds.length ? all.filter((c) => dealerIds.includes(c.dealer_id)) : all;
  }

  async listOffers(catalogId: string, offset: number, limit: number): Promise<TjekOffer[]> {
    const raw = await readJsonFixture<unknown[]>(import.meta.url, 'fixtures', 'offers.json');
    return raw
      .map((o) => TjekOfferSchema.parse(o))
      .filter((o) => o.catalog_id === catalogId)
      .slice(offset, offset + limit);
  }
}

/**
 * Live client. Only ever constructed by the runner *after* the legal gate has
 * allowed `tjek` in `live` mode — which today it does not (status: pending).
 *
 * Endpoints follow the public v2 API (`/v2/dealers`, `/v2/catalogs`,
 * `/v2/offers`) with `X-Api-Key`. Re-verify against the SDK before first use.
 */
export class LiveTjekClient implements TjekClient {
  constructor(
    private readonly apiKey: string,
    private readonly baseUrl = 'https://api.etilbudsavis.dk',
    private readonly fetchImpl: typeof fetch = fetch,
  ) {
    if (!apiKey) throw new Error('LiveTjekClient requires TJEK_API_KEY');
  }

  private async get<T>(path: string, params: Record<string, string>): Promise<T> {
    const url = new URL(path, this.baseUrl);
    for (const [k, v] of Object.entries(params)) url.searchParams.set(k, v);
    const res = await this.fetchImpl(url, {
      headers: { 'X-Api-Key': this.apiKey, Accept: 'application/json' },
    });
    if (res.status === 429) {
      const retry = Number(res.headers.get('Retry-After') ?? '5');
      throw new TjekRateLimitError(retry);
    }
    if (!res.ok) throw new Error(`Tjek ${path} → HTTP ${res.status}`);
    return (await res.json()) as T;
  }

  async listDealers(): Promise<TjekDealer[]> {
    const raw = await this.get<unknown[]>('/v2/dealers', { limit: '100' });
    return raw.map((d) => TjekDealerSchema.parse(d));
  }

  async listCatalogs(dealerIds: readonly string[]): Promise<TjekCatalog[]> {
    const raw = await this.get<unknown[]>('/v2/catalogs', {
      dealer_ids: dealerIds.join(','),
      order_by: '-publication_date',
      limit: '100',
    });
    return raw.map((c) => TjekCatalogSchema.parse(c));
  }

  async listOffers(catalogId: string, offset: number, limit: number): Promise<TjekOffer[]> {
    const raw = await this.get<unknown[]>('/v2/offers', {
      catalog_ids: catalogId,
      offset: String(offset),
      limit: String(limit),
    });
    return raw.map((o) => TjekOfferSchema.parse(o));
  }
}

export class TjekRateLimitError extends Error {
  constructor(public readonly retryAfterSeconds: number) {
    super(`Tjek rate limited; retry after ${retryAfterSeconds}s`);
    this.name = 'TjekRateLimitError';
  }
}
