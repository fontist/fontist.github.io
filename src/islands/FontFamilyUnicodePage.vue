<script setup lang="ts">
import { computed, ref, watch } from 'vue'
import { loadFontFamily } from '../lib/fonts/families-loader'
import type { FontFamily, FontFamilyFile, Coverage } from '../lib/types/domain'
import BlockCoverageHeatmap from '../components/BlockCoverageHeatmap.vue'
import { loadCoverage } from '../lib/unicode/coverage'
import { fetchJson } from '../lib/ssr-fetch'

const props = defineProps({
  familySlug: { type: String, required: true }
})

const familySlug = props.familySlug

const family = ref<FontFamily | null>(null)
const coverage = ref<Coverage | null>(null)
const unicodeBlocks = ref<{ name: string; start: number; end: number }[]>([])
const loading = ref(true)
const selectedFileSlug = ref<string | null>(null)

const selectableFiles = computed<FontFamilyFile[]>(() =>
  (family.value?.files || []).filter(f => f.redistributable),
)

const currentFile = computed<FontFamilyFile | null>(() => {
  const files = family.value?.files || []
  if (files.length === 0) return null

  // `slug` is not unique within a family — the same font can appear as a
  // `manual` formula with no archive assets and a `google` one with them.
  // Looking a slug back up can therefore return the empty record, whose
  // bare-slug coverage path 404s. Among equal-slug matches, prefer data.
  const withData = (candidates: FontFamilyFile[]) =>
    candidates.find(f => f.coverage_file || f.path) ?? candidates[0]

  if (selectedFileSlug.value) {
    const matches = files.filter(f => f.slug === selectedFileSlug.value)
    if (matches.length > 0) return withData(matches)
  }
  return withData(files.filter(f => f.redistributable)) ?? withData(files)
})

async function loadFamily() {
  loading.value = true
  try {
    family.value = await loadFontFamily(familySlug)
    const querySlug = (typeof window !== 'undefined' ? new URLSearchParams(window.location.search).get('style') : null)
    if (typeof querySlug === 'string' && family.value?.files.some(f => f.slug === querySlug)) {
      selectedFileSlug.value = querySlug
    } else {
      const initial = family.value?.files.find(f => f.redistributable) || family.value?.files?.[0]
      selectedFileSlug.value = initial?.slug || null
    }

    // Pre-fetch coverage + block registry so the heatmap paints on first paint.
    const path = currentFile.value?.coverage_file || currentFile.value?.slug
    const [cov, blocks] = await Promise.all([
      path ? loadCoverage(path) : Promise.resolve(null),
      fetchJson<{ name: string; start: number; end: number }[]>('unicode-blocks.json'),
    ])
    coverage.value = cov
    unicodeBlocks.value = blocks
  } finally {
    loading.value = false
  }
}

await loadFamily()
watch(familySlug, loadFamily)


function selectFile(slug: string) {
  selectedFileSlug.value = slug
}
</script>

<template>
  <div class="ffup" v-if="!loading && family">
    <header class="ffup-head">
      <a :href="`/families/${familySlug}`" class="ffup-back">← {{ family.name }}</a>
      <h1>Unicode Coverage</h1>
      <p class="ffup-meta">
        {{ family.style_count }} styles · {{ family.formula_slugs.length }} formulas
      </p>
    </header>

    <section v-if="selectableFiles.length > 1" class="ffup-switcher">
      <h2 class="ffup-section-title">Switch file</h2>
      <div class="ffup-chips">
        <button
          v-for="f in selectableFiles"
          :key="f.slug"
          :class="['ffup-chip', { on: currentFile?.slug === f.slug }]"
          @click="selectFile(f.slug)"
        >
          <span class="ffup-chip-style">{{ f.style }}</span>
          <span class="ffup-chip-formula">{{ f.formula_slug }}</span>
        </button>
      </div>
    </section>

    <main v-if="currentFile">
      <BlockCoverageHeatmap
        :font-slug="currentFile.slug"
        :coverage="coverage"
        :formula-slug="currentFile.formula_slug"
        :unicode-blocks="unicodeBlocks"
      />
    </main>

    <div v-else class="ffup-empty">
      <p>No coverage data available.</p>
    </div>

    <aside v-if="selectableFiles.length > 1" class="ffup-compare-link">
      <a :href="`/unicode/block/basic-latin?fonts=${selectableFiles.map(f => f.slug).join(',')}`"
      >Compare all files side-by-side in Unicode browser →</a>
    </aside>
  </div>

  <div v-else-if="loading" class="ffup-loading">Loading…</div>
  <div v-else class="ffup-loading">
    <p>Family not found.</p>
    <a href="/families" class="ffup-back">Browse all families →</a>
  </div>
</template>

<style scoped>
/* All styles migrated to src/styles/main.css (@layer components). */
</style>
