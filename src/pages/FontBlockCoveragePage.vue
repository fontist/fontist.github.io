<script setup lang="ts">
// FontBlockCoveragePage — SPA detail view for one (font × Unicode block).
// Triggered by clicking a tile in BlockCoverageHeatmap. Renders the
// per-block char grid (via FontUnicodeBrowser) plus the block's metadata
// (range, completeness %, missing char count).
//
// Not pre-rendered in SSG — too many combinations (fonts × blocks).
// Vue-router lazy-loads this route client-side.

import { computed, ref, watch } from 'vue'
import { useRoute, useRouter, RouterLink } from 'vue-router'
import { useHead } from '@unhead/vue'
import { findFilesBySlug, type FamilyFileEntry } from '../lib/fonts/families-loader'
import { fetchJson } from '../lib/ssr-fetch'
import type { FontFamily, FontFamilyFile, Coverage } from '../lib/types/domain'
import { blockSlug, blockDisplayName } from '../lib/unicode/constants'
import FontUnicodeBrowser from '../components/FontUnicodeBrowser.vue'

const route = useRoute()
const router = useRouter()
const fontSlug = computed(() => route.params.fontSlug as string)
const blockParam = computed(() => route.params.blockSlug as string)
const requestedFormula = computed(() => (route.query.formula as string) || '')

const entries = ref<FamilyFileEntry[]>([])
const coverage = ref<Coverage | null>(null)
const allBlocks = ref<{ name: string; start: number; end: number }[]>([])
const loading = ref(true)

const activeEntry = computed<FamilyFileEntry | null>(() => {
  if (entries.value.length === 0) return null
  if (requestedFormula.value) {
    const hit = entries.value.find(e => e.file.formula_slug === requestedFormula.value)
    if (hit) return hit
  }
  const pool = entries.value.filter(e => e.file.redistributable)
  return (pool.length > 0 ? pool : entries.value)[0]
})

const activeFamily = computed<FontFamily | null>(() => activeEntry.value?.family ?? null)
const activeFile = computed<FontFamilyFile | null>(() => activeEntry.value?.file ?? null)

const matchedBlock = computed(() => {
  return allBlocks.value.find(b => blockSlug(b.name) === blockParam.value) ?? null
})

const matchedCoverageBlock = computed(() => {
  if (!coverage.value || !matchedBlock.value) return null
  return coverage.value.blocks.find(b => blockSlug(b.name) === blockParam.value) ?? null
})

const completeness = computed(() => {
  if (!matchedBlock.value) return null
  const total = matchedBlock.value.end - matchedBlock.value.start + 1
  const covered = matchedCoverageBlock.value?.codepoints?.length ?? 0
  return {
    total,
    covered,
    missing: total - covered,
    pct: total > 0 ? covered / total : 0,
  }
})

function switchFormula(formulaSlug: string) {
  router.replace({ query: { ...route.query, formula: formulaSlug } })
}

async function loadAll() {
  loading.value = true
  try {
    const [entrs, blocksIndex] = await Promise.all([
      findFilesBySlug(fontSlug.value),
      fetchJson<{ name: string; start: number; end: number }[]>('unicode-blocks.json'),
    ])
    entries.value = entrs
    allBlocks.value = blocksIndex

    const file = activeEntry.value?.file
    const coveragePath = file?.coverage_file || file?.slug
    if (coveragePath) {
      try {
        coverage.value = await fetchJson<Coverage>(
          coveragePath.includes('/') ? coveragePath : `coverage/${coveragePath}.json`
        )
      } catch {
        coverage.value = null
      }
    }
  } finally {
    loading.value = false
  }
}

await loadAll()
watch(fontSlug, loadAll)

useHead(() => ({
  title: matchedBlock.value
    ? `${blockDisplayName(matchedBlock.value.name)} in ${activeFamily.value?.name ?? fontSlug.value} — Fontist`
    : 'Block detail — Fontist',
  link: [{ rel: 'canonical', href: `https://www.fontist.org/fonts/${fontSlug.value}/unicode/block/${blockParam.value}` }],
}))
</script>

<template>
  <div class="fbcp">
    <header class="fbcp-head" v-if="!loading && matchedBlock">
      <RouterLink :to="`/fonts/${fontSlug}/unicode`" class="fbcp-back">
        ← Coverage overview
      </RouterLink>
      <p class="fbcp-family">{{ activeFamily?.name }} <span v-if="activeFile">· {{ activeFile.style }}</span></p>
      <h1 class="fbcp-title">{{ blockDisplayName(matchedBlock.name) }}</h1>
      <p class="fbcp-range">
        U+{{ matchedBlock.start.toString(16).toUpperCase().padStart(4, '0') }}–U+{{ matchedBlock.end.toString(16).toUpperCase().padStart(4, '0') }}
      </p>

      <div class="fbcp-stats" v-if="completeness">
        <div class="fbcp-stat">
          <span class="fbcp-stat-num">{{ Math.round(completeness.pct * 100) }}<small>%</small></span>
          <span class="fbcp-stat-label">complete</span>
        </div>
        <div class="fbcp-stat-divider"></div>
        <div class="fbcp-stat">
          <span class="fbcp-stat-num">{{ completeness.covered.toLocaleString() }}</span>
          <span class="fbcp-stat-label">covered</span>
        </div>
        <div class="fbcp-stat-divider"></div>
        <div class="fbcp-stat">
          <span class="fbcp-stat-num">{{ completeness.missing.toLocaleString() }}</span>
          <span class="fbcp-stat-label">missing</span>
        </div>
        <div class="fbcp-stat-divider"></div>
        <div class="fbcp-stat">
          <span class="fbcp-stat-num">{{ completeness.total.toLocaleString() }}</span>
          <span class="fbcp-stat-label">total in block</span>
        </div>
      </div>
    </header>

    <section v-if="entries.length > 1" class="fbcp-switcher">
      <h2 class="fbcp-switcher-title">Switch formula version</h2>
      <div class="fbcp-chips">
        <button
          v-for="e in entries"
          :key="e.file.formula_slug"
          :class="['fbcp-chip', { on: activeFile?.formula_slug === e.file.formula_slug }]"
          @click="switchFormula(e.file.formula_slug)"
        >
          {{ e.file.formula_slug }}
          <span v-if="!e.file.redistributable" class="fbcp-chip-flag">proprietary</span>
        </button>
      </div>
    </section>

    <main v-if="!loading && activeFile" class="fbcp-main">
      <FontUnicodeBrowser
        :key="'fbcp-' + activeFile.slug + '|' + matchedBlock?.slug"
        :slug="activeFile.slug"
        :font-path="activeFile.path"
        :coverage-file="activeFile.coverage_file"
        :initial-block-slug="blockParam"
        :redistributable="activeFile.redistributable"
      />
    </main>

    <div v-else-if="!loading && !matchedBlock" class="fbcp-empty">
      <p>Unknown block: <code>{{ blockParam }}</code></p>
      <RouterLink :to="`/fonts/${fontSlug}/unicode`">← back to coverage overview</RouterLink>
    </div>

    <div v-else class="fbcp-loading">Loading…</div>
  </div>
</template>

<style scoped>
/* All styles migrated to src/styles/main.css (@layer components). */
</style>
