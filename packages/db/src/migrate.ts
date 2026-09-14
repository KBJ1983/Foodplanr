import { migrate } from 'drizzle-orm/postgres-js/migrator';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';
import { createDb } from './client';

const url = process.env.DATABASE_URL;
if (!url) {
  console.error('DATABASE_URL is not set');
  process.exit(1);
}
const { db, close } = createDb(url);
const migrationsFolder = join(dirname(fileURLToPath(import.meta.url)), '..', 'drizzle');
await migrate(db, { migrationsFolder });
await close();
console.log('migrations applied');
