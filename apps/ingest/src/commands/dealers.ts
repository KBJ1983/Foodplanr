import { FixtureTjekClient, LiveTjekClient } from '@madplan/adapters';
import { assertSourceAllowed, resolveEnv, type RunMode } from '@madplan/legal';
import { secrets } from '../env';

/**
 * Print Tjek dealers (id + name) so an admin can map them to our retailers
 * (`retailer.tjek_dealer_id`; prototype: apps/web/lib/dealers.ts). Names are
 * printed, not stored — the tjek whitelist covers dealer_id only.
 */
export async function dealersCommand(opts: { mode: RunMode; json: boolean }): Promise<void> {
  assertSourceAllowed('tjek', opts.mode, resolveEnv());
  const client = opts.mode === 'fixtures' ? new FixtureTjekClient() : new LiveTjekClient(secrets().tjekApiKey ?? '');
  const dealers = await client.listDealers();
  const rows = dealers.map((d) => ({ id: d.id, name: d.name })).sort((a, b) => a.name.localeCompare(b.name, 'da'));
  if (opts.json) console.log(JSON.stringify(rows, null, 2));
  else {
    console.table(rows);
    console.log(`\n${rows.length} dealers. Map the grocery ones in apps/web/lib/dealers.ts (TJEK_DEALER_TO_STORE).`);
  }
}
