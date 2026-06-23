# 10 — Specs plan

Spec date: 2026-06-23. Status: **plan**. Resolves AUDIT D.

## Current state

| File | Status | Action |
|---|---|---|
| `tests/dirify.test.mjs` | stale (target deleted) | **delete** |
| `tests/nav-consistency.spec.ts` | stale (VitePress selectors gone) | **delete** |
| `src/lib/unicode/__tests__/constants.test.ts` | live, useful | keep |

After deletion, the test suite runs zero tests. The plan below rebuilds
coverage around **behavior**, not interactions. No doubles — real data, real
functions, asserted outputs.

## Principles (carry forward from global CLAUDE.md)

1. **No `double()`** — or the JS equivalent (jest.fn with no real impl). Use
   the real function with real input.
2. **Behavior over interactions.** Assert output, not "was called N times."
3. **Pure functions are the testable core.** Tests target the `src/lib/` layer.
   Vue components are exercised via the build (SSG succeeds = smoke test).
4. **Node's built-in test runner.** `node --test`. No new test framework.

## Plan

### Phase 1 — Cleanup (this session)

- **Delete** `tests/dirify.test.mjs`
- **Delete** `tests/nav-consistency.spec.ts`

Both reference deleted code. Keeping them is misleading: CI is green but
verifies nothing.

### Phase 2 — Core specs

Each spec lives next to the code it tests, mirroring `src/lib/unicode/__tests__/`.

#### `src/lib/ssr-fetch/__tests__/ssr-fetch.test.mjs`

```
- fetchJson: reads JSON from public/ via fs during SSG path
- fetchJson: returns parsed JSON for valid input
- fetchJson: throws TypeError for malformed JSON
- fetchJson: returns null/empty for 404 in browser path (mock fetch)
- fetchText: returns raw string
- basePath: respects import.meta.env.BASE_URL
```

#### `src/lib/markdown/__tests__/loader.test.mjs`

```
- loadParsedMarkdown: parses well-formed frontmatter + body
- returns null for missing file
- handles missing closing '---' (returns raw, no frontmatter)
- handles code fence containing '---' (does not split)
- handles multi-line YAML values
- handles quoted strings with special chars
- handles empty frontmatter (---\n---\nbody)
- handles empty body
```

This spec is the highest-leverage of the batch. The frontmatter parser is
re-implemented in `scripts/gen-ssg-routes.mjs:34-43` (AUDIT J.1) — once the
spec exists, we can extract a shared `parseFrontmatter` and have both callers
test against it.

#### `src/lib/fonts/__tests__/loader.test.mjs`

```
- loadFontsRegistry: returns array from registry JSON
- loadFontMetadata: returns map keyed by slug
- findFontEntry(slug): returns entry or undefined
- cache: second call does not re-read file (fs spy)
```

No mocks. The test reads the real `public/fonts.json` and `public/font-metadata.json`.
If those files are absent (clean checkout before fetch), the test is skipped
with a clear message — `t.skip('run npm run build:no-fetch first')`.

#### `src/lib/formulas/__tests__/loader.test.mjs`

```
- loadAllFormulas: returns 4,283 entries (smoke check on count)
- findFormula(slug): returns entry or undefined
- findFormula: handles dotted slugs (e.g., 'google.noto')
- cache: second call returns same reference
```

#### `src/lib/unicode/__tests__/slug.test.ts` (new)

```
- blockNameToSlug('Basic Latin') === 'basic-latin'
- blockNameToSlug('CJK Unified Ideographs Extension A') === 'cjk-unified-ideographs-extension-a'
- hexForCodepoint(0x0041) === '0041'
- hexForCodepoint(0x1F600) === '1f600'
- planeForCodepoint(0x0041) === 0
- planeForCodepoint(0x1F600) === 1  (SMP)
```

#### `src/composables/__tests__/useTheme.test.mjs`

```
- detect(): returns stored theme when localStorage has 'dark'
- detect(): returns stored theme when localStorage has 'light'
- detect(): falls back to prefers-color-scheme
- detect(): defaults to 'light' when no stored pref and no matchMedia
- toggle(): flips dark <-> light
- toggle(): persists to localStorage
- toggle(): updates document.documentElement.classList
```

Pure-function extraction: refactor `useTheme.ts` so the detect/toggle logic is
in a pure `themeState.ts` module, then `useTheme.ts` is a thin Vue wrapper.
Test the pure module.

#### `scripts/__tests__/gen-ssg-routes.test.mjs`

```
- collectGuides: returns [{slug,title,description}, ...] from content/guide/
- collectGuides: ignores files without frontmatter title
- collectLicenses: returns [{slug,title,description}, ...]
- deriveRoutes: includes /font/<slug> for every font-metadata entry
- deriveRoutes: includes /unicode/block/<slug> for every block
- deriveRoutes: includes /guide/<slug> for every guide
- deriveRoutes: includes /licenses/<slug> for every license
- sitemap: includes <loc> for every route
- sitemap: excludes /404 and dev routes
```

### Phase 3 — Integration specs (deferred)

These exercise the full SSG pipeline and are higher-cost. Defer until Phase 2
is green.

- `tests/integration/ssg-build.test.mjs` — runs `npm run build:no-fetch` against
  a tiny fixture data set, asserts every route emits a `.html` file.
- `tests/integration/routing.test.mjs` — for each route in `src/router.ts`,
  asserts the param regex matches expected slug shapes (dotted, kebab, hex).

## Runner config

`package.json`:

```json
{
  "scripts": {
    "test": "node --test --test-reporter=spec 'src/**/__tests__/**/*.test.{ts,mjs}' 'scripts/__tests__/**/*.test.mjs' 'tests/**/*.test.{ts,mjs}'",
    "test:watch": "node --test --watch 'src/**/__tests__/**/*.test.{ts,mjs}'"
  }
}
```

Glob expansion requires Node 21+. If the project pins older Node, list files
explicitly or use `tsx --test` (already a dev dep via vite).

## Coverage targets (informational)

Not gates — guides for where to add next:

| Module            | Target | Today |
|---|---|---|
| `src/lib/`        | 80%    | ~5%   |
| `src/composables/`| 60%    | 0%    |
| `scripts/`        | 60%    | 0%    |
| `src/pages/`      | smoke  | n/a (SSG is smoke test) |

## What specs block merge

A PR that touches any of these modules without updating the corresponding spec
is blocked:

- `src/lib/markdown/loader.ts` — must update `loader.test.mjs`
- `src/lib/ssr-fetch.ts` — must update `ssr-fetch.test.mjs`
- `scripts/gen-ssg-routes.mjs` — must update `gen-ssg-routes.test.mjs`
- `src/composables/useTheme.ts` — must update `useTheme.test.mjs`

Other modules: specs preferred, not required for merge.

## Open questions

1. **tsx or node --test**? Node 21+ has native TypeScript stripping for test
   files. If the project pins Node 20, use `tsx --test`. Decide based on
   `.nvmrc` / `engines` field.

2. **Test data fixtures** — large JSON files (`formulas-data.json`, 2 MB)
   shouldn't be committed to the test directory. Tests read from `public/`
   and skip when absent. Confirm this is acceptable.
