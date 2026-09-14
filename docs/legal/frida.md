# Frida — DTU Fødevareinstituttet — legal status: **open**

Reviewed: 2026-09-14. Open dataset; free to use with mandatory credit.

## Attribution (must appear wherever nutrition numbers are shown)

> Fødevaredata (frida.fooddata.dk), version 5.5, 2025, DTU Fødevareinstituttet

Exposed in code as `FRIDA_ATTRIBUTION` / `attributionsFor(['frida'])` in `@madplan/legal`.

## Getting the dataset

The Frida site (now fcdb.fooddata.dk) is a JavaScript app; the download cannot be scripted from a
plain HTTP client, so the file is fetched manually:

1. Open https://frida.fooddata.dk → *Download* (redirects to fcdb.fooddata.dk).
2. Download the **normalised / long-format** dataset (one row per food × parameter), version 5.5.
3. If it is `.xlsx`, open in Excel and *Save as* CSV (UTF-8, semicolon). Save to
   `data/raw/frida_5.5.csv` (git-ignored — we do not commit third-party datasets).
4. Run: `pnpm ingest frida --file data/raw/frida_5.5.csv --dry-run` and check the column mapping.
   If headers differ from the defaults in `packages/adapters/src/frida/import.ts`
   (`DEFAULT_FRIDA_COLUMNS`), extend the alias lists there — that is the only place to touch.
5. Run without `--dry-run` to seed `ingredient` + `ingredient_nutrition`.

Stored fields: Frida food id, Danish/English name, food group, energy (kJ, kcal), protein, fat,
available carbohydrate, dietary fibre — all per 100 g. Nothing else from Frida is stored.

## Confirmation

- Licence: open, attribution required (frida.fooddata.dk "Om Frida" / terms page). Re-check wording
  when the dataset is actually downloaded and paste the exact licence text below.
- Licence text (verbatim): — *(paste on download)*
- Confirmed by: —, date —
