# 20 — SSG regression coverage + dist size observation

## Why

Plan 19 fixed three production bugs where pages shipped empty during SSG
because data loading was inside `onMounted` hooks (which don't fire
during vite-ssg's server render pass). The existing test suite (230
tests at the time) caught **none of them** — it tests pure functions
but never renders a page.

This plan captures:
1. Two new unit tests added to lock the `coverage_file` contract.
2. Recommendation for a post-build SSG smoke test.
3. Observation: `dist/` is 967 MB, approaching GitHub Pages' 1 GB
   published-site limit.

## 20.1 — `coverage_file` plumbing tests

Added to `scripts/__tests__/gen-font-families.test.mjs`:

```js
it('threads coverage_file through to FontFamilyFile when metadata provides it', () => {
  // Uses new mkPerFaceMeta() helper that emits both woff_file and
  // coverage_file with namespaced paths (woff/google/abel/Abel-Regular.woff
  // + coverage/google/abel/Abel-Regular.json).
  ...
  assert.equal(file.coverage_file, 'coverage/google/abel/Abel-Regular.json')
  assert.equal(file.path, 'woff/google/abel/Abel-Regular.woff')
})

it('emits null for path and coverage_file when metadata omits them', () => {
  // Non-redistributable formula with no artifacts on disk.
  ...
  assert.equal(file.path, null)
  assert.equal(file.coverage_file, null)
  assert.equal(file.redistributable, false)
})
```

Test count: 230 → 232.

These would have caught the `coverage_file` field omission during
plan 19's refactor if they'd existed beforehand.

## 20.2 — Post-build SSG smoke test (IMPLEMENTED)

**Gap.** No test verified that built pages actually contained rendered
content. A future change that moves data fetching into `onMounted`
would pass all unit tests but ship empty HTML.

**Implementation.** `scripts/__tests__/ssg-smoke.test.mjs`:

- Auto-skips when `dist/` doesn't exist (so `npm test` on a fresh clone
  doesn't fail). Skip message: `"dist/ not built — run npm run build first"`.
- Walks `dist/**/*.html` and asserts none contain regression markers:
  - `<main class="fsp-body"><!--` (FontSpecimen didn't render — plan 19.2)
  - `Loading Unicode coverage` (FontUnicodeBrowser stuck initial — plan 19.2)
  - `>0 families</span>` (FamiliesPage onMounted — plan 19.3)
  - `>0 formulas</span>` (FormulaBrowser onMounted — plan 19.3)
  - `All Licenses (0)` (license facet never populated)
- On failure: prints up to 5 violations with file path + marker.
- Cost: ~2 seconds against the current 37,138-page dist/.

Wired into `npm test` via the `scripts/__tests__/*.test.mjs` glob.

Verified:
- Skip when dist/ absent: ✅
- Pass when dist/ clean: ✅ (1 test, 2.4s)
- Fail when injected regression marker: ✅ (caught `<main class="fsp-body"><!--`)

## Files touched

| File | Change |
|---|---|
| `scripts/__tests__/gen-font-families.test.mjs` | +`mkPerFaceMeta` helper; +2 tests covering coverage_file plumbing |
| `scripts/__tests__/ssg-smoke.test.mjs` | new file — post-build regression scan |

## 20.3 — `dist/` size observation

After all fixes, `npm run build:no-fetch` produces:

```
dist/                967 MB
dist/fonts/          192 MB   (19,144 routes — /fonts/:slug + /fonts/:slug/unicode)
dist/families/       125 MB   (13,305 routes)
dist/unicode/        126 MB   (358 routes including big CJK blocks)
dist/formulas/        36 MB   (4,284 routes)
```

GitHub Pages enforces a **1 GB published-site limit**. We're at 97% of
that limit. Once archive-private CI produces per-face coverage for more
formulas (plan 13 lands), expect `dist/fonts/` to grow further as
coverage data renders into more pages.

**Largest individual pages today:**

| Page | Size |
|---|---|
| `dist/families/index.html` | 3.6 MB |
| `dist/formulas/index.html` | 3.2 MB |
| `dist/unicode/block/cjk-unified-ideographs-extension-h/index.html` | 2.3 MB |
| `dist/compare/index.html` | 549 KB |

**Not blocking yet**, but flag for capacity planning:
- The `/families` and `/formulas` index pages are essentially "list
  everything" pages. They'll keep growing as the formula set grows.
- Per-style `dist/fonts/` is the long-term risk — 19K today, will grow
  to ~30-40K once every formula has per-face coverage.

**Mitigations to consider** (separate from this plan):
1. Paginate `/families` and `/formulas` index pages (e.g., 200 per page).
2. Move the alphabet nav + filtering to a query API rather than
   pre-rendering every link.
3. Compress aggressive whitespace in the SSG output (vite-ssg already
   does some via html-minify-terser).

## Files touched

| File | Change |
|---|---|
| `scripts/__tests__/gen-font-families.test.mjs` | +`mkPerFaceMeta` helper; +2 tests covering coverage_file plumbing |
| `scripts/__tests__/ssg-smoke.test.mjs` | new — post-build regression scan (auto-skips if dist/ absent) |

## Acceptance

- [x] `gen-font-families.test.mjs` has tests for both the with-coverage_file
      and without-coverage_file branches (2 new tests)
- [x] Post-build SSG smoke test implemented (`ssg-smoke.test.mjs`)
- [x] Smoke test skips cleanly when dist/ doesn't exist
- [x] Smoke test fails when regression marker is injected (verified)
- [x] `npm test` green (233 tests total: 230 prior + 2 coverage_file + 1 smoke)
- [ ] (Follow-up) Pagination plan for `/families` + `/formulas` per 20.3

## Out of scope

- Paginating the index pages — UX decision that touches routing.
- Reconsidering `/unicode/char/:hex` SSG at scale (covered in plan 18.2).
