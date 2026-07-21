<script setup lang="ts">
import { computed, ref, watch } from 'vue'
import { findFilesBySlug, type FamilyFileEntry } from '../lib/fonts/families-loader'
import { setQueryParamAndReload } from '../lib/nav'
import type { FontFamily, FontFamilyFile } from '../lib/types/domain'
import FontSpecimen from '../components/FontSpecimen.vue'
import FontViewer from '../components/FontViewer.vue'
import NotFound from './NotFound.vue'

const props = defineProps({
  fontSlug: { type: String, required: true }
})

const fontSlug = props.fontSlug
const view = computed(() => ((typeof window !== 'undefined' ? new URLSearchParams(window.location.search).get('view') : null) as string) || 'specimen')
const requestedFormula = computed(() => ((typeof window !== 'undefined' ? new URLSearchParams(window.location.search).get('formula') : null) as string) || '')

const entries = ref<FamilyFileEntry[]>([])
const loading = ref(true)

const redistributableEntries = computed(() => entries.value.filter(e => e.file.redistributable))
const hasMultipleFormulas = computed(() => {
  const seen = new Set(entries.value.map(e => e.file.formula_slug))
  return seen.size > 1
})

const requestedMissing = computed(() => {
  if (!requestedFormula.value) return false
  return !entries.value.some(e => e.file.formula_slug === requestedFormula.value)
})

const activeEntry = computed<FamilyFileEntry | null>(() => {
  if (entries.value.length === 0) return null
  if (requestedFormula.value) {
    const hit = entries.value.find(e => e.file.formula_slug === requestedFormula.value)
    if (hit) return hit
  }
  const pool = redistributableEntries.value
  return (pool.length > 0 ? pool : entries.value)[0]
})

const activeFamily = computed<FontFamily | null>(() => activeEntry.value?.family ?? null)
const activeFile = computed<FontFamilyFile | null>(() => activeEntry.value?.file ?? null)

async function load() {
  loading.value = true
  try {
    entries.value = await findFilesBySlug(fontSlug)
  } finally {
    loading.value = false
  }
}

await load()
watch(fontSlug, load)


function switchFormula(formulaSlug: string) {
  // Preserves the current ?view= automatically (it is already on the URL).
  setQueryParamAndReload('formula', formulaSlug)
}

// Nav links preserve the selected ?formula= so switching Specimen/Inspector/
// Unicode does not silently reset which provider/version is being viewed.
function viewHref(v: string): string {
  const params = new URLSearchParams({ view: v })
  if (requestedFormula.value) params.set('formula', requestedFormula.value)
  return `/fonts/${fontSlug}?${params.toString()}`
}
function unicodeHref(): string {
  const q = requestedFormula.value ? `?formula=${encodeURIComponent(requestedFormula.value)}` : ''
  return `/fonts/${fontSlug}/unicode${q}`
}
</script>

<template>
  <NotFound v-if="!loading && entries.length === 0" />
  <div class="fsp" v-else-if="!loading && activeEntry">
    <header class="fsp-header">
      <p class="fsp-family-link">
        <a :href="`/families/${activeFamily?.slug}`" class="fsp-back">← {{ activeFamily?.name }}</a>
      </p>
      <div class="fsp-title-row">
        <h1>{{ activeFile?.style }}</h1>
        <span v-if="activeFamily" class="fsp-license">{{ activeFamily.license_name }}</span>
        <span
          v-if="activeFile?.redistributable"
          class="fsp-badge fsp-badge--ok"
          title="Freely redistributable"
        >Redistributable</span>
        <span v-else class="fsp-badge fsp-badge--no" title="Proprietary">Proprietary</span>
      </div>
      <p class="fsp-meta">
        Style <code class="fsp-code">{{ fontSlug }}</code>
        · {{ entries.length }} providing {{ entries.length === 1 ? 'formula' : 'formulas' }}
      </p>
      <p v-if="requestedMissing" class="fsp-notice">
        Requested formula <code>{{ requestedFormula }}</code> not available for this style — showing default.
      </p>
      <nav class="fsp-nav">
        <a :href="viewHref('specimen')" class="fsp-nav-link" :class="{ on: view === 'specimen' }">Specimen</a>
        <a :href="viewHref('inspector')" class="fsp-nav-link" :class="{ on: view === 'inspector' }">Inspector</a>
        <a :href="unicodeHref()" class="fsp-nav-link">Unicode coverage →</a>
      </nav>
    </header>

    <aside class="fsp-provenance">
      <h2 class="fsp-section-title">Provided by</h2>
      <ul class="fsp-formula-list">
        <li v-for="e in entries" :key="e.file.formula_slug">
          <a :href="`/formulas/${e.file.formula_slug}`" class="fsp-formula-link">{{ e.file.formula_slug }}</a>
        </li>
      </ul>
    </aside>

    <section v-if="hasMultipleFormulas" class="fsp-formula-switcher">
      <h2 class="fsp-section-title">Formula version</h2>
      <div class="fsp-chips">
        <button
          v-for="e in entries"
          :key="e.file.formula_slug"
          :class="['fsp-chip', { on: activeFile?.formula_slug === e.file.formula_slug }]"
          @click="switchFormula(e.file.formula_slug)"
        >
          <span class="fsp-chip-formula">{{ e.file.formula_slug }}</span>
          <span v-if="!e.file.redistributable" class="fsp-chip-flag">proprietary</span>
        </button>
      </div>
    </section>

    <main class="fsp-body">
      <template v-if="view === 'inspector' && activeFile">
        <FontViewer
          :key="activeFile.slug + '|' + activeFile.formula_slug"
          :slug="activeFile.slug"
          :font-path="activeFile.path"
          :coverage-file="activeFile.coverage_file"
          :redistributable="activeFile.redistributable"
        />
      </template>
      <template v-else-if="activeFile">
        <FontSpecimen
          :key="activeFile.slug + '|' + activeFile.formula_slug"
          :slug="activeFile.slug"
          :family-name="activeFamily?.name || ''"
          :font-path="activeFile.path"
          :coverage-file="activeFile.coverage_file"
          :redistributable="activeFile.redistributable"
        />
      </template>
      <div v-else class="fsp-empty">
        <p>No specimen available for this style.</p>
        <p class="fsp-empty-hint">All versions are proprietary — install via Fontist to view glyphs locally.</p>
      </div>
    </main>
  </div>

  <div v-else class="fsp-loading">Loading…</div>
</template>

<style scoped>
/* All styles migrated to src/styles/main.css (@layer components). */
</style>
