/**
 * The adapter runner is the only entry point that may execute an adapter.
 *
 *   1. legal gate      — refuse unless registry allows (source, mode, env)
 *   2. fetch           — adapter returns whitelisted records
 *   3. whitelist check — strict: any non-approved key throws
 *   4. normalise       — pass 1 rules, bundle split
 *
 * Nothing here touches a database; persistence is the caller's job.
 */
import type { NormalizedOffer } from '@madplan/domain';
import {
  assertSourceAllowed,
  resolveEnv,
  whitelistRecord,
  type Env,
  type RunMode,
  type SourceId,
} from '@madplan/legal';
import { FixtureSallingClient, LiveSallingClient, SallingAdapter } from './salling/adapter.js';
import { TjekAdapter } from './tjek/adapter.js';
import { FixtureTjekClient, LiveTjekClient } from './tjek/client.js';
import type { AdapterContext, IngestResult, IngestStats, OfferAdapter } from './types.js';

export interface RunnerOptions {
  source: SourceId;
  mode: RunMode;
  env?: Env;
  /** Inject an adapter (tests). If omitted, one is built from `source` + `mode`. */
  adapter?: OfferAdapter;
  dealerIds?: readonly string[];
  zips?: readonly string[];
  logger?: AdapterContext['logger'];
  /** Live credentials — only read after the gate has allowed live mode. */
  secrets?: { tjekApiKey?: string | undefined; sallingBearerToken?: string | undefined };
}

export function buildAdapter(opts: RunnerOptions): OfferAdapter {
  if (opts.adapter) return opts.adapter;
  switch (opts.source) {
    case 'tjek':
      return new TjekAdapter(
        opts.mode === 'fixtures'
          ? new FixtureTjekClient()
          : new LiveTjekClient(opts.secrets?.tjekApiKey ?? ''),
      );
    case 'salling':
      return new SallingAdapter(
        opts.mode === 'fixtures'
          ? new FixtureSallingClient()
          : new LiveSallingClient(opts.secrets?.sallingBearerToken ?? ''),
      );
    default:
      throw new Error(`No offer adapter for source '${opts.source}'`);
  }
}

export async function runOfferIngest(opts: RunnerOptions): Promise<IngestResult> {
  const started = Date.now();
  const env = opts.env ?? resolveEnv();

  // 1. gate — throws SourceNotAllowedError
  assertSourceAllowed(opts.source, opts.mode, env);

  const adapter = buildAdapter(opts);
  if (adapter.source !== opts.source) {
    throw new Error(`Adapter source '${adapter.source}' does not match requested '${opts.source}'`);
  }

  // 2. fetch
  const ctx: AdapterContext = { mode: opts.mode };
  if (opts.dealerIds) ctx.dealerIds = opts.dealerIds;
  if (opts.zips) ctx.zips = opts.zips;
  if (opts.logger) ctx.logger = opts.logger;
  const fetched = await adapter.fetch(ctx);

  // 3. strict whitelist — a leaky adapter fails here, before anything is stored
  const clean = fetched.map((r) => whitelistRecord(opts.source, r, { strict: true }));

  // 4. normalise
  const offers: NormalizedOffer[] = [];
  let bundlesSplit = 0;
  const unitPriceKinds: Record<string, number> = {};
  for (const rec of clean) {
    const out = adapter.normalize(rec);
    if (out.length > 1) bundlesSplit++;
    for (const o of out) {
      unitPriceKinds[o.unitPriceKind] = (unitPriceKinds[o.unitPriceKind] ?? 0) + 1;
      offers.push(o);
    }
  }

  const stats: IngestStats = {
    source: opts.source,
    mode: opts.mode,
    fetched: fetched.length,
    normalized: offers.length,
    bundlesSplit,
    unitPriceKinds,
    durationMs: Date.now() - started,
  };
  return { offers, stats };
}
