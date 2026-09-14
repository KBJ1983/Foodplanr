import { mkdir, writeFile } from 'node:fs/promises';
import { dirname, resolve } from 'node:path';
import { runOfferIngest, type IngestResult } from '@madplan/adapters';
import {
  DrizzleOfferRepository,
  DrizzleSourceRegistryRepository,
  MemoryOfferRepository,
  createDb,
  type OfferRepository,
} from '@madplan/db';
import { resolveEnv, type RunMode, type SourceId } from '@madplan/legal';
import { secrets } from '../env';

export interface OffersCommandOptions {
  source: SourceId;
  mode: RunMode;
  dryRun: boolean;
  json: boolean;
  dealerIds?: string[];
  zips?: string[];
  /** Write a snapshot (whitelisted, normalised offers only) for the web app to read while no DB exists. */
  out?: string;
}

function printSummary(result: IngestResult, persisted: { inserted: number; updated: number; retailersCreated: string[] } | null, dryRun: boolean) {
  const { stats, offers } = result;
  console.log(`\n[${stats.source}] mode=${stats.mode} fetched=${stats.fetched} normalized=${stats.normalized} bundlesSplit=${stats.bundlesSplit} in ${stats.durationMs} ms`);
  console.log('unit_price_kind:', stats.unitPriceKinds);
  if (persisted) {
    console.log(`persisted: inserted=${persisted.inserted} updated=${persisted.updated}` + (persisted.retailersCreated.length ? ` retailers created: ${persisted.retailersCreated.join(', ')}` : ''));
  } else if (dryRun) {
    console.log('dry-run: nothing written');
  }
  console.table(
    offers.slice(0, 25).map((o) => ({
      source_id: o.sourceId,
      retailer: o.retailerExternalId,
      heading: o.heading,
      price: o.price,
      size: o.sizeMin === null ? '' : o.sizeMin === o.sizeMax ? `${o.sizeMin} ${o.sizeUnit}` : `${o.sizeMin}–${o.sizeMax} ${o.sizeUnit}`,
      pcs: o.pieces ?? '',
      unit_price: o.unitPriceDkk ?? '',
      kind: o.unitPriceKind,
      bundle: o.bundleIndex || '',
    })),
  );
  if (offers.length > 25) console.log(`… ${offers.length - 25} more`);
}

export async function offersCommand(opts: OffersCommandOptions): Promise<void> {
  const env = resolveEnv();
  const sec = secrets();

  const result = await runOfferIngest({
    source: opts.source,
    mode: opts.mode,
    env,
    logger: opts.json ? undefined : console,
    secrets: { tjekApiKey: sec.tjekApiKey, sallingBearerToken: sec.sallingBearerToken },
    ...(opts.dealerIds ? { dealerIds: opts.dealerIds } : {}),
    ...(opts.zips ? { zips: opts.zips } : {}),
  });

  let persisted: Awaited<ReturnType<OfferRepository['upsertOffers']>> | null = null;
  let close: (() => Promise<void>) | null = null;

  if (opts.out) {
    const file = resolve(process.env.INIT_CWD ?? process.cwd(), opts.out);
    await mkdir(dirname(file), { recursive: true });
    const snapshot = { source: opts.source, mode: opts.mode, fetchedAt: new Date().toISOString(), stats: result.stats, offers: result.offers };
    await writeFile(file, JSON.stringify(snapshot, null, 2), 'utf8');
    if (!opts.json) console.log(`snapshot written: ${file} (${result.offers.length} offers, whitelisted fields only)`);
  }

  if (!opts.dryRun) {
    if (sec.databaseUrl) {
      const conn = createDb(sec.databaseUrl);
      close = conn.close;
      const registry = new DrizzleSourceRegistryRepository(conn.db);
      await registry.syncFromCode();
      try {
        persisted = await new DrizzleOfferRepository(conn.db).upsertOffers(result.offers);
        await registry.markSync(opts.source, null);
      } catch (err) {
        await registry.markSync(opts.source, err instanceof Error ? err.message : String(err));
        throw err;
      }
    } else {
      console.warn('DATABASE_URL not set — falling back to in-memory repository (nothing persisted).');
      persisted = await new MemoryOfferRepository().upsertOffers(result.offers);
    }
  }

  try {
    if (opts.json) {
      console.log(JSON.stringify({ stats: result.stats, persisted, offers: result.offers }, null, 2));
    } else {
      printSummary(result, persisted, opts.dryRun);
    }
  } finally {
    if (close) await close();
  }
}
