# 06 — Build pipeline

## Why
The current `npm run build` chains: `fetch-data.sh` → `gen-ssg-routes.mjs`
→ `vite-ssg build`. With Astro, the SSG step is built in; the route list
comes from `getStaticPaths` in each page. The fetch + gen scripts stay
mostly unchanged.

## Current pipeline

```
fetch-data.sh              → public/*.json, public/coverage/*, public/fonts/*.woff2
gen-font-families.mjs      → public/font-families.json
gen-licenses-index.mjs     → public/content/licenses/index.json
gen-unicode-data.mjs       → public/unicode-blocks.json, public/unicode/*
gen-ssg-routes.mjs         → public/ssg-routes.json, public/sitemap.xml
vite-ssg build             → dist/
```

## Target pipeline

```
fetch-data.sh              → unchanged
gen-font-families.mjs      → unchanged
gen-licenses-index.mjs     → unchanged
gen-unicode-data.mjs       → unchanged
gen-sitemap.mjs (new)      → public/sitemap.xml (after build, walks dist/)
astro build                → dist/
```

## Steps

1. **Update `package.json`** scripts:
   ```json
   {
     "scripts": {
       "dev": "astro dev",
       "build": "./scripts/fetch-data.sh && astro build && npm run gen:sitemap",
       "build:no-fetch": "astro build && npm run gen:sitemap",
       "preview": "astro preview",
       "gen:sitemap": "node scripts/gen-sitemap.mjs"
     }
   }
   ```

2. **Remove `gen-ssg-routes.mjs`** — Astro's `getStaticPaths` replaces it.
   But keep the route list for sitemap generation; the new
   `gen-sitemap.mjs` walks `dist/` after build to enumerate URLs (more
   reliable than guessing from route definitions).

3. **`astro.config.mjs`** — set `output: 'static'`, `site: 'https://www.fontist.org'`,
   and `build.format: 'directory'` (matches vite-ssg's `dirStyle: 'nested'`
   so `/foo/` resolves on GitHub Pages).

4. **GitHub Actions workflow** (`.github/workflows/*.yml`) — update
   `npm run build` invocation; the dist/ output shape is the same.

5. **Backwards-compat**: keep `vite.config.ts` + vite-ssg working until
   all phases are complete. The two builds can coexist; CI runs the
   Astro build, dev can use either.

## Acceptance
- [ ] `npm run build` produces dist/ with same URL shape as before
- [ ] sitemap.xml has same URL count (±5%)
- [ ] GitHub Actions CI builds successfully
- [ ] Deploy to GitHub Pages works (CNAME, og-image, etc.)
- [ ] `npm run dev` starts Astro dev server on port 4321

## Dependencies
- All previous phases (otherwise there are no pages to build)
