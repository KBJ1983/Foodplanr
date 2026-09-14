import { describe, expect, it } from 'vitest';
import { getSource } from '@madplan/legal';
import { runOfferIngest } from '../src/index';

describe('Salling food-waste adapter (fixtures)', () => {
  it('maps clearances to whitelisted, normalised food_waste offers', async () => {
    const { offers, stats } = await runOfferIngest({
      source: 'salling',
      mode: 'fixtures',
      env: 'test',
      zips: ['8000'],
    });
    expect(stats.fetched).toBe(2);
    expect(offers).toHaveLength(2);
    for (const o of offers) {
      expect(o.kind).toBe('food_waste');
      expect(o.source).toBe('salling');
      expect(o.storeExternalId).toBe('fx-store-8000-1');
      expect(JSON.stringify(o)).not.toMatch(/example\.invalid/);
    }
    const chicken = offers.find((o) => o.heading.startsWith('Kyllingelår'))!;
    expect(chicken.ean).toBe('5700000000011');
    expect(chicken.sizeMin).toBe(900);
    expect(chicken.unitPriceDkk).toBeCloseTo(16.6667, 3);
    expect(chicken.priceBefore).toBe(30);
  });

  it('returns nothing for zips without stores', async () => {
    const { offers } = await runOfferIngest({ source: 'salling', mode: 'fixtures', env: 'test', zips: ['9999'] });
    expect(offers).toEqual([]);
  });

  it('whitelist matches registry exactly', () => {
    expect(getSource('salling').approved_fields).toContain('heading');
    expect(getSource('salling').approved_fields).not.toContain('image');
  });
});
