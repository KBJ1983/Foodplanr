/**
 * Minimal typing of the Tjek (ShopGun) v2 API objects. Only the parts we read
 * are typed; everything else is `unknown` and is dropped before storage.
 *
 * NOTE: The exact shape must be re-verified against the SDK once a commercial
 * agreement and API key exist (docs/legal/tjek.md). Fixtures follow this shape.
 */
import { z } from 'zod';

export const TjekQuantitySchema = z
  .object({
    unit: z
      .object({
        symbol: z.string().nullable().optional(),
        si: z
          .object({ symbol: z.string().nullable().optional(), factor: z.number().nullable().optional() })
          .nullable()
          .optional(),
      })
      .nullable()
      .optional(),
    size: z
      .object({ from: z.number().nullable().optional(), to: z.number().nullable().optional() })
      .nullable()
      .optional(),
    pieces: z
      .object({ from: z.number().nullable().optional(), to: z.number().nullable().optional() })
      .nullable()
      .optional(),
  })
  .nullable()
  .optional();

/** `.loose()` — raw payloads carry many more keys; we tolerate but never keep them. */
export const TjekOfferSchema = z
  .object({
    id: z.string(),
    heading: z.string(),
    pricing: z.object({
      price: z.number(),
      pre_price: z.number().nullable().optional(),
      currency: z.string().default('DKK'),
    }),
    quantity: TjekQuantitySchema,
    run_from: z.string(),
    run_till: z.string(),
    dealer_id: z.string(),
    catalog_id: z.string().nullable().optional(),
    store_id: z.string().nullable().optional(),
  })
  .loose();

export type TjekOffer = z.infer<typeof TjekOfferSchema>;

export const TjekDealerSchema = z.object({ id: z.string(), name: z.string() }).loose();
export type TjekDealer = z.infer<typeof TjekDealerSchema>;

export const TjekCatalogSchema = z
  .object({
    id: z.string(),
    dealer_id: z.string(),
    run_from: z.string(),
    run_till: z.string(),
    offer_count: z.number().optional(),
  })
  .loose();
export type TjekCatalog = z.infer<typeof TjekCatalogSchema>;

/** Exactly the registry's approved_fields for `tjek`. */
export interface TjekWhitelistedRecord {
  dealer_id: string;
  catalog_id: string | null;
  offer_id: string;
  heading: string;
  price: number;
  price_before: number | null;
  currency: string;
  run_from: string;
  run_till: string;
  quantity_size_from: number | null;
  quantity_size_to: number | null;
  quantity_unit: string | null;
  quantity_si_unit: string | null;
  quantity_si_factor: number | null;
  quantity_pieces_from: number | null;
  quantity_pieces_to: number | null;
  [key: string]: unknown;
}
