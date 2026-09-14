import { defineConfig } from 'drizzle-kit';

// `drizzle-kit generate` works offline; DATABASE_URL is only needed for push/studio/migrate.
export default defineConfig({
  dialect: 'postgresql',
  schema: './src/schema/index.ts',
  out: './drizzle',
  strict: true,
  verbose: true,
  ...(process.env.DATABASE_URL ? { dbCredentials: { url: process.env.DATABASE_URL } } : {}),
});
