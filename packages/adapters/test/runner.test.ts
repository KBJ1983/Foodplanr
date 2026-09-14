import { describe, expect, it } from 'vitest';
import { FieldNotWhitelistedError, SourceNotAllowedError } from '@madplan/legal';
import { runOfferIngest, type OfferAdapter } from '../src/index.js';

describe('adapter runner — gate enforcement', () => {
  it('refuses live tjek while status is pending, before constructing any client', async () => {
    await expect(
      runOfferIngest({ source: 'tjek', mode: 'live', env: 'development', secrets: { tjekApiKey: 'x' } }),
    ).rejects.toBeInstanceOf(SourceNotAllowedError);
  });

  it('refuses fixtures in production', async () => {
    await expect(runOfferIngest({ source: 'tjek', mode: 'fixtures', env: 'production' })).rejects.toThrow(
      /not allowed in production/,
    );
  });

  it('refuses blocked sources even with an injected adapter', async () => {
    const adapter: OfferAdapter = {
      source: 'rema_product_api',
      fetch: async () => [{ ean: '1' }],
      normalize: () => [],
    };
    await expect(
      runOfferIngest({ source: 'rema_product_api', mode: 'fixtures', env: 'development', adapter }),
    ).rejects.toBeInstanceOf(SourceNotAllowedError);
  });

  it('a leaky adapter fails the run instead of being cleaned up silently', async () => {
    const leaky: OfferAdapter = {
      source: 'tjek',
      fetch: async () => [
        {
          offer_id: 'o1',
          dealer_id: 'd1',
          catalog_id: 'c1',
          heading: 'x',
          price: 1,
          run_from: 'a',
          run_till: 'b',
          publish: '2026-01-01',
        },
      ],
      normalize: () => [],
    };
    await expect(
      runOfferIngest({ source: 'tjek', mode: 'fixtures', env: 'test', adapter: leaky }),
    ).rejects.toBeInstanceOf(FieldNotWhitelistedError);
  });

  it('rejects an adapter whose source does not match the request', async () => {
    const wrong: OfferAdapter = { source: 'salling', fetch: async () => [], normalize: () => [] };
    await expect(
      runOfferIngest({ source: 'tjek', mode: 'fixtures', env: 'test', adapter: wrong }),
    ).rejects.toThrow(/does not match/);
  });
});
