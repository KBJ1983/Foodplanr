import { describe, expect, it } from 'vitest';
import { GLOBALLY_FORBIDDEN_FIELDS, getSource } from '@madplan/legal';
import { FixtureTjekClient, TjekAdapter, normalizeTjekRecord, runOfferIngest } from '../src/index.js';

describe('Tjek adapter (fixtures)', () => {
  it('fetches all fixture offers across dealers and paginates catalogs', async () => {
    const adapter = new TjekAdapter(new FixtureTjekClient());
    const recs = await adapter.fetch({ mode: 'fixtures' });
    expect(recs).toHaveLength(13);
  });

  it('emits only approved fields — never description/images/branding', async () => {
    const adapter = new TjekAdapter(new FixtureTjekClient());
    const recs = await adapter.fetch({ mode: 'fixtures' });
    const allowed = new Set(getSource('tjek').approved_fields);
    for (const r of recs) {
      for (const key of Object.keys(r)) {
        expect(allowed.has(key), `leaked key ${key}`).toBe(true);
        expect(GLOBALLY_FORBIDDEN_FIELDS).not.toContain(key);
      }
      expect(JSON.stringify(r)).not.toMatch(/example\.invalid|FIXTURE/);
    }
  });

  it('filters by dealerIds', async () => {
    const adapter = new TjekAdapter(new FixtureTjekClient());
    const recs = await adapter.fetch({ mode: 'fixtures', dealerIds: ['fx-lidl'] });
    expect(recs).toHaveLength(3);
    expect(recs.every((r) => r['dealer_id'] === 'fx-lidl')).toBe(true);
  });
});

describe('Tjek pass-1 normalisation', () => {
  it('end-to-end through the runner produces unit prices and splits bundles', async () => {
    const { offers, stats } = await runOfferIngest({ source: 'tjek', mode: 'fixtures', env: 'test' });
    expect(stats.fetched).toBe(13);
    // 13 offers, one 2-way bundle (+1) and one 3-way bundle (+2) → 16 rows
    expect(stats.normalized).toBe(16);
    expect(stats.bundlesSplit).toBe(2);

    const byId = new Map(offers.map((o) => [o.sourceId, o]));

    const beef = byId.get('fx-o-001')!;
    expect(beef.unitPriceKind).toBe('exact');
    expect(beef.unitPriceDkk).toBe(79.9);
    expect(beef.priceBefore).toBe(54.95);

    const chicken = byId.get('fx-o-002')!;
    expect(chicken.unitPriceKind).toBe('range_max');
    expect(chicken.sizeMax).toBe(500);
    expect(chicken.unitPriceDkk).toBe(90);

    const skyr = byId.get('fx-o-003')!;
    expect(skyr.sizeMin).toBe(900);
    expect(skyr.pieces).toBe(2);

    const milk1 = byId.get('fx-o-004#1')!;
    const milk2 = byId.get('fx-o-004#2')!;
    expect(milk1.heading).toBe('Sødmælk');
    expect(milk2.heading).toBe('letmælk');
    expect(milk1.bundleIndex).toBe(1);
    expect(milk1.sizeUnit).toBe('ml');
    expect(milk1.unitPriceDkk).toBe(12);

    const eggs = byId.get('fx-o-006')!;
    expect(eggs.unitPriceKind).toBe('pcs');
    expect(eggs.pieces).toBe(10);
    expect(eggs.unitPriceDkk).toBe(2.495);

    // quantity missing → parsed from heading
    const potatoes = byId.get('fx-o-101')!;
    expect(potatoes.sizeMin).toBe(2000);
    expect(potatoes.unitPriceDkk).toBe(7.5);
    expect(potatoes.unitPriceKind).toBe('exact');

    const cola = byId.get('fx-o-202')!;
    expect(cola.sizeMin).toBe(1980);
    expect(cola.sizeUnit).toBe('ml');
    expect(cola.pieces).toBe(6);

    // salmon 0.3 kg via SI factor
    const salmon = byId.get('fx-o-103')!;
    expect(salmon.sizeMin).toBe(300);
    expect(salmon.unitPriceDkk).toBeCloseTo(196.6667, 3);

    // nothing usable
    const carrots = byId.get('fx-o-104')!;
    expect(carrots.unitPriceKind).toBe('unknown');
    expect(carrots.unitPriceDkk).toBeNull();

    expect(stats.unitPriceKinds).toMatchObject({ unknown: 2 });
  });

  it('3-way bundle carries identical price to all variants', () => {
    const rows = normalizeTjekRecord({
      dealer_id: 'd',
      catalog_id: 'c',
      offer_id: 'o',
      heading: 'Pasta, ris eller couscous',
      price: 10,
      price_before: null,
      currency: 'DKK',
      run_from: 'a',
      run_till: 'b',
      quantity_size_from: 500,
      quantity_size_to: 1000,
      quantity_unit: 'g',
      quantity_si_unit: 'g',
      quantity_si_factor: 1,
      quantity_pieces_from: 1,
      quantity_pieces_to: 1,
    });
    expect(rows.map((r) => r.heading)).toEqual(['Pasta', 'ris', 'couscous']);
    expect(rows.map((r) => r.sourceId)).toEqual(['o#1', 'o#2', 'o#3']);
    expect(new Set(rows.map((r) => r.unitPriceDkk))).toEqual(new Set([10]));
  });

  it('non-DKK offers are dropped', () => {
    const rows = normalizeTjekRecord({
      dealer_id: 'd',
      catalog_id: 'c',
      offer_id: 'o',
      heading: 'x',
      price: 10,
      price_before: null,
      currency: 'SEK',
      run_from: 'a',
      run_till: 'b',
      quantity_size_from: null,
      quantity_size_to: null,
      quantity_unit: null,
      quantity_si_unit: null,
      quantity_si_factor: null,
      quantity_pieces_from: null,
      quantity_pieces_to: null,
    });
    expect(rows).toEqual([]);
  });
});
