import {
  boolean,
  index,
  integer,
  numeric,
  pgTable,
  primaryKey,
  text,
  timestamp,
  uuid,
} from 'drizzle-orm/pg-core';
import { recipeOriginEnum, recipeStatusEnum } from './enums';
import { ingredient } from './ingredients';
import { appUser } from './users';

/** 100 % our own (or explicitly licensed) recipes. No import from recipe sites — ever. */
export const recipe = pgTable(
  'recipe',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    title: text('title').notNull(),
    slug: text('slug').notNull().unique(),
    servingsBase: integer('servings_base').notNull().default(4),
    prepMin: integer('prep_min'),
    tags: text('tags').array().notNull().default([]),
    status: recipeStatusEnum('status').notNull().default('draft'),
    authorId: uuid('author_id').references(() => appUser.id),
    origin: recipeOriginEnum('origin').notNull().default('own'),
    /** Required when origin = licensed: reference to agreement in docs/legal/. */
    licenseRef: text('license_ref'),
    createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [index('recipe_status_idx').on(t.status)],
);

export const recipeIngredient = pgTable(
  'recipe_ingredient',
  {
    recipeId: uuid('recipe_id')
      .notNull()
      .references(() => recipe.id, { onDelete: 'cascade' }),
    ingredientId: uuid('ingredient_id')
      .notNull()
      .references(() => ingredient.id),
    qty: numeric('qty', { precision: 10, scale: 3 }).notNull(),
    /** g | ml | pcs — must be convertible to the ingredient's default_unit. */
    unit: text('unit').notNull(),
    optional: boolean('optional').notNull().default(false),
    group: text('group'),
    ord: integer('ord').notNull().default(0),
  },
  (t) => [primaryKey({ columns: [t.recipeId, t.ingredientId, t.ord] })],
);

export const recipeStep = pgTable(
  'recipe_step',
  {
    recipeId: uuid('recipe_id')
      .notNull()
      .references(() => recipe.id, { onDelete: 'cascade' }),
    ord: integer('ord').notNull(),
    text: text('text').notNull(),
  },
  (t) => [primaryKey({ columns: [t.recipeId, t.ord] })],
);

/** Computed from recipe_ingredient × ingredient_nutrition. */
export const recipeNutrition = pgTable('recipe_nutrition', {
  recipeId: uuid('recipe_id')
    .primaryKey()
    .references(() => recipe.id, { onDelete: 'cascade' }),
  kcalPerServing: numeric('kcal_per_serving', { precision: 8, scale: 1 }),
  proteinG: numeric('protein_g', { precision: 7, scale: 1 }),
  fatG: numeric('fat_g', { precision: 7, scale: 1 }),
  carbG: numeric('carb_g', { precision: 7, scale: 1 }),
  fiberG: numeric('fiber_g', { precision: 7, scale: 1 }),
  computedAt: timestamp('computed_at', { withTimezone: true }).notNull().defaultNow(),
});
