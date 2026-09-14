# Open Food Facts — legal status: **pending** (licence decision)

Reviewed: 2026-09-14. No adapter implemented.

Licence: Open Database License (ODbL) — attribution **and share-alike** on derived databases.

## The question to decide

If we enrich `ingredient_nutrition` / EAN matches with OFF data, `ingredient_nutrition` (and possibly
`offer.ean → ingredient` mappings) arguably become a *derived database* that must be offered under
ODbL. Options:

- **Use** OFF and accept publishing the derived nutrition/EAN table under ODbL (our recipes and meal
  plans are separate "produced works" and not affected).
- **Drop** OFF; rely on Frida for nutrition and on retailer EAN + our alias table for matching.

Recommendation: drop for MVP (Frida covers nutrition; EAN matching is phase 1+). Revisit if EAN
coverage becomes a real gap.

## Decision

- Decision: —
- By: —, date —
