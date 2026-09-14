import { describe, expect, it } from 'vitest';
import {
  FieldNotWhitelistedError,
  SourceNotAllowedError,
  assertSourceAllowed,
  denialReason,
  getSource,
  resolveEnv,
  whitelistRecord,
  whitelistRecords,
} from '../src/index.js';

describe('adapter gate — mode/status matrix', () => {
  it('pending source: fixtures ok in dev/test, live never', () => {
    expect(() => assertSourceAllowed('tjek', 'fixtures', 'development')).not.toThrow();
    expect(() => assertSourceAllowed('tjek', 'fixtures', 'test')).not.toThrow();
    expect(() => assertSourceAllowed('tjek', 'live', 'development')).toThrow(SourceNotAllowedError);
    expect(() => assertSourceAllowed('tjek', 'live', 'production')).toThrow(SourceNotAllowedError);
  });

  it('fixtures are refused in production for every source', () => {
    for (const s of ['tjek', 'salling', 'frida'] as const) {
      expect(() => assertSourceAllowed(s, 'fixtures', 'production')).toThrow(
        /not allowed in production/,
      );
    }
  });

  it('open source may run live in every env', () => {
    expect(() => assertSourceAllowed('frida', 'live', 'production')).not.toThrow();
    expect(() => assertSourceAllowed('frida', 'live', 'development')).not.toThrow();
  });

  it('blocked source is refused in every mode and env', () => {
    for (const mode of ['live', 'fixtures'] as const) {
      for (const env of ['production', 'development', 'test'] as const) {
        expect(() => assertSourceAllowed('rema_product_api', mode, env)).toThrow(
          SourceNotAllowedError,
        );
        expect(() => assertSourceAllowed('recipe_sites', mode, env)).toThrow(SourceNotAllowedError);
      }
    }
  });

  it('approved-without-agreement is refused even if registry validation were bypassed', () => {
    const fake = { ...getSource('tjek'), legal_status: 'approved' as const, agreement_ref: null };
    expect(denialReason(fake, 'live', 'production')).toMatch(/agreement_ref/);
  });

  it('resolveEnv reads NODE_ENV and defaults to development', () => {
    // vitest sets NODE_ENV=test (vitest.config.ts)
    expect(resolveEnv()).toBe('test');
    expect(resolveEnv('')).toBe('development');
    expect(resolveEnv('staging')).toBe('development');
    expect(resolveEnv('production')).toBe('production');
    expect(resolveEnv('test')).toBe('test');
  });
});

describe('adapter gate — field whitelist', () => {
  const leakyTjekRecord = {
    offer_id: 'o1',
    dealer_id: 'd1',
    catalog_id: 'c1',
    heading: 'Hakket oksekød 8-12%',
    price: 39.95,
    run_from: '2026-09-14T00:00:00Z',
    run_till: '2026-09-20T23:59:59Z',
    // the kind of things an SDK response also carries:
    images: { view: 'https://example.invalid/x.jpg' },
    description: 'Lækkert dansk oksekød',
    catalog_page: 3,
  };

  it('strict mode throws when an adapter leaks a non-whitelisted field', () => {
    expect(() => whitelistRecord('tjek', { offer_id: 'o1', publish: 'x' })).toThrow(
      FieldNotWhitelistedError,
    );
  });

  it('globally forbidden fields throw even in non-strict mode', () => {
    expect(() => whitelistRecord('tjek', leakyTjekRecord, { strict: false })).toThrow(
      /description|images|catalog_page/,
    );
  });

  it('non-strict mode drops unknown (non-forbidden) keys silently', () => {
    const out = whitelistRecord(
      'tjek',
      { offer_id: 'o1', heading: 'x', publish: 'y' },
      { strict: false },
    );
    expect(out).toEqual({ offer_id: 'o1', heading: 'x' });
  });

  it('keeps exactly the whitelisted keys and drops undefined', () => {
    const out = whitelistRecord('tjek', {
      offer_id: 'o1',
      dealer_id: 'd1',
      catalog_id: 'c1',
      heading: 'x',
      price: 10,
      price_before: undefined,
      run_from: 'a',
      run_till: 'b',
    });
    expect(Object.keys(out).sort()).toEqual(
      ['catalog_id', 'dealer_id', 'heading', 'offer_id', 'price', 'run_from', 'run_till'].sort(),
    );
  });

  it('a blocked source has an empty whitelist so nothing can ever pass', () => {
    expect(() => whitelistRecord('rema_product_api', { ean: '123' })).toThrow(
      FieldNotWhitelistedError,
    );
    expect(whitelistRecord('rema_product_api', {}, { strict: false })).toEqual({});
  });

  it('whitelistRecords applies to arrays', () => {
    const out = whitelistRecords('frida', [
      { frida_food_id: 1, name_da: 'Æble', kcal_100g: 52 },
      { frida_food_id: 2, name_da: 'Pære', kcal_100g: 57 },
    ]);
    expect(out).toHaveLength(2);
    expect(out[1]).toEqual({ frida_food_id: 2, name_da: 'Pære', kcal_100g: 57 });
  });
});
