# TODO.separate — Formula / Family / Font URL separation

Status: **active execution**. Date: 2026-06-24. Branch: `feat/vite-ssg-migration`.

## Context

The site conflates three domain entities into one or two URL roots. `TODO.unify/14-implementation-plan.md` shipped a `/fonts/:familySlug` route that actually addresses a *family* using the path token "fonts". `/font/:slug` (legacy) accepts *formula slugs* in a "font" path. `FormulaBrowser` links to `/font/<formula-slug>`. The result: a "font" in the URL can mean a formula, a family, or a style depending on which route you hit.

## Domain model (source of truth)

| Entity | Identity | Slug shape | Example |
|---|---|---|---|
| **Formula** | source + name (a packaging recipe) | namespaced | `google/abeezee`, `sil/abyssinica_sil_2.300` |
| **Family** | canonical typeface name | bare | `abeezee`, `abyssinica_sil` |
| **Font** | one style/file within a family, provided by a formula | bare, often with style suffix | `abeezee`, `roboto_bold_italic` |

Each `FontFamilyFile` already carries both `slug` (style-level) and `formula_slug`. Two formulas can ship the same style with different woff2 files and different coverage — the data model supports this even when current upstream data doesn't always exercise it (345 families have multiple formulas per style today).

## Target URL scheme

| URL | Entity | Notes |
|---|---|---|
| `/formulas` | formula index | |
| `/formulas/:formulaSlug` | formula detail | Namespaced slug. |
| `/families` | family index | Was `/fonts`. |
| `/families/:familySlug` | family detail | Lists styles, formula provenance. |
| `/families/:familySlug/unicode` | family coverage | First redistributable style + switcher. |
| `/fonts/:fontSlug` | font (style) page | All formulas providing this style. `?formula=` switches. |
| `/fonts/:fontSlug/unicode` | font coverage | Per-formula coverage. |

No bare `/fonts` index — would be ~5,963 items, not useful for browsing. Users reach individual fonts via families.

No back-compat redirects. `/font/:slug`, `/browse`, `/formula/:slug` all stay 404 (consistent with how the rename was already handled for `/browse` and `/formula/:slug`).

## Phases

1. **[01-cleanup.md](01-cleanup.md)** — drop `/font/*` legacy redirect routes. `byFormula` stays (still used by `FormulaPage.vue`).
2. **[02-rename-families.md](02-rename-families.md)** — rename `/fonts/*` → `/families/*`. Rename `FontsPage.vue` → `FamiliesPage.vue`.
3. **[03-font-routes.md](03-font-routes.md)** — add `/fonts/:fontSlug` routes; new `FontStylePage.vue`, `FontStyleUnicodePage.vue`; new `filesBySlug()` lookup + `findFilesBySlug()` loader; tests.
4. **[04-nav-and-ssg.md](04-nav-and-ssg.md)** — nav: `Formulas` + `Families`; `gen-ssg-routes.mjs` emits per-fileSlug routes; FormulaBrowser links to `/formulas/<slug>`.
5. **[05-verify.md](05-verify.md)** — tests, build, route inventory, commits.

## Non-goals

- Backwards compatibility for any retired URL (`/font/:slug`, `/browse`, `/formula/:slug`).
- Per-version URL paths (e.g., `/fonts/<slug>/<formulaSlug>`). Formula disambiguation is via `?formula=` query param.
- Top-level `/fonts` index page.
- Changing the data model — `FontFamilyFile` already has the right shape.

## Success criteria

- All routes match the table above.
- `npm test` passes (existing + new lookup tests).
- `npm run build:no-fetch` succeeds.
- Route inventory in `public/ssg-routes.json`:
  - `/formulas/*` count: 1 index + N formula detail pages.
  - `/families/*` count: 1 index + N family + N family/unicode.
  - `/fonts/*` count: N font + N font/unicode (where N = unique file slugs).
  - Zero `/font/`, `/browse`, `/formula/` routes.
- Nav reads: Formulas / Families / Licenses / Guide / Unicode / Blog / About.
