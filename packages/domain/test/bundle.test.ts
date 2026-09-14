import { describe, expect, it } from 'vitest';
import { splitBundleHeading } from '../src/index.js';

describe('splitBundleHeading', () => {
  it('returns a single heading unchanged', () => {
    expect(splitBundleHeading('Hakket oksekød 8-12%')).toEqual(['Hakket oksekød 8-12%']);
  });

  it('splits "X eller Y"', () => {
    expect(splitBundleHeading('Kyllingefilet eller kalkunbryst')).toEqual([
      'Kyllingefilet',
      'kalkunbryst',
    ]);
  });

  it('splits comma lists ending in eller', () => {
    expect(splitBundleHeading('Pepsi, Faxe Kondi eller Mirinda')).toEqual([
      'Pepsi',
      'Faxe Kondi',
      'Mirinda',
    ]);
  });

  it('handles "el." abbreviation and dedupes', () => {
    expect(splitBundleHeading('Æbler el. pærer')).toEqual(['Æbler', 'pærer']);
    expect(splitBundleHeading('Agurk eller agurk')).toEqual(['Agurk']);
  });

  it('empty input → empty list', () => {
    expect(splitBundleHeading('   ')).toEqual([]);
  });
});
