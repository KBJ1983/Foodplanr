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

## When the agreement arrives

1. Save it here as `tjek-agreement-<YYYY-MM-DD>.pdf` (or verbatim `.md`).
2. Fill in below. 3. In `source_registry.ts`: `legal_status: 'approved'`, `agreement_ref: 'docs/legal/tjek-agreement-<date>.pdf'`,
   adjust `approved_fields` to *exactly* what the agreement lists, set `attribution` if required.
4. Verify the v2 offer object shape against the SDK with a real key before the first live run.

## Confirmation

- Agreement file: —
- Covers storage / history / free display / paid display: — / — / — / —
- Confirmed by: —, date —
