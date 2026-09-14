# apps/web — placeholder (phase 1)

Next.js 15 (App Router) customer PWA + `/admin` route group. Not scaffolded in phase 0.

When scaffolding, remember:

- Attribution component in the footer / next to nutrition data: `attributionsFor(sources)` from `@madplan/legal`.
- No third-party images anywhere. Own icons/photos only.
- Admin "Kilder" page reads `source_registry` (DB mirror) but status changes happen in code with an `agreement_ref`.
- Add `transpilePackages: ['@madplan/*']` in `next.config` because workspace packages ship TypeScript source.
