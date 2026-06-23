# Audit — `feat/vite-ssg-migration` branch

Snapshot date: 2026-06-23. Branch: `feat/vite-ssg-migration`. LOC: ~9,400 TS/Vue/CSS.

Scope: code smells, OCP/DRY/MECE violations, model conflation, layering lapses,
test coverage, documentation gaps. Findings are concrete and actionable —
each item names a file:line where applicable and the principle it violates.

## Severity scale

- **P0 (architecture blocker)** — the long-term clean is impossible without resolving these.
- **P1 (correctness/quality)** — causes user-visible bugs or maintenance pain.
- **P2 (cleanup)** — safe to defer, low-impact.

---

## A. Data model conflation — **P0**

### A.1 Font URL serves formula data

`src/pages/FontPage.vue:33` calls `findFormula(s)` to render `/font/:slug`. The
"font" page is actually rendering a formula record and its bundled families.

```ts
// src/pages/FontPage.vue
formula.value = await findFormula(s)
```

**Principle violated:** Model-driven, semantically-driven (CLAUDE.md). A "font" is
not a "formula"; one URL should not serve the other's data.

**Consequence:** `/font/yu` shows 10 families (Yu Mincho + Yu Gothic + ...) collapsed
under the formula name "Yu". Individual families have no canonical page. If two formulas
ship "Roboto", only one wins the slug.

### A.2 Formula record doubles as font collection

`FormulaData` (`src/lib/formulas/loader.ts:3-14`) mixes concerns:

```ts
export interface FormulaData {
  name: string
  formulaName: string
  slug: string
  familyCount: number       // ← formula property
  styleCount: number        // ← formula property
  familyNames: string[]     // ← font family property
  sourceType: string
  platforms: string[]
  licenseType: string       // ← formula property
  licenseCategory: string
  licenseName: string
}
```

**Principle violated:** Single Responsibility, MECE. A formula is a recipe; a font
family is a typographic entity. The two should not share a type.

### A.3 No reverse index for "fonts shipped by formula" / "formulas providing font"

`font-metadata.json` has `formula_path` (forward link) but no inverse. To answer
"which formulas provide Roboto?" we'd have to scan all entries.

**Principle violated:** Single source of truth. The relationship exists in the data;
not exposing it forces every consumer to recompute.

### A.4 Missing entities

The domain has five real entities; the codebase models two:

| Real entity       | Modeled as            |
|-------------------|-----------------------|
| Formula           | `FormulaData`         |
| Font Family       | (conflated with Formula) |
| Style             | (string in `familyNames[]`) |
| Font File         | `FontMetadataEntry`   |
| Coverage          | (loose JSON in `public/coverage/`) |

**Spec:** see `08-domain-model.md`.

---

## B. Layering lapses — **P1**

### B.1 `useUnicodeBlock.ts` bypasses the loader

`src/composables/useUnicodeBlock.ts:17` calls `globalThis.fetch` directly:

```ts
const res = await globalThis.fetch(`${basePath}unicode/blocks/${slug}.json`)
```

`lib/unicode/data/loader.ts` is the canonical gateway (`00-architecture.md`
"Dependency Inversion"). The composable reimplements basePath + JSON parse + cache.

**Fix:** Use `loadBlockCharacters(blockName)` from the loader.

### B.2 Orphaned `src/components/UnicodeBlockGrid.vue`

Two components share this name:

- `src/lib/unicode/components/UnicodeBlockGrid.vue` — live (3 importers)
- `src/components/UnicodeBlockGrid.vue` — orphaned (0 importers)

`grep -r 'components/UnicodeBlockGrid' src/` returns nothing.

**Fix:** Delete `src/components/UnicodeBlockGrid.vue`. (Already noted in `REM-WORK.md` §9.)

### B.3 `FormulaBrowser.vue` SPA-router bypass

`src/components/FormulaBrowser.vue:118` reads `window.location.search` directly
instead of using vue-router's `useRoute().query`. The legacy `goToFormula()`
function (per REM-WORK §12) navigates via `window.location.href` rather than
`router.push` or `<RouterLink>`.

**Fix:** Use `useRoute()` for query, `<RouterLink>` for navigation. Delete `goToFormula()`.

---

## C. Type system fragmentation — **P1**

### C.1 Domain types live inside loader files

`FormulaData` is declared in `src/lib/formulas/loader.ts:3-14`. `FontEntry` and
`FontMetadataEntry` in `src/lib/fonts/loader.ts:3-26`. There is no
`src/lib/types/` or shared domain module.

**Consequence:** Any page that needs both a Formula and a FontEntry imports two
loader modules just for types. Cross-entity relationships (a Formula's fonts) have
no canonical home.

**Fix:** Create `src/lib/types/domain.ts`. Move all domain interfaces there. Loaders
re-export for backward compat.

### C.2 No type for MarkdownContent / Frontmatter

`loadParsedMarkdown` returns `{ raw, frontmatter, body }` but the return type is
inferred inline; `Frontmatter` is exported from the markdown loader, not from a
types module. Inconsistent with where FormulaData lives.

### C.3 No type for coverage

`fetchCoverage()` in `src/composables/useCoverage.ts` returns `any`. The actual
shape (`{ codepoints: number[], blocks: [...], variable_axes, opentype_features,
total_codepoints, supported_blocks }`) is undocumented in TS.

---

## D. Test coverage — **P1**

### D.1 Stale tests

| File | Status | Action |
|---|---|---|
| `tests/dirify.test.mjs` | Tests `scripts/dirify-urls.mjs` which was deleted | **Delete** |
| `tests/nav-consistency.spec.ts` | Targets `.VPNavBar*` selectors that no longer exist | **Delete** |
| `src/lib/unicode/__tests__/constants.test.ts` | Live, useful | Keep |

Stale tests give false confidence — CI is green but tests nothing.

### D.2 Missing test coverage

No tests for:
- `src/lib/ssr-fetch.ts` — SSR vs browser branch, JSON parse errors
- `src/lib/markdown/loader.ts` — frontmatter parsing edge cases (missing `---`,
  nested code fences containing `---`, quoted strings, multi-line values)
- `src/composables/useTheme.ts` — toggle state, localStorage persistence, system
  preference detection
- `scripts/gen-ssg-routes.mjs` — block slug derivation, license/guide index generation
- `src/lib/fonts/loader.ts` — cache behavior
- `src/router.ts` — route resolution for catch-all, param patterns

**Spec:** see `10-specs.md`.

---

## E. Generated data committed to repo — **P1**

These files are committed in `public/` but are build outputs per `04-static-data.md`:

- `public/formulas-data.json` (~2 MB)
- `public/fonts.json` (~1 MB)
- `public/font-metadata.json`
- `public/coverage/*.json` (53 files)
- `public/fonts/*.woff2` (52 files, noto/ excluded)

`scripts/fetch-data.sh` and CI overwrite them on every build. Committed copies
drift from prod and bloat the repo.

**Fix:** Add to `.gitignore`, `git rm --cached` the tracked files (do not delete from disk).
See `04-static-data.md` for the exact `.gitignore` block.

---

## F. CSS architecture — **P2**

### F.1 Monolithic stylesheet

`src/styles/main.css` is 933 lines covering: tokens, reset, layout primitives,
specimen vocabulary, about-page styles, markdown typography, 404, scrollbars,
font-face declarations, Unicode glyph rendering.

**Principle violated:** MECE, OCP. Adding a new surface means editing the same file
as every other surface.

**Recommend:** Split into `tokens.css`, `base.css`, `typography.css`,
`specimen.css`, `unicode-glyphs.css`, `vendor-fonts.css`. Defer until other
refactors land — visual regressions are easy to introduce.

### F.2 Mixed legacy variables

Both `--vp-c-*` (VitePress legacy) and `--spec-*` (current) are used. The bridge
lives at `src/styles/main.css:32-44` but no page should depend on `--vp-c-*` anymore.

**Audit:** `grep -rn 'var(--vp-c-' src/ | wc -l` → 21 hits across pages/components.

**Fix:** Sweep and replace with `--spec-*` equivalents, then delete the bridge.

### F.3 Per-page scoped styles override global rules

We just fixed this in `GuidePage.vue` and `LicensePage.vue` (the `pre` background
conflict). Pattern is risky: any page that defines `:deep(pre)`, `:deep(code)`,
etc. can shadow `main.css`. No convention prevents it.

**Convention to add to `09-page-contract.md`:** scoped styles must not re-declare
typography that exists in `main.css`. Use the `md-doc` / `gp-content` class hooks
already provided.

---

## G. Routing/URL model — **P0 (per A.1)**

### G.1 Singular `/font/:slug` should be plural

REST convention: collections are plural. `/fonts/:familySlug` reads correctly;
`/font/:slug` reads as "one specific font" (which a family with N styles isn't).

### G.2 `/browse` is the formula index but doesn't say so

Users (and the user) have repeatedly been confused that Browse = formulas. Rename
route to `/formulas`, keep `/browse` as alias during transition.

### G.3 No bidirectional Unicode → Fonts cross-link

`/unicode/block/basic-latin` shows characters but never answers "which fonts
cover this block?" — even though we have coverage data for every font. Highest-
value missing feature.

### G.4 Variable font styles not addressable

A variable font's named instances (Roboto Black, Roboto Thin, etc.) cannot be
deep-linked. The FontPage shows axis controls but no `/font/roboto/styles/black` URL.

---

## H. Performance — **P2**

### H.1 `loadAllFormulas()` loads entire 2 MB JSON

Every page that calls `findFormula()` (FontPage, FormulaPage, FormulaBrowser)
loads the full `formulas-data.json` — 4,283 entries, ~2 MB. No per-slug lookup
endpoint exists. Acceptable for SSG (one read at build), but in the browser the
first navigation pays the full cost.

**Future:** Generate a per-slug index `formulas-index.json` mapping slug → file
offset, or split into `formulas/a/*.json`, `formulas/b/*.json`, etc.

### H.2 Coverage data is one file per font

`public/coverage/{slug}.json` — fine for per-font fetch, but no aggregate for
"which fonts cover block X?" Building the reverse index at SSG time is O(N×M)
but feasible (4,283 fonts × ~100 blocks each).

---

## I. Documentation gaps — **P2**

### I.1 No spec for the domain model

`00-architecture.md` describes repo boundaries but not entities. `IA.md` shows
routes but not relationships. New contributors must read code to learn the model.

**Fix:** `08-domain-model.md` (this batch).

### I.2 No page contract

What must every page do? (Call `useHead`, set canonical, handle loading/error
states, use loaders not fetch.) Undocumented.

**Fix:** `09-page-contract.md` (this batch).

### I.3 `CLAUDE.md` is accurate but high-level

Project CLAUDE.md gives the architecture but not the conventions. The global
CLAUDE.md has the absolute rules. Neither spec-out the page-level patterns.

---

## J. Build pipeline — **P2**

### J.1 `gen-ssg-routes.mjs` has its own frontmatter parser

`scripts/gen-ssg-routes.mjs:34-43` parses YAML frontmatter with regex. The Vue
side (`src/lib/markdown/loader.ts`) has its own parser. Two implementations of
the same logic.

**Fix:** Extract a shared parser into `src/lib/markdown/frontmatter.ts` (pure TS,
no Vue dep). Use it from both the Vue loader and the build script.

### J.2 `scripts/fetch-data.sh` not idempotent

If run twice, fetches everything twice. No `--if-missing` flag, no etag caching.
Acceptable for CI but wasteful for local dev.

---

## K. Accessibility — **P2**

Not audited deeply, but two obvious issues:
- Theme toggle button has `aria-label` ✓ but no `aria-pressed`.
- Nav dropdown hover-only on desktop; keyboard users can open it (button is
  clickable) but the menu items inside are `<a>` not `role="menuitem"` properly
  wired for arrow-key navigation.

Defer to a dedicated a11y pass.

---

## L. Unicode data provenance — **P0** (resolved 2026-06-23)

### L.1 No regeneration script for 344 committed Unicode block files

`public/unicode/blocks/*.json` (344 files), `public/unicode-blocks.json`, and
`public/unicode/indexes/*` (8 files) are committed to the repo with no script
that regenerates them.

`scripts/fetch-data.sh` handles `formulas-data.json`, `fonts.json`,
`font-metadata.json`, `coverage/`, and `fonts/*.woff2` — but does NOT touch
Unicode data.

The field shapes (`cp`, `n`, `c`, `s`, `bc`, `mir`, `lo`, `up`, `ti`) exactly
match UCD XML attributes (`@cp`, `@na`, `@gc`, `@sc`, `@bc`, `@mir`, `@lc`,
`@uc`, `@tc`). Someone extracted these from UCD XML at some point — the
extraction script was never committed.

**Consequence:** Unicode version upgrades require hand-rolling. There is no
record of which Unicode version the current files target. Stale data ships
invisibly.

**Fix applied (2026-06-23):** `scripts/gen-unicode-data.mjs` downloads
`https://www.unicode.org/Public/<version>/ucdxml/ucd.all.flat.zip`, parses the
XML via `scripts/lib/ucd-xml.ts` (pure-logic, fully tested), and regenerates
`public/unicode/blocks/*.json`, `public/unicode-blocks.json`,
`public/unicode/indexes/*`, and `public/unicode-version.json`. Defaults to
Unicode 17.0.0; `--unicode-version=X.Y.Z` to override; `--force` to re-download;
default `--clean` removes stale block files and stale property-index files.
Spec: `12-ucd-xml-pipeline.md`. Run via `npm run gen-unicode`.

### L.2 Unknown Unicode version

`unicode-blocks.json` records `unicode_version` per block (ranging from "1.1"
to recent), but there is no top-level "this data is from Unicode X.Y.Z"
marker. The site claims Unicode support without stating which version.

**Fix applied (2026-06-23):** `gen-unicode-data.mjs` writes
`public/unicode-version.json` recording the source version, generation
timestamp, char count, and block count. Current value:
`{"version":"17.0.0","charCount":159866,"blockCount":346}`.

---

## M. No schema validation on upstream data — **P1**

`fetchJson<T>` parses JSON and types it as `<T>`, but does zero runtime
validation. If `formulas-data.json` schema changes upstream (field renamed,
type changed), every consumer silently breaks at render time.

```ts
// src/lib/ssr-fetch.ts
export async function fetchJson<T>(path: string): Promise<T> {
  // ... reads/parses/fetches
  return JSON.parse(text) as T  // <-- the `as T` is a lie
}
```

**Fix:** Introduce `zod` (or similar) schemas at the ingest boundary.
`loadAllFormulas()` validates against `FormulaDataSchema` and throws on
mismatch. Pages catch and degrade gracefully.

Spec: `13-schema-validation.md` (planned, not yet written).

---

## N. Upstream snake_case leaks into domain — **P2**

`FontEntry.canonical_name`, `FontMetadataEntry.coverage_file`,
`FontMetadataEntry.woff2_file` are snake_case — inherited from the upstream
Ruby-generated JSON. Our codebase is camelCase. The leak is in
`src/lib/types/domain.ts:18-25`.

**Why this matters:** MECE — upstream naming conventions should not dictate
our internal model. Translation belongs at the ingest boundary.

**Fix:** When implementing the ingest layer (see M), translate field names
at parse time:
```ts
// In the loader
const raw = await fetchJson<RawFontEntry>('fonts.json')
return raw.fonts.map(({ canonical_name, style_count, ...rest }) => ({
  ...rest,
  canonicalName: canonical_name,
  styleCount: style_count,
}))
```

Back-compat: keep the raw shape available in a separate `RawFontEntry` type
for debugging.

---

## O. CJK detection regex duplicated three times — **P1** (resolved 2026-06-23)

The "is this a CJK block?" regex appeared in:

1. `src/lib/unicode/constants.ts:87` — `scriptGroup()`:
   `/CJK|Hiragana|Katakana|Hangul|Bopomofo|Kangxi|Yi|Phags-pa/i`

2. `src/components/FontUnicodeBrowser.vue:43` — `scriptCategory()`:
   `/CJK|Hiragana|Katakana|Hangul|Bopomofo/i`

Each copy had a slightly different set of alternations. The same block was
classified as "CJK" by one function and "Other" by the other (e.g. `Kangxi
Radicals`, `Yi Syllables`, `Phags-pa`).

**Fix applied (2026-06-23):** Replaced both ad-hoc classifiers with a single
canonical classifier chain in `src/lib/unicode/constants.ts`:

- `ScriptFamily` — union type modeling the 12 script families
- `SCRIPT_FAMILY_PATTERNS` — ordered list of `[family, regex]` pairs (single
  source of truth)
- `blockScriptFamily(name): ScriptFamily` — canonical classifier
- `isCjkBlock(name): boolean` — thin convenience predicate
- `scriptFamilyLabel(family): string` — display label map
- `scriptGroup(name): string` — preserved for backward compat (now a thin
  wrapper over the canonical path)

`FontUnicodeBrowser.vue` now imports `blockScriptFamily` and uses a local
display-label map (`FONT_SCRIPT_LABELS`) for the per-font summary. The
canonical classifier drives classification; the local map controls only
display strings. While there, also replaced the local `safeChar()` duplicate
and inline `hex` formatting with imports from `constants.ts`.

**Test coverage:** 11 new tests in `constants.test.ts` cover the canonical
classifier, `isCjkBlock`, and `scriptFamilyLabel`, including the specific
previously-misclassified blocks (Kangxi, Yi, Phags-pa).

---

## P. No `<Suspense>` boundaries — **P2**

Pages use top-level `await`, which during SPA navigation can leave the
previous page rendered until the new one resolves. There is no `<Suspense>`
wrapper in `App.vue` or `DefaultLayout.vue`.

For SSG this is invisible (pages are pre-rendered with data already
resolved). For SPA navigation it manifests as "freeze then jump."

**Fix:** Wrap `<RouterView />` in `<Suspense>` with a `<template #fallback>`
that renders a minimal loading state. Low priority — most pages load fast
enough that the gap isn't visible.

---

## Q. Test/code drift detected by new specs — **P1** (resolved 2026-06-23)

When I added `src/lib/unicode/__tests__/slug.test.ts` with correct expectations,
it revealed that the pre-existing `constants.test.ts` had TWO wrong assertions:
`scriptGroup('CJK Unified Ideographs')` returned `'CJK'` (not
`'CJK (Chinese/Japanese/Korean)'`) and `blockDisplayName('CJK ... Extension A')`
returned `'Extended CJK Characters'` (not `'CJK Extension A'`).

CI was green because `npm test` only ran `tests/*.mjs` — the `.ts` specs in
`src/lib/**/__tests__/` were never discovered.

**Fix applied:** Updated `package.json` test glob + corrected
`constants.test.ts` assertions. CI will now catch drift.

**Lesson:** Test files that aren't being run are worse than no tests — they
give false confidence. The `npm test` script should auto-discover, not
enumerate.

---

## R. `dirify.test.mjs` is documentation, not stale — **P2** (reclassified)

Initial audit (D.1) called `tests/dirify.test.mjs` stale because the
`scripts/dirify-urls.mjs` it ostensibly targeted was deleted. On closer
reading: the test runs the dirify algorithm INLINE against a fake dist tree.
It's intentional documentation of the historical algorithm (vite-ssg made
the script obsolete via `dirStyle: 'nested'`).

**Action:** Keep. The file header already explains the context.

---

## Summary by priority (updated)

| Priority | Count | Items |
|---|---|---|
| **P0** | 3 (1 resolved) | A (data model), G (URL model), A.3, ~~L (Unicode provenance)~~ ✅ |
| **P1** | 9 (3 resolved) | B (layering), C (types), D (tests), E (committed data), **M (schema validation)**, ~~**O (CJK regex DRY)**~~ ✅, ~~**Q (test/code drift)**~~ ✅ |
| **P2** | 7 | F (CSS), H (perf), I (docs), J (build), K (a11y), **N (snake_case)**, **P (Suspense)**, **R (dirify reclassified)** |

## What this session will resolve

- **AUDIT.md** (this doc) — captures all findings including L–R extensions
- **08-domain-model.md** — P0 spec for the entity model
- **09-page-contract.md** — conventions for every page
- **10-specs.md** — test plan covering D
- **11-unicode-data-provenance.md** — analysis of L
- **12-ucd-xml-pipeline.md** — spec + implementation for L.1
- **Implementation:** B.2 (delete orphan grid), B.1 (useUnicodeBlock loader),
  B.3 (FormulaBrowser router fix), D.1 (delete stale tests), C.1 (centralize types),
  D.2 (add specs for loaders/theme/markdown/routes), Q (fix constants drift),
  L.1 (gen-unicode-data.mjs), O (extract isCjkBlock)

Deferred (need user direction or out-of-session scope):
- A/G full URL rename and entity split — P0 but high-risk
- E gitignore changes — needs `git rm --cached` coordination
- F CSS split — visual regression risk
- H perf optimizations — measure first

Each deferred item has a clear spec in this directory; future work picks up the doc.
