#!/usr/bin/env node
/**
 * pnpm ingest --source=tjek --fixtures            # offers (default command)
 * pnpm ingest offers --source=salling --fixtures --zip 8000
 * pnpm ingest frida --file ./data/raw/frida_5.5.csv [--dry-run]
 * pnpm ingest sources                              # print the rights registry
 */
import { Command, InvalidArgumentError } from 'commander';
import { SOURCE_IDS, SourceNotAllowedError, FieldNotWhitelistedError, type SourceId } from '@madplan/legal';
import { loadEnv } from './env';
import { offersCommand } from './commands/offers';
import { fridaCommand } from './commands/frida';
import { sourcesCommand } from './commands/sources';
import { dealersCommand } from './commands/dealers';

loadEnv();

function parseSource(value: string): SourceId {
  if ((SOURCE_IDS as readonly string[]).includes(value)) return value as SourceId;
  throw new InvalidArgumentError(`Unknown source. Valid: ${SOURCE_IDS.join(', ')}`);
}

const collect = (v: string, prev: string[] = []) => [...prev, v];

const program = new Command()
  .name('ingest')
  .description('Madplan ingest CLI — every source runs behind the legal gate (packages/legal).')
  .showHelpAfterError();

program
  .command('offers', { isDefault: true })
  .description('Fetch, whitelist and normalise offers from one source')
  .requiredOption('-s, --source <source>', `one of: ${SOURCE_IDS.join(', ')}`, parseSource)
  .option('--fixtures', 'use local fixtures (default; never calls the network)')
  .option('--live', 'call the real API — refused unless legal_status is approved/open')
  .option('--dry-run', 'do not persist; print only')
  .option('--json', 'machine-readable output')
  .option('--dealer <id>', 'restrict to dealer id (repeatable)', collect)
  .option('--zip <zip>', 'Salling food waste: zip code (repeatable)', collect)
  .option('--out <file>', 'write a JSON snapshot of the normalised offers (e.g. data/offers/latest.json)')
  .action(async (o: { source: SourceId; fixtures?: boolean; live?: boolean; dryRun?: boolean; json?: boolean; dealer?: string[]; zip?: string[]; out?: string }) => {
    if (o.live && o.fixtures) throw new InvalidArgumentError('--live and --fixtures are mutually exclusive');
    await offersCommand({
      source: o.source,
      mode: o.live ? 'live' : 'fixtures',
      dryRun: Boolean(o.dryRun),
      json: Boolean(o.json),
      ...(o.dealer ? { dealerIds: o.dealer } : {}),
      ...(o.zip ? { zips: o.zip } : {}),
      ...(o.out ? { out: o.out } : {}),
    });
  });

program
  .command('dealers')
  .description('List Tjek dealers (id + name) to map them to our retailers')
  .option('--live', 'call the real API — refused unless tjek is approved')
  .option('--json')
  .action(async (o: { live?: boolean; json?: boolean }) => {
    await dealersCommand({ mode: o.live ? 'live' : 'fixtures', json: Boolean(o.json) });
  });

program
  .command('frida')
  .description('Import the Frida (DTU) dataset CSV into the ingredient ontology')
  .requiredOption('-f, --file <path>', 'path to Frida CSV export (see docs/legal/frida.md)')
  .option('--version <v>', 'Frida dataset version label', '5.5')
  .option('--dry-run', 'parse and print only')
  .option('--json', 'machine-readable output')
  .action(async (o: { file: string; version: string; dryRun?: boolean; json?: boolean }) => {
    await fridaCommand({ file: o.file, version: o.version, dryRun: Boolean(o.dryRun), json: Boolean(o.json) });
  });

program
  .command('sources')
  .description('Print the source rights registry')
  .option('--json')
  .action((o: { json?: boolean }) => sourcesCommand({ json: Boolean(o.json) }));

program.parseAsync(process.argv).catch((err: unknown) => {
  if (err instanceof SourceNotAllowedError) {
    console.error(`\n⛔ ${err.message}\n   See docs/legal/ and packages/legal/src/source_registry.ts`);
    process.exit(2);
  }
  if (err instanceof FieldNotWhitelistedError) {
    console.error(`\n⛔ ${err.message}\n   An adapter emitted a field outside approved_fields. Fix the adapter, do not widen the whitelist without legal review.`);
    process.exit(3);
  }
  console.error(err);
  process.exit(1);
});
