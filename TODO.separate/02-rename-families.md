# 02 — Rename /fonts/* → /families/*

Phase B of [README.md](README.md). Pure rename — fixes the "font" vs "family" conflation at the URL level. No new pages yet.

## Why

A "font" in fontist's data model is an individual style/file (entry in `family.files[]`). What I've been calling `/fonts/:familySlug` actually addresses a family. The URL root must reflect that.

## Route changes

| Was | Now |
|---|---|
| `/fonts` (index) | `/families` |
| `/fonts/:familySlug` | `/families/:familySlug` |
| `/fonts/:familySlug/unicode` | `/families/:familySlug/unicode` |

Route name `fonts-index` → `families-index` (matches path; only this name changed — `font-family` / `font-family-unicode` stay since they describe the page content, not the path).

## File changes

### `src/router.ts`

Three route `path` fields changed as in the table above.

### `src/pages/FontsPage.vue` → `src/pages/FamiliesPage.vue`

Rename via `git mv` to preserve history. Page title and meta description updated:
- Title: `Fonts — Fontist` → `Font Families — Fontist`
- Description: "Browse every font family…" → keep (already accurate).
- Canonical URL: `https://www.fontist.org/fonts` → `https://www.fontist.org/families`.

### `src/layouts/DefaultLayout.vue`

Nav link `/fonts` with label `Fonts` becomes `/families` with label `Families`.

### `src/pages/FontFamilyPage.vue`

Back-link: `/fonts` → `/families`. Label "Browse all families →" stays.

### `src/pages/FontFamilyUnicodePage.vue`

Back-link: `/fonts` → `/families`. Label stays.

### `src/pages/NotFound.vue`

Update `/fonts` link if present (currently `Formulas →`). Audit for any `/fonts` reference.

### `src/pages/HomePage.vue`

Already links to `https://www.fontist.org/formulas/` for the Formulas card. Check other CTAs. If anything points to `/fonts` (the old family index), update to `/families`.

### `scripts/gen-ssg-routes.mjs`

- STATIC_ROUTES: replace `/fonts` with `/families`.
- Family route emission loop: replace `/fonts/${fam.slug}` with `/families/${fam.slug}` (both the detail and `/unicode` variants).
- Sitemap priority rule `r.startsWith('/fonts/')` → `r.startsWith('/families/')`. Priority 0.9 stays.

## Verification

- `npm test` still passes (143 tests at this point in the phase sequence — Phase A kept byFormula tests; Phase C will add 4 more for filesBySlug, reaching 147).
- `npm run build:no-fetch` succeeds.
- `public/ssg-routes.json` contains `/families` and `/families/<slug>`; zero `/fonts/` family routes (the new `/fonts/:fontSlug` routes don't exist until Phase C).
