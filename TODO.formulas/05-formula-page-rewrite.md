# 05 — FormulaPage.vue rewrite

Phase E of [README.md](README.md). Renders rich detail from `findFormulaDetails(slug)` with fallback to the existing `FormulaData` summary when details are missing.

## Goal

Visit `/formulas/google/aclonica` and see:

1. Formula name as the H1.
2. Description (multi-line, escaped properly).
3. Info grid: Formula Key, Source, Family count, Style count, Homepage (link), SPDX License (link to license_url), Redistributable badge.
4. Copyright block.
5. Resources list — grouped by resource key, each showing source, format, and download URLs.
6. Styles table — per-style: full_name, type, version, post_script_name, copyright (truncated if long).
7. Font collections table (when `font_collections` is non-empty) — per-collection: filename, then nested styles table.
8. Install command (`fontist install "<formulaName>"`).
9. Family cross-link (`findFamilyByFormula(slug)` — already wired).

When `details/<slug>.json` is missing, render the existing minimal summary (current FormulaData fields from `formulas-data.json`) plus a note that detailed metadata hasn't been extracted yet.

## Imports

```ts
import { findFormula, type FormulaData } from '../lib/formulas/loader'
import { findFormulaDetails, type FormulaDetails } from '../lib/formulas/details-loader'
import { findFamilyByFormula, type FontFamily } from '../lib/fonts/families-loader'
```

## State shape

```ts
const formula = ref<FormulaData | null>(null)
const details = ref<FormulaDetails | null>(null)
const family = ref<FontFamily | null>(null)
const loading = ref(true)
const copied = ref(false)
```

`loadData()` fetches all three in parallel:

```ts
async function loadData() {
  loading.value = true
  try {
    const [f, d, fam] = await Promise.all([
      findFormula(slug.value),
      findFormulaDetails(slug.value),
      findFamilyByFormula(slug.value),
    ])
    formula.value = f
    details.value = d
    family.value = fam
  } catch (e) {
    console.error('Failed to load formula:', e)
  } finally {
    loading.value = false
  }
}
```

## Template skeleton

```vue
<template>
  <div class="page-container">
    <div v-if="loading"><p>Loading…</p></div>

    <div v-else-if="!formula">
      <h1 class="page-title">Formula not found</h1>
      <p>No formula found for: <code>{{ slug }}</code></p>
      <RouterLink to="/formulas">← Back to Formulas</RouterLink>
    </div>

    <article v-else class="formula-page">
      <header class="formula-header">
        <h1 class="page-title">{{ formula.name }}</h1>
        <p v-if="details?.description" class="formula-description">{{ details.description }}</p>
        <p v-else-if="!details" class="formula-description muted">
          Detailed metadata not yet available for this formula.
        </p>
      </header>

      <section class="info-grid">
        <div class="info-row">
          <dt>Formula Key</dt>
          <dd><code>{{ formula.formulaName }}</code></dd>
        </div>
        <div class="info-row">
          <dt>Slug</dt>
          <dd><code>{{ formula.slug }}</code></dd>
        </div>
        <div class="info-row">
          <dt>Source</dt>
          <dd>{{ formula.sourceType }}</dd>
        </div>
        <div class="info-row">
          <dt>Families</dt>
          <dd>{{ formula.familyCount }}</dd>
        </div>
        <div class="info-row">
          <dt>Styles</dt>
          <dd>{{ formula.styleCount }}</dd>
        </div>
        <div class="info-row" v-if="details?.homepage">
          <dt>Homepage</dt>
          <dd><a :href="details.homepage" rel="noopener" target="_blank">{{ details.homepage }}</a></dd>
        </div>
        <div class="info-row">
          <dt>License</dt>
          <dd>
            <span class="license-name">{{ formula.licenseName }}</span>
            <code v-if="details?.spdx_license" class="spdx-badge">{{ details.spdx_license }}</code>
            <a v-if="details?.license_url" :href="details.license_url" rel="noopener" target="_blank" class="license-link">license text →</a>
          </dd>
        </div>
        <div class="info-row" v-if="details">
          <dt>Redistributable</dt>
          <dd>
            <span class="badge" :class="details.redistributable ? 'badge-yes' : 'badge-no'">
              {{ details.redistributable ? 'yes' : 'no' }}
            </span>
          </dd>
        </div>
      </section>

      <section v-if="details?.copyright" class="copyright-block">
        <h2>Copyright</h2>
        <pre class="copyright-text">{{ details.copyright }}</pre>
      </section>

      <section v-if="details?.resources && Object.keys(details.resources).length" class="resources-block">
        <h2>Resources</h2>
        <dl class="resources-list">
          <div v-for="(res, key) in details.resources" :key="key" class="resource-item">
            <dt>{{ key }}</dt>
            <dd>
              <span v-if="res.source" class="resource-meta">source: {{ res.source }}</span>
              <span v-if="res.format" class="resource-meta">format: {{ res.format }}</span>
              <ul v-if="res.urls?.length" class="resource-urls">
                <li v-for="url in res.urls" :key="url">
                  <a :href="url" rel="noopener" target="_blank">{{ url }}</a>
                </li>
              </ul>
            </dd>
          </div>
        </dl>
      </section>

      <section v-if="details?.fonts?.length" class="fonts-block">
        <h2>Fonts</h2>
        <table class="styles-table">
          <thead>
            <tr>
              <th>Family</th>
              <th>Style</th>
              <th>Full name</th>
              <th>PostScript</th>
              <th>Version</th>
              <th>Variable</th>
            </tr>
          </thead>
          <tbody>
            <template v-for="font in details.fonts" :key="font.name">
              <tr v-for="style in font.styles" :key="`${font.name}-${style.type}`">
                <td>{{ style.family_name }}</td>
                <td>{{ style.type }}</td>
                <td>{{ style.full_name || '—' }}</td>
                <td><code>{{ style.post_script_name || '—' }}</code></td>
                <td>{{ style.version || '—' }}</td>
                <td>{{ style.variable_font ? 'yes' : 'no' }}</td>
              </tr>
            </template>
          </tbody>
        </table>
      </section>

      <section v-if="details?.font_collections?.length" class="collections-block">
        <h2>Font Collections</h2>
        <div v-for="col in details.font_collections" :key="col.filename" class="collection-item">
          <h3><code>{{ col.filename }}</code></h3>
          <table class="styles-table">
            <thead>
              <tr>
                <th>Family</th>
                <th>Style</th>
                <th>Full name</th>
                <th>PostScript</th>
                <th>Version</th>
                <th>Index</th>
              </tr>
            </thead>
            <tbody>
              <template v-for="font in col.fonts" :key="font.name">
                <tr v-for="style in font.styles" :key="`${col.filename}-${font.name}-${style.type}`">
                  <td>{{ style.family_name }}</td>
                  <td>{{ style.type }}</td>
                  <td>{{ style.full_name || '—' }}</td>
                  <td><code>{{ style.post_script_name || '—' }}</code></td>
                  <td>{{ style.version || '—' }}</td>
                  <td>{{ style.font_index ?? '—' }}</td>
                </tr>
              </template>
            </tbody>
          </table>
        </div>
      </section>

      <section class="install-section">
        <h2>Install</h2>
        <div class="install-cmd-wrapper">
          <code class="install-cmd">fontist install "{{ formula.formulaName }}"</code>
          <button @click="copyInstall" class="copy-btn" :class="{ copied }">
            {{ copied ? 'Copied!' : 'Copy' }}
          </button>
        </div>
      </section>

      <div v-if="family" class="font-link-section">
        <RouterLink :to="`/families/${family.slug}`" class="view-font-btn">
          View Family →
        </RouterLink>
      </div>
    </article>
  </div>
</template>
```

## Styles

Reuse existing `--vp-c-*` variables. Key additions:

- `.formula-description` — italic, soft text color, max-width prose.
- `.spdx-badge` — inline `<code>` style, monospace, soft background.
- `.license-link` — small inline link after the license name.
- `.badge-yes` / `.badge-no` — green / red dot-style badge.
- `.copyright-text` — `<pre>` with `white-space: pre-wrap`, monospace, small font.
- `.styles-table` — standard table styling, sticky first column optional.
- `.resource-meta` — inline pill, soft background.

## Head metadata

Update `useHead()` description to use the details description when available:

```ts
useHead(() => ({
  title: formula.value
    ? `${formula.value.name} — Fontist Formula`
    : 'Formula — Fontist',
  meta: [
    { property: 'og:title', content: formula.value?.name || 'Fontist Formula' },
    { property: 'og:type', content: 'website' },
    {
      name: 'description',
      content: details.value?.description
        ? `${details.value.description.slice(0, 155)}…`
        : formula.value
          ? `Install ${formula.value.name} with fontist. ${formula.value.familyCount} families, ${formula.value.styleCount} styles.`
          : 'Fontist formula details and install command.',
    },
  ],
  link: [{ rel: 'canonical', href: `https://www.fontist.org/formulas/${slug.value}` }],
}))
```

## Verification

- Visit `/formulas/google/aclonica` locally — should render description, homepage link, Apache-2.0 badge with license URL, resources list, styles table with one row (Aclonica Regular), install command.
- Visit `/formulas/google/abeezee` — should render two style rows (Regular + Italic).
- Visit `/formulas/yu` — should fall back to the summary view (no mock details file), showing the muted "Detailed metadata not yet available" note.
- Visit `/formulas/<unknown>` — 404 handling unchanged.
