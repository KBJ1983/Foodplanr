import { boolean, integer, pgTable, text, timestamp, uuid } from 'drizzle-orm/pg-core';
import { userPlanEnum } from './enums.js';

/** Named app_user because `user` is reserved in Postgres. */
export const appUser = pgTable('app_user', {
  id: uuid('id').primaryKey().defaultRandom(),
  email: text('email').notNull().unique(),
  plan: userPlanEnum('plan').notNull().default('free'),
  isAdmin: boolean('is_admin').notNull().default(false),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
});

export const entitlement = pgTable('entitlement', {
  plan: userPlanEnum('plan').primaryKey(),
  maxSavedPlans: integer('max_saved_plans').notNull(),
  maxWeeksAhead: integer('max_weeks_ahead').notNull(),
  lunchbox: boolean('lunchbox').notNull().default(false),
  templatesCatalog: boolean('templates_catalog').notNull().default(false),
});
