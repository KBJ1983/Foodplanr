# docs/legal — rights per data source

Every external source has one file here. `packages/legal/src/source_registry.ts` points at these via
`agreement_ref`. A source may only be set to `approved` in code when the corresponding file contains:

1. The agreement or Terms as received (PDF or verbatim Markdown), with date.
2. A short statement of *which use* it covers: storage, price history, display in a free and in a paid
   product, and the exact field list.
3. Who confirmed it (name, date).

| Source | File | Status today |
|---|---|---|
| Tjek / eTilbudsavis | [tjek.md](tjek.md) | pending — request sent? (see OPEN_QUESTIONS) |
| Salling Group API | [salling.md](salling.md) | pending — Terms not yet stored |
| Frida (DTU) | [frida.md](frida.md) | open — attribution only |
| Open Food Facts | [openfoodfacts.md](openfoodfacts.md) | pending — ODbL decision |
| Coop, Rema, Nemlig, recipe sites | — | blocked — no file until written permission exists |

Rule of thumb: when in doubt, the answer is `blocked`.
