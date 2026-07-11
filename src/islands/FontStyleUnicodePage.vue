<script setup lang="ts">
import { computed, ref, watch } from 'vue'
import { findFilesBySlug, type FamilyFileEntry } from '../lib/fonts/families-loader'
import type { FontFamily, FontFamilyFile, Coverage } from '../lib/types/domain'
import BlockCoverageHeatmap from '../components/BlockCoverageHeatmap.vue'
import { loadCoverage } from '../lib/unicode/coverage'
import { fetchJson } from '../lib/ssr-fetch'
import NotFound from './NotFound.vue'

const props = defineProps({
  fontSlug: { type: String, required: true }
})

const fontSlug = props.fontSlug
const requestedFormula = computed(() => ((typeof window !== 'undefined' ? new URLSearchParams(window.location.search).get('formula') : null) as string) || '')

const entries = ref<FamilyFileEntry[]>([])
const coverage = ref<Coverage | null>(null)
const unicodeBlocks = ref<{ name: string; start: number; end: number }[]>([])
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
    entries.value = await findFilesBySlug(fontSlug.value)
    // Load coverage + unicode block registry in parallel so the heatmap
    // has everything it needs on first paint.
    const file = activeEntry.value?.file
    const coveragePath = file?.coverage_file || file?.slug
    const [cov, blocks] = await Promise.all([
      coveragePath ? loadCoverage(coveragePath) : Promise.resolve(null),
      fetchJson<{ name: string; start: number; end: number }[]>('unicode-blocks.json'),
    ])
    coverage.value = cov
    unicodeBlocks.value = blocks
  } finally {
    loading.value = false
  }
}

await load()
watch(fontSlug, load)


function switchFormula(formulaSlug: string) {
  window.location.replace({ path: `/fonts/${fontSlug.value}/unicode`, query: { ...route.query, formula: formulaSlug } })
}
</script>

<template>
  <NotFound v-if="!loading && entries.length === 0" />
  <div class="fsup" v-else-if="!loading && activeEntry">
    <header class="fsup-head">
      <a :href="`/fonts/${fontSlug}`" class="fsup-back">← {{ activeFamily?.name }} {{ activeFile?.style }}</a>
      <h1>Unicode Coverage</h1>
      <p class="fsup-meta">
        {{ activeFile?.style }} · {{ entries.length }} {{ entries.length === 1 ? 'formula' : 'formulas' }}
      </p>
      <p v-if="requestedMissing" class="fsup-notice">
        Requested formula <code>{{ requestedFormula }}</code> not available — showing default.
      </p>
    </header>

    <section v-if="hasMultipleFormulas" class="fsup-switcher">
      <h2 class="fsup-section-title">Switch formula version</h2>
      <div class="fsup-chips">
        <button
          v-for="e in entries"
          :key="e.file.formula_slug"
          :class="['fsup-chip', { on: activeFile?.formula_slug === e.file.formula_slug }]"
          @click="switchFormula(e.file.formula_slug)"
        >
          <span class="fsup-chip-formula">{{ e.file.formula_slug }}</span>
          <span v-if="!e.file.redistributable" class="fsup-chip-flag">proprietary</span>
        </button>
      </div>
    </section>

    <main v-if="activeFile">
      <BlockCoverageHeatmap
        :font-slug="fontSlug"
        :coverage="coverage"
        :formula-slug="activeFile.formula_slug"
        :unicode-blocks="unicodeBlocks"
      />
    </main>

    <div v-else class="fsup-empty">
      <p>No coverage data available.</p>
    </div>
  </div>

  <div v-else class="fsup-loading">Loading…</div>
</template>

<style scoped>
/* All styles migrated to src/styles/main.css (@layer components). */
</style>
