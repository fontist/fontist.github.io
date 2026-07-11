<script setup lang="ts">
// BlockCoverageHeatmap — the "cartographer's atlas" view of a font's
// Unicode coverage. 346 Unicode blocks rendered as pastel tiles arranged
// by plane (BMP / SMP / SIP / TIP / SSP / PUA). Tile color = coverage %.
// Hover → block name + covered/total. Click → per-block detail page.
//
// The whole visual is intentionally compact and scannable. The big serif
// completeness numbers (top) and the dense tile grid (middle) are the
// two strongest signals; everything else (legend, tooltips, plane
// filters) is supporting cast.

import { computed, ref } from 'vue'
import { blockSlug } from '../lib/unicode/constants'
import { normalizeBlockName, coverageBucket as bucketFor } from '../lib/unicode/coverage'
import type { Coverage } from '../lib/types/domain'

interface Props {
  fontSlug: string
  coverage: Coverage | null
  formulaSlug?: string
  unicodeBlocks?: { name: string; start: number; end: number }[]
}

const props = withDefaults(defineProps<Props>(), {
  formulaSlug: '',
  unicodeBlocks: () => [],
})

const hovered = ref<string | null>(null)

// ---------- Plane classification ----------
const planeForStart = (start: number): string => {
  if (start <= 0xFFFF) return 'bmp'
  if (start <= 0x1FFFF) return 'smp'
  if (start <= 0x2FFFF) return 'sip'
  if (start <= 0xDFFFF) return 'tip'
  if (start <= 0xEFFFF) return 'ssp'
  if (start <= 0xFFFFF) return 'pua-a'
  return 'pua-b'
}

const PLANE_META: { key: string; short: string; full: string; range: string }[] = [
  { key: 'bmp',  short: 'BMP',  full: 'Basic Multilingual Plane',          range: 'U+0000–U+FFFF' },
  { key: 'smp',  short: 'SMP',  full: 'Supplementary Multilingual Plane',   range: 'U+10000–U+1FFFF' },
  { key: 'sip',  short: 'SIP',  full: 'Supplementary Ideographic Plane',    range: 'U+20000–U+2FFFF' },
  { key: 'tip',  short: 'TIP',  full: 'Tertiary Ideographic Plane',         range: 'U+30000–U+3FFFF' },
  { key: 'ssp',  short: 'SSP',  full: 'Supplementary Special-purpose Plane', range: 'U+E0000–U+EFFFF' },
  { key: 'pua-a', short: 'PUA-A', full: 'Supplementary Private Use Area-A',  range: 'U+F0000–U+FFFFF' },
  { key: 'pua-b', short: 'PUA-B', full: 'Supplementary Private Use Area-B',  range: 'U+100000–U+10FFFF' },
]

// ---------- Tile data ----------
// Each tile represents one Unicode block. Coverage % comes from the
// per-face coverage_file's blocks[] array (matched by name); blocks the
// font has no entry for get either 0% (if blocks are listed but empty)
// or "unknown" (if coverage_file is missing entirely).
interface Tile {
  name: string
  slug: string
  start: number
  end: number
  total: number
  covered: number
  pct: number          // 0..1, undefined → "no data"
  unknown: boolean
  plane: string
}

const activeFilter = ref<string>('all')

const tiles = computed<Tile[]>(() => {
  const hasCoverage = !!props.coverage && !!props.coverage.blocks
  const coveredByBlock = new Map<string, number>()
  if (hasCoverage) {
    for (const b of props.coverage!.blocks) {
      const n = (b.codepoints?.length ?? 0)
      coveredByBlock.set(normalizeBlockName(b.name), n)
    }
  }

  return props.unicodeBlocks.map(b => {
    const total = b.end - b.start + 1
    const covered = coveredByBlock.get(normalizeBlockName(b.name)) ?? 0
    return {
      name: b.name,
      slug: blockSlug(b.name),
      start: b.start,
      end: b.end,
      total,
      covered,
      pct: total > 0 ? covered / total : 0,
      unknown: !hasCoverage,
      plane: planeForStart(b.start),
    }
  })
})

const visibleTiles = computed(() => {
  if (activeFilter.value === 'all') return tiles.value
  return tiles.value.filter(t => t.plane === activeFilter.value)
})

const planesInView = computed(() => {
  const seen = new Set<string>()
  for (const t of visibleTiles.value) seen.add(t.plane)
  return PLANE_META.filter(p => seen.has(p.key))
})

// Per-plane tile grouping
const tilesByPlane = computed(() => {
  const groups = new Map<string, Tile[]>()
  for (const t of visibleTiles.value) {
    const arr = groups.get(t.plane) ?? []
    arr.push(t)
    groups.set(t.plane, arr)
  }
  return groups
})

// ---------- Stats ----------
// Note: coverage_file's `total_codepoints` and `total_blocks` are
// scoped to blocks the font has data for. For the headline stat we
// want completeness *across all of Unicode*, so we use
// unicodeBlocks (passed in from the parent — comes from
// public/unicode-blocks.json) as the global denominator.
const globalTotals = computed(() => {
  let codepoints = 0
  for (const b of props.unicodeBlocks) {
    codepoints += (b.end - b.start + 1)
  }
  return { codepoints, blocks: props.unicodeBlocks.length }
})

const summary = computed(() => {
  const coveredNames = new Set<string>()
  for (const b of (props.coverage?.blocks ?? [])) {
    if ((b.codepoints?.length ?? 0) > 0) {
      coveredNames.add(normalizeBlockName(b.name))
    }
  }
  // Count blocks in unicodeBlocks that have >0 coverage (matched by normalized name).
  let supportedBlocks = 0
  for (const b of props.unicodeBlocks) {
    if (coveredNames.has(normalizeBlockName(b.name))) supportedBlocks++
  }
  const supportedCodepoints = props.coverage?.codepoints?.length ?? 0
  return {
    totalCodepoints: globalTotals.value.codepoints,
    supportedCodepoints,
    totalBlocks: globalTotals.value.blocks,
    supportedBlocks,
    codepointPct: globalTotals.value.codepoints > 0
      ? supportedCodepoints / globalTotals.value.codepoints
      : 0,
    blockPct: globalTotals.value.blocks > 0
      ? supportedBlocks / globalTotals.value.blocks
      : 0,
    hasData: !!props.coverage,
  }
})

// Per-plane completeness. Use block support rate (supportedBlocks / totalBlocks)
// rather than codepoint share — codepoint % is misleading in BMP/CJK where
// one block can dwarf everything else (CJK alone has ~98K assigned codepoints).
const planeStats = computed(() => {
  const out = new Map<string, { total: number; covered: number; pct: number; supportedBlocks: number; totalBlocks: number }>()
  for (const t of tiles.value) {
    const cur = out.get(t.plane) ?? { total: 0, covered: 0, pct: 0, supportedBlocks: 0, totalBlocks: 0 }
    cur.total += t.total
    cur.covered += t.covered
    cur.totalBlocks += 1
    if (t.covered > 0) cur.supportedBlocks += 1
    out.set(t.plane, cur)
  }
  for (const v of out.values()) {
    // pct here = "what fraction of this plane's BLOCKS have at least one
    // codepoint covered by the font" — more meaningful than codepoint share.
    v.pct = v.totalBlocks > 0 ? v.supportedBlocks / v.totalBlocks : 0
  }
  return out
})

// ---------- Color selection ----------
function tileColorClass(t: Tile): string {
  return 't-' + bucketFor(t.pct, !t.unknown)
}

function pctLabel(pct: number): string {
  if (pct >= 0.999) return '100%'
  if (pct >= 0.995) return '99%+'
  return `${Math.round(pct * 100)}%`
}

// ---------- Navigation ----------
function openBlock(tile: Tile) {
  window.location.href = {
    path: `/fonts/${props.fontSlug}/unicode/block/${tile.slug}`,
    query: props.formulaSlug ? { formula: props.formulaSlug } : undefined,
  }
}
</script>

<template>
  <section class="cov" :class="{ 'cov--nodata': !summary.hasData }">
    <!-- ── Headline stats ───────────────────────────────────────── -->
    <header class="cov-stats">
      <div class="cov-stats-primary">
        <div class="cov-stats-num">{{ summary.hasData ? pctLabel(summary.blockPct) : '—' }}</div>
        <div class="cov-stats-label">
          <span class="cov-stats-label-strong">of Unicode covered</span>
          <span class="cov-stats-label-sub" v-if="summary.hasData">
            {{ summary.supportedBlocks.toLocaleString() }} of {{ summary.totalBlocks.toLocaleString() }} blocks
          </span>
          <span class="cov-stats-label-sub" v-else>no coverage data yet</span>
        </div>
      </div>
      <div class="cov-stats-secondary">
        <div class="cov-stats-mini">
          <span class="cov-stats-mini-num">{{ summary.supportedCodepoints.toLocaleString() }}</span>
          <span class="cov-stats-mini-label">codepoints</span>
        </div>
        <div class="cov-stats-divider"></div>
        <div class="cov-stats-mini">
          <span class="cov-stats-mini-num">{{ pctLabel(summary.codepointPct) }}</span>
          <span class="cov-stats-mini-label">codepoint share</span>
        </div>
      </div>
    </header>

    <!-- ── Plane filter pills ──────────────────────────────────── -->
    <nav class="cov-filter" role="tablist" aria-label="Filter blocks by plane">
      <button
        :class="['cov-filter-pill', { on: activeFilter === 'all' }]"
        @click="activeFilter = 'all'"
        role="tab"
        :aria-selected="activeFilter === 'all'"
      >All planes</button>
      <button
        v-for="p in PLANE_META.filter(p => tilesByPlane.has(p.key))"
        :key="p.key"
        :class="['cov-filter-pill', { on: activeFilter === p.key }]"
        @click="activeFilter = p.key"
        role="tab"
        :aria-selected="activeFilter === p.key"
      >
        <span class="cov-filter-pill-short">{{ p.short }}</span>
        <span class="cov-filter-pill-full">{{ p.full }}</span>
      </button>
    </nav>

    <!-- ── Per-plane sections ──────────────────────────────────── -->
    <div class="cov-planes">
      <section v-for="p in planesInView" :key="p.key" class="cov-plane">
        <header class="cov-plane-head">
          <div class="cov-plane-title">
            <span class="cov-plane-title-key">{{ p.short }}</span>
            <span class="cov-plane-title-full">{{ p.full }}</span>
          </div>
          <div class="cov-plane-meta">
            <span class="cov-plane-range">{{ p.range }}</span>
            <span class="cov-plane-pct">
              <span class="cov-plane-pct-num">{{ pctLabel(planeStats.get(p.key)?.pct ?? 0) }}</span>
              <span class="cov-plane-pct-label">blocks supported</span>
            </span>
            <span class="cov-plane-blocks">{{ planeStats.get(p.key)?.supportedBlocks ?? 0 }}/{{ planeStats.get(p.key)?.totalBlocks ?? 0 }} total</span>
          </div>
        </header>
        <div class="cov-grid">
          <button
            v-for="t in tilesByPlane.get(p.key)"
            :key="t.slug"
            :class="['cov-tile', tileColorClass(t), { 'cov-tile--empty': t.covered === 0 && !t.unknown }]"
            @click="openBlock(t)"
            @mouseenter="hovered = t.slug"
            @mouseleave="hovered = null"
            @focus="hovered = t.slug"
            @blur="hovered = null"
            :title="`${t.name}: ${t.covered}/${t.total} (${pctLabel(t.pct)})`"
            :aria-label="`${t.name} — ${pctLabel(t.pct)} covered`"
          >
            <span class="cov-tile-fill" :style="{ '--cov-fill-pct': Math.max(4, Math.round(t.pct * 100)) + '%' }"></span>
            <span class="cov-tile-label" v-if="t.covered > 0">{{ pctLabel(t.pct) }}</span>
            <span class="cov-tile-label cov-tile-label--muted" v-else>{{ t.unknown ? '?' : '0' }}</span>
          </button>
        </div>
      </section>
    </div>

    <!-- ── Legend ──────────────────────────────────────────────── -->
    <footer class="cov-legend">
      <span class="cov-legend-label">Coverage scale</span>
      <ol class="cov-legend-scale" aria-label="Coverage percentage scale">
        <li><span class="cov-legend-tile t-0"></span><span class="cov-legend-text">0%</span></li>
        <li><span class="cov-legend-tile t-25"></span><span class="cov-legend-text">1–25%</span></li>
        <li><span class="cov-legend-tile t-50"></span><span class="cov-legend-text">26–50%</span></li>
        <li><span class="cov-legend-tile t-75"></span><span class="cov-legend-text">51–75%</span></li>
        <li><span class="cov-legend-tile t-100"></span><span class="cov-legend-text">76–100%</span></li>
        <li v-if="tiles.some(t => t.unknown)"><span class="cov-legend-tile t-unknown"></span><span class="cov-legend-text">no data</span></li>
      </ol>
      <span class="cov-legend-hint">Click a tile to see per-block detail.</span>
    </footer>
  </section>
</template>

<style scoped>
/* All styles migrated to src/styles/main.css (@layer components). */
</style>
