# Salling Group API — legal status: **pending**

Reviewed: 2026-09-14. Terms not yet read/stored. Adapter runs on fixtures only; live client intentionally unimplemented.

## To do (Kasper)

1. Sign up at developer.sallinggroup.dev, read the Terms of Use for the Anti Food Waste, Stores and
   Product Suggestions APIs.
2. Save the Terms verbatim as `salling-terms-<YYYY-MM-DD>.md` (copy/paste) or PDF in this folder.
3. Confirm, per API, whether the Terms permit: storing prices/EAN/end time, showing them to end users
   in a free and a paid product, and any attribution requirement. Note any clause on caching duration.
4. If covered: `legal_status: 'approved'`, `agreement_ref: 'docs/legal/salling-terms-<date>.md'`.
   If not covered: keep `pending` and ask Salling for a partner arrangement.

Fields we intend to store (food waste): store id, brand, zip, lat/lng, ean, product name, new price,
original price, end time, stock + unit. **No images.**

Rate limit: 10,000 calls/day — food-waste sync only for zip codes with active users.

## Confirmation

- Terms file: —
- Covers storage / display free / display paid: — / — / —
- Confirmed by: —, date —
