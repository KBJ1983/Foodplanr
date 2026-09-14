/**
 * Repository interfaces + two implementations: Drizzle (Postgres) and in-memory
 * (tests / dry-run). The ingest CLI only talks to these interfaces.
 */
import { and, eq, inArray, sql } from 'drizzle-orm';
import type { NormalizedOffer } from '@madplan/domain';
import type { FridaFood } from '@madplan/adapters';
import { listSources, type SourceId } from '@madplan/legal';
import type { Db } from './client';
import * as s from './schema/index';

export interface UpsertOffersResult {
  inserted: number;
  updated: number;
  retailersCreated: string[];
}

export interface OfferRepository {
  upsertOffers(offers: readonly NormalizedOffer[]): Promise<UpsertOffersResult>;
  /** Remove every row from a source — for when an agreement ends (brief §0.8). */
  deleteBySource(source: SourceId): Promise<number>;
}

export interface IngredientRepository {
  upsertFridaFoods(foods: readonly FridaFood[]): Promise<{ inserted: number; updated: number }>;
}

export interface SourceRegistryRepository {
  syncFromCode(): Promise<void>;
  markSync(source: SourceId, error: string | null): Promise<void>;
}

const num = (n: number | null | undefined): string | null => (n === null || n === undefined ? null : String(n));

function slugify(input: string): string {
  return input
    .toLowerCase()
    .replace(/[æ]/g, 'ae')
    .replace(/[ø]/g, 'oe')
    .replace(/[å]/g, 'aa')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
}

// ---------------------------------------------------------------------------
// Drizzle implementation
// ---------------------------------------------------------------------------

export class DrizzleOfferRepository implements OfferRepository {
  constructor(private readonly db: Db) {}

  private async resolveRetailers(offers: readonly NormalizedOffer[]): Promise<{
    map: Map<string, string>;
    created: string[];
  }> {
    const map = new Map<string, string>();
    const created: string[] = [];
    const keys = [...new Set(offers.map((o) => `${o.source}|${o.retailerExternalId}`))];

    for (const key of keys) {
      const [source, ext] = key.split('|') as [SourceId, string];
      const column = source === 'salling' ? s.retailer.sallingBrand : s.retailer.tjekDealerId;
      const existing = await this.db.select({ id: s.retailer.id }).from(s.retailer).where(eq(column, ext)).limit(1);
      if (existing[0]) {
        map.set(key, existing[0].id);
        continue;
      }
      // Unknown retailer: create a stub the admin renames later. Never blocks ingest.
      const values = {
        name: ext,
        slug: `${source}-${slugify(ext)}`,
        ...(source === 'salling' ? { sallingBrand: ext } : { tjekDealerId: ext }),
      };
      const [row] = await this.db.insert(s.retailer).values(values).returning({ id: s.retailer.id });
      map.set(key, row!.id);
      created.push(ext);
    }
    return { map, created };
  }

  async upsertOffers(offers: readonly NormalizedOffer[]): Promise<UpsertOffersResult> {
    if (offers.length === 0) return { inserted: 0, updated: 0, retailersCreated: [] };
    const { map, created } = await this.resolveRetailers(offers);

    const existing = await this.db
      .select({ sourceId: s.offer.sourceId })
      .from(s.offer)
      .where(
        and(
          eq(s.offer.source, offers[0]!.source),
          inArray(
            s.offer.sourceId,
            offers.map((o) => o.sourceId),
          ),
        ),
      );
    const existingIds = new Set(existing.map((e) => e.sourceId));

    const rows = offers.map((o) => ({
      source: o.source,
      sourceId: o.sourceId,
      retailerId: map.get(`${o.source}|${o.retailerExternalId}`)!,
      catalogId: o.catalogExternalId,
      heading: o.heading,
      price: String(o.price),
      priceBefore: num(o.priceBefore),
      currency: o.currency,
      runFrom: new Date(o.runFrom),
      runTill: new Date(o.runTill),
      sizeMin: num(o.sizeMin),
      sizeMax: num(o.sizeMax),
      sizeUnit: o.sizeUnit,
      pieces: num(o.pieces),
      unitPriceDkk: num(o.unitPriceDkk),
      unitPriceKind: o.unitPriceKind,
      ean: o.ean,
      normalizedBy: o.normalizedBy,
      kind: o.kind,
      bundleIndex: o.bundleIndex,
      updatedAt: new Date(),
    }));

    for (let i = 0; i < rows.length; i += 500) {
      const chunk = rows.slice(i, i + 500);
      await this.db
        .insert(s.offer)
        .values(chunk)
        .onConflictDoUpdate({
          target: [s.offer.source, s.offer.sourceId],
          set: {
            heading: sql`excluded.heading`,
            price: sql`excluded.price`,
            priceBefore: sql`excluded.price_before`,
            runFrom: sql`excluded.run_from`,
            runTill: sql`excluded.run_till`,
            sizeMin: sql`excluded.size_min`,
            sizeMax: sql`excluded.size_max`,
            sizeUnit: sql`excluded.size_unit`,
            pieces: sql`excluded.pieces`,
            unitPriceDkk: sql`excluded.unit_price_dkk`,
            unitPriceKind: sql`excluded.unit_price_kind`,
            ean: sql`excluded.ean`,
            updatedAt: sql`now()`,
          },
        });
    }

    const updated = rows.filter((r) => existingIds.has(r.sourceId)).length;
    return { inserted: rows.length - updated, updated, retailersCreated: created };
  }

  async deleteBySource(source: SourceId): Promise<number> {
    const deleted = await this.db.delete(s.offer).where(eq(s.offer.source, source)).returning({ id: s.offer.id });
    return deleted.length;
  }
}

export class DrizzleIngredientRepository implements IngredientRepository {
  constructor(private readonly db: Db) {}

  async upsertFridaFoods(foods: readonly FridaFood[]): Promise<{ inserted: number; updated: number }> {
    let inserted = 0;
    let updated = 0;
    await this.db.transaction(async (tx) => {
      for (const f of foods) {
        const found = await tx
          .select({ id: s.ingredient.id })
          .from(s.ingredient)
          .where(eq(s.ingredient.fridaFoodId, f.frida_food_id))
          .limit(1);
        let id: string;
        if (found[0]) {
          id = found[0].id;
          await tx
            .update(s.ingredient)
            .set({ nameDa: f.name_da, nameEn: f.name_en, category: f.food_group, updatedAt: new Date() })
            .where(eq(s.ingredient.id, id));
          updated++;
        } else {
          const [row] = await tx
            .insert(s.ingredient)
            .values({ nameDa: f.name_da, nameEn: f.name_en, fridaFoodId: f.frida_food_id, category: f.food_group })
            .returning({ id: s.ingredient.id });
          id = row!.id;
          inserted++;
        }
        await tx
          .insert(s.ingredientNutrition)
          .values({
            ingredientId: id,
            kcal100g: num(f.kcal_100g),
            kj100g: num(f.kj_100g),
            proteinG: num(f.protein_g),
            fatG: num(f.fat_g),
            carbG: num(f.carb_g),
            fiberG: num(f.fiber_g),
            source: 'frida',
            sourceVersion: f.source_version,
          })
          .onConflictDoUpdate({
            target: s.ingredientNutrition.ingredientId,
            set: {
              kcal100g: sql`excluded.kcal_100g`,
              kj100g: sql`excluded.kj_100g`,
              proteinG: sql`excluded.protein_g`,
              fatG: sql`excluded.fat_g`,
              carbG: sql`excluded.carb_g`,
              fiberG: sql`excluded.fiber_g`,
              sourceVersion: sql`excluded.source_version`,
              updatedAt: sql`now()`,
            },
          });
      }
    });
    return { inserted, updated };
  }
}

export class DrizzleSourceRegistryRepository implements SourceRegistryRepository {
  constructor(private readonly db: Db) {}

  async syncFromCode(): Promise<void> {
    for (const e of listSources()) {
      await this.db
        .insert(s.sourceRegistry)
        .values({
          source: e.source,
          displayName: e.display_name,
          legalStatus: e.legal_status,
          approvedFields: [...e.approved_fields],
          attribution: e.attribution,
          agreementRef: e.agreement_ref,
          reviewedAt: e.reviewed_at,
          note: e.note,
        })
        .onConflictDoUpdate({
          target: s.sourceRegistry.source,
          set: {
            displayName: sql`excluded.display_name`,
            legalStatus: sql`excluded.legal_status`,
            approvedFields: sql`excluded.approved_fields`,
            attribution: sql`excluded.attribution`,
            agreementRef: sql`excluded.agreement_ref`,
            reviewedAt: sql`excluded.reviewed_at`,
            note: sql`excluded.note`,
          },
        });
    }
  }

  async markSync(source: SourceId, error: string | null): Promise<void> {
    await this.db
      .update(s.sourceRegistry)
      .set({ lastSyncAt: new Date(), lastError: error })
      .where(eq(s.sourceRegistry.source, source));
  }
}

// ---------------------------------------------------------------------------
// In-memory implementation (tests, dry-run)
// ---------------------------------------------------------------------------

export class MemoryOfferRepository implements OfferRepository {
  readonly offers = new Map<string, NormalizedOffer>();
  readonly retailers = new Set<string>();

  async upsertOffers(offers: readonly NormalizedOffer[]): Promise<UpsertOffersResult> {
    let inserted = 0;
    let updated = 0;
    const created: string[] = [];
    for (const o of offers) {
      const rk = `${o.source}|${o.retailerExternalId}`;
      if (!this.retailers.has(rk)) {
        this.retailers.add(rk);
        created.push(o.retailerExternalId);
      }
      const key = `${o.source}|${o.sourceId}`;
      if (this.offers.has(key)) updated++;
      else inserted++;
      this.offers.set(key, o);
    }
    return { inserted, updated, retailersCreated: created };
  }

  async deleteBySource(source: SourceId): Promise<number> {
    let n = 0;
    for (const [k, v] of this.offers) {
      if (v.source === source) {
        this.offers.delete(k);
        n++;
      }
    }
    return n;
  }
}

export class MemoryIngredientRepository implements IngredientRepository {
  readonly foods = new Map<number, FridaFood>();
  async upsertFridaFoods(foods: readonly FridaFood[]): Promise<{ inserted: number; updated: number }> {
    let inserted = 0;
    let updated = 0;
    for (const f of foods) {
      if (this.foods.has(f.frida_food_id)) updated++;
      else inserted++;
      this.foods.set(f.frida_food_id, f);
    }
    return { inserted, updated };
  }
}
