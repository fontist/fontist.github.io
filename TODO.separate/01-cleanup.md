# 01 — Cleanup: drop /font/* legacy redirect routes

Phase A of [README.md](README.md). Pure removal — no public URLs change in this phase.

## What stays after this phase

- `/formulas` + `/formulas/:slug` — untouched.
- `/fonts` + `/fonts/:familySlug` + `/fonts/:familySlug/unicode` — untouched (renamed in Phase B).
- `/formula/:slug` — already removed in prior commit (`12677da`).

## Changes

### `src/router.ts`

Remove:
- `import { findFamilyByFormula } from './lib/fonts/families-loader'`
- `fontRedirect()` helper
- `fontUnicodeRedirect()` helper
- Route `/font/:slug(.+)/unicode/:block` (redirect)
- Route `/font/:slug(.+)/unicode` (redirect)
- Route `/font/:slug(.+)` (redirect)

### What is KEPT (revised)

`byFormula` lookup in `family-lookup.ts` and `findFamilyByFormula` in `families-loader.ts` **stay**. They were introduced as the redirect's helper but are also a legitimate cross-entity query (formula slug → first family) needed by `FormulaPage.vue`'s "View Font Specimen" button. Removing them would break that page.

The redirect was the architectural problem (URL said "font" but meant formula, papered over with a runtime slug rewrite); the lookup itself is fine.

## Files not touched

- `src/lib/fonts/family-lookup.ts` — `byFormula` stays.
- `src/lib/fonts/families-loader.ts` — `findFamilyByFormula` stays.
- `src/lib/fonts/__tests__/families-loader.test.ts` — `byFormula` tests stay.
- `src/pages/FontPage.vue`, `src/pages/FontUnicodePage.vue`, `src/pages/FontBlockPage.vue` — already unrouted, left in place per repo rules.
- `src/pages/ComparePage.vue`, `src/pages/FormulaPage.vue` — still have `/font/${...}` links that relied on the now-removed redirects. Fixed in Phase D (see [04-nav-and-ssg.md](04-nav-and-ssg.md)).

## Verification

- `npm test` — 143 tests pass (no tests removed).
- No `/font/` references remain in `src/router.ts`.
- TypeScript build clean (no unused imports).
