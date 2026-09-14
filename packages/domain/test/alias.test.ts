import { describe, expect, it } from 'vitest';
import { matchHeading, normalizeHeading, rule } from '../src/index';

const rules = [
  rule('hakkede-tomater', ['hakkede tomater', 'flåede tomater']),
  rule('tomater', ['tomater', 'tomat'], { exclude: ['hakkede', 'flåede', 'puré', 'pure'] }),
  rule('kyllingelaar', ['kyllingelår', 'kyllinge lår', 'kyllingeunderlår']),
  rule('kyllingebryst', ['kyllingebryst', 'kyllingefilet', 'kyllingeinderfilet']),
  rule('fuldkornspasta', ['fuldkornspasta', 'fuldkorns pasta']),
  rule('pasta', ['pasta', 'spaghetti', 'penne'], { exclude: ['fuldkorn'] }),
];

describe('alias matcher (pass 2)', () => {
  it('first specific rule wins over general ones', () => {
    expect(matchHeading('Hakkede tomater 400 g', rules)?.ingredientId).toBe('hakkede-tomater');
    expect(matchHeading('Tomater i klase', rules)?.ingredientId).toBe('tomater');
    expect(matchHeading('Fuldkornspasta 500 g', rules)?.ingredientId).toBe('fuldkornspasta');
    expect(matchHeading('Spaghetti 1 kg', rules)?.ingredientId).toBe('pasta');
  });

  it('exclusions prevent wrong matches', () => {
    expect(matchHeading('Tomatpuré 3 x 70 g', rules)?.ingredientId).not.toBe('tomater');
  });

  it('word boundary stops substrings inside other words', () => {
    // "kyllingepølser" must not match kyllingelår/kyllingebryst rules
    expect(matchHeading('Kyllingepølser', rules)).toBeNull();
    expect(matchHeading('Økologisk kyllingebrystfilet', rules)?.ingredientId).toBe('kyllingebryst');
  });

  it('returns confidence and rule index; null when nothing matches', () => {
    const m = matchHeading('Kyllingelår 1 kg', rules)!;
    expect(m.confidence).toBe(0.85);
    expect(m.ruleIndex).toBe(2);
    expect(matchHeading('Opvasketabs 60 stk', rules)).toBeNull();
  });

  it('normalises headings', () => {
    expect(normalizeHeading('  Arla®  Sødmælk  ')).toBe('arla sødmælk');
  });
});
