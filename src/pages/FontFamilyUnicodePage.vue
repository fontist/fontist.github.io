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
.ffup { max-width: 1000px; margin: 0 auto; padding: 2rem 1.5rem 5rem; }
.ffup-head {
  margin-bottom: 1.5rem;
  padding-bottom: 0.75rem;
  border-bottom: 1px solid var(--vp-c-divider, #e8e6e0);
}
.ffup-back {
  font-size: 0.85rem;
  color: var(--fontist-rose, #bf4e6a);
  text-decoration: none;
}
.ffup-head h1 {
  font-size: 1.5rem;
  margin: 0.3rem 0 0.25rem;
  color: var(--vp-c-text-1, #1a1a1a);
}
.ffup-meta {
  font-size: 0.82rem;
  color: var(--vp-c-text-3, #888);
  margin: 0;
}

.ffup-switcher { margin-bottom: 1.5rem; }
.ffup-section-title {
  font-size: 0.72rem;
  font-weight: 700;
  text-transform: uppercase;
  letter-spacing: 0.1em;
  margin: 0 0 0.5rem;
  color: var(--vp-c-text-3, #888);
}
.ffup-chips { display: flex; flex-wrap: wrap; gap: 0.4rem; }
.ffup-chip {
  display: inline-flex;
  flex-direction: column;
  align-items: flex-start;
  padding: 0.35rem 0.75rem;
  background: var(--vp-c-bg, #fff);
  border: 1px solid var(--vp-c-divider, #e8e6e0);
  border-radius: 4px;
  cursor: pointer;
  transition: all 0.15s;
  font-family: inherit;
}
.ffup-chip:hover { border-color: var(--fontist-rose, #bf4e6a); }
.ffup-chip.on {
  background: var(--fontist-rose, #bf4e6a);
  border-color: var(--fontist-rose, #bf4e6a);
}
.ffup-chip-style { font-size: 0.82rem; font-weight: 600; color: var(--vp-c-text-1, #1a1a1a); }
.ffup-chip.on .ffup-chip-style { color: #fff; }
.ffup-chip-formula {
  font-family: var(--spec-font-mono, monospace);
  font-size: 0.68rem;
  color: var(--vp-c-text-3, #888);
}
.ffup-chip.on .ffup-chip-formula { color: rgba(255, 255, 255, 0.75); }

.ffup-compare-link {
  margin-top: 2rem;
  padding: 1rem;
  background: var(--vp-c-bg-soft, #faf8f5);
  border-radius: 6px;
  text-align: center;
}
.ffup-compare-link a {
  color: var(--fontist-rose, #bf4e6a);
  text-decoration: none;
  font-size: 0.9rem;
  font-weight: 500;
}

.ffup-empty {
  padding: 2rem;
  text-align: center;
  color: var(--vp-c-text-3, #888);
}
.ffup-loading {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 0.5rem;
  min-height: 50vh;
  color: var(--vp-c-text-3, #888);
}
</style>
