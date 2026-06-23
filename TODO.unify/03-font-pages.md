# 03 — Move Font Specimen Pages and Composables

## Source: `formulas/docs/`
## Target: `fontist.org/src/`

## Font-Specific Composables
These manage font loading and reactive state — they're Vue-specific but
not tied to any single page.

### Move to `src/composables/`
- `useFontFace.ts` → `injectFontFace()` — lazy @font-face injection with dedup
- `useFontVariation.ts` → `useFontVariation()` — reactive variable axis + OT feature state
- `useCoverage.ts` → `fetchCoverage()` — cached per-font coverage fetcher

### Encapsulation
- Each composable has a single responsibility
- `injectFontFace` manages DOM style injection — nothing else touches `<style>`
- `useFontVariation` manages reactive state — nothing else stores axis values
- `fetchCoverage` manages HTTP cache — nothing else caches coverage data

## Font Specimen Pages

### Move to `src/pages/`
- `FontPage.vue` → `src/pages/FontPage.vue` — font detail with specimen
- `FontUnicodePage.vue` → `src/pages/FontUnicodePage.vue` — per-font Unicode coverage
- `FontBlockPage.vue` → `src/pages/FontBlockPage.vue` — per-font block grid
- `BrowsePage.vue` → `src/pages/BrowsePage.vue` — browse all fonts
- `ComparePage.vue` → `src/pages/ComparePage.vue` — multi-font comparison
- `FormulaPage.vue` → `src/pages/FormulaPage.vue` — formula YAML detail

### Move to `src/components/`
- `FontViewer.vue` → `src/components/FontViewer.vue` — 3-panel font inspector
- `FontUnicodeBrowser.vue` → `src/components/FontUnicodeBrowser.vue`
- `FontSpecimen.vue` → `src/components/FontSpecimen.vue`
- `FormulaBrowser.vue` → `src/components/FormulaBrowser.vue`
- `LicenseBadge.vue` → `src/components/LicenseBadge.vue`
- `ShaCopy.vue` → `src/components/ShaCopy.vue`

### Move to `src/pages/`
- `GuidePage.vue` → `src/pages/GuidePage.vue`
- `LicensePage.vue` → `src/pages/LicensePage.vue`
- `HomePage.vue` → merge with existing fontist.org home
- `NotFound.vue` → `src/pages/NotFound.vue`

## Routes to Add
```typescript
{ path: '/font/:slug(.+)/unicode/:block', component: FontBlockPage },
{ path: '/font/:slug(.+)/unicode', component: FontUnicodePage },
{ path: '/font/:slug(.+)', component: FontPage },
{ path: '/formula/:slug(.+)', component: FormulaPage },
{ path: '/browse', component: BrowsePage },
{ path: '/compare', component: ComparePage },
{ path: '/compare/:fonts', component: ComparePage },
{ path: '/guide/:path(.*)*', component: GuidePage },
{ path: '/licenses/:path(.*)*', component: LicensePage },
```

## Data Dependencies (fetched from fontist-archive at build time)
- `formulas-data.json` — formula metadata (from formulas repo)
- `coverage/*.json` — per-font Unicode coverage (from fontist-archive)
- `fonts/*.woff2` — font specimens (from fontist-archive)
- `fonts.json` — font registry (from fontist-archive)
- `font-metadata.json` — manifest (from fontist-archive)

## Content to Move
- `public/content/guide/*.md` → `public/content/guide/` (14 files)
- `public/content/licenses/*.md` → `public/content/licenses/` (23 files)
- `public/content/licenses/data/*.yml` → license YAML data

## Styles to Move
- `styles/main.css` → `src/styles/main.css`
  - Contains: Source Sans Pro font stack, Noto Sans @font-face (local woff2),
    global layout, Unicode glyph rendering rules
- `public/fonts/noto/*.woff2` → `public/fonts/noto/` (22 Noto Sans subset files)

## Verification
- `/browse` loads font browser
- `/font/inter` loads specimen with weight slider + feature toggles
- `/font/inter/unicode` loads per-font Unicode coverage
- `/compare/inter,abel` loads side-by-side comparison
- `/guide` loads guide index
- `/licenses` loads license index
