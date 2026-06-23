# 00 — Architecture: Three-Repo Unification

## Goal
Consolidate the Fontist web presence into a clean three-repo architecture with
full separation of concerns, OOP/OCP compliance, and zero code duplication.

## Repositories

### 1. `fontist/formulas` — Pure Data
```
formulas/
  Formulas/           ← 4,283 YAML formula files
  process/            ← Ruby scripts (data generation)
  test/               ← CI tests (schema, URL, installation)
  vendor/             ← Unicode source data (UnicodeData.txt, etc.)
  .github/            ← CI workflows
```
**Responsibility**: Define how fonts are downloaded and installed.
**No website code.** Generates JSON data artifacts consumed by other repos.

### 2. `fontist/fontist-archive` — Pre-built Artifacts
```
fontist-archive/
  coverage/           ← Unicode coverage JSON per font
  fonts/              ← OTS-safe woff2 specimens
  fonts.json          ← Font registry (canonical name → formulas)
  font-metadata.json  ← Build manifest
```
**Responsibility**: Cache expensive build outputs (woff2 encoding, coverage
extraction) so they're not rebuilt on every website deploy.

### 3. `fontist/fontist.github.io` — The Website
```
fontist.github.io/  (fontist.org)
  src/
    lib/unicode/        ← TypeScript library (types, constants, loader, coverage)
    lib/fonts/          ← Font data loading (registry, coverage, specimens)
    composables/        ← Vue composables (font face, variation, coverage)
    components/         ← Shared Vue components (UnicodeBlockGrid, FontViewer, etc.)
    pages/              ← All page components
    styles/             ← Global CSS
    layouts/            ← Layout components
    router.ts           ← Route definitions
  public/
    formulas-data.json    ← fetched from formulas repo at build time
    coverage/             ← fetched from fontist-archive
    fonts/                ← fetched from fontist-archive
    unicode/              ← static Unicode data (committed)
    content/              ← guide + licenses markdown (committed)
    noto/                 ← Noto Sans fallback fonts (committed)
    blog/                 ← blog markdown (committed)
  index.html
  main.ts
  App.vue
  vite.config.ts
  package.json
```
**Responsibility**: Render the website. Fetches data from the other two repos
at build time. Contains ALL website code.

## Data Flow
```
formulas (YAML)
    ↓ CI: validate + generate JSON
formulas-data.json (formulas-data, stats, search-index)
    ↓ triggers rebuild
fontist-archive (woff2 + coverage)
    ↓ fetched at build time
fontist.github.io (website)
    ↓ deployed to
fontist.org
```

## OOP/OCP Principles

### Open/Closed: Adding new page types
- New page type = new file in `src/pages/` + route in `router.ts`
- No existing code modified
- Pages depend on abstract interfaces (Loaders), not concrete implementations

### Encapsulation: Library boundaries
- `lib/unicode/` exposes only types + pure functions via barrel export
- `lib/fonts/` exposes only data loading interfaces
- Internal implementation (JSON parsing, caching) is private
- Pages never access JSON files directly — always through loaders

### Single Responsibility
- `lib/unicode/` — Unicode standard data (blocks, characters, properties)
- `lib/fonts/` — Font catalog data (registry, coverage, specimens)
- `composables/` — Reactive state management (Vue-specific)
- `components/` — Reusable UI elements
- `pages/` — Route-level components (composition root)

### Dependency Inversion
- Pages depend on loader interfaces, not fetch() calls
- Loaders can be swapped (local JSON, remote API, embedded data)
- Tests can mock loaders without touching pages

## Naming Conventions
- Pages: `{Domain}{Action}Page.vue` (e.g., `UnicodeCharPage.vue`, `FontSpecimenPage.vue`)
- Components: `{Domain}{Widget}.vue` (e.g., `UnicodeBlockGrid.vue`)
- Composables: `use{Capability}.ts` (e.g., `useFontFace.ts`)
- Loaders: `{domain}/loader.ts` (e.g., `lib/unicode/data/loader.ts`)
- Types: `lib/{domain}/types/index.ts`

## Migration Path
1. **Phase 1**: Set up vite-ssg infrastructure in fontist.org (TODO 01)
2. **Phase 2**: Move Unicode library + pages from formulas (TODO 02)
3. **Phase 3**: Move font specimen pages + composables (TODO 03)
4. **Phase 4**: Move static data + content (TODO 04)
5. **Phase 5**: Convert existing fontist.org content to vite-ssg pages (TODO 05)
6. **Phase 6**: Set up CI data pipeline (TODO 06)
7. **Phase 7**: Clean up formulas — remove docs/, make data-only (TODO 07)
