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
.fbcp { max-width: 1100px; margin: 0 auto; padding: 2rem 1.5rem 5rem; }

.fbcp-head {
  margin-bottom: 2rem;
  padding-bottom: 1.5rem;
  border-bottom: 1px solid var(--spec-rule);
}

.fbcp-back {
  font-family: var(--spec-font-mono);
  font-size: 0.78rem;
  color: var(--fontist-rose, #bf4e6a);
  text-decoration: none;
  letter-spacing: 0.02em;
}

.fbcp-back:hover { text-decoration: underline; }

.fbcp-family {
  font-family: var(--spec-font-mono);
  font-size: 0.72rem;
  text-transform: uppercase;
  letter-spacing: 0.1em;
  color: var(--spec-mute);
  margin: 1.25rem 0 0.3rem;
}

.fbcp-title {
  font-family: var(--spec-font-display);
  font-size: clamp(2rem, 5vw, 3rem);
  font-weight: 400;
  font-style: italic;
  letter-spacing: -0.015em;
  line-height: 1.05;
  margin: 0 0 0.3rem;
  color: var(--spec-ink);
}

.fbcp-range {
  font-family: var(--spec-font-mono);
  font-size: 0.85rem;
  color: var(--spec-ink-soft);
  margin: 0;
  letter-spacing: 0.04em;
}

.fbcp-stats {
  display: flex;
  align-items: baseline;
  gap: 1.5rem;
  margin-top: 1.5rem;
  flex-wrap: wrap;
}

.fbcp-stat {
  display: flex;
  flex-direction: column;
  gap: 0.15rem;
}

.fbcp-stat-num {
  font-family: var(--spec-font-display);
  font-size: 1.8rem;
  font-weight: 400;
  line-height: 1;
  color: var(--spec-ink);
  font-variant-numeric: tabular-nums;
}

.fbcp-stat-num small {
  font-size: 0.7em;
  margin-left: 0.1em;
  color: var(--spec-mute);
}

.fbcp-stat-label {
  font-family: var(--spec-font-mono);
  font-size: 0.66rem;
  text-transform: uppercase;
  letter-spacing: 0.1em;
  color: var(--spec-mute);
}

.fbcp-stat-divider {
  width: 1px;
  align-self: stretch;
  background: var(--spec-rule);
}

.fbcp-switcher { margin-bottom: 1.5rem; }
.fbcp-switcher-title {
  font-family: var(--spec-font-mono);
  font-size: 0.7rem;
  text-transform: uppercase;
  letter-spacing: 0.1em;
  color: var(--spec-mute);
  margin: 0 0 0.5rem;
}
.fbcp-chips { display: flex; flex-wrap: wrap; gap: 0.4rem; }
.fbcp-chip {
  display: inline-flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.35rem 0.7rem;
  background: transparent;
  border: 1px solid var(--spec-rule);
  border-radius: 3px;
  cursor: pointer;
  font-family: var(--spec-font-mono);
  font-size: 0.74rem;
  color: var(--spec-ink-soft);
  transition: all 0.15s ease;
}
.fbcp-chip:hover { border-color: var(--fontist-rose, #bf4e6a); }
.fbcp-chip.on {
  background: var(--spec-ink);
  border-color: var(--spec-ink);
  color: var(--spec-paper);
}
.fbcp-chip-flag {
  font-size: 0.62rem;
  opacity: 0.7;
}

.fbcp-empty, .fbcp-loading {
  text-align: center;
  padding: 4rem 1.5rem;
  font-family: var(--spec-font-mono);
  color: var(--spec-mute);
}

.fbcp-empty a {
  display: inline-block;
  margin-top: 1rem;
  color: var(--fontist-rose, #bf4e6a);
  text-decoration: none;
}

@media (max-width: 640px) {
  .fbcp-stats { gap: 1rem; }
  .fbcp-stat-num { font-size: 1.4rem; }
}
</style>
