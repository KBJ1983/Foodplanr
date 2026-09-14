import { existsSync } from 'node:fs';
import { resolve } from 'node:path';

/** Load .env from repo root if present (Node ≥ 20.12 built-in; no dotenv dependency). */
export function loadEnv(): void {
  const roots = [process.env.INIT_CWD, process.cwd(), resolve(process.cwd(), '..', '..')].filter(
    (r): r is string => Boolean(r),
  );
  for (const candidate of roots.map((r) => resolve(r, '.env'))) {
    if (existsSync(candidate)) {
      try {
        process.loadEnvFile(candidate);
      } catch {
        // ignore malformed .env; explicit env vars still apply
      }
      return;
    }
  }
}

export function secrets() {
  return {
    databaseUrl: process.env.DATABASE_URL || null,
    tjekApiKey: process.env.TJEK_API_KEY || undefined,
    sallingBearerToken: process.env.SALLING_BEARER_TOKEN || undefined,
  };
}
