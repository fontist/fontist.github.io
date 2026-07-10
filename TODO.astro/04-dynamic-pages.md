# 04 — Dynamic page migration

## Why
Dynamic pages generate one HTML file per data record (~13,000 routes
total). In vite-ssg this is handled by `gen-ssg-routes.mjs` + ssgOptions.
In Astro, `getStaticPaths()` does the same job — per-page, declarative.

## Scope — dynamic page types

| Route pattern | Count | Source |
|---------------|-------|--------|
| `/fonts/:slug` | ~2K | `FontPage.vue` |
| `/fonts/:slug/styles/:style` | ~4K | `FontStylePage.vue` |
| `/fonts/:slug/unicode` | ~2K | `FontStyleUnicodePage.vue` |
| `/fonts/:slug/blocks/:block` | ~290K potential, 50K actual | `FontBlockPage.vue` |
| `/families/:slug` | ~1.5K | `FontFamilyPage.vue` |
| `/families/:slug/unicode` | ~1.5K | `FontFamilyUnicodePage.vue` |
| `/formulas/:slug` | ~2K | `FormulaPage.vue` |
| `/unicode/blocks/:block` | 340 | `UnicodeBlockPage.vue` |
| `/unicode/characters/:cp` | ~150K | `UnicodeCharPage.vue` |
| `/unicode/properties/:prop` | ~500 | `PropertyListPage.vue` |
| `/unicode/properties/:prop/:value` | ~5K | `PropertyDetailPage.vue` |
| `/compare/:slugs` | dynamic | `ComparePage.vue` (SPA-only — see phase 05) |

## Steps

1. **Pattern**: each `*.vue` → `*.astro` with `getStaticPaths`:
   ```astro
   ---
   import type { GetStaticPaths } from 'astro'
   import DefaultLayout from '../../layouts/DefaultLayout.astro'
   import { loadAllFormulas } from '../../lib/formulas/loader'

   export const getStaticPaths = (async () => {
     const formulas = await loadAllFormulas()
     return formulas.map(f => ({
       params: { slug: f.slug },
       props: { formula: f },
     }))
   }) satisfies GetStaticPaths

   const { formula } = Astro.props
   ---
   <DefaultLayout title={`${formula.name} — Formula — Fontist`}>
     <!-- formula details -->
   </DefaultLayout>
   ```

2. **Font pages** — read from `loadFontsRegistry()` + `loadFontMetadata()`.
   Each font has metadata for styles, paths, coverage. The
   `font-families.json` index provides the family grouping.

3. **Unicode block/char pages** — read from `public/unicode/*.json` via
   the existing loaders. `getStaticPaths` enumerates 340 blocks and
   ~150K codepoints (selectively — only emit pages for chars that
   appear in at least one font's coverage).

4. **Property pages** — `PropertyListPage.vue` is reused for multiple
   properties via route `props`. In Astro, create separate `.astro`
   files per property OR use a single dynamic route with `getStaticPaths`
   that emits all property variants.

5. **ComparePage** — `/compare/:slugs` is user-driven (slugs chosen at
   runtime). Keep as SPA: render the page shell via Astro, then hydrate
   the interactive ComparePage Vue island with `client:only`. See phase 05.

6. **Per-page SEO** — each `.astro` page emits its own `<title>`, OG
   tags, canonical URL via the `<slot name="head">` in DefaultLayout.

## Acceptance
- [ ] All dynamic URL paths match the existing sitemap.xml
- [ ] `astro build` produces the same file count as the current vite-ssg build
- [ ] Per-page OG tags are correct (spot-check 10 pages)
- [ ] Build time is within 2x of current vite-ssg (~5 min)
- [ ] Spot-check 3 pages per route pattern render identically

## Dependencies
- Phase 02 (layout)
- Phase 03 (static pages, for pattern)
