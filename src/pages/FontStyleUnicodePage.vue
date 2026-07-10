<script setup lang="ts">
import { computed, ref, watch } from 'vue'
import { useRoute, useRouter, RouterLink } from 'vue-router'
import { useHead } from '@unhead/vue'
import { findFilesBySlug, type FamilyFileEntry } from '../lib/fonts/families-loader'
import type { FontFamily, FontFamilyFile, Coverage } from '../lib/types/domain'
import BlockCoverageHeatmap from '../components/BlockCoverageHeatmap.vue'
import { fetchCoverage } from '../composables/useCoverage'
import { fetchJson } from '../lib/ssr-fetch'
import NotFound from './NotFound.vue'

const route = useRoute()
const router = useRouter()
const fontSlug = computed(() => route.params.fontSlug as string)
const requestedFormula = computed(() => (route.query.formula as string) || '')

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
      coveragePath ? fetchCoverage(coveragePath) : Promise.resolve(null),
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

useHead(() => ({
  title: activeEntry.value
    ? `${activeFamily.value?.name} ${activeFile.value?.style} — Unicode Coverage — Fontist`
    : 'Unicode Coverage — Fontist',
  link: [{ rel: 'canonical', href: `https://www.fontist.org/fonts/${fontSlug.value}/unicode` }],
}))

function switchFormula(formulaSlug: string) {
  router.replace({ path: `/fonts/${fontSlug.value}/unicode`, query: { ...route.query, formula: formulaSlug } })
}
</script>

<template>
  <NotFound v-if="!loading && entries.length === 0" />
  <div class="fsup" v-else-if="!loading && activeEntry">
    <header class="fsup-head">
      <RouterLink :to="`/fonts/${fontSlug}`" class="fsup-back">← {{ activeFamily?.name }} {{ activeFile?.style }}</RouterLink>
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
.fsup { max-width: 1000px; margin: 0 auto; padding: 2rem 1.5rem 5rem; }
.fsup-head {
  margin-bottom: 1.5rem;
  padding-bottom: 0.75rem;
  border-bottom: 1px solid var(--spec-rule);
}
.fsup-back {
  font-size: 0.85rem;
  color: var(--fontist-rose, #bf4e6a);
  text-decoration: none;
}
.fsup-head h1 {
  font-size: 1.5rem;
  margin: 0.3rem 0 0.25rem;
  color: var(--color-ink);
}
.fsup-meta {
  font-size: 0.82rem;
  color: var(--color-mute);
  margin: 0;
}
.fsup-notice {
  margin: 0.75rem 0 0;
  font-size: 0.82rem;
  color: #8b6f00;
  background: rgba(255, 196, 0, 0.1);
  border-left: 3px solid #8b6f00;
  padding: 0.5rem 0.75rem;
  border-radius: 0 4px 4px 0;
}

.fsup-switcher { margin-bottom: 1.5rem; }
.fsup-section-title {
  font-size: 0.72rem;
  font-weight: 700;
  text-transform: uppercase;
  letter-spacing: 0.1em;
  margin: 0 0 0.5rem;
  color: var(--color-mute);
}
.fsup-chips { display: flex; flex-wrap: wrap; gap: 0.4rem; }
.fsup-chip {
  display: inline-flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.35rem 0.75rem;
  background: var(--color-paper);
  border: 1px solid var(--spec-rule);
  border-radius: 4px;
  cursor: pointer;
  transition: all 0.15s;
  font-family: inherit;
}
.fsup-chip:hover { border-color: var(--fontist-rose, #bf4e6a); }
.fsup-chip.on {
  background: var(--fontist-rose, #bf4e6a);
  border-color: var(--fontist-rose, #bf4e6a);
}
.fsup-chip-formula {
  font-family: var(--spec-font-mono, monospace);
  font-size: 0.78rem;
  color: var(--color-ink);
}
.fsup-chip.on .fsup-chip-formula { color: #fff; }
.fsup-chip-flag {
  font-size: 0.62rem;
  text-transform: uppercase;
  letter-spacing: 0.06em;
  color: var(--color-mute);
  border-left: 1px solid var(--spec-rule);
  padding-left: 0.5rem;
}
.fsup-chip.on .fsup-chip-flag { color: rgba(255, 255, 255, 0.75); border-left-color: rgba(255, 255, 255, 0.3); }

.fsup-empty {
  padding: 2rem;
  text-align: center;
  color: var(--color-mute);
}
.fsup-loading {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 0.5rem;
  min-height: 50vh;
  color: var(--color-mute);
}
</style>
