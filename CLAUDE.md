# CLAUDE.md — Madplan-platform

Language: code and comments in English; Danish domain words (madplan, tilbud, råvare) are fine in UI strings.

## Hard rule: no data we have no right to (overrides everything else)

- Source rights live in `packages/legal/src/source_registry.ts`. Never call a source live unless its
  `legal_status` is `approved` or `open`. `pending` = fixtures only. `blocked` = nothing, not even fixtures.
- Never widen `approved_fields` or flip a status to `approved` without an `agreement_ref` pointing at a
  document in `docs/legal/`. If in doubt whether a source may be used: stop and add it to
  `docs/OPEN_QUESTIONS.md` instead of implementing.
- Store only factual, necessary fields: price, period, quantity, EAN, product name, chain. Never
  description, images, page/layout, recipes or other editorial content from third parties. No raw payload
  columns. Never link or copy third-party images.
- No website scraping. Only documented APIs with an agreement, or open datasets with a licence.
- Recipes, meal plans, texts, images are ours (`recipe.origin = own`) or licensed with a `license_ref`.
  Never import from recipe sites, not even ingredient lists.
- Every external record carries `source` + `source_id` so a source can be purged with one call
  (`OfferRepository.deleteBySource`).
- Show attribution where data is shown: `attributionsFor(sources)` from `@madplan/legal`.

## Working in this repo

- pnpm workspaces; run `pnpm test` and `pnpm typecheck` from the root. Tests must not touch the network.
- All adapter execution goes through `packages/adapters/src/runner.ts` (gate → fetch → strict whitelist →
  normalise). Add a new source by: registry entry → `docs/legal/<source>.md` → adapter with fixtures → tests
  proving no non-whitelisted key leaks.
- Domain logic (`packages/domain`) is pure and DB-free. The meal-plan engine (phase 1) must stay a pure
  function `(preferences, recipePool, offerIndex, priceBaseline) → MealPlan[]`.
- Ingredients are ids from our ontology (Frida-seeded), never free text, in recipes and matches.
- Schema changes: edit `packages/db/src/schema/*`, then `pnpm db:generate`; commit the generated SQL.
- Imports inside workspace packages are extensionless (`./gate`, not `./gate.js`) with
  `moduleResolution: Bundler`. Turbopack (Next.js) cannot map `.js` specifiers to `.ts` files; tsx and
  vitest are fine either way. Don't reintroduce `.js` suffixes.
- Web app (`apps/web`): design tokens and utility classes live in `app/globals.css`; every screen is a
  full-colour `<Screen tone>`; no photos or maps from third parties, only our own assets/placeholders.
- Editing files from PowerShell: read with `[IO.File]::ReadAllText(path, UTF8)` and write with a
  BOM-less UTF-8 encoder. `Get-Content -Raw` in Windows PowerShell 5.1 reads as ANSI and corrupts æøå.
- Money: `numeric` columns, `DKK`. Quantities normalised to g / ml / pcs.
