# apps/web — customer PWA (Next.js App Router)

Implements the design handoff *"foodplanr – wireframes, retning 1c Plakat"*: every screen has its own
full-colour background, one huge number per screen, word navigation in the top (Planer · Arkiv ·
Indkøb · Profil), 5 full-screen onboarding questions.

```bash
pnpm --filter @madplan/web dev      # http://localhost:3000
pnpm --filter @madplan/web build
```

## Routes

| Route | Screen | Colour |
|---|---|---|
| `/` | redirect → onboarding or archive | — |
| `/onboarding/1..5` | Personer · Butikker · Budget · Råvarer · Kalorier | C · B · A · C · B |
| `/arkiv` | archive with headline count, filter chips, list / 4-col grid | C (yellow) |
| `/planer/[id]` | week detail; desktop adds the blue strategy panel | white |
| `/indkob/strategi` | Billigst / Færrest steder / Faste butikker | B (blue) |
| `/indkob` | shopping list grouped per store; desktop adds profile panel | white |
| `/profil` | household, key numbers, stores, preferences, toggles | A (magenta) |

## What is real and what is example data

- **Real:** navigation, state (localStorage), onboarding inputs, strategy computation
  (`lib/strategy.ts`, tested), checklist counter, `copy_list` handoff via `@madplan/checkout`,
  Frida attribution via `@madplan/legal` where kcal is shown.
- **Example data:** the six plans, dishes and per-store prices in `lib/mock-data.ts` are ours and
  invented. The archive headline number is scaled to the planned catalogue size and labelled so.
- **Placeholders:** photos and the route map are striped colour blocks, as in the design. No
  third-party imagery, ever.

## Tokens

Defined in `app/globals.css`: A `oklch(58% .26 300)` (dark `oklch(40% .2 300)`), B `oklch(72% .15 200)`,
C `oklch(88% .22 80)`, ink `#0d0d12`, Manrope 400/600/800, radius 8/8/4/24, no shadows, no borders,
dividers 15–30 % black (35 % white on colour).

## Phase 1 hooks

Replace `lib/mock-data.ts` + `lib/matching.ts` with server data from the engine; swap the localStorage
store for auth + `meal_plan` rows; "byt ret" on a day; service worker for offline.
