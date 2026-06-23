# Information Architecture — fontist.org

Snapshot of the **runtime** IA as it exists on `feat/vite-ssg-migration` at
2026-06-23. All routes below render correctly when served by `vite dev` against
the current working-tree data. This diagram is for navigation reasoning, not a
spec — verify against `src/router.ts` and the page components before acting.

## Top-level routing surface

```
fontist.org/  (this repo, apex domain)
│
├── /                         HomePage ........... marketing landing
├── /about                    AboutPage ......... markdown render (about.md)
├── /blog  /blog/:slug        BlogIndex/BlogPost  markdown render
│
├── /browse                   BrowsePage ........ 4,283-formula index
│   └── FormulaBrowser.vue       (search · license · source filters · A–Z)
│
├── /formula/:slug            FormulaPage ......  formula metadata + install cmd
│   └── links → /font/:slug
│
├── /font/:slug               FontPage .........  interactive specimen
│   │                                            (axes · features · sample text)
│   ├── /font/:slug/unicode   FontUnicodePage ..  per-font coverage by block
│   │   └── /font/:slug/unicode/:block   FontBlockPage  (one font × one block)
│   └── links → /formula/:slug
│
├── /compare  /compare/:fonts ComparePage ......  side-by-side multi-font
│
└── /unicode  (the standalone Unicode browser — domain of `src/lib/unicode/`)
    ├── /unicode              UnicodePage ......  7 planes overview
    ├── /unicode/plane/:id    UnicodePlanePage   blocks in a plane, grouped by Unicode version
    ├── /unicode/block/:slug  UnicodeBlockPage   1-block grid (standalone, no font)
    ├── /unicode/char/:hex    UnicodeCharPage ..  one codepoint, deep metadata
    │                                                (case mappings, encodings,
    │                                                 decomposition, prev/next)
    │
    ├── /unicode/scripts  /scripts/:code      ┐
    ├── /unicode/category /category/:code     ├─ PropertyListPage /
    ├── /unicode/combining /combining/:cc     │  PropertyDetailPage
    └── /unicode/bidiclass /bidiclass/:bc     ┘  (same component, route props)

Other:
├── /guide/*                  GuidePage .........  markdown render (public/content/guide/)
├── /licenses/*               LicensePage .......  markdown render (public/content/licenses/)
└── /*                        NotFound
```

## Data flow per page

```
Browser
  │
  │  vite dev (SPA)  ·or·  vite-ssg build (SSR + hydration, when wired)
  ▼
src/main.ts ── createApp + createRouter ── App.vue ── DefaultLayout (nav/footer)
                                                    └─ <RouterView> → Page component
                                                          │
                                                          ▼
                                            ┌────────────────────────┐
                                            │  Page calls composables │
                                            │  & lib helpers only —   │
                                            │  never raw fetch()      │
                                            └────────────────────────┘
                                                          │
              ┌───────────────────────┬───────────────────┼───────────────────────┐
              ▼                       ▼                   ▼                       ▼
   injectFontFace()       fetchCoverage()        loadAllBlocks() /        FormulaPage /
   useFontFace.ts         useCoverage.ts         loadBlockCharacters()    FormulaBrowser
   (DOM <style> injection)(HTTP cache,           loader.ts               fetch formulas-data.json
   idempotent             per-slug cache)          │                     directly (no composable
                                                    │                      — minor layering lapse)
                                                    ▼
                              ┌──────────────────────────────────────┐
                              │  import.meta.env.BASE_URL + path      │
                              │  (the only base-path strategy)        │
                              └──────────────────────────────────────┘
                                                    │
                                                    ▼
                                            HTTP fetch
                                                    │
                ┌────────────────┬─────────────────┴┴────────┬────────────────┐
                ▼                ▼                           ▼                ▼
        public/              public/coverage/         public/fonts/*.woff2   public/formulas-data.json
        unicode-blocks.json  {slug}.json              (specimen binary)       (4,283 entries)
                │                │                           │                │
                │          { codepoints: number[],          │                │
                │           variable_axes, opentype_features,│                │
                │           blocks: [{name, codepoints}],   │                │
                │           total_codepoints, supported_blocks, ... }        │
                │                                           │                │
                ▼                                           ▼                ▼
        public/unicode/blocks/*.json (344 files, chars: [{cp,c,n,s,bc,cc,...}])
        public/unicode/indexes/by-{script,category,bidi,combining}.json
```

## The three "modes" of `UnicodeBlockGrid.vue`

The grid component is the workhorse of the Unicode experience. Same component,
three behavioral modes selected by props:

| Mode        | Trigger                       | Distinguishing behavior                                   |
|-------------|-------------------------------|-----------------------------------------------------------|
| standalone  | `mode="standalone"` (default) | Renders every codepoint in the block with system glyphs;  |
|             |                               | no coverage decoration; used by `/unicode/block/:slug`    |
| per-font    | `mode="per-font"` + 1 font    | Glyphs styled with the font's `@font-face`; unsupported   |
|             |                               | cells get dashed background + ✗ badge; `/font/:s/u/:b`    |
| multi-font  | `mode="multi-font"` + N fonts | Multiple glyph slots per cell, one per font; used by      |
|             |                               | `/compare` and findGaps()                                 |

## Cross-linking topology

```
                    HomePage
                       │
                       ▼
                   /browse ◄──────────────────────────────────┐
                       │                                       │
                       ▼                                       │
       ┌───────────────────────────────────┐                   │
       │  4,283 formula slugs (alphabetized)│                  │
       └───────────────────────────────────┘                   │
                       │                                       │
                       ▼                                       │
              /formula/:slug ─────► /font/:slug ◄──────────────┘
                       │                │
                       │                ├──► /font/:slug/unicode
                       │                │       │
                       │                │       └──► /font/:slug/unicode/:block
                       │                │                 │
                       │                │                 └──► /unicode/char/:hex
                       │                │                          │
                       │                ▼                          │
                       │           /formula/:slug ◄────────────────┘
                       │
                       ▼
              (license metadata)

  Unicode browser (separate entry, top-nav):
       /unicode ─► /unicode/plane/:p ─► /unicode/block/:b ─► /unicode/char/:h
                                       │                       │
                                       └──► /unicode/{scripts,category,
                                            combining,bidiclass}/:code
                                                │
                                                └──► (back to /unicode/char/:hex
                                                      for each listed codepoint)
```

## Data assets (per `public/`)

| Asset                                              | Source                           | When updated         | Size class |
|----------------------------------------------------|----------------------------------|----------------------|------------|
| `unicode-blocks.json` (346 blocks + version)       | formulas repo (committed here)   | Unicode release      | tens of KB |
| `unicode/blocks/*.json` (344 per-block char files) | formulas repo (committed here)   | Unicode release      | ~tens of MB|
| `unicode/indexes/by-{script,category,bidi,combining}.json` + per-code lists | formulas repo (committed) | Unicode release | MB |
| `fonts/noto/*.woff2` (22 fallback subsets)         | formulas repo (committed here)   | rare                 | MB         |
| `content/{guide,licenses,blog}/*.md`               | authored here                    | content edit         | KB         |
| `licenses/*.svg` (license badge icons)             | formulas repo (committed here)   | new license type     | KB         |
| `formulas-data.json` (4,283 entries)               | formulas repo                   | per-formula change   | ~2 MB      |
| `coverage/{slug}.json`                             | fontist-archive                 | per-font rebuild     | ~10s KB    |
| `fonts/{slug}.woff2`                               | fontist-archive                 | per-font rebuild     | ~10s KB    |
| `fonts.json`, `font-metadata.json`                 | fontist-archive                 | per-pipeline run     | ~1 MB      |
| `sources/*.svg`                                    | (referenced by FormulaBrowser)  | —                    | **MISSING**|

## Layer boundaries (enforced by convention, not tooling)

```
┌─────────────────────────────────────────────────────────┐
│ pages/        composition root — calls composables &    │
│               lib helpers; can hold page-local state    │
├─────────────────────────────────────────────────────────┤
│ composables/  Vue-specific reactive glue (DOM, cache).  │
│ components/   Pure presentation. Receive props, emit.   │
├─────────────────────────────────────────────────────────┤
│ lib/unicode/  pure TypeScript. The ONLY place fetch()   │
│   loader.ts   is allowed. Constants/types are pure.     │
│   coverage.ts operates on Sets — no I/O.                │
├─────────────────────────────────────────────────────────┤
│ public/*.json, *.woff2  static assets, fetched at       │
│                        runtime via import.meta.env.BASE │
└─────────────────────────────────────────────────────────┘
```

Two known layering lapses:
1. `FormulaBrowser.vue` and `FormulaPage.vue` fetch `formulas-data.json` directly
   instead of through a `useFormula()`/loader abstraction. Consequence: no
   cache, duplicated fetch logic, harder to swap source.
2. `goToFormula()` in `FormulaBrowser.vue` uses `window.location.href` to
   bypass the SPA router — vestigial workaround from the VitePress batched-
   build era. In vite-ssg with `includedRoutes` listing every formula, plain
   `<RouterLink>` should work and the bypass can go.
