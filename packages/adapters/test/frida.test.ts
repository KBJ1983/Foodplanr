import { describe, expect, it } from 'vitest';
import { getSource, whitelistRecords } from '@madplan/legal';
import { importFridaCsv, matchNutrient, parseCsv, readTextFixture } from '../src/index';

const readSample = () =>
  readTextFixture(import.meta.url, '..', 'src', 'frida', 'fixtures', 'frida_sample.csv');

describe('CSV parser', () => {
  it('auto-detects semicolon and handles quoted fields with delimiters', () => {
    const rows = parseCsv('a;b\n"x;y";2\n');
    expect(rows).toEqual([{ a: 'x;y', b: '2' }]);
  });
  it('handles comma, CRLF, BOM and doubled quotes', () => {
    const rows = parseCsv('﻿a,b\r\n"he said ""hi""",1\r\n');
    expect(rows).toEqual([{ a: 'he said "hi"', b: '1' }]);
  });
});

describe('Frida import', () => {
  it('maps parameter names in Danish and English', () => {
    expect(matchNutrient('Energi (kJ)')).toBe('kj_100g');
    expect(matchNutrient('Energy (kcal)')).toBe('kcal_100g');
    expect(matchNutrient('Protein')).toBe('protein_g');
    expect(matchNutrient('Fedt')).toBe('fat_g');
    expect(matchNutrient('Fedtsyrer, mættede')).toBeNull();
    expect(matchNutrient('Kulhydrat, tilgængelig')).toBe('carb_g');
    expect(matchNutrient('Kostfibre')).toBe('fiber_g');
    expect(matchNutrient('Vitamin C')).toBeNull();
  });

  it('builds one food per id from long-format rows, only approved fields', async () => {
    const text = await readSample();
    const foods = importFridaCsv(text);
    expect(foods.map((f) => f.frida_food_id)).toEqual([1, 2, 3, 4, 5]);

    const apple = foods[0]!;
    expect(apple).toMatchObject({
      name_da: 'Æble, rå',
      name_en: 'Apple, raw',
      food_group: 'Frugt og frugtprodukter',
      kcal_100g: 52,
      kj_100g: 218,
      protein_g: 0.3,
      fat_g: 0.2,
      carb_g: 11.4,
      fiber_g: 2.2,
      source_version: '5.5',
    });

    // Quoted name with embedded delimiter
    expect(foods[3]!.name_da).toBe('Mælk, sød, 3,5 % fedt');

    // kcal derived from kJ when missing
    const potato = foods[2]!;
    expect(potato.kcal_100g).toBe(77);

    // Every record passes the strict whitelist for `frida`
    const allowed = new Set(getSource('frida').approved_fields);
    for (const f of foods) for (const k of Object.keys(f)) expect(allowed.has(k), k).toBe(true);
    expect(whitelistRecords('frida', foods)).toHaveLength(5);
  });

  it('accepts custom column names', () => {
    const csv = 'id,navn,param,v\n9,Test,Protein,5\n';
    const foods = importFridaCsv(csv, {
      columns: { foodId: ['id'], nameDa: ['navn'], parameterName: ['param'], value: ['v'] },
      version: '5.4',
    });
    expect(foods).toHaveLength(1);
    expect(foods[0]).toMatchObject({ frida_food_id: 9, name_da: 'Test', protein_g: 5, source_version: '5.4' });
  });
});
