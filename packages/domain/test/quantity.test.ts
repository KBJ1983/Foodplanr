import { describe, expect, it } from 'vitest';
import { normalizeQuantity, parseQuantityFromHeading } from '../src/index.js';

describe('normalizeQuantity — pass 1', () => {
  it('exact weight → DKK per kg', () => {
    const r = normalizeQuantity(39.95, { unit: 'g', sizeFrom: 500, sizeTo: 500, piecesFrom: 1, piecesTo: 1 });
    expect(r).toEqual({
      sizeMin: 500,
      sizeMax: 500,
      sizeUnit: 'g',
      pieces: 1,
      unitPriceDkk: 79.9,
      unitPriceKind: 'exact',
    });
  });

  it('uses source SI mapping when present (kg → g)', () => {
    const r = normalizeQuantity(120, {
      unit: 'kg',
      siUnit: 'g',
      siFactor: 1000,
      sizeFrom: 1.5,
      sizeTo: 1.5,
    });
    expect(r.sizeMin).toBe(1500);
    expect(r.sizeUnit).toBe('g');
    expect(r.unitPriceDkk).toBe(80);
    expect(r.unitPriceKind).toBe('exact');
  });

  it('multipack multiplies size by pieces', () => {
    const r = normalizeQuantity(25, { unit: 'g', sizeFrom: 125, sizeTo: 125, piecesFrom: 4, piecesTo: 4 });
    expect(r.sizeMin).toBe(500);
    expect(r.pieces).toBe(4);
    expect(r.unitPriceDkk).toBe(50);
    expect(r.unitPriceKind).toBe('exact');
  });

  it('range → range_max, unit price on largest size', () => {
    const r = normalizeQuantity(20, { unit: 'g', sizeFrom: 400, sizeTo: 500 });
    expect(r.sizeMin).toBe(400);
    expect(r.sizeMax).toBe(500);
    expect(r.unitPriceDkk).toBe(40);
    expect(r.unitPriceKind).toBe('range_max');
  });

  it('volume in cl → DKK per litre', () => {
    const r = normalizeQuantity(10, { unit: 'cl', sizeFrom: 33, sizeTo: 33 });
    expect(r.sizeUnit).toBe('ml');
    expect(r.sizeMin).toBe(330);
    expect(r.unitPriceDkk).toBe(30.303);
    expect(r.unitPriceKind).toBe('exact');
  });

  it('pieces only → DKK per piece', () => {
    const r = normalizeQuantity(30, { piecesFrom: 3, piecesTo: 3 });
    expect(r).toEqual({
      sizeMin: null,
      sizeMax: null,
      sizeUnit: 'pcs',
      pieces: 3,
      unitPriceDkk: 10,
      unitPriceKind: 'pcs',
    });
  });

  it('size expressed in stk is treated as a piece count', () => {
    const r = normalizeQuantity(24, { unit: 'stk', sizeFrom: 6, sizeTo: 6 });
    expect(r.sizeUnit).toBe('pcs');
    expect(r.pieces).toBe(6);
    expect(r.unitPriceDkk).toBe(4);
    expect(r.unitPriceKind).toBe('pcs');
  });

  it('unknown unit or missing quantity → unknown', () => {
    expect(normalizeQuantity(10, { unit: 'bakke', sizeFrom: 1, sizeTo: 1 }).unitPriceKind).toBe('unknown');
    expect(normalizeQuantity(10, null).unitPriceKind).toBe('unknown');
    expect(normalizeQuantity(10, {}).unitPriceDkk).toBeNull();
  });

  it('non-positive price → unknown', () => {
    expect(normalizeQuantity(0, { unit: 'g', sizeFrom: 500, sizeTo: 500 }).unitPriceKind).toBe('unknown');
  });
});

describe('parseQuantityFromHeading — fallback', () => {
  it('parses single amounts with decimal comma', () => {
    expect(parseQuantityFromHeading('Sødmælk 0,5 l')).toMatchObject({ sizeFrom: 0.5, sizeTo: 0.5, unit: 'l' });
    expect(parseQuantityFromHeading('Hakket oksekød 500 g')).toMatchObject({ sizeFrom: 500, unit: 'g' });
    expect(parseQuantityFromHeading('Kartofler 2 kg')).toMatchObject({ sizeFrom: 2, unit: 'kg' });
  });

  it('parses multipacks', () => {
    expect(parseQuantityFromHeading('Skyr 2 x 450 g')).toMatchObject({
      piecesFrom: 2,
      sizeFrom: 450,
      unit: 'g',
    });
    expect(parseQuantityFromHeading('Cola 6x33cl')).toMatchObject({ piecesFrom: 6, sizeFrom: 33, unit: 'cl' });
  });

  it('parses ranges', () => {
    expect(parseQuantityFromHeading('Kyllingebryst 400-500 g')).toMatchObject({
      sizeFrom: 400,
      sizeTo: 500,
      unit: 'g',
    });
  });

  it('returns null when nothing is recognisable', () => {
    expect(parseQuantityFromHeading('Agurk')).toBeNull();
    expect(parseQuantityFromHeading('Rugbrød 8-12% fedt')).toBeNull();
  });
});
