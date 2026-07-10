# TODO.astro — Migration from vite-ssg + Vue to Astro

## Context

fontist.org currently runs on Vite + vite-ssg + Vue Router (37K pre-rendered
pages). The migration to Astro will:

- Keep Vue components as **islands** (interactive parts: heatmap, search,
  font specimen, nav toggle)
- Use Astro's file-based routing (no vue-router)
- Use Astro's content collections for markdown (blog, guide, licenses)
- Leverage Astro's built-in SSG (no vite-ssg dependency)
- Reduce client-side JS: most pages become pure HTML + CSS

## Migration phases

| # | Phase | Risk | Effort |
|---|---|---|---|
| 01 | Astro project scaffold + config | Low | 2h |
| 02 | Layout migration (DefaultLayout → Astro layout) | Low | 3h |
| 03 | Static page migration (About, Blog, Guide, Licenses, Unicode) | Medium | 6h |
| 04 | Dynamic page migration (Fonts, Families, Formulas) | High | 8h |
| 05 | Interactive islands (Heatmap, FontSpecimen, Compare, Nav toggle) | High | 6h |
| 06 | Build pipeline (gen-* scripts + Astro integration) | Medium | 3h |
| 07 | Test adaptation (Vitest + Playwright) | Medium | 4h |
| 08 | Cleanup (remove vue-router, vite-ssg, dead code) | Low | 2h |

Total estimate: ~34 hours (4-5 days focused work).

## What stays the same

- **All `src/lib/` code** — pure TypeScript, no Vue dependency. Works as-is.
- **All `scripts/gen-*.mjs`** — build scripts, no Vue dependency.
- **All `public/content/` data** — YAML, markdown, JSON. Unchanged.
- **Essenfont @font-face CSS** — cross-origin webfont system. Unchanged.
- **Tailwind 4 config** — `@theme` tokens work in Astro's Vite integration.

## What changes

- `vite-ssg` → Astro's built-in SSG
- `vue-router` → Astro file-based routing (`src/pages/`)
- `<script setup>` with top-level `await` → Astro frontmatter (`---`)
- `<RouterLink>` → `<a href>` (Astro generates real URLs)
- `useHead()` from `@unhead/vue` → Astro's `<head>` management
- `@vue/test-utils` mounts → Astro component testing or Playwright
