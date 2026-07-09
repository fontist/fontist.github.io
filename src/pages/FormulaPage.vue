<script setup lang="ts">
import { ref, computed, watch } from 'vue'
import { useRoute } from 'vue-router'
import { useHead } from '@unhead/vue'
import { findFormula, type FormulaData } from '../lib/formulas/loader'
import { findFormulaDetails, type FormulaDetails } from '../lib/formulas/details-loader'
import { findFamilyByFormula, type FontFamily } from '../lib/fonts/families-loader'

const route = useRoute()
const slug = computed(() => route.params.slug as string)

const formula = ref<FormulaData | null>(null)
const details = ref<FormulaDetails | null>(null)
const family = ref<FontFamily | null>(null)
const loading = ref(true)
const copied = ref(false)

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
    console.error('Failed to load formula data:', e)
  } finally {
    loading.value = false
  }
}

await loadData()
watch(slug, loadData)

const descriptionForHead = computed(() => {
  if (details.value?.description) {
    const d = details.value.description
    return d.length > 155 ? `${d.slice(0, 155)}…` : d
  }
  if (formula.value) {
    return `Install ${formula.value.name} with fontist: ${formula.value.formulaName}. ${formula.value.familyCount} families, ${formula.value.styleCount} styles, ${formula.value.licenseName}.`
  }
  return 'Fontist formula details and install command.'
})

useHead(() => ({
  title: formula.value
    ? `${formula.value.name} — Fontist Formula`
    : 'Formula — Fontist',
  meta: [
    { property: 'og:title', content: formula.value?.name || 'Fontist Formula' },
    { property: 'og:type', content: 'website' },
    { name: 'description', content: descriptionForHead.value },
  ],
  link: [
    { rel: 'canonical', href: `https://www.fontist.org/formulas/${slug.value}` },
  ],
}))

function copyInstall() {
  if (!formula.value) return
  navigator.clipboard.writeText(`fontist install "${formula.value.formulaName}"`)
  copied.value = true
  setTimeout(() => (copied.value = false), 2000)
}

const resourceEntries = computed(() => {
  const r = details.value?.resources
  if (!r) return []
  return Object.entries(r).map(([key, val]) => ({ key, val }))
})
</script>

<template>
  <div class="page-container">
    <div v-if="loading">
      <p>Loading…</p>
    </div>

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
          Detailed metadata not yet available for this formula. Showing summary only.
        </p>
      </header>

      <section class="formula-info">
        <h2 class="section-title">Summary</h2>
        <dl class="info-grid">
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
            <dd>
              <a :href="details.homepage" rel="noopener" target="_blank" class="ext-link">{{ details.homepage }}</a>
            </dd>
          </div>
          <div class="info-row">
            <dt>License</dt>
            <dd class="license-cell">
              <span class="license-name">{{ formula.licenseName }}</span>
              <code v-if="details?.spdx_license" class="spdx-badge">{{ details.spdx_license }}</code>
              <a
                v-if="details?.license_url"
                :href="details.license_url"
                rel="noopener"
                target="_blank"
                class="license-link"
              >license text →</a>
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
          <div class="info-row" v-if="details?.source_format">
            <dt>Source Format</dt>
            <dd><code>{{ details.source_format }}</code></dd>
          </div>
        </dl>
      </section>

      <section v-if="details?.copyright" class="formula-section">
        <h2 class="section-title">Copyright</h2>
        <pre class="copyright-text">{{ details.copyright }}</pre>
      </section>

      <section v-if="resourceEntries.length" class="formula-section">
        <h2 class="section-title">Resources</h2>
        <dl class="resources-list">
          <div v-for="entry in resourceEntries" :key="entry.key" class="resource-item">
            <dt class="resource-key"><code>{{ entry.key }}</code></dt>
            <dd>
              <div class="resource-meta">
                <span v-if="entry.val.source" class="meta-pill">source: {{ entry.val.source }}</span>
                <span v-if="entry.val.format" class="meta-pill">format: {{ entry.val.format }}</span>
                <span v-if="entry.val.family" class="meta-pill">family: {{ entry.val.family }}</span>
              </div>
              <ul v-if="entry.val.urls?.length" class="resource-urls">
                <li v-for="url in entry.val.urls" :key="url">
                  <a :href="url" rel="noopener" target="_blank" class="ext-link">{{ url }}</a>
                </li>
              </ul>
            </dd>
          </div>
        </dl>
      </section>

      <section v-if="details?.fonts?.length" class="formula-section">
        <h2 class="section-title">Fonts ({{ details.fonts.length }})</h2>
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
                <td><code class="ps-name">{{ style.post_script_name || '—' }}</code></td>
                <td class="version-cell">{{ style.version || '—' }}</td>
                <td>{{ style.variable_font ? 'yes' : 'no' }}</td>
              </tr>
            </template>
          </tbody>
        </table>
      </section>

      <section v-if="details?.font_collections?.length" class="formula-section">
        <h2 class="section-title">Font Collections ({{ details.font_collections.length }})</h2>
        <div v-for="col in details.font_collections" :key="col.filename" class="collection-item">
          <h3 class="collection-filename"><code>{{ col.filename }}</code></h3>
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
              <template v-for="font in col.fonts" :key="`${col.filename}-${font.name}`">
                <tr v-for="style in font.styles" :key="`${col.filename}-${font.name}-${style.type}`">
                  <td>{{ style.family_name }}</td>
                  <td>{{ style.type }}</td>
                  <td>{{ style.full_name || '—' }}</td>
                  <td><code class="ps-name">{{ style.post_script_name || '—' }}</code></td>
                  <td class="version-cell">{{ style.version || '—' }}</td>
                  <td>{{ style.font_index ?? '—' }}</td>
                </tr>
              </template>
            </tbody>
          </table>
        </div>
      </section>

      <section class="install-section">
        <h2 class="section-title">Install</h2>
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

<style scoped>
.formula-page {
  display: block;
}

.formula-page :deep(.page-title),
.formula-page .page-title {
  font-family: var(--spec-font-display);
  font-size: clamp(2rem, 5vw, 3rem);
  font-weight: 400;
  font-style: italic;
  letter-spacing: -0.02em;
  line-height: 1.05;
  color: var(--spec-ink);
  margin: 0;
}

.formula-header {
  margin-bottom: 2rem;
  padding-bottom: 1.5rem;
  border-bottom: 1px solid var(--vp-c-divider, rgba(28,26,24,0.16));
}

.formula-description {
  margin-top: 1rem;
  font-family: var(--spec-font-display);
  font-style: italic;
  font-size: 1.15rem;
  line-height: 1.5;
  color: var(--spec-ink-soft);
  max-width: 60ch;
}

.formula-description.muted {
  font-style: italic;
  color: var(--spec-mute);
  font-family: var(--spec-font-body);
  font-size: 0.92rem;
}

.section-title {
  font-family: var(--spec-font-display);
  font-style: italic;
  font-size: 1.3rem;
  font-weight: 400;
  color: var(--spec-ink);
  letter-spacing: -0.005em;
  margin-bottom: 0.85rem;
  padding-bottom: 0.5rem;
  border-bottom: 1px solid var(--vp-c-divider, rgba(28,26,24,0.16));
  position: relative;
}
.section-title::before {
  content: '';
  display: block;
  width: 1.5rem;
  height: 1px;
  background: var(--fontist-rose);
  margin-bottom: 0.6rem;
}

.formula-info,
.formula-section,
.install-section {
  margin-bottom: 2.25rem;
}

.info-grid {
  display: grid;
  gap: 0.6rem;
}

.info-row {
  display: grid;
  grid-template-columns: 160px 1fr;
  align-items: baseline;
}

.info-row dt {
  font-size: 0.8rem;
  text-transform: uppercase;
  letter-spacing: 0.05em;
  color: var(--vp-c-text-3);
  font-weight: 600;
}

.info-row dd {
  font-size: 0.95rem;
  color: var(--vp-c-text-1);
}

.info-row code,
.resource-key code,
.ps-name,
.install-cmd {
  font-family: var(--vp-font-family-mono);
  background: var(--vp-c-bg-soft);
  padding: 0.15em 0.4em;
  border-radius: 3px;
  font-size: 0.85rem;
}

.ext-link {
  color: var(--vp-c-brand-1);
  text-decoration: none;
  word-break: break-all;
}

.ext-link:hover {
  text-decoration: underline;
}

.license-cell {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  flex-wrap: wrap;
}

.license-name {
  color: var(--vp-c-text-1);
}

.spdx-badge {
  font-family: var(--vp-font-family-mono);
  background: var(--vp-c-bg-soft);
  border: 1px solid var(--vp-c-divider);
  padding: 0.1em 0.4em;
  border-radius: 3px;
  font-size: 0.75rem;
  color: var(--vp-c-text-2);
}

.license-link {
  font-size: 0.85rem;
  color: var(--vp-c-brand-1);
  text-decoration: none;
}

.license-link:hover {
  text-decoration: underline;
}

.badge {
  display: inline-block;
  padding: 0.15em 0.6em;
  font-size: 0.75rem;
  font-weight: 600;
  border-radius: 999px;
  text-transform: lowercase;
}

.badge-yes {
  background: rgba(34, 197, 94, 0.15);
  color: #16a34a;
}

.badge-no {
  background: rgba(239, 68, 68, 0.15);
  color: #dc2626;
}

.copyright-text {
  font-family: var(--vp-font-family-mono);
  font-size: 0.8rem;
  line-height: 1.5;
  color: var(--vp-c-text-2);
  background: var(--vp-c-bg-soft);
  padding: 0.75rem 1rem;
  border-radius: 6px;
  border: 1px solid var(--vp-c-divider);
  white-space: pre-wrap;
  word-wrap: break-word;
  margin: 0;
  max-width: 80ch;
}

.resources-list {
  display: grid;
  gap: 1rem;
}

.resource-item {
  padding: 0.75rem 1rem;
  background: var(--vp-c-bg-soft);
  border-radius: 6px;
  border: 1px solid var(--vp-c-divider);
}

.resource-key {
  font-weight: 600;
  font-size: 0.9rem;
  margin-bottom: 0.4rem;
}

.resource-meta {
  display: flex;
  gap: 0.4rem;
  flex-wrap: wrap;
  margin-bottom: 0.5rem;
}

.meta-pill {
  font-size: 0.75rem;
  font-family: var(--vp-font-family-mono);
  background: var(--vp-c-bg);
  border: 1px solid var(--vp-c-divider);
  padding: 0.1em 0.5em;
  border-radius: 999px;
  color: var(--vp-c-text-2);
}

.resource-urls {
  margin: 0;
  padding-left: 1.2rem;
  display: grid;
  gap: 0.25rem;
  font-size: 0.85rem;
}

.styles-table {
  width: 100%;
  border-collapse: collapse;
  font-size: 0.875rem;
}

.styles-table th,
.styles-table td {
  text-align: left;
  padding: 0.5rem 0.75rem;
  border-bottom: 1px solid var(--vp-c-divider);
  vertical-align: top;
}

.styles-table th {
  font-size: 0.75rem;
  text-transform: uppercase;
  letter-spacing: 0.05em;
  color: var(--vp-c-text-3);
  font-weight: 600;
  background: var(--vp-c-bg-soft);
}

.styles-table td.version-cell {
  font-family: var(--vp-font-family-mono);
  font-size: 0.8rem;
  color: var(--vp-c-text-2);
}

.collection-item {
  margin-bottom: 1.25rem;
}

.collection-filename {
  font-size: 0.95rem;
  font-weight: 600;
  margin-bottom: 0.5rem;
}

.install-cmd-wrapper {
  display: flex;
  align-items: center;
  gap: 0.75rem;
  padding: 0.75rem 1rem;
  background: var(--vp-c-bg-soft);
  border-radius: 8px;
  border: 1px solid var(--vp-c-divider);
}

.install-cmd {
  flex: 1;
  font-size: 0.9rem;
  color: var(--vp-c-text-1);
  background: transparent;
  padding: 0;
}

.copy-btn {
  padding: 0.375rem 0.75rem;
  font-size: 0.8125rem;
  font-weight: 500;
  border: 1px solid var(--vp-c-divider);
  border-radius: 6px;
  background: var(--vp-c-bg);
  color: var(--vp-c-text-2);
  cursor: pointer;
  transition: all 0.15s;
}

.copy-btn:hover {
  border-color: var(--vp-c-brand-1);
  color: var(--vp-c-brand-1);
}

.copy-btn.copied {
  background: var(--vp-c-brand-1);
  border-color: var(--vp-c-brand-1);
  color: white;
}

.font-link-section {
  margin-top: 2rem;
}

.view-font-btn {
  display: inline-block;
  padding: 0.75rem 1.5rem;
  background: var(--vp-c-brand-1);
  color: white;
  border-radius: 8px;
  font-weight: 500;
  text-decoration: none;
  transition: background 0.15s;
}

.view-font-btn:hover {
  background: var(--vp-c-brand-2);
}
</style>
