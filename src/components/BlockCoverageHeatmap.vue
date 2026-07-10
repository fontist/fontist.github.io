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
import { useRouter } from 'vue-router'
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

const router = useRouter()
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
  router.push({
    path: `/fonts/${props.fontSlug}/unicode/block/${tile.slug}`,
    query: props.formulaSlug ? { formula: props.formulaSlug } : undefined,
  })
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
.cov {
  --cov-tile-size: 28px;
  --cov-tile-gap: 4px;
  --cov-grid-cols: 16;
  display: block;
  font-family: var(--spec-font-body);
  color: var(--spec-ink);
}

/* ── Headline stats ───────────────────────────────────────────── */
.cov-stats {
  display: grid;
  grid-template-columns: minmax(0, 1.4fr) minmax(0, 1fr);
  gap: 2.5rem;
  align-items: end;
  padding: 0 0 1.5rem;
  border-bottom: 1px solid var(--spec-rule);
  margin-bottom: 1.75rem;
}

.cov-stats-primary {
  display: flex;
  align-items: baseline;
  gap: 1rem;
}

.cov-stats-num {
  font-family: var(--spec-font-display);
  font-weight: 400;
  font-size: clamp(3.5rem, 9vw, 5.5rem);
  line-height: 0.9;
  letter-spacing: -0.025em;
  color: var(--spec-ink);
  font-variant-numeric: tabular-nums;
  font-feature-settings: "tnum" 1, "lnum" 1;
}

.cov-stats-label {
  display: flex;
  flex-direction: column;
  gap: 0.2rem;
}

.cov-stats-label-strong {
  font-size: 0.78rem;
  font-weight: 600;
  text-transform: uppercase;
  letter-spacing: 0.12em;
  color: var(--spec-ink);
}

.cov-stats-label-sub {
  font-family: var(--spec-font-mono);
  font-size: 0.78rem;
  color: var(--spec-mute);
  letter-spacing: 0;
}

.cov-stats-secondary {
  display: flex;
  align-items: baseline;
  gap: 1.25rem;
  padding-bottom: 0.4rem;
}

.cov-stats-mini {
  display: flex;
  flex-direction: column;
  gap: 0.1rem;
}

.cov-stats-mini-num {
  font-family: var(--spec-font-display);
  font-size: 1.4rem;
  font-weight: 400;
  color: var(--spec-ink);
  font-variant-numeric: tabular-nums;
  line-height: 1;
}

.cov-stats-mini-label {
  font-family: var(--spec-font-mono);
  font-size: 0.7rem;
  text-transform: uppercase;
  letter-spacing: 0.08em;
  color: var(--spec-mute);
}

.cov-stats-divider {
  width: 1px;
  align-self: stretch;
  background: var(--spec-rule);
  margin: 0.2rem 0;
}

/* ── Plane filter ─────────────────────────────────────────────── */
.cov-filter {
  display: flex;
  flex-wrap: wrap;
  gap: 0.4rem;
  margin-bottom: 2rem;
}

.cov-filter-pill {
  display: inline-flex;
  align-items: baseline;
  gap: 0.4rem;
  padding: 0.4rem 0.7rem 0.35rem;
  background: transparent;
  border: 1px solid var(--spec-rule);
  border-radius: 3px;
  font-family: var(--spec-font-mono);
  font-size: 0.74rem;
  color: var(--spec-ink-soft);
  cursor: pointer;
  transition: all 0.18s ease;
  letter-spacing: 0;
}

.cov-filter-pill:hover {
  border-color: var(--fontist-rose, #bf4e6a);
  color: var(--spec-ink);
}

.cov-filter-pill.on {
  background: var(--spec-ink);
  border-color: var(--spec-ink);
  color: var(--spec-paper);
}

.cov-filter-pill-short {
  font-weight: 600;
  letter-spacing: 0.05em;
}

.cov-filter-pill-full {
  font-size: 0.7rem;
  opacity: 0.7;
}

.cov-filter-pill.on .cov-filter-pill-full {
  opacity: 0.55;
}

/* ── Per-plane section ────────────────────────────────────────── */
.cov-plane + .cov-plane { margin-top: 2.5rem; }

.cov-plane-head {
  display: flex;
  align-items: baseline;
  justify-content: space-between;
  gap: 1rem;
  padding-bottom: 0.6rem;
  margin-bottom: 0.75rem;
  border-bottom: 1px solid var(--spec-rule);
}

.cov-plane-title {
  display: flex;
  align-items: baseline;
  gap: 0.6rem;
  min-width: 0;
}

.cov-plane-title-key {
  font-family: var(--spec-font-mono);
  font-size: 0.72rem;
  font-weight: 600;
  letter-spacing: 0.18em;
  color: var(--fontist-rose, #bf4e6a);
  text-transform: uppercase;
}

.cov-plane-title-full {
  font-family: var(--spec-font-display);
  font-size: 1.1rem;
  font-style: italic;
  color: var(--spec-ink);
  line-height: 1.1;
}

.cov-plane-meta {
  display: flex;
  align-items: baseline;
  gap: 1.5rem;
  flex-shrink: 0;
}

.cov-plane-range {
  font-family: var(--spec-font-mono);
  font-size: 0.7rem;
  color: var(--spec-mute);
  letter-spacing: 0.02em;
}

.cov-plane-pct {
  display: flex;
  align-items: baseline;
  gap: 0.35rem;
}

.cov-plane-pct-num {
  font-family: var(--spec-font-display);
  font-size: 1.1rem;
  color: var(--spec-ink);
  font-variant-numeric: tabular-nums;
  line-height: 1;
}

.cov-plane-pct-label {
  font-family: var(--spec-font-mono);
  font-size: 0.65rem;
  text-transform: uppercase;
  letter-spacing: 0.1em;
  color: var(--spec-mute);
}

.cov-plane-blocks {
  font-family: var(--spec-font-mono);
  font-size: 0.7rem;
  color: var(--spec-mute);
}

/* ── Tile grid ────────────────────────────────────────────────── */
.cov-grid {
  display: grid;
  grid-template-columns: repeat(var(--cov-grid-cols), var(--cov-tile-size));
  gap: var(--cov-tile-gap);
  justify-content: start;
}

.cov-tile {
  position: relative;
  width: var(--cov-tile-size);
  height: var(--cov-tile-size);
  padding: 0;
  background: transparent;
  border: 1px solid var(--coverage-tile-border);
  border-radius: 2px;
  cursor: pointer;
  transition: transform 0.16s cubic-bezier(.2,.7,.3,1), border-color 0.16s ease, box-shadow 0.16s ease;
  overflow: hidden;
  font: inherit;
}

.cov-tile:hover,
.cov-tile:focus-visible {
  transform: translateY(-2px);
  border-color: var(--coverage-tile-border-strong);
  box-shadow: 0 2px 0 rgba(28,26,24,0.08), 0 4px 8px rgba(28,26,24,0.1);
  z-index: 2;
  outline: none;
}

.cov-tile-fill {
  position: absolute;
  inset: 0;
  background: currentColor;
  /* Coverage fill animates from bottom — gives a sense of "how much is filled" */
  clip-path: inset(calc(100% - var(--cov-fill-pct, 0%)) 0 0 0);
  transition: clip-path 0.3s ease;
}

.cov-tile-label {
  position: absolute;
  inset: 0;
  display: flex;
  align-items: center;
  justify-content: center;
  font-family: var(--spec-font-mono);
  font-size: 0.55rem;
  font-weight: 600;
  letter-spacing: 0;
  color: var(--spec-ink);
  text-shadow: 0 0 2px var(--spec-paper);
  pointer-events: none;
  opacity: 0;
  transition: opacity 0.12s ease;
}

.cov-tile:hover .cov-tile-label,
.cov-tile:focus-visible .cov-tile-label {
  opacity: 1;
}

.cov-tile-label--muted {
  font-weight: 400;
  color: var(--spec-mute);
}

/* Coverage color buckets. Each tile sets its color via the .t-* class
   on the <button>, which `currentColor` in the fill inherits from. */
.t-0       { color: var(--coverage-0); }
.t-low     { color: var(--coverage-25); }
.t-25      { color: var(--coverage-25); }
.t-50      { color: var(--coverage-50); }
.t-75      { color: var(--coverage-75); }
.t-100     { color: var(--coverage-100); }
.t-unknown { color: var(--coverage-unknown); }

/* For 0% tiles, override fill to use the "none" rose and add subtle hatch */
.cov-tile--empty .cov-tile-fill {
  background: repeating-linear-gradient(
    -45deg,
    var(--coverage-none),
    var(--coverage-none) 3px,
    transparent 3px,
    transparent 6px
  );
  clip-path: none;
}

/* Unknown (no coverage data) tiles get a dotted appearance */
.t-unknown .cov-tile-fill {
  background-image: radial-gradient(circle at 50% 50%, var(--coverage-tile-border-strong) 1px, transparent 1.5px);
  background-size: 5px 5px;
  background-color: var(--coverage-unknown);
}

/* ── Legend ───────────────────────────────────────────────────── */
.cov-legend {
  display: flex;
  align-items: center;
  flex-wrap: wrap;
  gap: 0.5rem 1.25rem;
  margin-top: 2rem;
  padding-top: 1rem;
  border-top: 1px solid var(--spec-rule);
}

.cov-legend-label {
  font-family: var(--spec-font-mono);
  font-size: 0.7rem;
  text-transform: uppercase;
  letter-spacing: 0.12em;
  color: var(--spec-mute);
}

.cov-legend-scale {
  display: flex;
  align-items: center;
  gap: 0.75rem;
  margin: 0;
  padding: 0;
  list-style: none;
}

.cov-legend-scale li {
  display: flex;
  align-items: center;
  gap: 0.4rem;
}

.cov-legend-tile {
  display: block;
  width: 16px;
  height: 16px;
  border: 1px solid var(--coverage-tile-border-strong);
  border-radius: 2px;
}

.cov-legend-text {
  font-family: var(--spec-font-mono);
  font-size: 0.68rem;
  color: var(--spec-ink-soft);
  letter-spacing: 0;
}

.cov-legend-hint {
  margin-left: auto;
  font-family: var(--spec-font-mono);
  font-size: 0.68rem;
  color: var(--spec-mute);
  font-style: italic;
}

/* ── Responsive ───────────────────────────────────────────────── */
@media (max-width: 720px) {
  .cov {
    --cov-tile-size: 24px;
    --cov-grid-cols: 12;
    --cov-tile-gap: 3px;
  }
  .cov-stats {
    grid-template-columns: 1fr;
    gap: 1rem;
  }
  .cov-stats-secondary {
    flex-wrap: wrap;
    gap: 1rem;
  }
  .cov-plane-head {
    flex-direction: column;
    align-items: flex-start;
    gap: 0.4rem;
  }
  .cov-plane-meta {
    flex-wrap: wrap;
    gap: 0.75rem;
  }
  .cov-filter-pill-full {
    display: none;
  }
  .cov-filter-pill {
    padding: 0.35rem 0.6rem;
  }
  .cov-legend-hint {
    margin-left: 0;
    width: 100%;
  }
}

/* Respect reduced-motion */
@media (prefers-reduced-motion: reduce) {
  .cov-tile,
  .cov-tile-fill,
  .cov-filter-pill {
    transition: none;
  }
  .cov-tile:hover,
  .cov-tile:focus-visible {
    transform: none;
  }
}
</style>
