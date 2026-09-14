# Madplan-platform

Chain-independent Danish meal-plan platform: 5 questions → meal plan optimised against this week's
offers in the user's chosen supermarkets → shopping list per chain → checkout handoff.

**Phase 0 (this repo state):** monorepo, DB schema + migration, source rights registry with adapter
gate and tests, Frida import → ingredient ontology, Tjek adapter on fixtures, pass-1 normalisation,
ingest CLI. No live third-party calls are possible yet — by design (see below).

## The one hard rule

We do not copy data we have no right to. Every source has a `legal_status` in
[packages/legal/src/source_registry.ts](packages/legal/src/source_registry.ts). Adapters can only run
live against `approved`/`open` sources; only whitelisted, factual fields are stored (price, period,
quantity, EAN, product name, chain); no descriptions, images or raw payloads; recipes are 100 % ours.
Details: brief §0 and [docs/legal/](docs/legal/README.md).

## Layout

```
apps/ingest        CLI + worker: runs adapters behind the gate, normalises, persists
apps/web           (phase 1) Next.js PWA + /admin
packages/legal     source_registry.ts + gate (assertSourceAllowed, whitelistRecord)
packages/domain    pure TS: units, quantity → unit price (pass 1), bundle split, offer types
packages/adapters  tjek/ salling/ frida/ — each with fixtures/; runner.ts is the only entry point
packages/db        Drizzle schema, migrations (drizzle/), repositories (Drizzle + in-memory)
packages/checkout  CheckoutHandoff interface + copy_list implementation
docs/legal         Terms/agreements per source; docs/OPEN_QUESTIONS.md
```

## Getting started

```bash
pnpm install
pnpm test                                   # all packages
pnpm typecheck
pnpm ingest --source=tjek --fixtures --dry-run
pnpm ingest offers --source=salling --fixtures --zip 8000 --dry-run
pnpm ingest sources                         # print the rights registry
pnpm ingest frida --file data/raw/frida_5.5.csv --dry-run   # after manual download, see docs/legal/frida.md
```

With `DATABASE_URL` set (Supabase/Azure Postgres):

```bash
pnpm db:migrate                             # applies packages/db/drizzle/*
pnpm ingest --source=tjek --fixtures        # persists fixture offers (dev only; refused in production)
```

`pnpm ingest --source=tjek --live` exits with code 2 today: Tjek is `pending`.

## Ingest pipeline (pass 1 implemented)

1. Gate: `assertSourceAllowed(source, mode, env)`.
2. Adapter fetch → records containing only `approved_fields` (strictly re-checked; a leak fails the run).
3. Normalise: quantity → base unit (g/ml/pcs), `unit_price_dkk`, `unit_price_kind`
   (`exact | range_max | pcs | unknown`), "X eller Y" bundles split into variants (`source_id#n`).
4. Persist: upsert on `(source, source_id)`; unknown retailers get a stub row for admin to rename.

Pass 2 (alias table) and pass 3 (LLM on unmatched, heading + quantity only) are phase 1.

## Attribution

Frida: "Fødevaredata (frida.fooddata.dk), version 5.5, 2025, DTU Fødevareinstituttet" — use
`attributionsFor([...])` from `@madplan/legal` wherever nutrition data is rendered.
