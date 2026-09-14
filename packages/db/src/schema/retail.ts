import {
  date,
  index,
  integer,
  numeric,
  pgTable,
  primaryKey,
  real,
  text,
  timestamp,
  uniqueIndex,
  uuid,
} from 'drizzle-orm/pg-core';
import { checkoutModeEnum, normalizedByEnum, offerKindEnum, unitPriceKindEnum } from './enums';
import { ingredient } from './ingredients';

export const retailer = pgTable('retailer', {
  id: uuid('id').primaryKey().defaultRandom(),
  name: text('name').notNull(),
  slug: text('slug').notNull().unique(),
  tjekDealerId: text('tjek_dealer_id').unique(),
  sallingBrand: text('salling_brand').unique(),
  checkoutMode: checkoutModeEnum('checkout_mode').notNull().default('copy_list'),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
});

export const store = pgTable(
  'store',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    retailerId: uuid('retailer_id')
      .notNull()
      .references(() => retailer.id, { onDelete: 'cascade' }),
    source: text('source').notNull(),
    externalId: text('external_id').notNull(),
    zip: text('zip'),
    lat: real('lat'),
    lng: real('lng'),
  },
  (t) => [uniqueIndex('store_source_external_uq').on(t.source, t.externalId)],
);

/**
 * Whitelisted facts only: name, price, period, quantity, EAN, retailer.
 * No description, images, page references or raw payloads — by design and by
 * schema. Expired rows are deleted after 14 days; numbers live on in price_history.
 */
export const offer = pgTable(
  'offer',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    source: text('source').notNull(),
    sourceId: text('source_id').notNull(),
    retailerId: uuid('retailer_id')
      .notNull()
      .references(() => retailer.id, { onDelete: 'cascade' }),
    storeId: uuid('store_id').references(() => store.id, { onDelete: 'set null' }),
    catalogId: text('catalog_id'),
    heading: text('heading').notNull(),
    price: numeric('price', { precision: 10, scale: 2 }).notNull(),
    priceBefore: numeric('price_before', { precision: 10, scale: 2 }),
    currency: text('currency').notNull().default('DKK'),
    runFrom: timestamp('run_from', { withTimezone: true }).notNull(),
    runTill: timestamp('run_till', { withTimezone: true }).notNull(),
    sizeMin: numeric('size_min', { precision: 12, scale: 4 }),
    sizeMax: numeric('size_max', { precision: 12, scale: 4 }),
    /** g | ml | pcs */
    sizeUnit: text('size_unit'),
    pieces: numeric('pieces', { precision: 8, scale: 2 }),
    unitPriceDkk: numeric('unit_price_dkk', { precision: 12, scale: 4 }),
    unitPriceKind: unitPriceKindEnum('unit_price_kind').notNull().default('unknown'),
    ean: text('ean'),
    ingredientId: uuid('ingredient_id').references(() => ingredient.id, { onDelete: 'set null' }),
    matchConfidence: real('match_confidence'),
    normalizedBy: normalizedByEnum('normalized_by').notNull().default('rule'),
    kind: offerKindEnum('kind').notNull().default('weekly'),
    bundleIndex: integer('bundle_index').notNull().default(0),
    ingestedAt: timestamp('ingested_at', { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [
    uniqueIndex('offer_source_source_id_uq').on(t.source, t.sourceId),
    index('offer_retailer_run_till_idx').on(t.retailerId, t.runTill),
    index('offer_ingredient_idx').on(t.ingredientId),
    index('offer_unmatched_idx').on(t.matchConfidence),
  ],
);

/** Derived, numbers only. Survives offer retention deletes. */
export const priceHistory = pgTable(
  'price_history',
  {
    ingredientId: uuid('ingredient_id')
      .notNull()
      .references(() => ingredient.id, { onDelete: 'cascade' }),
    retailerId: uuid('retailer_id')
      .notNull()
      .references(() => retailer.id, { onDelete: 'cascade' }),
    date: date('date').notNull(),
    unitPriceDkk: numeric('unit_price_dkk', { precision: 12, scale: 4 }).notNull(),
    source: text('source').notNull(),
  },
  (t) => [primaryKey({ columns: [t.ingredientId, t.retailerId, t.date, t.source] })],
);
