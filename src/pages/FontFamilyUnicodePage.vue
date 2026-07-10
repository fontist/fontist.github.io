<script setup lang="ts">
import { computed, ref, watch } from 'vue'
import { useRoute, RouterLink } from 'vue-router'
import { useHead } from '@unhead/vue'
import { loadFontFamily } from '../lib/fonts/families-loader'
import type { FontFamily, FontFamilyFile, Coverage } from '../lib/types/domain'
import BlockCoverageHeatmap from '../components/BlockCoverageHeatmap.vue'
import { fetchCoverage } from '../composables/useCoverage'
import { fetchJson } from '../lib/ssr-fetch'

const route = useRoute()
const familySlug = computed(() => route.params.familySlug as string)

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
  if (selectedFileSlug.value) {
    const found = files.find(f => f.slug === selectedFileSlug.value)
    if (found) return found
  }
  return files.find(f => f.redistributable) || files[0]
})

async function loadFamily() {
  loading.value = true
  try {
    family.value = await loadFontFamily(familySlug.value)
    const querySlug = route.query.style
    if (typeof querySlug === 'string' && family.value?.files.some(f => f.slug === querySlug)) {
      selectedFileSlug.value = querySlug
    } else {
      const initial = family.value?.files.find(f => f.redistributable) || family.value?.files?.[0]
      selectedFileSlug.value = initial?.slug || null
    }

    // Pre-fetch coverage + block registry so the heatmap paints on first paint.
    const path = currentFile.value?.coverage_file || currentFile.value?.slug
    const [cov, blocks] = await Promise.all([
      path ? fetchCoverage(path) : Promise.resolve(null),
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

useHead(() => ({
  title: family.value ? `${family.value.name} — Unicode Coverage` : 'Unicode Coverage — Fontist',
  link: [
    { rel: 'canonical', href: `https://www.fontist.org/families/${familySlug.value}/unicode` },
  ],
}))

function selectFile(slug: string) {
  selectedFileSlug.value = slug
}
</script>

<template>
  <div class="ffup" v-if="!loading && family">
    <header class="ffup-head">
      <RouterLink :to="`/families/${familySlug}`" class="ffup-back">← {{ family.name }}</RouterLink>
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
      <RouterLink
        :to="`/unicode/block/basic-latin?fonts=${selectableFiles.map(f => f.slug).join(',')}`"
      >Compare all files side-by-side in Unicode browser →</RouterLink>
    </aside>
  </div>

  <div v-else-if="loading" class="ffup-loading">Loading…</div>
  <div v-else class="ffup-loading">
    <p>Family not found.</p>
    <RouterLink to="/families" class="ffup-back">Browse all families →</RouterLink>
  </div>
</template>

<style scoped>
/* All styles migrated to src/styles/main.css (@layer components). */
</style>
