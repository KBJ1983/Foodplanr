import { describe, expect, it } from 'vitest';
import { CopyListHandoff, formatCopyList } from '../src/index.js';

describe('copy_list handoff', () => {
  const list = {
    retailerId: 'r1',
    retailerName: 'Netto',
    lines: [
      { ingredientId: 'i1', name: 'Hakket oksekød', qty: 500, unit: 'g' as const, estPriceDkk: 39.95 },
      { ingredientId: 'i2', name: 'Kartofler', qty: 1500, unit: 'g' as const, estPriceDkk: 11.25 },
      { ingredientId: 'i3', name: 'Æg', qty: 6, unit: 'pcs' as const },
      { ingredientId: 'i4', name: 'Sødmælk', qty: 1000, unit: 'ml' as const },
    ],
  };

  it('formats a Danish text list with estimated total', () => {
    expect(formatCopyList(list)).toBe(
      [
        'Indkøbsliste – Netto',
        '',
        '- Hakket oksekød, 500 g',
        '- Kartofler, 1,5 kg',
        '- Æg, 6 stk',
        '- Sødmælk, 1,0 l',
        '',
        'Estimeret pris: 51,20 kr.',
      ].join('\n'),
    );
  });

  it('builds a basket and reports ready_to_copy', async () => {
    const h = new CopyListHandoff('r1');
    const { basket, unmatchedLines } = await h.buildBasket(list);
    expect(unmatchedLines).toEqual([]);
    expect(basket.mode).toBe('copy_list');
    expect(await h.handoff(basket, { id: 'u1' })).toEqual({ status: 'ready_to_copy' });
  });
});
