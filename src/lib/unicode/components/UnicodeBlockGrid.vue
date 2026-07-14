<script setup lang="ts">
import { computed } from 'vue'
import type { UnicodeBlock, UnicodeCharacter, GridMode } from '..'
import type { FontContext } from '../../types/domain'
import { isControlChar, controlAbbrev, controlName, displayChar } from '..'
import { fontFormatForPath } from '../../fonts/format.ts'

const props = withDefaults(defineProps<{
  block: UnicodeBlock
  fonts?: FontContext[]
  mode?: GridMode
  showMissing?: boolean
  maxChars?: number
}>(), {
  fonts: () => [],
  mode: 'standalone',
  showMissing: true,
  maxChars: 512,
})

const emit = defineEmits<{
  (e: 'select', cp: number): void
}>()

interface Cell {
  char: UnicodeCharacter
  renders: { font: FontContext; supported: boolean }[]
  hasAny: boolean
  hasAll: boolean
}

const cells = computed<Cell[]>(() => {
  const chars = props.block.characters.slice(0, props.maxChars)
  return chars.map(c => {
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
      if (!document.getElementById(`ub-style-${id}`)) {
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
  width: 28px;
  height: 20px;
  border-radius: 3px;
  border: 1px solid var(--spec-rule);
}
.ub-legend-swatch--ok {
  background: var(--color-paper);
  border-style: solid;
  border-color: var(--spec-rule);
}
.ub-legend-swatch--no {
  background: repeating-linear-gradient(
    135deg,
    transparent,
    transparent 3px,
    rgba(0,0,0,0.08) 3px,
    rgba(0,0,0,0.08) 5px
  ), var(--color-paper-deep);
  border-style: dashed;
  border-color: var(--color-mute);
}
.ub-legend-hint {
  margin-left: auto;
  font-size: 0.72rem;
  color: var(--color-mute);
  font-style: italic;
}

.ub-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, 158px);
  gap: 6px;
}
.ub-cell {
  display: flex;
  flex-direction: column;
  align-items: center;
  width: 158px;
  min-height: 120px;
  padding: 6px;
  background: var(--color-paper);
  border: 1px solid var(--spec-rule);
  border-radius: 6px;
  cursor: pointer;
  overflow: hidden;
  gap: 3px;
  transition: border-color 0.12s, box-shadow 0.12s;
}
.ub-cell:hover {
  border-color: var(--fontist-rose, #bf4e6a);
  box-shadow: 0 2px 8px rgba(0,0,0,0.08);
}
.ub-cell.missing {
  background: repeating-linear-gradient(
    135deg,
    var(--color-paper-deep),
    var(--color-paper-deep) 3px,
    var(--color-paper-deep) 3px,
    var(--color-paper-deep) 6px
  );
  border-style: dashed;
  border-color: var(--color-mute);
  opacity: 0.55;
}
.ub-missing-badge {
  position: absolute;
  top: 3px;
  right: 4px;
  font-size: 0.6rem;
  color: #c44;
  font-weight: 700;
  line-height: 1;
}
.ub-cp {
  font-size: 0.55rem;
  font-family: var(--font-mono);
  color: var(--color-mute);
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
</style>
