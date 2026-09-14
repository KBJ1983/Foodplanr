/**
 * Salling Group "Anti Food Waste" API v1 — minimal typing of what we read.
 * Shape per developer.sallinggroup.dev; re-verify once Terms are stored and
 * status becomes `approved` (docs/legal/salling.md).
 */
import { z } from 'zod';

export const SallingClearanceSchema = z
  .object({
    offer: z
      .object({
        currency: z.string().default('DKK'),
        ean: z.string().nullable().optional(),
        endTime: z.string(),
        newPrice: z.number(),
        originalPrice: z.number().nullable().optional(),
        stock: z.number().nullable().optional(),
        stockUnit: z.string().nullable().optional(),
      })
      .loose(),
    product: z
      .object({
        /** Salling calls the product name "description". It is the varenavn, nothing more. */
        description: z.string(),
        ean: z.string().nullable().optional(),
      })
      .loose(),
  })
  .loose();

export const SallingFoodWasteStoreSchema = z
  .object({
    store: z
      .object({
        id: z.string(),
        brand: z.string(),
        address: z.object({ zip: z.string().nullable().optional() }).loose().optional(),
        coordinates: z.tuple([z.number(), z.number()]).nullable().optional(),
      })
      .loose(),
    clearances: z.array(SallingClearanceSchema),
  })
  .loose();

export type SallingFoodWasteStore = z.infer<typeof SallingFoodWasteStoreSchema>;

/** Exactly the registry's approved_fields for `salling`. */
export interface SallingWhitelistedRecord {
  store_id: string;
  store_brand: string;
  store_zip: string | null;
  store_lat: number | null;
  store_lng: number | null;
  ean: string | null;
  heading: string;
  price: number;
  price_before: number | null;
  currency: string;
  run_till: string;
  stock: number | null;
  stock_unit: string | null;
  [key: string]: unknown;
}
