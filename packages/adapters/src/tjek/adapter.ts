import {
  lookupUnit,
  normalizeQuantity,
  parseQuantityFromHeading,
  splitBundleHeading,
  type NormalizedOffer,
  type RawQuantity,
} from '@madplan/domain';
import type { AdapterContext, OfferAdapter, WhitelistedRecord } from '../types.js';
import type { TjekClient } from './client.js';
import type { TjekOffer, TjekWhitelistedRecord } from './types.js';

const PAGE_SIZE = 100;

/**
 * Projects a raw SDK offer onto exactly the approved fields. This is the only
 * place raw Tjek objects are touched; nothing else in the codebase sees them.
 */
export function toWhitelisted(o: TjekOffer): TjekWhitelistedRecord {
  const q = o.quantity ?? null;
  return {
    dealer_id: o.dealer_id,
    catalog_id: o.catalog_id ?? null,
    offer_id: o.id,
    heading: o.heading,
    price: o.pricing.price,
    price_before: o.pricing.pre_price ?? null,
    currency: o.pricing.currency ?? 'DKK',
    run_from: o.run_from,
    run_till: o.run_till,
    quantity_size_from: q?.size?.from ?? null,
    quantity_size_to: q?.size?.to ?? null,
    quantity_unit: q?.unit?.symbol ?? null,
    quantity_si_unit: q?.unit?.si?.symbol ?? null,
    quantity_si_factor: q?.unit?.si?.factor ?? null,
    quantity_pieces_from: q?.pieces?.from ?? null,
    quantity_pieces_to: q?.pieces?.to ?? null,
  };
}

function rawQuantity(r: TjekWhitelistedRecord): RawQuantity | null {
  // Tjek's "no information" quantity is size 1..1 × pieces 1..1 in a count unit
  // (or no unit). That carries nothing, so fall back to parsing the heading.
  const sizeIsOne = (r.quantity_size_from ?? 1) === 1 && (r.quantity_size_to ?? 1) === 1;
  const piecesIsOne = (r.quantity_pieces_from ?? 1) === 1 && (r.quantity_pieces_to ?? 1) === 1;
  const unitDef = lookupUnit(r.quantity_unit);
  const unitIsCount = unitDef === null || unitDef.base === 'pcs';
  if (sizeIsOne && piecesIsOne && unitIsCount) return parseQuantityFromHeading(r.heading);
  return {
    unit: r.quantity_unit,
    siUnit: r.quantity_si_unit,
    siFactor: r.quantity_si_factor,
    sizeFrom: r.quantity_size_from,
    sizeTo: r.quantity_size_to,
    piecesFrom: r.quantity_pieces_from,
    piecesTo: r.quantity_pieces_to,
  };
}

/** Pure — used by the adapter and directly testable. */
export function normalizeTjekRecord(r: TjekWhitelistedRecord): NormalizedOffer[] {
  if (r.currency && r.currency !== 'DKK') return [];
  const variants = splitBundleHeading(r.heading);
  const qty = normalizeQuantity(r.price, rawQuantity(r));
  const isBundle = variants.length > 1;
  return variants.map((heading, i) => ({
    source: 'tjek',
    sourceId: isBundle ? `${r.offer_id}#${i + 1}` : r.offer_id,
    retailerExternalId: r.dealer_id,
    catalogExternalId: r.catalog_id,
    storeExternalId: null,
    heading,
    price: r.price,
    priceBefore: r.price_before,
    currency: 'DKK',
    runFrom: r.run_from,
    runTill: r.run_till,
    ean: null,
    kind: 'weekly',
    bundleIndex: isBundle ? i + 1 : 0,
    normalizedBy: 'rule',
    ...qty,
  }));
}

export class TjekAdapter implements OfferAdapter {
  readonly source = 'tjek' as const;

  constructor(private readonly client: TjekClient) {}

  async fetch(ctx: AdapterContext): Promise<WhitelistedRecord[]> {
    const dealers = await this.client.listDealers();
    const dealerIds = ctx.dealerIds?.length
      ? dealers.map((d) => d.id).filter((id) => ctx.dealerIds!.includes(id))
      : dealers.map((d) => d.id);
    const catalogs = await this.client.listCatalogs(dealerIds);

    const out: WhitelistedRecord[] = [];
    for (const catalog of catalogs) {
      let offset = 0;
      for (;;) {
        const page = await this.client.listOffers(catalog.id, offset, PAGE_SIZE);
        for (const o of page) out.push(toWhitelisted(o));
        if (page.length < PAGE_SIZE) break;
        offset += PAGE_SIZE;
      }
    }
    ctx.logger?.info(`[tjek] ${catalogs.length} catalogs → ${out.length} offers`);
    return out;
  }

  normalize(record: WhitelistedRecord): NormalizedOffer[] {
    return normalizeTjekRecord(record as TjekWhitelistedRecord);
  }
}
