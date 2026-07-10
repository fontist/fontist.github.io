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
/* All styles migrated to src/styles/main.css (@layer components). */
</style>
