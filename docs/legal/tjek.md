# Tjek / eTilbudsavis — legal status: **pending**

Reviewed: 2026-09-14. No agreement stored yet. Adapter runs on fixtures only.

## What we need from Tjek (services@tjek.com)

A written commercial agreement that explicitly covers:

- **Storage** of the following offer fields: dealer id, catalog id, offer id, heading (product name),
  price, pre-price, currency, run_from, run_till, quantity (size from/to, unit, pieces from/to).
- **Derived price history** per ingredient/retailer (numbers only, kept after the offer expires).
- **Display** of price, period and product name in a freemium product (free tier and paid tier).
- **Attribution** wording and placement they require.
- Rate limits and expected call volume (daily sync of all Danish grocery dealers, ~06:00).

We will **not** store: description, images, publication pages, branding, links.

## Runbook: from agreement to real offers in the app

Nothing below may run before step 1 is done — the gate refuses live calls while status is `pending`.

1. **Store the agreement.** Save the mail/PDF verbatim here as `tjek-agreement-<YYYY-MM-DD>.pdf` (or `.md`).
   Fill in the confirmation block at the bottom: which uses and which fields it covers, who confirmed.
2. **Flip the registry.** In `packages/legal/src/source_registry.ts` set `legal_status: 'approved'`,
   `agreement_ref: 'docs/legal/tjek-agreement-<date>.pdf'`, trim `approved_fields` to exactly what the
   agreement lists, set `attribution` if required, update `reviewed_at`. `pnpm test` must stay green
   (the registry tests enforce the invariants).
3. **API key.** Put `TJEK_API_KEY=...` in `.env` (git-ignored). Never in chat, never in the repo.
4. **Verify the API shape** with one real call before trusting the adapter (typed from memory of the
   public SDK): `pnpm ingest dealers --live` (prints dealer id + name) and
   `pnpm ingest --source=tjek --live --dry-run --dealer <one id> --json | head`. Fix `packages/adapters/src/tjek/types.ts`
   if fields differ; fixtures must then be updated to match.
5. **Map dealers.** Copy the grocery dealer ids from step 4 into `apps/web/lib/dealers.ts`
   (`TJEK_DEALER_TO_STORE`) — later `retailer.tjek_dealer_id` in the DB.
6. **Snapshot for the web app** (until a database is configured):
   `pnpm ingest --source=tjek --live --dry-run --out data/offers/latest.json`. The file holds whitelisted,
   normalised fields only and is git-ignored. Restart the web app; `/api/offers` reports how many offers
   matched the ontology, and the price-source line names Tjek and the fetch time.
7. **Check the match rate.** Unmatched headings (below 0.7 confidence) are not used for prices. Extend
   `apps/web/lib/aliases.ts` for common misses; pass 3 (LLM on unmatched, heading + quantity only) is phase 1.
8. **With a database:** `pnpm db:migrate`, then `pnpm ingest --source=tjek --live` persists to `offer`;
   schedule daily 06:00 Europe/Copenhagen.

## Confirmation

- Agreement file: —
- Covers storage / history / free display / paid display: — / — / — / —
- Confirmed by: —, date —
