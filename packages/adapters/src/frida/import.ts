/**
 * Frida (DTU) import — builds our ingredient ontology seed from the open
 * Frida dataset. Input is the "normalised"/long export: one row per
 * (food, parameter). Column names differ between Frida versions and between
 * the Danish and English exports, so the mapping is configurable; the
 * defaults cover the names we know.
 *
 * Output contains only the registry's approved fields for `frida`.
 *
 * Attribution is mandatory wherever these numbers are shown:
 *   "Fødevaredata (frida.fooddata.dk), version 5.5, 2025, DTU Fødevareinstituttet"
 */
import { parseCsv } from './csv';

export interface FridaColumnMap {
  foodId: readonly string[];
  nameDa: readonly string[];
  nameEn: readonly string[];
  foodGroup: readonly string[];
  parameterName: readonly string[];
  value: readonly string[];
}

export const DEFAULT_FRIDA_COLUMNS: FridaColumnMap = {
  foodId: ['FoodID', 'FoodId', 'FødevareID', 'food_id'],
  nameDa: ['FødevareNavn', 'FoodName_DK', 'FoodNameDa', 'FoodName', 'Fødevare'],
  nameEn: ['FoodName_EN', 'FoodNameEn', 'FoodNameEnglish', 'FoodName_English'],
  foodGroup: ['FoodGroup', 'FødevareGruppe', 'FoodGroupName', 'Gruppe'],
  parameterName: ['ParameterNavn', 'ParameterName', 'Parameter', 'Nutrient'],
  value: ['ResVal', 'Value', 'Værdi', 'ResultValue'],
};

/** Nutrients we keep, matched by parameter name (Danish or English). */
const NUTRIENT_MATCHERS: { key: FridaNutrientKey; re: RegExp }[] = [
  { key: 'kcal_100g', re: /^energi.*kcal|^energy.*kcal|kcal/i },
  { key: 'kj_100g', re: /^energi.*kj|^energy.*kj|\bkj\b/i },
  { key: 'protein_g', re: /^protein/i },
  { key: 'fat_g', re: /^fedt(?!syre)|^fat(?!ty)|^total fat|^fedt, total/i },
  { key: 'carb_g', re: /^kulhydrat.*(tilg|avail)|^carbohydrate.*(avail|by diff)|^kulhydrat$|^carbohydrate$/i },
  { key: 'fiber_g', re: /kostfib|dietary fib|^fibre|^fiber/i },
];

export type FridaNutrientKey = 'kcal_100g' | 'kj_100g' | 'protein_g' | 'fat_g' | 'carb_g' | 'fiber_g';

export interface FridaFood {
  frida_food_id: number;
  name_da: string;
  name_en: string | null;
  food_group: string | null;
  kcal_100g: number | null;
  kj_100g: number | null;
  protein_g: number | null;
  fat_g: number | null;
  carb_g: number | null;
  fiber_g: number | null;
  source_version: string;
  [key: string]: unknown;
}

export interface FridaImportOptions {
  columns?: Partial<FridaColumnMap>;
  version?: string;
}

function pick(row: Record<string, string>, candidates: readonly string[]): string | null {
  for (const c of candidates) {
    const v = row[c];
    if (v !== undefined && v !== '') return v;
  }
  return null;
}

function toNumber(raw: string | null): number | null {
  if (raw === null) return null;
  const n = Number(raw.replace(/\s/g, '').replace(',', '.'));
  return Number.isFinite(n) ? n : null;
}

export function matchNutrient(parameterName: string): FridaNutrientKey | null {
  for (const m of NUTRIENT_MATCHERS) if (m.re.test(parameterName.trim())) return m.key;
  return null;
}

/** Long-format rows → one FridaFood per food id. Pure. */
export function foodsFromRows(rows: readonly Record<string, string>[], opts: FridaImportOptions = {}): FridaFood[] {
  const cols: FridaColumnMap = { ...DEFAULT_FRIDA_COLUMNS, ...opts.columns };
  const version = opts.version ?? '5.5';
  const byId = new Map<number, FridaFood>();

  for (const row of rows) {
    const id = toNumber(pick(row, cols.foodId));
    if (id === null) continue;
    let food = byId.get(id);
    if (!food) {
      const nameDa = pick(row, cols.nameDa);
      if (!nameDa) continue;
      food = {
        frida_food_id: id,
        name_da: nameDa,
        name_en: pick(row, cols.nameEn),
        food_group: pick(row, cols.foodGroup),
        kcal_100g: null,
        kj_100g: null,
        protein_g: null,
        fat_g: null,
        carb_g: null,
        fiber_g: null,
        source_version: version,
      };
      byId.set(id, food);
    }
    const param = pick(row, cols.parameterName);
    if (!param) continue;
    const key = matchNutrient(param);
    if (!key) continue;
    const val = toNumber(pick(row, cols.value));
    if (val === null) continue;
    // First value wins; Frida lists each parameter once per food.
    if (food[key] === null) food[key] = val;
  }

  // Derive kcal from kJ when the export only carries kJ.
  for (const f of byId.values()) {
    if (f.kcal_100g === null && f.kj_100g !== null) f.kcal_100g = Math.round((f.kj_100g / 4.184) * 10) / 10;
  }
  return [...byId.values()].sort((a, b) => a.frida_food_id - b.frida_food_id);
}

export function importFridaCsv(text: string, opts: FridaImportOptions = {}): FridaFood[] {
  return foodsFromRows(parseCsv(text), opts);
}
