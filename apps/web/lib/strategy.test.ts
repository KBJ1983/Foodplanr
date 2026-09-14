import { describe, expect, it } from 'vitest';
import { PLANS, planById } from './mock-data';
import { allStrategies, cheapest, fewestStops, preferred } from './strategy';

const plan = planById('familieuge')!;

describe('shopping strategies', () => {
  it('cheapest is never more expensive than the other strategies', () => {
    for (const p of PLANS) {
      const r = allStrategies(p, ['rema', 'lidl']);
      expect(r.cheapest.total).toBeLessThanOrEqual(r.fewestStops.total);
      expect(r.cheapest.total).toBeLessThanOrEqual(r.preferred.total);
      expect(r.cheapest.missing).toEqual([]);
    }
  });

  it('fewestStops uses exactly one store when one carries everything', () => {
    const r = fewestStops(plan);
    expect(r.groups).toHaveLength(1);
    expect(r.missing).toEqual([]);
    expect(r.total).toBe(r.groups[0]!.total);
  });

  it('preferred only uses the fixed stores', () => {
    const r = preferred(plan, ['rema', 'lidl']);
    for (const g of r.groups) expect(['rema', 'lidl']).toContain(g.store);
    expect(r.groups.map((g) => g.items.length).reduce((a, b) => a + b, 0)).toBe(plan.items.length);
  });

  it('groups are sorted by total, largest first, and totals add up', () => {
    const r = cheapest(plan);
    for (let i = 1; i < r.groups.length; i++) expect(r.groups[i - 1]!.total).toBeGreaterThanOrEqual(r.groups[i]!.total);
    expect(r.total).toBe(r.groups.reduce((a, g) => a + g.total, 0));
  });
});
