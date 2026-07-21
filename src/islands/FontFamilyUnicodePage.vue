<script setup lang="ts">
import { computed, ref } from 'vue'
import { loadFontFamily } from '../lib/fonts/families-loader'
import { pickFileWithData } from '../lib/fonts/pick-file'
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
const selectedFileId = ref<string | null>(null)
// slug is NOT unique within a family (distinct faces can slugify identically),
// so a file's identity is its PostScript name + formula_slug.
const fileId = (f: FontFamilyFile) => `${f.ps}|${f.formula_slug}`

const selectableFiles = computed<FontFamilyFile[]>(() =>
  (family.value?.files || []).filter(f => f.redistributable),
)

const currentFile = computed<FontFamilyFile | null>(() => {
  const files = family.value?.files || []
  if (files.length === 0) return null

  if (selectedFileId.value) {
    const hit = files.find(f => fileId(f) === selectedFileId.value)
    if (hit) return hit
  }
  const redistributable = files.filter(f => f.redistributable)
  return pickFileWithData(redistributable) ?? pickFileWithData(files) ?? null
})

async function loadFamily() {
  loading.value = true
  try {
    family.value = await loadFontFamily(familySlug)
    // The ?style= deep-link is a slug; resolve it to a concrete file (there may
    // be several with that slug — prefer one with assets).
    const querySlug = (typeof window !== 'undefined' ? new URLSearchParams(window.location.search).get('style') : null)
    const files = family.value?.files || []
    if (typeof querySlug === 'string') {
      const matches = files.filter(f => f.slug === querySlug)
      const pick = pickFileWithData(matches) ?? matches[0]
      if (pick) selectedFileId.value = fileId(pick)
    }
    if (!selectedFileId.value) {
      const initial = files.find(f => f.redistributable) || files[0]
      selectedFileId.value = initial ? fileId(initial) : null
    }

    // Load the block registry once + coverage for the initial file.
    unicodeBlocks.value = await fetchJson<{ name: string; start: number; end: number }[]>('unicode-blocks.json')
    await loadCoverageForCurrent()
  } finally {
    loading.value = false
  }
}

// Coverage is per-file, so it must reload whenever the selected file changes —
// otherwise the heatmap keeps showing the first file's coverage. Guard against a
// stale response: a fast (cached) load for a since-deselected file must not
// overwrite the current one, so only apply if the selection hasn't moved on.
async function loadCoverageForCurrent() {
  const requested = selectedFileId.value
  const path = currentFile.value?.coverage_file || currentFile.value?.slug
  const cov = path ? await loadCoverage(path) : null
  if (requested === selectedFileId.value) coverage.value = cov
}

await loadFamily()


async function selectFile(f: FontFamilyFile) {
  selectedFileId.value = fileId(f)
  await loadCoverageForCurrent()
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
          :key="fileId(f)"
          :class="['ffup-chip', { on: currentFile && fileId(currentFile) === fileId(f) }]"
          @click="selectFile(f)"
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
      <a :href="`/unicode/block/basic-latin?fonts=${[...new Set(selectableFiles.map(f => f.slug))].join(',')}`"
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
