/**
 * Adapter gate — the runtime enforcement of the source registry.
 *
 *   mode 'live'     : real network calls. Allowed only for `approved` / `open`.
 *   mode 'fixtures' : local mock data, no network. Allowed for everything except `blocked`.
 *
 * In production (`NODE_ENV=production`) fixtures are never allowed either — a
 * production ingest must be against a real, approved source or not run at all.
 *
 * `whitelistRecord` strips every key that is not in `approved_fields`. In
 * strict mode (default) it throws if an adapter emits a non-whitelisted key,
 * so a leaky adapter fails tests instead of quietly being cleaned up.
 */
import {
  GLOBALLY_FORBIDDEN_FIELDS,
  getSource,
  type SourceEntry,
  type SourceId,
} from './source_registry';

export type RunMode = 'live' | 'fixtures';

export type Env = 'production' | 'development' | 'test';

export class SourceNotAllowedError extends Error {
  constructor(
    public readonly source: SourceId,
    public readonly mode: RunMode,
    public readonly env: Env,
    reason: string,
  ) {
    super(`Source '${source}' not allowed in mode '${mode}' (env=${env}): ${reason}`);
    this.name = 'SourceNotAllowedError';
  }
}

export class FieldNotWhitelistedError extends Error {
  constructor(
    public readonly source: SourceId,
    public readonly fields: readonly string[],
  ) {
    super(`Source '${source}' emitted non-whitelisted field(s): ${fields.join(', ')}`);
    this.name = 'FieldNotWhitelistedError';
  }
}

export function resolveEnv(raw: string | undefined = process.env.NODE_ENV): Env {
  if (raw === 'production') return 'production';
  if (raw === 'test') return 'test';
  return 'development';
}

/** Pure decision function. Returns null when allowed, otherwise the reason. */
export function denialReason(entry: SourceEntry, mode: RunMode, env: Env): string | null {
  if (entry.legal_status === 'blocked') {
    return 'legal_status=blocked — no use in any mode until written permission is stored in docs/legal/';
  }
  if (mode === 'live') {
    if (entry.legal_status === 'pending') {
      return 'legal_status=pending — live calls forbidden until agreement is stored and status is approved';
    }
    if (entry.legal_status === 'approved' && !entry.agreement_ref) {
      return 'approved without agreement_ref (registry invariant violated)';
    }
    return null;
  }
  // mode === 'fixtures'
  if (env === 'production') {
    return 'fixtures are not allowed in production';
  }
  return null;
}

export function assertSourceAllowed(
  source: SourceId,
  mode: RunMode,
  env: Env = resolveEnv(),
): SourceEntry {
  const entry = getSource(source);
  const reason = denialReason(entry, mode, env);
  if (reason) throw new SourceNotAllowedError(source, mode, env, reason);
  return entry;
}

export interface WhitelistOptions {
  /** Throw on unknown keys (default true). When false, unknown keys are dropped silently. */
  strict?: boolean;
}

/**
 * Returns a new object containing only `approved_fields` of the source.
 * Undefined values are dropped. Globally forbidden field names always throw,
 * even in non-strict mode — they can never be legitimately present.
 */
export function whitelistRecord<T extends Record<string, unknown>>(
  source: SourceId,
  record: T,
  opts: WhitelistOptions = {},
): Record<string, unknown> {
  const strict = opts.strict ?? true;
  const entry = getSource(source);
  const allowed = new Set<string>(entry.approved_fields);
  const forbidden = new Set<string>(GLOBALLY_FORBIDDEN_FIELDS);

  const out: Record<string, unknown> = {};
  const leaked: string[] = [];
  for (const [key, value] of Object.entries(record)) {
    if (forbidden.has(key)) {
      throw new FieldNotWhitelistedError(source, [key]);
    }
    if (allowed.has(key)) {
      if (value !== undefined) out[key] = value;
    } else {
      leaked.push(key);
    }
  }
  if (strict && leaked.length > 0) throw new FieldNotWhitelistedError(source, leaked);
  return out;
}

export function whitelistRecords<T extends Record<string, unknown>>(
  source: SourceId,
  records: readonly T[],
  opts?: WhitelistOptions,
): Record<string, unknown>[] {
  return records.map((r) => whitelistRecord(source, r, opts));
}
