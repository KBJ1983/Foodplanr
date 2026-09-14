import { describe, expect, it } from 'vitest';
import { aggregateNeeds, costAtStore, offerValidInWeek, priceStrategies, recipesForPlan, swapDelta, type PricingInput } from './engine';
import { PLANS, planById } from './mock-data';
import { fixtureOffers } from './offers';
import { recipeById } from './recipes';
import { INGREDIENTS } from './ingredients';
import { RECIPES } from './recipes';

const today = new Date(2026, 8, 16); // Wed in ISO week 38
const weekStart = '2026-09-14';
const offers = fixtureOffers(today);
const plan = planById('familieuge')!;
const input: PricingInput = { plan, persons: 4, weekStart, offers, fixedStores: ['rema', 'lidl'] };

describe('data integrity', () => {
  it('every recipe line and every offer points at a known ingredient; every plan day at a known recipe', () => {
    const ids = new Set(INGREDIENTS.map((i) => i.id));
    for (const r of RECIPES) for (const l of r.lines) expect(ids.has(l.ingredientId), `${r.id}:${l.ingredientId}`).toBe(true);
    for (const o of offers) expect(ids.has(o.ingredientId), o.ingredientId).toBe(true);
    for (const p of PLANS) for (const id of p.recipeIds) expect(() => recipeById(id)).not.toThrow();
  });
});

describe('offer validity', () => {
  it('this-week offers are valid, next-week and expired ones are not', () => {
    const rema = offers.find((o) => o.sourceId === 'fx-1')!; // this week
    const next = offers.find((o) => o.heading.startsWith('Kyllingebrystfilet'))!; // week +1
    const expired = offers.find((o) => o.retailerExternalId === 'netto' && o.ingredientId === 'kyllingelaar')!; // week -1
    expect(offerValidInWeek(rema, weekStart)).toBe(true);
    expect(offerValidInWeek(next, weekStart)).toBe(false);
    expect(offerValidInWeek(next, '2026-09-21')).toBe(true);
    expect(offerValidInWeek(expired, weekStart)).toBe(false);
  });
});

describe('needs and line costs', () => {
  it('scales recipes to the household and aggregates across the week', () => {
    const needs = aggregateNeeds(recipesForPlan(plan), 4);
    const potatoes = needs.find((n) => n.ingredientId === 'kartofler')!;
    // kyllingelår 600 g + fiskefrikadeller 800 g
    expect(potatoes.qty).toBe(1400);
    const needs2 = aggregateNeeds(recipesForPlan(plan), 2);
    expect(needs2.find((n) => n.ingredientId === 'kartofler')!.qty).toBe(700);
  });

  it('uses a valid offer in packs, else the baseline estimate', () => {
    const needs = aggregateNeeds(recipesForPlan(plan), 4);
    const chicken = needs.find((n) => n.ingredientId === 'kyllingelaar')!;
    const atRema = costAtStore(chicken, 'rema', offers, weekStart);
    expect(atRema.kind).toBe('offer');
    expect(atRema.offer?.packs).toBe(1);
    expect(atRema.price).toBe(39);
    expect(atRema.offer?.runFrom.startsWith('2026-09-14')).toBe(true);

    const atNetto = costAtStore(chicken, 'netto', offers, weekStart);
    expect(atNetto.kind).toBe('baseline'); // Netto's offer expired last week
    expect(atNetto.price).toBe(Math.round(1 * 55 * 0.97 * 100) / 100);

    const tomatoes = needs.find((n) => n.ingredientId === 'hakkede-tomater')!; // 800 + 400 g
    const atLidl = costAtStore(tomatoes, 'lidl', offers, weekStart);
    expect(atLidl.offer?.packs).toBe(3);
    expect(atLidl.price).toBe(12);
  });

  it('never picks an "offer" that is dearer than the normal estimate', () => {
    const dear = { ...offers[0]!, price: 999, priceBefore: null };
    const needs = aggregateNeeds(recipesForPlan(plan), 4);
    const chicken = needs.find((n) => n.ingredientId === 'kyllingelaar')!;
    expect(costAtStore(chicken, 'rema', [dear], weekStart).kind).toBe('baseline');
  });
});

describe('strategies', () => {
  it('cheapest ≤ preferred and ≤ fewestStops; totals add up; savings reported', () => {
    for (const p of PLANS) {
      const r = priceStrategies({ ...input, plan: p });
      expect(r.cheapest.total).toBeLessThanOrEqual(r.preferred.total + 1e-9);
      expect(r.cheapest.total).toBeLessThanOrEqual(r.fewestStops.total + 1e-9);
      expect(r.fewestStops.groups).toHaveLength(1);
      for (const s of Object.values(r)) {
        expect(s.total).toBeCloseTo(s.groups.reduce((a, g) => a + g.total, 0), 2);
        expect(s.saved).toBeCloseTo(s.baselineTotal - s.total, 2);
        expect(s.lineCount).toBe(aggregateNeeds(recipesForPlan(p), 4).length);
      }
    }
  });

  it('preferred only uses the fixed stores and benefits from their offers', () => {
    const r = priceStrategies(input).preferred;
    for (const g of r.groups) expect(['rema', 'lidl']).toContain(g.store);
    expect(r.offerLines).toBeGreaterThan(0);
    expect(r.saved).toBeGreaterThan(0);
  });

  it('offers only count in the week they are valid', () => {
    const thisWeek = priceStrategies(input).cheapest;
    const nextWeek = priceStrategies({ ...input, weekStart: '2026-09-21' }).cheapest;
    expect(thisWeek.offerLines).not.toBe(nextWeek.offerLines);
  });
});

describe('line overrides (flyt / udsolgt)', () => {
  it('moving a line re-prices it in the new store and marks where it came from', async () => {
    const { applyLineOverrides, storeOptions } = await import('./engine');
    const base = priceStrategies(input).preferred;
    const chicken = base.groups.flatMap((g) => g.lines).find((l) => l.ingredientId === 'kyllingelaar')!;
    expect(chicken.store).toBe('rema'); // Rema has the valid offer
    const moved = applyLineOverrides(base, { kyllingelaar: { store: 'lidl' } }, offers, weekStart);
    const line = moved.groups.flatMap((g) => g.lines).find((l) => l.ingredientId === 'kyllingelaar')!;
    expect(line.store).toBe('lidl');
    expect(line.movedFrom).toBe('rema');
    expect(line.kind).toBe('baseline');
    expect(moved.total).toBeGreaterThan(base.total);
    expect(moved.lineCount).toBe(base.lineCount);
    const opts = storeOptions(chicken, offers, weekStart);
    expect(opts.map((o) => o.store).sort()).toEqual(['365', 'bilka', 'brugsen', 'foetex', 'lidl', 'meny', 'netto', 'rema'].sort());
    expect(opts.find((o) => o.store === 'rema')!.kind).toBe('offer');
  });

  it('sold-out lines leave groups and totals but are kept for restoring', async () => {
    const { applyLineOverrides } = await import('./engine');
    const base = priceStrategies(input).preferred;
    const r = applyLineOverrides(base, { kyllingelaar: { soldOut: true } }, offers, weekStart);
    expect(r.soldOut.map((l) => l.ingredientId)).toEqual(['kyllingelaar']);
    expect(r.lineCount).toBe(base.lineCount - 1);
    expect(r.total).toBeCloseTo(base.total - 39, 2);
    expect(r.groups.flatMap((g) => g.lines).some((l) => l.ingredientId === 'kyllingelaar')).toBe(false);
  });

  it('no overrides → same result object', async () => {
    const { applyLineOverrides } = await import('./engine');
    const base = priceStrategies(input).cheapest;
    expect(applyLineOverrides(base, {}, offers, weekStart)).toBe(base);
  });
});

describe('swaps', () => {
  it('swapping a day changes the week price and the needs', () => {
    const delta = swapDelta(input, 0, 'ovnbagt-laks'); // salmon instead of chicken thighs
    expect(delta).toBeGreaterThan(0);
    const swapped = recipesForPlan(plan, { 0: 'ovnbagt-laks' });
    expect(swapped[0]!.id).toBe('ovnbagt-laks');
    expect(aggregateNeeds(swapped, 4).some((n) => n.ingredientId === 'laksefilet')).toBe(true);
  });
});
