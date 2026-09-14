import { pgTable, text, timestamp, date } from 'drizzle-orm/pg-core';
import { legalStatusEnum } from './enums';

/**
 * Mirror of packages/legal/src/source_registry.ts for the admin UI and sync
 * bookkeeping. The TypeScript registry is the source of truth; the ingest
 * worker syncs it here on start. Status can only become `approved` in code,
 * with an agreement_ref — never from this table alone.
 */
export const sourceRegistry = pgTable('source_registry', {
  source: text('source').primaryKey(),
  displayName: text('display_name').notNull(),
  legalStatus: legalStatusEnum('legal_status').notNull(),
  approvedFields: text('approved_fields').array().notNull(),
  attribution: text('attribution'),
  agreementRef: text('agreement_ref'),
  reviewedAt: date('reviewed_at').notNull(),
  note: text('note').notNull().default(''),
  lastSyncAt: timestamp('last_sync_at', { withTimezone: true }),
  lastError: text('last_error'),
});
