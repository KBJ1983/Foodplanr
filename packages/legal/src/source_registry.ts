/**
 * Source rights registry — the single source of truth for which external data
 * sources we may use, in which mode, and which fields we may store.
 *
 * HARD RULE (brief §0): no source is used in production without documented
 * rights. Changing a status to `approved` requires an `agreement_ref` pointing
 * at a document in docs/legal/. The schema below enforces that invariant.
 */
import { z } from 'zod';

export const LEGAL_STATUSES = ['approved', 'pending', 'blocked', 'open'] as const;
export type LegalStatus = (typeof LEGAL_STATUSES)[number];

export const SOURCE_IDS = [
  'tjek',
  'salling',
  'frida',
  'openfoodfacts',
  'coop',
  'rema_product_api',
  'nemlig_web_api',
  'recipe_sites',
] as const;
export type SourceId = (typeof SOURCE_IDS)[number];

export const SourceEntrySchema = z
  .object({
    source: z.enum(SOURCE_IDS),
    display_name: z.string().min(1),
    legal_status: z.enum(LEGAL_STATUSES),
    /** Exact record keys an adapter may emit for this source. Nothing else is stored. */
    approved_fields: z.array(z.string().min(1)).readonly(),
    /** Attribution text shown wherever this source's data is displayed. Required for `open`. */
    attribution: z.string().nullable(),
    /** Path under docs/legal/ (or external reference) to the agreement/terms. Required for `approved`. */
    agreement_ref: z.string().nullable(),
    /** ISO date of last legal review. */
    reviewed_at: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
    /** Free-text note for humans: why this status, what is missing. */
    note: z.string(),
  })
  .refine((e) => e.legal_status !== 'approved' || (e.agreement_ref && e.agreement_ref.length > 0), {
    message: 'approved sources must reference a stored agreement (agreement_ref)',
    path: ['agreement_ref'],
  })
  .refine((e) => e.legal_status !== 'open' || (e.attribution && e.attribution.length > 0), {
    message: 'open sources must define attribution text',
    path: ['attribution'],
  })
  .refine((e) => e.legal_status !== 'blocked' || e.approved_fields.length === 0, {
    message: 'blocked sources may not whitelist any fields',
    path: ['approved_fields'],
  });

export type SourceEntry = z.infer<typeof SourceEntrySchema>;

/** Fields that must never appear in any stored record, regardless of source. */
export const GLOBALLY_FORBIDDEN_FIELDS = [
  'description',
  'image',
  'images',
  'image_url',
  'thumbnail',
  'logo',
  'branding',
  'publication',
  'pages',
  'catalog_page',
  'text',
  'html',
  'recipe',
  'raw',
  'payload',
] as const;

export const FRIDA_ATTRIBUTION =
  'Fødevaredata (frida.fooddata.dk), version 5.5, 2025, DTU Fødevareinstituttet';

const registry: readonly SourceEntry[] = [
  {
    source: 'tjek',
    display_name: 'Tjek / eTilbudsavis (official API)',
    legal_status: 'pending',
    approved_fields: [
      'dealer_id',
      'catalog_id',
      'offer_id',
      'heading',
      'price',
      'price_before',
      'currency',
      'run_from',
      'run_till',
      'quantity_size_from',
      'quantity_size_to',
      'quantity_unit',
      'quantity_si_unit',
      'quantity_si_factor',
      'quantity_pieces_from',
      'quantity_pieces_to',
    ],
    attribution: null,
    agreement_ref: null,
    reviewed_at: '2026-09-14',
    note:
      'Dev key available, but commercial use (storage, price history, display in paid product) requires ' +
      'a written agreement via services@tjek.com. Fixtures only until agreement_ref is set.',
  },
  {
    source: 'salling',
    display_name: 'Salling Group API (Anti Food Waste, Stores)',
    legal_status: 'pending',
    approved_fields: [
      'store_id',
      'store_brand',
      'store_zip',
      'store_lat',
      'store_lng',
      'ean',
      'heading',
      'price',
      'price_before',
      'currency',
      'run_till',
      'stock',
      'stock_unit',
    ],
    attribution: null,
    agreement_ref: null,
    reviewed_at: '2026-09-14',
    note:
      'Free signup; portal Terms must be read, stored in docs/legal/salling-terms-<date>.md and confirmed ' +
      'to cover our use before status becomes approved. 10,000 calls/day.',
  },
  {
    source: 'frida',
    display_name: 'Frida — DTU Fødevareinstituttet food composition data',
    legal_status: 'open',
    approved_fields: [
      'frida_food_id',
      'name_da',
      'name_en',
      'food_group',
      'kcal_100g',
      'kj_100g',
      'protein_g',
      'fat_g',
      'carb_g',
      'fiber_g',
      'source_version',
    ],
    attribution: FRIDA_ATTRIBUTION,
    agreement_ref: 'docs/legal/frida.md',
    reviewed_at: '2026-09-14',
    note: 'Open dataset v5.5 (Dec 2025). Attribution mandatory wherever nutrition data is shown.',
  },
  {
    source: 'openfoodfacts',
    display_name: 'Open Food Facts (ODbL)',
    legal_status: 'pending',
    approved_fields: ['ean', 'kcal_100g', 'protein_g', 'fat_g', 'carb_g', 'fiber_g', 'allergens'],
    attribution: null,
    agreement_ref: null,
    reviewed_at: '2026-09-14',
    note:
      'ODbL share-alike may force us to publish derived ingredient_nutrition. Decision pending (brief §10). ' +
      'Adapter is not implemented until decided.',
  },
  {
    source: 'coop',
    display_name: 'Coop developer portal (Recipe/Store/Marketing API)',
    legal_status: 'blocked',
    approved_fields: [],
    attribution: null,
    agreement_ref: null,
    reviewed_at: '2026-09-14',
    note: 'Partner API, subscription key via agreement only.',
  },
  {
    source: 'rema_product_api',
    display_name: 'Rema 1000 product API (unofficial)',
    legal_status: 'blocked',
    approved_fields: [],
    attribution: null,
    agreement_ref: null,
    reviewed_at: '2026-09-14',
    note:
      'Technically reachable without login, but no documented licence; rema1000.dk terms apply. ' +
      'Rema offers are taken via Tjek instead. Ask Rema in writing.',
  },
  {
    source: 'nemlig_web_api',
    display_name: 'Nemlig website API (unofficial, user login)',
    legal_status: 'blocked',
    approved_fields: [],
    attribution: null,
    agreement_ref: null,
    reviewed_at: '2026-09-14',
    note: 'No licence. Contact Nemlig about partner integration.',
  },
  {
    source: 'recipe_sites',
    display_name: 'Recipe websites (Valdemarsro, Arla, Rema, Coop, ...)',
    legal_status: 'blocked',
    approved_fields: [],
    attribution: null,
    agreement_ref: null,
    reviewed_at: '2026-09-14',
    note: 'Blocked permanently. Copyright. We own our recipe pool; not even ingredient lists are imported.',
  },
];

/** Validated at module load so a bad edit fails fast, everywhere. */
export const SOURCE_REGISTRY: ReadonlyMap<SourceId, SourceEntry> = new Map(
  z.array(SourceEntrySchema).parse(registry).map((e) => [e.source, e]),
);

export function getSource(source: SourceId): SourceEntry {
  const entry = SOURCE_REGISTRY.get(source);
  if (!entry) throw new Error(`Unknown source '${source}'`);
  return entry;
}

export function listSources(): SourceEntry[] {
  return [...SOURCE_REGISTRY.values()];
}

/** Attribution lines to render wherever data from the given sources is displayed. */
export function attributionsFor(sources: Iterable<SourceId>): string[] {
  const out = new Set<string>();
  for (const s of sources) {
    const a = getSource(s).attribution;
    if (a) out.add(a);
  }
  return [...out];
}
