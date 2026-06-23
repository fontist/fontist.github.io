# 09 — Page contract

Spec date: 2026-06-23. Status: **convention**. Resolves AUDIT B (layering), F.3
(scoped-style overrides), I.2 (no contract).

## The contract

Every page component in `src/pages/` follows these rules. No exceptions. CI
should enforce where mechanical (rules below marked `[CI]`).

### 1. Composition root, not data layer

Pages are the only place that calls loaders. They use top-level `await` to
pre-fetch during SSG. Components below the page receive data via props.

```vue
<!-- CORRECT -->
<script setup lang="ts">
import { findFormula } from '../lib/formulas/loader'
const formula = await findFormula(slug)
</script>
<template>
  <FormulaDetail :formula="formula" />
</template>

<!-- WRONG — component fetches its own data -->
<script setup lang="ts">
import { findFormula } from '../lib/formulas/loader'
const formula = await findFormula(slug)  // <-- move to parent page
</script>
```

**Why:** SSG needs the data fetch at the page boundary so vite-ssg can await it.
A component that fetches on mount renders empty during pre-render.

### 2. Never call `fetch()` directly `[CI]`

```ts
// WRONG
const res = await globalThis.fetch(`${basePath}unicode/blocks/${slug}.json`)

// RIGHT — go through the domain loader
import { loadBlockCharacters } from '../lib/unicode/data/loader'
const chars = await loadBlockCharacters(blockName)
```

CI grep: `grep -rn 'globalThis.fetch\|window.fetch\|fetch(' src/ | grep -v 'lib/'`
must return zero hits.

**Why:** Loaders abstract SSR (node:fs) vs browser (fetch), cache results, and
own the basePath logic. Bypassing them means the page works in dev but breaks
in SSG. (AUDIT B.1, B.3.)

### 3. Always call `useHead()` `[CI]`

Every page sets at minimum:
- `title`
- `meta[name=description]`
- `link[rel=canonical]`

```ts
useHead(() => ({
  title: `${formula.name} — Fontist`,
  meta: [
    { name: 'description', content: formula.description ?? defaultDesc },
  ],
  link: [
    { rel: 'canonical', href: `https://www.fontist.org/formula/${formula.slug}` },
  ],
}))
```

CI check: every file in `src/pages/*Page.vue` must contain a `useHead(` call.

### 4. Use vue-router, never `window.location`

```ts
// WRONG
const params = new URLSearchParams(window.location.search)
window.location.href = `/formula/${slug}`

// RIGHT
import { useRoute, useRouter } from 'vue-router'
const route = useRoute()
const router = useRouter()
router.push(`/formula/${slug}`)
```

For navigation in templates, use `<RouterLink>`.

**Why:** `window.location` triggers a full page reload, defeats the SPA, and
breaks `useRoute()` reactivity. (AUDIT B.3.)

### 5. Loading and error states

Top-level await throws → vite-ssg renders the closest error boundary. For
graceful fallback (e.g., data missing upstream), wrap the fetch:

```ts
const data = await fetchJson<T>(path).catch(() => null)
if (!data) {
  // render placeholder, not crash
}
```

Pages must not render partial data when the canonical entity is missing.
Redirect to NotFound instead.

### 6. Scoped styles: typography is global

Scoped `<style>` blocks must not redeclare typography that exists in
`src/styles/main.css`. Specifically forbidden in scoped styles:

- `:deep(pre)`, `:deep(code)` backgrounds
- `:deep(a)` colors
- font-family on body-level elements

Use the class hooks already provided:

| Hook          | Purpose                            |
|---|---|
| `.md-doc`     | Rendered markdown (guide, license) |
| `.gp-content` | Guide page content                 |
| `.lp-content` | License page content               |
| `.spec-*`     | Specimen vocabulary                |

```vue
<!-- WRONG -->
<style scoped>
:deep(pre) { background: #1a1918; color: #eee; }
</style>

<!-- RIGHT — use the global rule via class -->
<template>
  <div class="md-doc gp-content" v-html="content" />
</template>
```

**Why:** Per-page `:deep(pre)` overrides caused the light-mode code block bug
(AUDIT F.3). The global rule is theme-aware; scoped overrides are not.

### 7. Naming

Files: `{Domain}{Action}Page.vue` — `FontPage`, `UnicodeBlockPage`,
`LicensePage`. Action is omitted for the canonical detail page.

Route names: kebab-case, matches file name minus `Page.vue`.
`FontPage.vue` → route name `font`.

Route paths: see `08-domain-model.md`. Collections are plural
(`/fonts`, `/formulas`). Detail pages are singular-with-param
(`/fonts/:familySlug`).

### 8. Props down, events up

A page may pass data to a child via props. A child must not import a loader.
If a child needs to navigate, it emits an event; the page calls `router.push`.

```vue
<!-- FormulaDetail.vue (child component, no fetch) -->
<script setup lang="ts">
import type { Formula } from '../lib/types/domain'
defineProps<{ formula: Formula }>()
defineEmits<{ navigate: [slug: string] }>()
</script>
```

### 9. Types from `lib/types/domain.ts` `[CI]`

Pages and components import entity types from
`src/lib/types/domain.ts`, not from loader files. Loaders re-export for back-compat
but new code goes to the canonical home.

```ts
// PREFERRED
import type { Formula, FontFamily } from '../lib/types/domain'

// ACCEPTABLE (back-compat during migration)
import type { Formula } from '../lib/formulas/loader'
```

### 10. No side-effects at module scope

A page's `<script setup>` may run top-level `await` for data fetching. It must
not:
- Mutate `window` or `document` outside `onMounted`
- Register global event listeners without cleanup
- Write to `localStorage` outside a user gesture handler

## Checklist (paste into PR template)

- [ ] Page calls a loader, never `fetch()`
- [ ] `useHead()` sets title, description, canonical
- [ ] Uses `useRoute()` / `<RouterLink>`, not `window.location`
- [ ] Loading state renders before data arrives (or SSG renders the final HTML)
- [ ] No `:deep(pre|code|a)` in scoped styles
- [ ] Types from `src/lib/types/domain.ts`
- [ ] File name matches route name
