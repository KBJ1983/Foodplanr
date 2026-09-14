import { index, integer, numeric, pgTable, text, timestamp, uniqueIndex, uuid } from 'drizzle-orm/pg-core';

/** Our ingredient ontology. Frida-seeded, admin-curated. Recipes and offer matches reference ids, never free text. */
export const ingredient = pgTable(
  'ingredient',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    nameDa: text('name_da').notNull(),
    nameEn: text('name_en'),
    fridaFoodId: integer('frida_food_id'),
    category: text('category'),
    /** g | ml | pcs */
    defaultUnit: text('default_unit').notNull().default('g'),
    densityGPerMl: numeric('density_g_per_ml', { precision: 6, scale: 3 }),
    /** Typical grams per piece, for pcs ↔ g conversion (e.g. egg ≈ 58). */
    gramsPerPiece: numeric('grams_per_piece', { precision: 8, scale: 2 }),
    /** Manual/derived fallback price when no offer or history exists. DKK per default_unit×1000 (kg/l) or per pcs. */
    defaultPricePerUnit: numeric('default_price_per_unit', { precision: 10, scale: 2 }),
    aliases: text('aliases').array().notNull().default([]),
    createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [
    uniqueIndex('ingredient_frida_food_id_uq').on(t.fridaFoodId),
    index('ingredient_name_da_idx').on(t.nameDa),
  ],
);

export const ingredientNutrition = pgTable('ingredient_nutrition', {
  ingredientId: uuid('ingredient_id')
    .primaryKey()
    .references(() => ingredient.id, { onDelete: 'cascade' }),
  kcal100g: numeric('kcal_100g', { precision: 7, scale: 2 }),
  kj100g: numeric('kj_100g', { precision: 8, scale: 2 }),
  proteinG: numeric('protein_g', { precision: 6, scale: 2 }),
  fatG: numeric('fat_g', { precision: 6, scale: 2 }),
  carbG: numeric('carb_g', { precision: 6, scale: 2 }),
  fiberG: numeric('fiber_g', { precision: 6, scale: 2 }),
  /** Registry source id — enables "delete everything from source X". */
  source: text('source').notNull(),
  sourceVersion: text('source_version').notNull(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
});
