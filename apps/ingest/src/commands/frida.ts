import { readFile } from 'node:fs/promises';
import { resolve } from 'node:path';
import { importFridaCsv } from '@madplan/adapters';
import { DrizzleIngredientRepository, MemoryIngredientRepository, createDb } from '@madplan/db';
import { assertSourceAllowed, getSource, resolveEnv, whitelistRecords } from '@madplan/legal';
import { secrets } from '../env.js';

export interface FridaCommandOptions {
  file: string;
  version: string;
  dryRun: boolean;
  json: boolean;
}

/**
 * Frida is `open` — the gate allows live use, but the dataset itself is
 * downloaded manually (docs/legal/frida.md) and passed in as a CSV. Nothing is
 * fetched from the network here.
 */
export async function fridaCommand(opts: FridaCommandOptions): Promise<void> {
  const env = resolveEnv();
  assertSourceAllowed('frida', 'live', env);

  // Resolve relative to where the user invoked pnpm, not the package directory.
  const filePath = resolve(process.env.INIT_CWD ?? process.cwd(), opts.file);
  const text = await readFile(filePath, 'utf8');
  const foods = importFridaCsv(text, { version: opts.version });
  // Belt and braces: every record must pass the strict whitelist before storage.
  whitelistRecords('frida', foods, { strict: true });

  const sec = secrets();
  let result: { inserted: number; updated: number } | null = null;
  let close: (() => Promise<void>) | null = null;
  if (!opts.dryRun) {
    if (sec.databaseUrl) {
      const conn = createDb(sec.databaseUrl);
      close = conn.close;
      result = await new DrizzleIngredientRepository(conn.db).upsertFridaFoods(foods);
    } else {
      console.warn('DATABASE_URL not set — falling back to in-memory repository (nothing persisted).');
      result = await new MemoryIngredientRepository().upsertFridaFoods(foods);
    }
  }

  try {
    if (opts.json) {
      console.log(JSON.stringify({ count: foods.length, result, foods }, null, 2));
      return;
    }
    const withKcal = foods.filter((f) => f.kcal_100g !== null).length;
    console.log(`\n[frida] parsed ${foods.length} foods from ${opts.file} (version ${opts.version}); ${withKcal} with kcal`);
    if (result) console.log(`persisted: inserted=${result.inserted} updated=${result.updated}`);
    else console.log('dry-run: nothing written');
    console.table(
      foods.slice(0, 15).map((f) => ({
        id: f.frida_food_id,
        name_da: f.name_da,
        group: f.food_group ?? '',
        kcal: f.kcal_100g ?? '',
        protein: f.protein_g ?? '',
        fat: f.fat_g ?? '',
        carb: f.carb_g ?? '',
        fiber: f.fiber_g ?? '',
      })),
    );
    console.log(`\nAttribution required wherever shown: "${getSource('frida').attribution}"`);
  } finally {
    if (close) await close();
  }
}
