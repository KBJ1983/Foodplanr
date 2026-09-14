# Open questions / actions

Owner in parentheses. Phase 0 build is complete without these; they gate live data.

## Rights (blocking for live data)

- [ ] **Tjek**: send use-case + request for commercial agreement to services@tjek.com (Kasper). Template of what to ask in [legal/tjek.md](legal/tjek.md).
- [ ] **Salling**: read Terms, store in `docs/legal/`, decide approved/pending (Kasper).
- [ ] **Open Food Facts**: use-or-drop decision on ODbL share-alike (Kasper). Recommendation in [legal/openfoodfacts.md](legal/openfoodfacts.md): drop for MVP.
- [ ] **Rema 1000** and **Nemlig**: written request for partner integration (Kasper). Until answered: `blocked`.
- [ ] **Frida**: download v5.5 manually (JS site, not scriptable), paste exact licence text into [legal/frida.md](legal/frida.md), run import (Kasper).

## Technical assumptions to verify when keys exist

- Tjek v2 offer object shape (`pricing.price/pre_price`, `quantity.unit.si`, `size/pieces from/to`, `run_from/run_till`, `dealer_id/catalog_id`) is typed from memory of the public SDK, not from the current docs (docs are behind login). Verify with one real response before first live run; fixtures must then be updated to match.
- Tjek "no quantity information" is assumed to be `size 1..1 × pieces 1..1` in a count unit; we fall back to heading parsing in that case.
- Salling food-waste response shape (`clearances[].offer.newPrice/endTime/ean`, `product.description`) typed from the public docs as remembered; verify.
- Frida column names: defaults cover known Danish/English exports; extend `DEFAULT_FRIDA_COLUMNS` if the 5.5 export differs.

## Product / infra decisions (not blocking phase 0)

- Hosting: Supabase vs Azure PG. Schema is plain Postgres; Drizzle migrations work on both.
- Auth provider (phase 1). Payments (phase 2).
- LLM normalisation (pass 3): Anthropic API, cache on heading hash; LLM sees heading + quantity only.
- Unit-price policy for ranges: we compute on the **largest** size (`range_max`), i.e. the optimistic per-kg price. Confirm this is the desired presentation.
