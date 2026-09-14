import type { SizeUnit } from './types';

interface UnitDef {
  base: SizeUnit;
  factor: number;
}

/** Unit symbols as they appear in Danish retail data, lower-cased. */
const UNIT_TABLE: Record<string, UnitDef> = {
  // weight
  g: { base: 'g', factor: 1 },
  gr: { base: 'g', factor: 1 },
  gram: { base: 'g', factor: 1 },
  kg: { base: 'g', factor: 1000 },
  kilo: { base: 'g', factor: 1000 },
  mg: { base: 'g', factor: 0.001 },
  // volume
  ml: { base: 'ml', factor: 1 },
  cl: { base: 'ml', factor: 10 },
  dl: { base: 'ml', factor: 100 },
  l: { base: 'ml', factor: 1000 },
  ltr: { base: 'ml', factor: 1000 },
  liter: { base: 'ml', factor: 1000 },
  litre: { base: 'ml', factor: 1000 },
  // count
  stk: { base: 'pcs', factor: 1 },
  'stk.': { base: 'pcs', factor: 1 },
  pcs: { base: 'pcs', factor: 1 },
  pc: { base: 'pcs', factor: 1 },
  pk: { base: 'pcs', factor: 1 },
  'pk.': { base: 'pcs', factor: 1 },
  pakke: { base: 'pcs', factor: 1 },
  ps: { base: 'pcs', factor: 1 },
  bdt: { base: 'pcs', factor: 1 },
  bundt: { base: 'pcs', factor: 1 },
};

export function normalizeUnitSymbol(symbol: string): string {
  return symbol.trim().toLowerCase().replace(/\s+/g, '');
}

export function lookupUnit(symbol: string | null | undefined): UnitDef | null {
  if (!symbol) return null;
  return UNIT_TABLE[normalizeUnitSymbol(symbol)] ?? null;
}

export interface BaseAmount {
  value: number;
  unit: SizeUnit;
}

/**
 * Convert an amount in a source unit to a base unit (g / ml / pcs).
 * Prefers an explicit SI mapping from the source when present.
 */
export function toBaseAmount(
  value: number,
  unit: string | null | undefined,
  si?: { unit?: string | null | undefined; factor?: number | null | undefined },
): BaseAmount | null {
  if (!Number.isFinite(value)) return null;
  if (si?.unit && si.factor && Number.isFinite(si.factor)) {
    const siDef = lookupUnit(si.unit);
    if (siDef) return { value: value * si.factor * siDef.factor, unit: siDef.base };
  }
  const def = lookupUnit(unit);
  if (!def) return null;
  return { value: value * def.factor, unit: def.base };
}

/** Round to 4 decimals — enough for DKK/kg without floating-point noise. */
export function round4(n: number): number {
  return Math.round(n * 10_000) / 10_000;
}
