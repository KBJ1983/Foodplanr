# Koblingen: madplan → opskrift → råvare → tilbud → indkøbsliste

Dette er den kæde, som både databasen (fase 0-skema) og web-prototypen (`apps/web/lib/engine.ts`) følger.
Prototypen kører på egne testdata i præcis samme form, så den rigtige data kan sættes ind uden at ændre
motor eller UI.

```
meal_plan_template.week_pattern  →  recipe (vores egne)  →  recipe_ingredient.ingredient_id
                                                                    │
                                                                    ▼
                                            ingredient (ontologi, Frida-seedet)  ◄──  offer.ingredient_id
                                                                    │                 (match: pass 1 regler,
                                                                    │                  pass 2 alias, pass 3 LLM)
                                                                    ▼
                    behov pr. råvare (skaleret til husstanden)  ×  butik
                                                                    │
                                    gyldigt tilbud i den planlagte uge?  (offer.run_from ≤ uge < offer.run_till)
                                        ja → antal pakker × tilbudspris          nej → normalpris-estimat
                                             (offer_id + periode gemmes på linjen)     (price_history-median, ellers
                                                                                        ingredient.default_price_per_unit)
                                                                    │
                                                                    ▼
                          strategier: Billigst · Færrest steder · Faste butikker
                                                                    │
                                                                    ▼
                    shopping_list.lines [{ingredient_id, qty, unit, offer_id?, est_price}]  pr. butik
```

## Hvad indkøbslisten viser, og hvorfor

Hver linje husker sin prisoprindelse:

| Felt på linjen | Vises som |
|---|---|
| `kind = offer` + `offer.run_from/run_till` | **Tilbud** · varenavn fra tilbuddet · antal pakker × pris · "gyldig 14.–20. sep." · "før 55 kr" |
| `kind = baseline` | "Normalpris, estimat" |
| `baselinePrice − price` | "spar 16 kr" |

Øverst på listen: "Tilbud gyldige 14.–20. sep. · 9 af 31 varer på tilbud · spar 84 kr". Bunden: priskilde-linjen
(hvilken kilde, hvilken periode, at normalpriser er estimater).

Et tilbud bruges kun hvis dets periode overlapper den planlagte uge. Et tilbud der er udløbet, eller som først
gælder næste uge, ignoreres for denne uge og dukker op når man vælger næste uge. Et "tilbud" der er dyrere end
normalpris-estimatet bruges ikke.

## Vejen til rigtige tilbudspriser

Motor og UI er klar. Det der mangler, er data med ret til brug:

1. **Aftale med Tjek** (services@tjek.com), se `docs/legal/tjek.md`. Når den er på plads: `legal_status: 'approved'`
   + `agreement_ref` i `packages/legal/src/source_registry.ts`. Først da må `pnpm ingest --source=tjek --live` køre.
2. **Ingest** skriver whitelistede felter til `offer` (pris, periode, mængde, varenavn, kæde). `run_from`/`run_till`
   kommer direkte fra tilbudsavisens gyldighed, det er præcis den periode listen viser.
3. **Match til ontologien** (fase 1): pass 2 alias-tabel (admin retter), pass 3 LLM på umatchede med kun varenavn og
   mængde som input. Match under 0,7 i konfidens går til admin-køen og bruges ikke i priser.
4. **Normalpris-baseline** (fase 1): `price_history` pr. råvare/kæde (median over 8 uger) erstatter de manuelle
   estimater i `ingredient.default_price_per_unit`. Rabat-% = 1 − tilbud/baseline.
5. **Web-appen** læser tilbud via `/api/offers` (`apps/web/lib/offers-source.ts`): findes et ingest-snapshot
   (`pnpm ingest --source=tjek --live --dry-run --out data/offers/latest.json`), bruges det, med forhandler-mapping
   (`lib/dealers.ts`) og alias-match (`lib/aliases.ts`, pass 2); ellers fixtures. `PriceSource` viser kildenavn,
   hentetidspunkt og match-rate. Med database læses `offer`-tabellen samme sted. Runbook: `docs/legal/tjek.md`.
6. **Salling madspild** (fase 2, efter Terms-review) kommer ind som `offer.kind = food_waste` med kort TTL og
   vises som en egen linjetype ("Madspild · Netto Aarhus C · udløber i dag").

## Opskrifter og bytte af retter

- Opskrifter er 100 % vores egne (`recipe.origin = own`). Prototypen har 26 i `apps/web/lib/recipes.ts`;
  ontologien har ~60 råvarer i `apps/web/lib/ingredients.ts`. Fase 1 flytter dem til databasen og admin-CRUD.
- "Byt ret" gemmes som `swaps[planId|uge][dagIndex] = recipeId`. Behov, tilbud og pris genberegnes for hele
  ugen, og bytte-vælgeren viser ændringen i ugepris for hver alternativ ret. I fase 1 bliver det brugerens egen
  `meal_plan.days` afledt af templaten.
- Mængder skaleres lineært med `persons / recipe.servings_base`. Pakker rundes op pr. råvare på tværs af ugen,
  så dagspriser summerer ikke præcist til ugeprisen (mærket "ca.").
