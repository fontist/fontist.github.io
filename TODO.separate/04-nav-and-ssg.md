# 04 — Nav + SSG + FormulaBrowser

Phase D of [README.md](README.md). Wires the new routes into the build pipeline and updates internal links.

## Nav (`src/layouts/DefaultLayout.vue`)

After Phase B, nav reads: Formulas / Families / Licenses / Guide / Unicode / Blog / About. No "Fonts" link — there's no top-level `/fonts` index (would be ~5,963 items, not useful for browsing).

Users reach individual fonts via:
- Family page → style switcher → click into a style.
- Direct link from formula detail page (Phase E of TODO.unify/13 mentions linking formula → families it provides; the new font routes let formulas link to specific styles too — but that's out of scope here).

## `scripts/gen-ssg-routes.mjs`

### Route emission

After Phase B, the families loop already emits `/families/<slug>` + `/families/<slug>/unicode`. This phase adds a new loop for font routes:

```js
const emittedFileSlugs = new Set()
for (const fam of familiesIndex.families || []) {
  for (const file of fam.files) {
    if (!file.slug || emittedFileSlugs.has(file.slug)) continue
    emittedFileSlugs.add(file.slug)
    routes.add(`/fonts/${file.slug}`)
    routes.add(`/fonts/${file.slug}/unicode`)
  }
}
console.log(`fonts: emitted ${emittedFileSlugs.size} unique file slugs`)
```

The dedup is essential: 345 families have multiple formulas shipping the same style slug. Without dedup, we'd emit one route per `(fileSlug, formula)` pair instead of per `fileSlug`.

### Sitemap priorities

Update the priority ladder:
```js
const priority = r === '/' ? '1.0'
  : r.startsWith('/families/') && !r.endsWith('/unicode') ? '0.9'
  : r.startsWith('/fonts/') && !r.endsWith('/unicode') ? '0.8'
  : r.startsWith('/formulas/') ? '0.7'
  : r.startsWith('/unicode/') ? '0.6'
  : '0.5'
```

Rationale: families are the primary browse entry (highest detail priority). Individual fonts are second (people deep-link to specific styles). Formula metadata pages are third. Unicode reference pages are fourth.

## `src/components/FormulaBrowser.vue`

Currently each formula item links to `/font/${f.slug}` with the formula slug. After Phase A, that route is gone. Change to:

```vue
<RouterLink v-for="f in groupedFormulas[letter]" :key="f.slug" :to="`/formulas/${f.slug}`" class="formula-item">
```

Links now go to formula detail pages (was: broken font-specimen page that silently failed to render). Formula detail shows metadata + lists families, which link onward to family pages.

## Retarget stale `/font/` links in active pages

Phase A removed the `/font/*` redirect routes that several active pages relied on. Fix each caller in this phase so no live route points at `/font/*`:

### `src/pages/ComparePage.vue`

Per-column links (lines ~226, ~265): `col.slug` is a file-level slug (each column is an individual font style being compared). Retarget to the Phase C per-style routes:

```vue
<RouterLink :to="`/fonts/${col.slug}`" class="cmp-col-name">…</RouterLink>
<RouterLink :to="`/fonts/${col.slug}/unicode`" class="cmp-cov-link">…</RouterLink>
```

No lookup needed — file slug → font URL is direct.

### `src/pages/FormulaPage.vue`

The "View Font Specimen" button linked to `/font/${slug}` where `slug` is the formula slug. A formula can ship many styles across one or more families, so "the font" is ambiguous. Resolution: link to the family detail page when the formula maps to a single family via `findFamilyByFormula()`; hide the button entirely when no family matches.

```vue
<script setup lang="ts">
import { findFamilyByFormula, type FontFamily } from '../lib/fonts/families-loader'
// …
const family = ref<FontFamily | null>(null)
async function loadData() {
  // …
  family.value = await findFamilyByFormula(slug.value)
}
</script>

<template>
  <div v-if="family" class="font-link-section">
    <RouterLink :to="`/families/${family.slug}`" class="view-font-btn">View Family →</RouterLink>
  </div>
</template>
```

This is why Phase A kept `byFormula` / `findFamilyByFormula` instead of removing them outright.

## Audit other internal links

Grep for any remaining `/font/` references in `src/`:
- `src/pages/FontPage.vue`, `src/pages/FontBlockPage.vue`, `src/pages/FontUnicodePage.vue` — orphaned (unrouted) pages pending integration. Still have `/font/${slug}` references. Left untouched per repo rules.
- `src/ssg-routes.ts` — alternate route generator, not wired into the build. Still references `/font/*`. Left untouched per repo rules.
- Any hit that's reachable from a route gets updated in this phase.

## Verification

- `npm run build:no-fetch` shows `fonts: emitted N unique file slugs` with N ≈ 5,963.
- `public/ssg-routes.json` contains the expected URL breakdown (see README success criteria).
- Nav has 7 links, no "Fonts" label.
- FormulaBrowser item links land on `/formulas/<slug>`.
