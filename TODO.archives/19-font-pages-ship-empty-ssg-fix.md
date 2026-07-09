# 19 — Critical: font pages shipped empty in production SSG

## Why

End-to-end inspection of `dist/fonts/abel/index.html` (after the prior
"all green" builds) revealed that **every redistributable font page
shipped with an empty `<main class="fsp-body">` tag**, and every
`/fonts/:slug/unicode` page shipped stuck on `"Loading Unicode coverage…"`.

Two independent root causes, both SSG-related. Both silent — no test
caught them because tests don't render full pages.

## Issues

### 19.1 — `fetchCoverage` path mismatch

**Bug.** `src/composables/useCoverage.ts` constructed coverage paths as
`coverage/${slug}.json`, where `slug` is the *face* slug (`abel`,
`exo_medium`). But the archive layout is **per-face, namespaced**:

```
coverage/google/abel/Abel-Regular.json       ← actual location
coverage/abel.json                             ← what fetchCoverage tried
```

The path was wrong in two ways at once:
- Missing the formula namespace (`google/`).
- Missing the PostScript-style filename (`Abel-Regular.json`).

`font-metadata.json` already carries the correct relative path in its
`coverage_file` field (`coverage/google/abel/Abel-Regular.json`), but
the consumer code wasn't reading it. The `FontFamilyFile` interface had
a `path` field (the woff path) but no `coverage_file` field — so even
if a component wanted to pass it through, it couldn't.

**Result.** Every `fetchCoverage` call 404'd during SSG. Components
fell back to "no coverage data" or "loading forever".

### 19.2 — Font specimen + browser gated on `onMounted`

**Bug.** Both `FontSpecimen.vue` and `FontUnicodeBrowser.vue` (and
`FontViewer.vue`) initialized their data fetching inside `onMounted`
hooks. **`onMounted` does not fire during vite-ssg's server-side
render pass.** So:

- `FontSpecimen`'s `v-if="redistributable && fontReady"` evaluated
  `fontReady=false` during SSG → entire specimen section replaced
  with `<!---->` (Vue's empty v-if placeholder).
- `FontUnicodeBrowser`'s `v-if="!loading && coverage"` had
  `loading=true` (initial ref) and `coverage=null` → "Loading…"
  placeholder shipped as the final HTML.
- `FontViewer` (inspector view) had the same problem.

**Result.** Even if `fetchCoverage` had worked, the components would
still have shipped empty / "loading" because the data was never
fetched during SSG.

## Fix

### 19.1 — Thread `coverage_file` end-to-end

| Layer | Change |
|---|---|
| `src/lib/types/domain.ts` | `FontFamilyFile.coverage_file: string \| null` (new field) |
| `scripts/gen-font-families.mjs` | emit `coverage_file: m.coverage_file \|\| null` per file entry; the legacy `fonts/${slug}.woff` fallback for `path` is also dropped in favor of `null` (was wrong — see plan 17) |
| `src/composables/useCoverage.ts` | `fetchCoverage` now accepts either a face slug (legacy `coverage/{slug}.json`) OR a full archive-relative path (`coverage/google/abel/Abel-Regular.json`); cache key is the resolved path |
| `src/lib/fonts/compare-context.ts` | use `file.coverage_file` when present; derive from `file.path` (`woff/.../*.woff` → `coverage/.../*.json`) as a fallback |
| `FontViewer.vue`, `FontSpecimen.vue`, `FontUnicodeBrowser.vue` | new `coverageFile` prop; `fetchCoverage(props.coverageFile \|\| props.slug)` |
| `FontStylePage.vue`, `FontStyleUnicodePage.vue`, `FontFamilyPage.vue`, `FontFamilyUnicodePage.vue` | pass `:coverage-file="activeFile.coverage_file"` to all three components |

### 19.2 — Move data fetching out of `onMounted` to top-level await

Vue 3 `<script setup>` supports top-level `await`, which **does** run
during SSG. Restructured:

- `FontSpecimen.vue`: removed `fontReady` from the `v-if`. Specimen
  structure renders unconditionally for redistributable fonts. `fontId`
  ref now defaults to the slug-derived ID (`ff-${slug}`) so
  `font-family:` CSS is well-formed even before `onMounted` injects the
  `@font-face` rule. Font loads via `font-display: swap` once the
  `<style>` is appended on the client.
- `FontUnicodeBrowser.vue`: `fetchCoverage` + `fetchBlock` moved out of
  `onMounted` to top-level. Only font-CSS injection (which touches
  `document`) stays in `onMounted`.
- `FontViewer.vue`: same refactor — coverage fetch at top level,
  `@font-face` injection stays in `onMounted`.

## Verification

After the fix, `dist/fonts/abel/index.html`:

```html
<main class="fsp-body">
  <section class="specimen">
    <div class="specimen-hero" style="font-family:'ff-abel', sans-serif;">
      Whereas recognition of the inherent dignity
    </div>
    <div class="specimen-strip">
      <div class="specimen-line" style="font-family:'ff-abel', sans-serif;font-size:48px;...">
        The quick brown fox jumps over the lazy dog. 0123456789
      </div>
      ...
```

And `dist/fonts/abel/unicode/index.html`:

```html
<section class="fub">
  <div class="fub-summary">
    <span class="fub-count">248 codepoints</span>
    <span class="fub-sep">·</span>
    <span class="fub-count">11/11 blocks</span>
    <span class="fub-planes"><span class="fub-plane on">BMP</span> ...
```

For fonts without coverage data (e.g. `exo_medium`, whose archive
metadata has no `coverage_file` because archive-private hasn't
re-processed exo in the new per-face layout yet), the page now renders
the correct graceful fallback: `"No coverage data for this font yet."`
instead of `"Loading Unicode coverage…"` forever.

`npm test`: 230 passing. `npm run build:no-fetch`: 37,138 pages
generated successfully.

### 19.3 — Index pages (Families, Formulas) also shipped empty

**Same bug pattern.** `FamiliesPage.vue` (`/families`) and
`FormulaBrowser.vue` (`/formulas` via `BrowsePage.vue`) both loaded
their list data in `onMounted`. SSG output:

- `/families/index.html` rendered `"0 families"` + `"All Licenses (0)"`
  + an empty `<div class="family-list">` + a disabled alphabet nav.
- `/formulas/index.html` rendered the equivalent empty state.

**Fix.** Moved both `loadFontFamilies()` and `loadAllFormulas()` calls
out of `onMounted` to top-level `<script setup>` await. Query-param
initialization (search/redist/license filters) moved with them — those
also need to be set during SSG so deep links like `/formulas?license=ofl`
render correctly.

After the fix:
- `/families/index.html` renders all 6,627 family links.
- `/formulas/index.html` renders all 4,283 formula links.
- Both pages are ~3 MB of pre-rendered HTML.

## Files touched (cumulative across 19.1, 19.2, 19.3)

| File | Change |
|---|---|
| `src/lib/types/domain.ts` | +`coverage_file: string \| null` on `FontFamilyFile` |
| `scripts/gen-font-families.mjs` | emit `coverage_file`; drop `fonts/${slug}.woff` legacy fallback for `path` |
| `src/composables/useCoverage.ts` | accept full path OR slug; cache by resolved path |
| `src/lib/fonts/compare-context.ts` | use `coverage_file`; derive from path when missing |
| `src/components/FontViewer.vue` | +coverageFile prop; fetch at top level; inject @font-face in onMounted |
| `src/components/FontSpecimen.vue` | +coverageFile prop; default fontId to slug-derived; v-if no longer gates on fontReady |
| `src/components/FontUnicodeBrowser.vue` | +coverageFile prop; fetch at top level |
| `src/pages/FontStylePage.vue` | pass `:coverage-file` to both child components |
| `src/pages/FontStyleUnicodePage.vue` | pass `:coverage-file` |
| `src/pages/FontFamilyPage.vue` | pass `:coverage-file` to all three children |
| `src/pages/FontFamilyUnicodePage.vue` | pass `:coverage-file` |
| `src/pages/FamiliesPage.vue` | onMounted → top-level await |
| `src/components/FormulaBrowser.vue` | onMounted → top-level await |
| `public/font-families.json` | regenerated with `coverage_file` per file entry |

## Acceptance

- [x] `/fonts/abel` ships with full specimen structure in SSG HTML
- [x] `/fonts/abel/unicode` ships with real coverage summary (248 cp, 11/11 blocks)
- [x] `/fonts/exo_medium/unicode` ships with graceful "No coverage data" fallback
- [x] `/families` ships with all 6,627 family links rendered
- [x] `/formulas` ships with all 4,283 formula links rendered
- [x] `npm test` green (230 tests)
- [x] `npm run build:no-fetch` succeeds (37,138 pages)
- [x] No `loading…` / `0 families` / `0 formulas` placeholders left in built pages
- [x] `coverage_file` flows through registry → gen-font-families → component props

## Out of scope

- **FontBlockPage.vue / FontUnicodePage.vue** — orphaned pages not in
  `src/router.ts`. Their `fonts/${slug}.woff2` legacy paths were left
  intact per the global rule "zero imports ≠ dead code." If they're
  resurrected, they'll need the same `coverage-file` plumbing added.
- **Full per-face coverage data for every formula** — depends on
  archive-private CI running the new builder (plan 13). Until then,
  most formulas still have flat `coverage/{family}.json` and will
  render the "No coverage data" fallback. That's correct behavior
  given the data state.
