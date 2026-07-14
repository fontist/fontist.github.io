<script setup lang="ts">
import { computed, ref, watch, onMounted } from 'vue'
import type { UnicodeBlock, UnicodeCharacter, GridMode } from '..'
import type { FontContext } from '../../types/domain'
import { isControlChar, controlAbbrev, controlName, displayChar, hexCp } from '..'
import { fontFormatForPath } from '../../fonts/format.ts'

const props = withDefaults(defineProps<{
  block: UnicodeBlock
  fonts?: FontContext[]
  mode?: GridMode
  showMissing?: boolean
  pageSize?: number
}>(), {
  fonts: () => [],
  mode: 'standalone',
  showMissing: true,
  pageSize: 512,
})

const emit = defineEmits<{
  (e: 'select', cp: number): void
}>()

// ── Pagination (internal — consumers never need to handle this) ──
const currentPage = ref(1)

const totalPages = computed(() =>
  Math.max(1, Math.ceil(props.block.characters.length / props.pageSize))
)

const pagedCharacters = computed(() => {
  const start = (currentPage.value - 1) * props.pageSize
  return props.block.characters.slice(start, start + props.pageSize)
})

// Reset to page 1 when block changes
watch(() => props.block, () => { currentPage.value = 1 })

// Sync with ?page= URL param
onMounted(() => {
  if (typeof window === 'undefined') return
  const p = new URLSearchParams(window.location.search).get('page')
  if (p) {
    const n = parseInt(p, 10)
    if (!isNaN(n) && n >= 1) currentPage.value = Math.min(n, totalPages.value)
  }
})

function goToPage(page: number) {
  currentPage.value = page
  const el = document.querySelector('.ub-container')
  if (el) el.scrollIntoView({ behavior: 'smooth', block: 'start' })
  if (typeof window !== 'undefined') {
    const url = new URL(window.location.href)
    if (page > 1) url.searchParams.set('page', String(page))
    else url.searchParams.delete('page')
    window.history.replaceState({}, '', url)
  }
}

const pageWindow = computed(() => {
  const pages: number[] = []
  const start = Math.max(1, currentPage.value - 2)
  const end = Math.min(totalPages.value, currentPage.value + 2)
  for (let i = start; i <= end; i++) pages.push(i)
  return pages
})

const pageStartHex = computed(() =>
  pagedCharacters.value.length > 0 ? hexCp(pagedCharacters.value[0].cp) : ''
)
const pageEndHex = computed(() =>
  pagedCharacters.value.length > 0 ? hexCp(pagedCharacters.value[pagedCharacters.value.length - 1].cp) : ''
)

// ── Cell computation (operates on paged characters only) ──
interface Cell {
  char: UnicodeCharacter
  renders: { font: FontContext; supported: boolean }[]
  hasAny: boolean
  hasAll: boolean
}

const cells = computed<Cell[]>(() => {
  return pagedCharacters.value.map(c => {
    const renders = props.fonts.map(f => ({ font: f, supported: f.coverage.has(c.cp) }))
    const hasAny = renders.some(r => r.supported)
    const hasAll = renders.length > 0 && renders.every(r => r.supported)
    return { char: c, renders, hasAny, hasAll }
  })
})

const visibleCells = computed(() => {
  if (props.mode === 'multi-font' && props.showMissing) return cells.value
  if (!props.showMissing && props.fonts.length > 0) {
    return cells.value.filter(c => c.hasAny)
  }
  return cells.value
})

const gridStyles = computed(() => {
  if (props.fonts.length === 0) return {}
  const styles: Record<string, string> = {}
  props.fonts.forEach((f, i) => {
    if (f.fontPath && f.redistributable) {
      const id = `ub-${f.slug.replace(/[^a-z0-9]/gi, '-')}`
      if (document.getElementById(`ub-style-${id}`)) {
        const s = document.createElement('style')
        s.id = `ub-style-${id}`
        s.textContent = `@font-face{font-family:'${id}';src:url('${f.fontPath}') format('${fontFormatForPath(f.fontPath)}');font-weight:100 900;font-display:swap;}`
        document.head.appendChild(s)
      }
      styles[f.slug] = `'${id}', sans-serif`
    }
  })
  return styles
})

function fontFamily(font: FontContext): string {
  const id = `ub-${font.slug.replace(/[^a-z0-9]/gi, '-')}`
  return font.redistributable && font.fontPath ? `'${id}', sans-serif` : 'sans-serif'
}

function displayName(char: UnicodeCharacter): string {
  if (isControlChar(char.category, char.cp)) {
    return controlName(char.cp) || char.name
  }
  return char.name
}
</script>

<template>
  <div class="ub-container">
    <!-- Legend: explains supported vs missing (per-font mode only) -->
    <div class="ub-legend" v-if="fonts.length > 0 && mode !== 'standalone'">
      <div class="ub-legend-item">
        <span class="ub-legend-swatch ub-legend-swatch--ok"></span>
        <span>In {{ fonts[0]?.familyName || 'font' }}</span>
      </div>
      <div class="ub-legend-item">
        <span class="ub-legend-swatch ub-legend-swatch--no"></span>
        <span>Not in font</span>
      </div>
      <span class="ub-legend-hint">Click any character for full details →</span>
    </div>

    <!-- Page info -->
    <div v-if="totalPages > 1" class="ub-page-info">
      Page {{ currentPage }} of {{ totalPages }} · U+{{ pageStartHex }}–U+{{ pageEndHex }}
    </div>

    <div class="ub-grid">
      <button
        v-for="cell in visibleCells"
        :key="cell.char.cp"
        :class="['ub-cell', { missing: !cell.hasAny && fonts.length > 0 }]"
        @click="emit('select', cell.char.cp)"
      >
        <span class="ub-cp">{{ cell.char.hex }}</span>
        <span class="ub-missing-badge" v-if="!cell.hasAny && fonts.length > 0">✗</span>

        <template v-if="mode === 'standalone' || fonts.length === 0">
          <div class="ub-glyph-box" v-if="isControlChar(cell.char.category, cell.char.cp)">
            <div class="ub-guides">
              <span class="ub-guide ub-guide--cap"></span>
              <span class="ub-guide ub-guide--xheight"></span>
              <span class="ub-guide ub-guide--baseline"></span>
            </div>
            <span class="ub-control-box">{{ controlAbbrev(cell.char.cp) }}</span>
          </div>
          <div class="ub-glyph-box" v-else>
            <div class="ub-guides">
              <span class="ub-guide ub-guide--cap"></span>
              <span class="ub-guide ub-guide--xheight"></span>
              <span class="ub-guide ub-guide--baseline"></span>
            </div>
            <span class="ub-glyph">{{ displayChar(cell.char.cp, cell.char.category) }}</span>
          </div>
        </template>

        <template v-else-if="mode === 'per-font' && fonts.length === 1">
          <div class="ub-glyph-box" v-if="isControlChar(cell.char.category, cell.char.cp)">
            <div class="ub-guides">
              <span class="ub-guide ub-guide--cap"></span>
              <span class="ub-guide ub-guide--xheight"></span>
              <span class="ub-guide ub-guide--baseline"></span>
            </div>
            <span
              class="ub-control-box"
              :style="{ opacity: cell.renders[0].supported ? 1 : 0.3 }"
            >{{ controlAbbrev(cell.char.cp) }}</span>
          </div>
          <div class="ub-glyph-box" v-else>
            <div class="ub-guides">
              <span class="ub-guide ub-guide--cap"></span>
              <span class="ub-guide ub-guide--xheight"></span>
              <span class="ub-guide ub-guide--baseline"></span>
            </div>
            <span
              class="ub-glyph"
              :style="{ fontFamily: cell.renders[0].supported ? fontFamily(fonts[0]) : 'Essenfont, sans-serif', opacity: cell.renders[0].supported ? 1 : 0.4 }"
            >{{ displayChar(cell.char.cp, cell.char.category) }}</span>
          </div>
        </template>

      <template v-else>
        <div class="ub-multi">
          <span
            v-for="r in cell.renders"
            :key="r.font.slug"
            class="ub-glyph-mini"
            :style="{ fontFamily: r.supported ? fontFamily(r.font) : 'sans-serif', opacity: r.supported ? 1 : 0.15, color: r.supported ? 'inherit' : r.font.color }"
            :title="r.font.familyName + (r.supported ? '' : ' — missing')"
          >{{ cell.char.char }}</span>
        </div>
      </template>

      <span class="ub-name">{{ displayName(cell.char) }}</span>
    </button>
    </div>

    <!-- Pagination controls -->
    <nav v-if="totalPages > 1" class="ub-pagination">
      <button class="ub-page-btn" :disabled="currentPage === 1" @click="goToPage(currentPage - 1)">← Prev</button>
      <button v-if="pageWindow[0] > 1" class="ub-page-btn" @click="goToPage(1)">1</button>
      <span v-if="pageWindow[0] > 2" class="ub-page-ellipsis">…</span>
      <button
        v-for="page in pageWindow"
        :key="page"
        :class="['ub-page-btn', { on: page === currentPage }]"
        @click="goToPage(page)"
      >{{ page }}</button>
      <span v-if="pageWindow[pageWindow.length - 1] < totalPages - 1" class="ub-page-ellipsis">…</span>
      <button v-if="pageWindow[pageWindow.length - 1] < totalPages" class="ub-page-btn" @click="goToPage(totalPages)">{{ totalPages }}</button>
      <button class="ub-page-btn" :disabled="currentPage === totalPages" @click="goToPage(currentPage + 1)">Next →</button>
    </nav>
  </div>
</template>

<style scoped>
.ub-container { width: 100%; }

/* Legend — explains supported vs missing */
.ub-legend {
  display: flex;
  align-items: center;
  gap: 1.5rem;
  padding: 0.6rem 0.8rem;
  margin-bottom: 0.75rem;
  background: var(--color-paper-deep);
  border: 1px solid var(--spec-rule);
  border-radius: 6px;
  font-size: 0.78rem;
  color: var(--color-ink-soft);
}
.ub-legend-item {
  display: flex;
  align-items: center;
  gap: 0.4rem;
}
.ub-legend-swatch {
  display: inline-block;
  width: 12px;
  height: 12px;
  border-radius: 2px;
}
.ub-legend-swatch--ok { background: #5b8; }
.ub-legend-swatch--no { background: #c44; opacity: 0.5; }
.ub-legend-hint {
  margin-left: auto;
  font-family: var(--font-mono);
  font-size: 0.68rem;
  color: var(--color-mute);
}

/* Page info */
.ub-page-info {
  font-family: var(--font-mono);
  font-size: 0.72rem;
  color: var(--color-mute);
  margin-bottom: 1rem;
  padding: 0.5rem 0;
}

/* Grid */
.ub-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(72px, 1fr));
  gap: 1px;
  background: var(--spec-rule);
  border: 1px solid var(--spec-rule);
}

.ub-cell {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: flex-end;
  background: var(--spec-bg);
  border: none;
  cursor: pointer;
  padding: 0.3rem 0.2rem 0.25rem;
  min-height: 80px;
  transition: background 0.15s;
  position: relative;
}
.ub-cell:hover {
  background: var(--spec-bg-hover);
}
.ub-cell.missing {
  background: var(--spec-bg-missing);
}

.ub-cp {
  font-size: 0.55rem;
  font-family: var(--font-mono);
  color: var(--color-mute);
  position: absolute;
  top: 3px;
  left: 4px;
}

.ub-missing-badge {
  position: absolute;
  top: 2px;
  right: 4px;
  font-size: 0.6rem;
  color: #c44;
  font-weight: 700;
  line-height: 1;
}

/* Glyph box with typographic guide lines */
.ub-glyph-box {
  position: relative;
  flex: 1;
  display: flex;
  align-items: center;
  justify-content: center;
  width: 100%;
  min-height: 48px;
}
.ub-guides {
  position: absolute;
  inset: 0;
  pointer-events: none;
  z-index: 0;
}
.ub-guide {
  position: absolute;
  left: 8px;
  right: 8px;
  height: 0;
}
.ub-guide--cap {
  top: 10%;
  border-top: 1px dashed rgba(0, 0, 0, 0.12);
}
.ub-guide--xheight {
  top: 28%;
  border-top: 1px dashed rgba(0, 0, 0, 0.10);
}
.ub-guide--baseline {
  top: 73%;
  border-top: 1.5px solid rgba(191, 78, 106, 0.30);
}
.ub-cell:hover .ub-guide--baseline {
  border-top-color: rgba(191, 78, 106, 0.5);
}

.ub-glyph {
  position: relative;
  z-index: 1;
  font-family: 'Essenfont', 'IBM Plex Sans', sans-serif;
  font-size: 1.8rem;
  line-height: 1.15;
  color: var(--spec-ink);
  text-align: center;
  display: flex;
  align-items: center;
  justify-content: center;
}

.ub-control-box {
  position: relative;
  z-index: 1;
  font-family: var(--font-mono);
  font-size: 0.7rem;
  font-weight: 700;
  letter-spacing: 0.04em;
  color: var(--color-mute);
  padding: 0.25rem 0.5rem;
  border: 1px dashed var(--color-mute);
  border-radius: 3px;
  background: var(--color-paper-deep);
}

.ub-multi {
  display: flex;
  gap: 4px;
  flex: 1;
  align-items: center;
  justify-content: center;
}
.ub-glyph-mini {
  font-size: 1.1rem;
  line-height: 1;
}
.ub-name {
  font-size: 0.5rem;
  text-align: center;
  color: var(--color-mute);
  line-height: 1.1;
  overflow: hidden;
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
}

/* Pagination */
.ub-pagination {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 0.3rem;
  padding: 2rem 0;
  margin-top: 1rem;
  flex-wrap: wrap;
}

.ub-page-btn {
  background: transparent;
  border: 1px solid var(--color-rule);
  border-radius: 2px;
  padding: 0.35rem 0.7rem;
  font-family: var(--font-mono);
  font-size: 0.72rem;
  color: var(--color-ink-soft);
  cursor: pointer;
  transition: all 0.15s;
  min-width: 32px;
}
.ub-page-btn:hover:not(:disabled):not(.on) {
  border-color: var(--color-accent);
  color: var(--color-accent);
}
.ub-page-btn.on {
  background: var(--color-accent);
  border-color: var(--color-accent);
  color: var(--color-paper);
}
.ub-page-btn:disabled {
  opacity: 0.4;
  cursor: default;
}

.ub-page-ellipsis {
  font-family: var(--font-mono);
  font-size: 0.72rem;
  color: var(--color-mute);
  padding: 0 0.3rem;
}

@media (max-width: 600px) {
  .ub-grid {
    grid-template-columns: repeat(auto-fill, minmax(56px, 1fr));
  }
  .ub-glyph { font-size: 1.4rem; }
  .ub-name { font-size: 0.45rem; }
}
</style>
