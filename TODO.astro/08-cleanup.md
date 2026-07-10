# 08 — Cleanup

## Why
After all pages are migrated and tests pass, remove the legacy vite-ssg
stack to reduce build time, dependencies, and surface area.

## What to remove

| Item | Reason |
|------|--------|
| `vite-ssg` dependency | Replaced by Astro's built-in SSG |
| `@vitejs/plugin-vue` (top-level) | Astro's Vue integration handles this |
| `vite.config.ts` | Replaced by `astro.config.mjs` |
| `src/main.ts` | Astro owns the entry point |
| `src/router.ts` | Replaced by Astro file-based routing |
| `src/App.vue` | Replaced by `DefaultLayout.astro` |
| `src/layouts/DefaultLayout.vue` | Replaced by `DefaultLayout.astro` |
| `scripts/gen-ssg-routes.mjs` | Replaced by `getStaticPaths` |
| `public/ssg-routes.json` | No longer needed |
| `vue-router` dependency | No longer used |
| `@unhead/vue` dependency | Astro manages `<head>` natively |

## What stays

- All `src/lib/` (pure TypeScript)
- All `src/components/*.vue` that are now islands
- All `src/composables/*.ts`
- All `scripts/gen-*.mjs` except `gen-ssg-routes.mjs`
- All `public/content/` data
- All Vitest tests for lib/composables
- Tailwind 4 config (`src/styles/main.css`)

## Steps

1. **Verify migration complete** — all 13K+ routes build via Astro, all
   tests pass, no references to removed files anywhere:
   ```bash
   grep -rn "vite-ssg\|vue-router\|@unhead/vue" src/ scripts/ 2>/dev/null
   ```

2. **Remove dependencies**:
   ```bash
   npm uninstall vite-ssg vue-router @unhead/vue @vitejs/plugin-vue vite
   ```

3. **Delete legacy files** — list each file explicitly and confirm with
   the user before deletion (per the global "never delete source files"
   rule, the user must approve every removal).

4. **Update `CLAUDE.md`** — replace vite-ssg references with Astro in
   the architecture section.

5. **Final Lighthouse audit** — confirm performance gains (target:
   80%+ reduction in JS bundle size on home page).

## Acceptance
- [ ] No `vite-ssg`, `vue-router`, or `@unhead/vue` imports anywhere
- [ ] `npm run build` succeeds with only Astro dependencies
- [ ] All tests still pass
- [ ] Lighthouse: 95+ performance on home page
- [ ] `node_modules` size reduced by ≥30%
- [ ] CLAUDE.md updated to reflect Astro architecture

## Dependencies
- All previous phases
- Explicit user approval for each file deletion
