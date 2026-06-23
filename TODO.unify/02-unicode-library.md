# 02 — Move Unicode Library and Browser Pages

## Source: `formulas/docs/`
## Target: `fontist.org/src/`

## Library Code (pure TypeScript, no Vue dependency)

### Move `lib/unicode/` → `src/lib/unicode/`
```
src/lib/unicode/
  types/index.ts         ← interfaces (UnicodeBlock, UnicodeCharacter, etc.)
  constants.ts           ← pure functions (hexCp, safeChar, displayChar, etc.)
  data/loader.ts         ← fetch + parse JSON (loadAllBlocks, loadBlockCharacters)
  data/coverage.ts       ← set operations (computeCoverage, findGaps)
  index.ts               ← barrel export
  components/
    UnicodeBlockGrid.vue ← shared grid component
```

### Encapsulation Rules
- `types/` exports interfaces only — no implementation
- `constants.ts` exports pure functions — no side effects, no I/O
- `data/loader.ts` is the ONLY module that calls `fetch()` — all data access
  goes through this gateway. Pages never call fetch directly.
- `data/coverage.ts` operates on in-memory Sets — no I/O
- `components/` are pure presentation — receive props, emit events, no data fetching

### OCP: Adding New Data Sources
If we later want to load Unicode data from a different source (embedded,
API, different JSON format), only `loader.ts` changes. All pages and
components stay the same.

## Pages to Move

### Standalone Unicode Browser (moves to fontist.org)
- `UnicodePage.vue` — planes overview → `src/pages/UnicodePage.vue`
- `UnicodePlanePage.vue` — blocks in a plane → `src/pages/UnicodePlanePage.vue`
- `UnicodeBlockPage.vue` — standalone block grid → `src/pages/UnicodeBlockPage.vue`
- `UnicodeCharPage.vue` — character detail → `src/pages/UnicodeCharPage.vue`
- `PropertyListPage.vue` — property overview → `src/pages/PropertyListPage.vue`
- `PropertyDetailPage.vue` — characters by property → `src/pages/PropertyDetailPage.vue`

### Static Data to Move
- `public/unicode-blocks.json` → stays as static data
- `public/unicode/blocks/*.json` → stays as static data (344 files)
- `public/unicode/indexes/` → stays as static data (property indexes)

## Composables to Move
- `useUnicodeBlock.ts` → `src/composables/useUnicodeBlock.ts`
- `useMarkdownLinks.ts` → `src/composables/useMarkdownLinks.ts`

## Routes to Add
```typescript
{ path: '/unicode', component: () => import('./pages/UnicodePage.vue') },
{ path: '/unicode/plane/:planeId', component: () => import('./pages/UnicodePlanePage.vue') },
{ path: '/unicode/block/:blockSlug', component: () => import('./pages/UnicodeBlockPage.vue') },
{ path: '/unicode/char/:hex', component: () => import('./pages/UnicodeCharPage.vue') },
{ path: '/unicode/scripts', component: () => import('./pages/PropertyListPage.vue'), props: {...} },
{ path: '/unicode/scripts/:code', component: () => import('./pages/PropertyDetailPage.vue'), props: {...} },
{ path: '/unicode/category', ... },
{ path: '/unicode/category/:code', ... },
{ path: '/unicode/combining', ... },
{ path: '/unicode/combining/:cc', ... },
{ path: '/unicode/bidiclass', ... },
{ path: '/unicode/bidiclass/:bc', ... },
```

## What Stays in Formulas (does NOT move)
Nothing — ALL Unicode browser code moves to fontist.org. Formulas keeps
zero website code.

## Verification
- `/unicode` loads planes overview
- `/unicode/plane/bmp` loads BMP blocks
- `/unicode/block/basic-latin` loads grid with control char boxes
- `/unicode/char/0041` loads char detail with clickable metadata
- `/unicode/scripts/Zinh` loads inherited script characters
