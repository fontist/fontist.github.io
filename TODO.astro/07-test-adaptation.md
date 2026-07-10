# 07 — Test adaptation

## Why
The Vitest suite (141+ tests) was written for Vue components mounted via
`@vue/test-utils`. After migration, Astro pages aren't Vue components —
they're `.astro` files compiled to HTML. Tests need to adapt:

- **Pure logic tests** (lib/, composables/, scripts/) — unchanged
- **Vue component tests** (interactive islands) — still work, but the
  component props/emit surface may change (router props removed)
- **Page tests** (Vitest on .vue pages) — replaced by Playwright or
  Astro component tests on the rendered HTML

## Current test inventory

| File | Tests | Status after migration |
|------|------:|------------------------|
| `tests/vitest/DataLayer.test.ts` | 20 | Unchanged (pure lib) |
| `tests/vitest/Features.test.ts` | 42 | Unchanged (lib + YAML) |
| `tests/vitest/Loaders.test.ts` | 23 | Unchanged (lib) |
| `tests/vitest/Composables.test.ts` | 13 | Unchanged (composables) |
| `tests/vitest/Components.test.ts` | 10 | Update if component props change |
| `tests/vitest/Components2.test.ts` | 12 | Update if component props change |
| `tests/vitest/BlockCoverageHeatmap.test.ts` | 6 | Unchanged (Vue island) |
| `tests/vitest/PermissionsMatrix.test.ts` | 4 | Unchanged (Vue island) |
| `tests/vitest/Pages.test.ts` | 11 | Replace BlogPostPage test with Playwright |
| `node --test` (scripts) | 252 | Unchanged |

## Steps

1. **Verify all lib/composable tests still pass** after migration — these
   should be untouched. Run `npx vitest run` to confirm.

2. **Update Vue component tests** to drop router-dependent mount setups:
   - Components receive params as props, not from `useRoute()`
   - Remove `vi.mock('vue-router')` where no longer needed
   - Remove Suspense wrappers (no async setup in islands)

3. **Add Playwright** for end-to-end page tests:
   ```bash
   npm install -D @playwright/test
   ```
   Create `tests/e2e/` with one test per page type:
   - `home.spec.ts` — hero renders, ecosystem cards
   - `font-detail.spec.ts` — specimen loads, coverage renders
   - `compare.spec.ts` — adding/removing fonts updates URL
   - `unicode-block.spec.ts` — block page shows glyph grid

4. **Add Astro component test** for `DefaultLayout.astro` using
   `@astrojs/test-utils` to verify slot rendering.

5. **CI matrix** — run both Vitest (lib/component layer) and Playwright
   (page layer) on every PR.

## Acceptance
- [ ] All 252 node tests still pass
- [ ] All Vitest lib/composable tests still pass (≥140 tests)
- [ ] Vitest component tests pass after prop updates
- [ ] Playwright runs end-to-end on 5+ page types
- [ ] CI workflow runs both test suites

## Dependencies
- All previous phases
