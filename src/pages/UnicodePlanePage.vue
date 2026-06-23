<script setup lang="ts">
import { ref, computed } from 'vue'
import { useRoute, RouterLink } from 'vue-router'
import { useHead } from '@unhead/vue'
import { loadAllBlocks, PLANES, hexCp, blockSlug } from '../lib/unicode'
import type { UnicodeBlock, PlaneKey } from '../lib/unicode'

const route = useRoute()
const planeId = computed(() => route.params.planeId as string)

const allBlocks = ref<UnicodeBlock[]>([])

const plane = computed(() =>
  PLANES.find(p => p.key === planeId.value || p.shortName.toLowerCase() === planeId.value.toLowerCase())
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

useHead(() => ({
  title: plane.value
    ? `${plane.value.shortName} — Unicode Plane`
    : 'Unicode Plane — Fontist',
  meta: [
    { property: 'og:title', content: plane.value?.shortName || 'Unicode Plane' },
    { property: 'og:type', content: 'website' },
  ],
  link: [
    { rel: 'canonical', href: `https://www.fontist.org/unicode/plane/${planeId.value}` },
  ],
}))
</script>

<template>
  <div class="plane" v-if="plane">
    <!-- Plane header -->
    <header class="plane-header">
      <RouterLink to="/unicode" class="plane-back">← Unicode</RouterLink>
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
          <RouterLink
            :to="`/unicode/block/${blockSlug(block.name)}`"
            class="block-info"
          >
            <span class="block-code">{{ hexCp(block.start) }}</span>
            <span class="block-code-dash">–</span>
            <span class="block-code">{{ hexCp(block.end) }}</span>
            <span class="block-name">{{ block.displayName || block.name }}</span>
          </RouterLink>
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
.plane {
  max-width: 880px;
  margin: 0 auto;
  padding: 2rem 1.5rem 5rem;
  font-family: var(--vp-font-family-base, system-ui, sans-serif);
}

/* ===== PLANE HEADER ===== */
.plane-header {
  margin-bottom: 2.5rem;
  padding-bottom: 1.5rem;
  border-bottom: 3px double var(--vp-c-text-1, #1a1a1a);
}
.plane-back {
  display: inline-block;
  font-size: 0.75rem;
  font-weight: 500;
  color: var(--fontist-rose, #bf4e6a);
  text-decoration: none;
  letter-spacing: 0.02em;
  margin-bottom: 0.75rem;
}
.plane-back:hover { text-decoration: underline; }
.plane-title-block {
  display: flex;
  align-items: baseline;
  gap: 0.75rem;
  margin-bottom: 0.5rem;
}
.plane-short {
  font-family: var(--spec-font-mono);
  font-size: 1.5rem;
  font-weight: 800;
  color: var(--fontist-rose, #bf4e6a);
  letter-spacing: 0.02em;
}
.plane-name {
  font-size: clamp(1.1rem, 3vw, 1.6rem);
  font-weight: 600;
  margin: 0;
  color: var(--vp-c-text-1, #1a1a1a);
  letter-spacing: -0.01em;
}
.plane-meta {
  display: flex;
  align-items: center;
  gap: 0.4rem;
  font-size: 0.8rem;
  color: var(--vp-c-text-3, #888);
  font-family: var(--spec-font-mono);
}
.plane-sep { opacity: 0.4; }
.plane-ref {
  display: inline-block;
  margin-top: 0.5rem;
  font-size: 0.72rem;
  color: var(--vp-c-text-3, #888);
  text-decoration: none;
  transition: color 0.15s;
}
.plane-ref:hover { color: var(--fontist-rose, #bf4e6a); }

/* ===== VERSION SECTIONS ===== */
.version-section {
  margin-bottom: 1.5rem;
}
.version-header {
  display: flex;
  align-items: center;
  gap: 0.75rem;
  padding: 0.5rem 0;
  margin-bottom: 0.25rem;
  border-bottom: 1px solid var(--vp-c-divider, #e8e6e0);
}

/* Era color coding — left border on version header */
.version-header.era-foundation { border-bottom-color: #3b5998; }
.version-header.era-expansion { border-bottom-color: #2a9d8f; }
.version-header.era-modernization { border-bottom-color: #588157; }
.version-header.era-emoji { border-bottom-color: #e9c46a; }
.version-header.era-recent { border-bottom-color: #f4a261; }
.version-header.era-latest { border-bottom-color: var(--fontist-rose, #bf4e6a); }

.version-badge {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  min-width: 3rem;
  padding: 0.15rem 0.5rem;
  border-radius: 3px;
  font-family: var(--spec-font-mono);
  font-size: 0.72rem;
  font-weight: 700;
  color: #fff;
}
.era-foundation .version-badge { background: #3b5998; }
.era-expansion .version-badge { background: #2a9d8f; }
.era-modernization .version-badge { background: #588157; }
.era-emoji .version-badge { background: #e9c46a; color: #1a1a1a; }
.era-recent .version-badge { background: #f4a261; color: #1a1a1a; }
.era-latest .version-badge { background: var(--fontist-rose, #bf4e6a); }

.version-info {
  display: flex;
  align-items: baseline;
  gap: 0.5rem;
}
.version-label {
  font-size: 0.82rem;
  font-weight: 600;
  color: var(--vp-c-text-1, #1a1a1a);
}
.version-year {
  font-family: var(--spec-font-mono);
  font-size: 0.72rem;
  color: var(--vp-c-text-3, #888);
}
.version-block-count {
  margin-left: auto;
  font-family: var(--spec-font-mono);
  font-size: 0.7rem;
  color: var(--vp-c-text-3, #888);
}

/* ===== BLOCK ROWS ===== */
.block-list {
  display: flex;
  flex-direction: column;
}
.block-row {
  display: flex;
  align-items: baseline;
  gap: 0.75rem;
  padding: 0.4rem 0 0.4rem 1rem;
  border-bottom: 1px solid var(--vp-c-divider, #f0eee8);
  transition: background 0.08s;
}
.block-row:hover {
  background: var(--vp-c-bg-soft, #faf8f5);
}
.block-row:last-child {
  border-bottom: none;
}

.block-info {
  display: flex;
  align-items: baseline;
  gap: 0.4rem;
  flex: 1;
  text-decoration: none;
  min-width: 0;
}

.block-code {
  font-family: var(--spec-font-mono);
  font-size: 0.75rem;
  font-weight: 600;
  color: var(--fontist-rose, #bf4e6a);
  white-space: nowrap;
  cursor: pointer;
}
.block-code-dash {
  font-family: var(--spec-font-mono);
  font-size: 0.7rem;
  color: var(--vp-c-text-3, #aaa);
}
.block-name {
  flex: 1;
  font-size: 0.85rem;
  color: var(--vp-c-text-1, #1a1a1a);
  cursor: pointer;
  transition: color 0.1s;
}
.block-row:hover .block-name {
  color: var(--fontist-rose, #bf4e6a);
}

.block-size {
  font-family: var(--spec-font-mono);
  font-size: 0.68rem;
  color: var(--vp-c-text-3, #aaa);
  white-space: nowrap;
}

.block-chart {
  font-size: 0.65rem;
  color: var(--vp-c-text-3, #aaa);
  text-decoration: none;
  white-space: nowrap;
  transition: color 0.1s;
  opacity: 0;
}
.block-row:hover .block-chart {
  opacity: 1;
}
.block-chart:hover {
  color: var(--fontist-rose, #bf4e6a);
}

/* ===== LOADING ===== */
.plane-loading {
  display: flex;
  align-items: center;
  justify-content: center;
  min-height: 50vh;
  color: var(--vp-c-text-3, #888);
  font-size: 0.9rem;
}

/* ===== RESPONSIVE ===== */
@media (max-width: 640px) {
  .block-chart { opacity: 1; }
  .block-row { padding-left: 0.5rem; gap: 0.4rem; }
  .block-code { font-size: 0.7rem; }
  .block-name { font-size: 0.8rem; }
}
</style>
