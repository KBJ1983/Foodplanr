import { boolean, date, integer, jsonb, numeric, pgTable, primaryKey, text, timestamp, uuid } from 'drizzle-orm/pg-core';
import { mealPlanStatusEnum } from './enums.js';
import { retailer } from './retail.js';
import { appUser } from './users.js';

/** Predefined meal plans — ours. `week_pattern` = [{day, recipe_id, servings}]. */
export const mealPlanTemplate = pgTable('meal_plan_template', {
  id: uuid('id').primaryKey().defaultRandom(),
  title: text('title').notNull(),
  description: text('description').notNull().default(''),
  tags: text('tags').array().notNull().default([]),
  weekPattern: jsonb('week_pattern').notNull(),
  targetKcal: integer('target_kcal'),
  targetPersons: integer('target_persons'),
  isPublic: boolean('is_public').notNull().default(false),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
});

/** A user's plan for one week. `days` = [{date, recipe_id, servings, kcal, est_price}]. */
export const mealPlan = pgTable('meal_plan', {
  id: uuid('id').primaryKey().defaultRandom(),
  userId: uuid('user_id')
    .notNull()
    .references(() => appUser.id, { onDelete: 'cascade' }),
  templateId: uuid('template_id').references(() => mealPlanTemplate.id, { onDelete: 'set null' }),
  weekStart: date('week_start').notNull(),
  persons: integer('persons').notNull(),
  kcalTarget: integer('kcal_target').notNull(),
  budget: numeric('budget', { precision: 10, scale: 2 }),
  retailerIds: uuid('retailer_ids').array().notNull().default([]),
  days: jsonb('days').notNull(),
  status: mealPlanStatusEnum('status').notNull().default('draft'),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
});

/** `lines` = [{ingredient_id, qty, unit, offer_id?, est_price}]. */
export const shoppingList = pgTable(
  'shopping_list',
  {
    mealPlanId: uuid('meal_plan_id')
      .notNull()
      .references(() => mealPlan.id, { onDelete: 'cascade' }),
    retailerId: uuid('retailer_id')
      .notNull()
      .references(() => retailer.id),
    lines: jsonb('lines').notNull(),
    estTotalDkk: numeric('est_total_dkk', { precision: 10, scale: 2 }),
    generatedAt: timestamp('generated_at', { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [primaryKey({ columns: [t.mealPlanId, t.retailerId] })],
);
