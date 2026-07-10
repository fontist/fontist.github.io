# 05 — Interactive islands

## Why
Pages that need client-side interactivity (search filters, font specimen
controls, compare view, heatmap hover, nav burger) become Vue islands
inside Astro pages. Astro ships zero JS by default; islands hydrate
on-demand via `client:*` directives.

## Scope — islands to extract

| Island | Where used | Hydration | Source |
|--------|-----------|-----------|--------|
| `NavBurger.vue` | layout | `client:load` | new (extract from DefaultLayout) |
| `ThemeToggle.vue` | layout | `client:load` | new (extract from DefaultLayout) |
| `NavDocsDropdown.vue` | layout | `client:idle` | existing |
| `FormulaBrowser.vue` | formulas index | `client:visible` | existing |
| `FontSpecimen.vue` | font pages | `client:visible` | existing |
| `FontViewer.vue` | font unicode pages | `client:visible` | existing |
| `FontUnicodeBrowser.vue` | font block pages | `client:visible` | existing |
| `BlockCoverageHeatmap.vue` | family unicode pages | `client:visible` | existing |
| `ComparePage.vue` | /compare/* | `client:only` | existing |
| `ShaCopy.vue` | formula pages | `client:idle` | existing |

## Steps

1. **Strip router dependency** from each component. They use `useRoute()`
   to read URL params; in Astro, params are passed as props from the
   `.astro` page wrapper:
   ```astro
   ---
   const { slug } = Astro.params
   ---
   <FontSpecimen :slug={slug} client:visible />
   ```

2. **Replace `useHead()`** — Astro pages own `<head>`. Components that
   set head tags (e.g., FontSpecimen's font preload) become props/events
   flowing up to the page.

3. **ComparePage** — `client:only="vue"` because the slugs are chosen
   at runtime; no SSG output for individual slug combos. The Astro
   shell handles the empty state and renders a placeholder.

4. **FormulaBrowser** — passes URL query params as props from Astro
   frontmatter:
   ```astro
   ---
   const q = Astro.url.searchParams.get('q') ?? ''
   const formulas = await loadAllFormulas()
   ---
   <FormulaBrowser :initial-query={q} :formulas={formulas} client:visible />
   ```

5. **ThemeToggle + NavBurger** — extract small Vue islands (no router
   dependency, just refs + onMounted). The theme toggle reads/writes
   localStorage; the burger toggles a class on the nav element.

6. **Coverage heatmap** — already pastel-themed; just needs `client:visible`
   and the coverage data passed as a prop instead of fetched on mount.

## Acceptance
- [ ] Each island hydrates on its assigned directive (no over-hydration)
- [ ] Theme toggle works on first paint (no FOUC) via inline script
- [ ] Mobile nav collapses correctly at <720px
- [ ] Font specimen variable-axis slider works
- [ ] Compare page loads fonts and updates URL on add/remove
- [ ] Lighthouse: home page ships <30 KB JS

## Dependencies
- Phase 02 (layout — for nav + theme toggle islands)
- Phase 04 (dynamic pages — for wrapping interactive components)
