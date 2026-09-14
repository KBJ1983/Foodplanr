import { describe, expect, it } from 'vitest';
import { lookupUnit, toBaseAmount } from '../src/index.js';

describe('units', () => {
  it('maps Danish retail unit symbols to base units', () => {
    expect(lookupUnit('kg')).toEqual({ base: 'g', factor: 1000 });
    expect(lookupUnit(' L ')).toEqual({ base: 'ml', factor: 1000 });
    expect(lookupUnit('stk.')).toEqual({ base: 'pcs', factor: 1 });
    expect(lookupUnit('bakke')).toBeNull();
    expect(lookupUnit(null)).toBeNull();
  });

  it('converts with and without SI hints', () => {
    expect(toBaseAmount(2, 'kg')).toEqual({ value: 2000, unit: 'g' });
    expect(toBaseAmount(33, 'cl')).toEqual({ value: 330, unit: 'ml' });
    expect(toBaseAmount(1, 'kg', { unit: 'g', factor: 1000 })).toEqual({ value: 1000, unit: 'g' });
    expect(toBaseAmount(1, 'kasse')).toBeNull();
    expect(toBaseAmount(Number.NaN, 'kg')).toBeNull();
  });
});
