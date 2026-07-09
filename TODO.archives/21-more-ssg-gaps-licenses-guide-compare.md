# 21 — More silent SSG gaps: /licenses, /guide, ComparePage runtime

## Why

After plan 19 + 20, end-to-end sampling of every route in `src/router.ts`
against `dist/` surfaced three more pre-existing issues that the smoke
test didn't catch (because the smoke test scans for *content patterns*,
not *missing pages*).

## Issues

### 21.1 — `/licenses` and `/guide` index pages missing from SSG

**Bug.** `scripts/gen-ssg-routes.mjs:9` had:

```js
const STATIC_ROUTES = ['/', '/about', '/blog', '/compare', '/families',
                       '/formulas', '/unicode']
```

`/licenses` and `/guide` were absent. The generator *did* enumerate
individual license and guide entries (`routes.add('/licenses/${s}')`,
`routes.add('/guide/${g.slug}')`), so deep pages like
`/licenses/apache` and `/guide/what-is-formula` rendered correctly —
but the index pages `/licenses` and `/guide` themselves were never
added to `ssg-routes.json`.

**Result in production.** Visiting `https://www.fontist.org/licenses`
or `https://www.fontist.org/guide` 404'd on GitHub Pages (no
`dist/licenses/index.html` or `dist/guide/index.html` shipped).

The router declared the routes (`router.ts:29,31`), so in dev mode
they worked. SSG silently dropped them.

**Fix.** Added both to `STATIC_ROUTES`:

```js
const STATIC_ROUTES = ['/', '/about', '/blog', '/compare', '/families',
                       '/formulas', '/unicode', '/licenses', '/guide']
```

Verified: `dist/licenses/index.html` (14 KB) and
`dist/guide/index.html` (16 KB) now exist and contain the rendered
list of licenses / guides.

Route count: 37,138 → 37,140.

### 21.2 — ComparePage hardcoded `fonts/${slug}.woff2` path

**Bug.** `src/pages/ComparePage.vue:74` (pre-fix) passed a hardcoded
legacy flat path to `injectFontFace`:

```js
const { fontId, ensureInjected } = injectFontFace(slug, `fonts/${slug}.woff2`, true)
```

And called `fetchCoverage(slug)` (line 89) which constructed
`coverage/${slug}.json` — same path-mismatch bug as plan 19.1, just in
a different consumer.

**Why the smoke test missed it.** ComparePage's initial render is the
empty "No fonts selected" state — well under any regression marker.
The bug only manifests at runtime when the user clicks a font to add
to the comparison.

**Fix.** `loadRegistry()` now builds a `slugToMetadata` map keyed by
family slug from `loadFontMetadata()`; `addFont()` looks up the
matching entry and uses its `woff_file` (for `injectFontFace`) and
`coverage_file` (for `fetchCoverage`) when present, falling back to
slug-only paths otherwise.

```js
const meta = slugToMetadata.value.get(slug) || {}
const fontPath = meta.woff_file || null
const coveragePath = meta.coverage_file || slug

let fontId = `ff-${slug.replace(/[^a-z0-9]/gi, '-')}`
if (fontPath) {
  const r = injectFontFace(slug, fontPath, true)
  r.ensureInjected()
  fontId = r.fontId
}
// ...
col.coverage = await fetchCoverage(coveragePath)
```

### 21.3 — Stale `TODO.ucode-clean/*` references in source

**State.** Eight source-code comments referenced `TODO.ucode-clean/{02,03,06,07}`
files that don't exist anywhere in the repo (called out in plan 18.1
as a doc-gap; this plan completes the cleanup).

**Fix.** Repointed all 8 references to the code itself (the contract
is the implementation). Files touched:

- `src/lib/types/domain.ts:222` — codepoint filename contract
- `src/lib/unicode/constants.ts:152,173,257` — codepoint hex canonical form, Unihan registry
- `src/lib/unicode/data/loader.ts:133` — codepoint detail loader
- `src/pages/UnicodeCharPage.vue:82,331` — SSG pre-render, Unihan categories
- `scripts/fetch-data.sh:148` — unicode pipeline

`grep -rn 'TODO.ucode-clean' src/ scripts/` now returns zero results.

## Files touched

| File | Change |
|---|---|
| `scripts/gen-ssg-routes.mjs` | `/licenses` + `/guide` added to STATIC_ROUTES |
| `src/pages/ComparePage.vue` | use `woff_file` / `coverage_file` from metadata instead of hardcoded legacy paths |
| `src/lib/types/domain.ts` | drop `TODO.ucode-clean/03` reference |
| `src/lib/unicode/constants.ts` | drop 3 `TODO.ucode-clean/{03,06}` references |
| `src/lib/unicode/data/loader.ts` | drop `TODO.ucode-clean/03` reference |
| `src/pages/UnicodeCharPage.vue` | drop 2 `TODO.ucode-clean/{02,06}` references |
| `scripts/fetch-data.sh` | drop `TODO.ucode-clean/07` reference |
| `scripts/__tests__/ssg-smoke.test.mjs` | +route-coverage test (would catch missing index.html pages) |

## Acceptance

- [x] `/licenses/index.html` and `/guide/index.html` exist in dist/
- [x] `grep -rn 'TODO.ucode-clean' src/ scripts/` returns 0 results
- [x] ComparePage uses per-face `woff_file` + `coverage_file` from metadata
- [x] `npm test` green (234 tests; was 233 before route-coverage smoke added)
- [x] `npm run build:no-fetch` succeeds (37,140 pages)
- [x] `dist/` size stays under the 1 GB GitHub Pages limit (969 MB)
- [x] Smoke test extended with route-coverage check (would catch
      future "missing index page" bugs of this exact class)

## Follow-up: `/unicode/{property}/:code` property detail pages

While surveying static routes vs dist/ I also noticed the dynamic
property routes (`/unicode/scripts/:code`, `/unicode/category/:code`,
`/unicode/combining/:code`, `/unicode/bidiclass/:code`) were not
pre-rendered. I added the generation, ran the build, and:

1. **It crashed with `JavaScript heap out of memory`** because each
   detail page renders the entire per-property char list (e.g.
   `scripts/Zyyy.json` ≈ 5 MB rendered HTML, `category/Lo.json` ≈ 4 MB).
   With 280 detail pages each holding a chunky `Set<number>` +
   the full Unicode index in memory, the default 4 GB heap was
   exhausted.
2. Bumping to `NODE_OPTIONS=--max-old-space-size=8192` got the build
   to finish, but **`dist/` grew to 1.2 GB — over the GitHub Pages
   1 GB published-site limit.**

**Reverted.** Property detail pages stay SPA-only (vue-router
lazy-loads them on demand). The index pages (`/unicode/scripts`,
`/unicode/category`, etc.) are still pre-rendered.

**Future options** if the user wants these pages pre-rendered:

| Option | Trade-off |
|---|---|
| Run build with `NODE_OPTIONS=--max-old-space-size=8192` and accept dist > 1 GB | Need a different host (CloudFlare Pages, Netlify) |
| Paginate the property pages (e.g., 500 chars per page) | URL surface changes |
| Pre-render only "top N" property values (top 50 scripts, top 30 categories) | Cheaper pages stay SSG; rare pages stay SPA |
| Move to a hybrid SSG + CSR model via vue-router lazy-load + sitemap hints | SEO cost on rare pages |

None of these are urgent — the property detail pages have always
worked in dev mode and via SPA navigation in production. The TODO is
captured here so the question is on record.

## Out of scope

- Adding more regression markers to the SSG smoke test for "missing
  index page" detection. The smoke test currently scans for content
  patterns, not route coverage. A separate "every route in router.ts
  has a corresponding dist/ page" check would catch this class of bug
  but is a larger design decision.
- The orphaned `FontBlockPage.vue`, `FontPage.vue`, `FontUnicodePage.vue`
  (not in `src/router.ts`, never imported). Their hardcoded
  `fonts/${slug}.woff2` paths are still wrong, but the files don't
  ship in production. Left intact per global rule "zero imports ≠
  dead code."
