<script setup lang="ts">
import { ref, computed } from 'vue'
import { findFormula, type FormulaData } from '../lib/formulas/loader'
import { findFormulaDetails, type FormulaDetails } from '../lib/formulas/details-loader'
import { findFamilyByFormula, type FontFamily } from '../lib/fonts/families-loader'
import { injectFontFace } from '../composables/useFontFace'
import { archiveUrl } from '../lib/archive-url'

const props = defineProps({
  slug: { type: String, required: true }
})

const slug = props.slug

const formula = ref<FormulaData | null>(null)
const details = ref<FormulaDetails | null>(null)
const family = ref<FontFamily | null>(null)
const loading = ref(true)
const copied = ref(false)

async function loadData() {
  loading.value = true
  try {
    const [f, d, fam] = await Promise.all([
      findFormula(slug),
      findFormulaDetails(slug),
      findFamilyByFormula(slug),
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

const woffPath = computed(() => {
  if (!formula.value || !formula.value.licenseCategory?.includes('open')) return ''
  // Use the path the archive actually published rather than guessing a layout
  // (the old `woff/{slug}.woff` 404s against the current nested layout).
  //
  // Prefer THIS formula's own face: a family can span providers (e.g. Tirra
  // has both google/tirra and sil/tirra_4.100), so matching on formula_slug
  // keeps the sil formula page from previewing the google specimen. Fall back
  // to any redistributable face so a formula whose own woff isn't published
  // still shows a family specimen rather than nothing.
  const files = family.value?.files || []
  const file =
    files.find((f) => f.formula_slug === slug && f.redistributable && f.path) ||
    files.find((f) => f.redistributable && f.path)
  if (!file?.path) return ''
  // Specimens live in fontist-archive-public, not public/ — resolve to the CDN.
  return archiveUrl(file.path)
})

const { fontId: specimenFontId, ensureInjected: ensureSpecimenFont } = injectFontFace(
  `specimen-${slug}`,
  woffPath.value,
  !!woffPath.value,
)
const specimenLoaded = ref(false)
if (typeof window !== 'undefined' && woffPath.value) {
  ensureSpecimenFont()
  const test = document.fonts.check(`12px "${specimenFontId}"`)
  if (!test) {
    document.fonts.ready.then(() => { specimenLoaded.value = true })
  } else {
    specimenLoaded.value = true
  }
}

const specimenFamilyName = computed(() => formula.value?.familyNames?.[0] || formula.value?.name || '')

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
      <a href="/formulas">← Back to Formulas</a>
    </div>

    <article v-else class="formula-page">
      <header class="formula-header">
        <h1 class="page-title">{{ formula.name }}</h1>
        <p v-if="details?.description" class="formula-description">{{ details.description }}</p>
        <p v-else-if="!details" class="formula-description muted">
          Detailed metadata not yet available for this formula. Showing summary only.
        </p>
      </header>

      <section v-if="woffPath" class="formula-specimen">
        <div class="specimen-display" :style="{ fontFamily: `'${specimenFontId}', serif` }">
          <div class="specimen-name">{{ specimenFamilyName }}</div>
          <div class="specimen-alphabet">ABCDEFGHIJKLMNOPQRSTUVWXYZ<br />abcdefghijklmnopqrstuvwxyz<br />0123456789 &amp;.,:;?!@#$%</div>
          <div class="specimen-pangram">The quick brown fox jumps over the lazy dog.</div>
        </div>
      </section>

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
        <a :href="`/families/${family.slug}`" class="view-font-btn">
          View Family →
        </a>
      </div>
    </article>
  </div>
</template>

<style scoped>
.formula-specimen {
  margin: 1.5rem 0 2.5rem;
  padding: 2rem 1.5rem;
  background: var(--color-paper-deep);
  border-left: 3px solid var(--color-accent);
  border-radius: 2px;
}
.specimen-display {
  line-height: 1.15;
}
.specimen-name {
  font-size: clamp(2.5rem, 6vw, 4.5rem);
  font-weight: 400;
  letter-spacing: -0.02em;
  margin-bottom: 1rem;
  color: var(--color-ink);
}
.specimen-alphabet {
  font-size: clamp(1rem, 2vw, 1.4rem);
  line-height: 1.8;
  color: var(--color-ink-soft);
  margin-bottom: 0.75rem;
}
.specimen-pangram {
  font-size: clamp(0.9rem, 1.4vw, 1.1rem);
  font-style: italic;
  color: var(--color-mute);
}
</style>
