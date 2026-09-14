import { describe, expect, it } from 'vitest';
import { runOfferIngest } from '@madplan/adapters';
import { MemoryOfferRepository } from '../src/index.js';

describe('MemoryOfferRepository', () => {
  it('upserts by (source, sourceId) and reports retailers created', async () => {
    const repo = new MemoryOfferRepository();
    const { offers } = await runOfferIngest({ source: 'tjek', mode: 'fixtures', env: 'test' });

    const first = await repo.upsertOffers(offers);
    expect(first.inserted).toBe(offers.length);
    expect(first.updated).toBe(0);
    expect(first.retailersCreated.sort()).toEqual(['fx-lidl', 'fx-netto', 'fx-rema']);

    const second = await repo.upsertOffers(offers);
    expect(second.inserted).toBe(0);
    expect(second.updated).toBe(offers.length);

    expect(await repo.deleteBySource('tjek')).toBe(offers.length);
    expect(repo.offers.size).toBe(0);
  });
});
