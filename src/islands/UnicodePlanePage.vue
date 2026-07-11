<script setup lang="ts">
import { ref, computed } from 'vue'
import { loadAllBlocks, PLANES, hexCp, blockSlug } from '../lib/unicode'
import type { UnicodeBlock, PlaneKey } from '../lib/unicode'

const props = defineProps({
  planeId: { type: String, required: true }
})

const planeId = props.planeId

const allBlocks = ref<UnicodeBlock[]>([])

const plane = computed(() =>
  PLANES.find(p => p.key === planeId || p.shortName.toLowerCase() === planeId.toLowerCase())
)

const VERSION_YEARS: Record<string, number> = {
  '1.1': 1993, '2.0': 1996, '2.1': 1998,
  '3.0': 1999, '3.1': 2001, '3.2': 2002,
  '4.0': 2003, '4.1': 2005,
  '5.0': 2006, '5.1': 2008, '5.2': 2009,
  '6.0': 2010, '6.1': 2012, '6.2': 2012, '6.3': 2013,
  '7.0': 2014,
  '8.0': 2015, '9.0': 2016, '10.0': 2017, '11.0': 2018,
  '12.0': 2019, '12.1': 2019, '13.0': 2020, '14.0': 2021,
  '15.0': 2022, '15.1': 2023, '16.0': 2024, '17.0': 2025,
}

function versionYear(v: string): number | null {
  return VERSION_YEARS[v] ?? null
}

function versionEra(v: string): string {
  const major = parseFloat(v)
  if (major <= 2) return 'era-foundation'
  if (major <= 4) return 'era-expansion'
  if (major <= 6) return 'era-modernization'
  if (major <= 9) return 'era-emoji'
  if (major <= 13) return 'era-recent'
  return 'era-latest'
}

function chartUrl(block: UnicodeBlock): string {
  const hex = block.start.toString(16).toUpperCase().padStart(4, '0')
  return `https://www.unicode.org/charts/PDF/U${hex}.html`
}

const blocks = computed(() =>
  allBlocks.value
    .filter(b => b.plane === plane.value?.key)
    .sort((a, b) => a.start - b.start)
)

const versionGroups = computed(() => {
  const groups: { version: string; blocks: UnicodeBlock[] }[] = []
  for (const b of blocks.value) {
    const v = b.unicodeVersion || 'unknown'
    let g = groups.find(g => g.version === v)
    if (!g) {
      g = { version: v, blocks: [] }
      groups.push(g)
    }
    g.blocks.push(b)
  }
  groups.sort((a, b) => parseFloat(a.version) - parseFloat(b.version))
  return groups
})

const totalCodepoints = computed(() => {
  if (!plane.value) return 0
  return plane.value.end - plane.value.start + 1
})

allBlocks.value = await loadAllBlocks()

</script>

<template>
  <div class="plane" v-if="plane">
    <!-- Plane header -->
    <header class="plane-header">
      <a href="/unicode" class="plane-back">← Unicode</a>
      <div class="plane-title-block">
        <span class="plane-short">{{ plane.shortName }}</span>
        <h1 class="plane-name">{{ plane.name }}</h1>
      </div>
      <div class="plane-meta">
        <span class="plane-range">{{ plane.range }}</span>
        <span class="plane-sep">·</span>
        <span class="plane-cp-count">{{ totalCodepoints.toLocaleString() }} codepoints</span>
        <span class="plane-sep">·</span>
        <span class="plane-block-count">{{ blocks.length }} blocks</span>
      </div>
      <a
        :href="`https://www.unicode.org/versions/enumeratedversions.html`"
        class="plane-ref"
        target="_blank"
        rel="noopener"
      >Unicode version history ↗</a>
    </header>

    <!-- Blocks grouped by Unicode version -->
    <section
      v-for="group in versionGroups"
      :key="group.version"
      class="version-section"
    >
      <div class="version-header" :class="versionEra(group.version)">
        <div class="version-badge">
          <span class="version-num">{{ group.version }}</span>
        </div>
        <div class="version-info">
          <span class="version-label">Unicode {{ group.version }}</span>
          <span class="version-year" v-if="versionYear(group.version)">{{ versionYear(group.version) }}</span>
        </div>
        <span class="version-block-count">{{ group.blocks.length }} blocks</span>
      </div>

      <div class="block-list">
        <div
          v-for="block in group.blocks"
          :key="block.name"
          class="block-row"
        >
          <a :href="`/unicode/block/${blockSlug(block.name)}`"
            class="block-info"
          >
            <span class="block-code">{{ hexCp(block.start) }}</span>
            <span class="block-code-dash">–</span>
            <span class="block-code">{{ hexCp(block.end) }}</span>
            <span class="block-name">{{ block.displayName || block.name }}</span>
          </a>
          <span class="block-size">{{ (block.end - block.start + 1).toLocaleString() }} cp</span>
          <a
            :href="chartUrl(block)"
            class="block-chart"
            target="_blank"
            rel="noopener"
            title="Unicode code chart (PDF)"
          >chart ↗</a>
        </div>
      </div>
    </section>
  </div>

  <div v-else-if="!loading" class="plane-loading">Plane "{{ planeId }}" not found.</div>
  <div v-else class="plane-loading">Loading…</div>
</template>

<style scoped>
/* All styles migrated to src/styles/main.css (@layer components). */
</style>
