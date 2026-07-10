<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { injectFontFace } from '../composables/useFontFace'
import { fetchCoverage } from '../composables/useCoverage'
import { useUnicodeBlock } from '../composables/useUnicodeBlock'
import { blockScriptFamily, hexCp, safeChar, blockSlug, type ScriptFamily } from '../lib/unicode/constants'
import type { Coverage, CoverageBlock } from '../lib/types/domain'

const FONT_SCRIPT_LABELS: Partial<Record<ScriptFamily, string>> = {
  'latin': 'Latin',
  'cyrillic': 'Cyrillic',
  'greek': 'Greek',
  'middle-eastern': 'Arabic/Hebrew',
  'south-se-asian': 'Indic/SE Asian',
  'cjk': 'CJK',
  'emoji': 'Emoji',
  'symbols-math': 'Symbols',
}

function fontScriptLabel(family: ScriptFamily): string {
  return FONT_SCRIPT_LABELS[family] ?? 'Other'
}

const props = defineProps({
  slug: { type: String, required: true },
  redistributable: { type: Boolean, default: false },
  fontPath: { type: String, default: null },
  coverageFile: { type: String, default: null },
  // When set, auto-select the block with this slug on mount (used by
  // FontBlockCoveragePage to deep-link into a specific block).
  initialBlockSlug: { type: String, default: null },
})

const coverage = ref(null)
const unicodeBlock = ref(null)
const loading = ref(true)
const error = ref(null)
const selectedBlockIdx = ref(0)
const selectedCp = ref(null)
const fontId = ref('')
const fontReady = ref(false)

const { fetchBlock } = useUnicodeBlock()

const blocks = computed(() => coverage.value?.blocks || [])
const currentBlock = computed(() => blocks.value[selectedBlockIdx.value])

const scripts = computed(() => {
  if (!blocks.value.length) return []
  const groups = {}
  for (const b of blocks.value) {
    const label = fontScriptLabel(blockScriptFamily(b.name))
    if (!groups[label]) groups[label] = 0
    groups[label]++
  }
  return Object.entries(groups).sort((a, b) => b[1] - a[1]).map(([k]) => k)
})

const charsWithNames = computed(() => {
  if (!currentBlock.value || !unicodeBlock.value) return []
  const blockData = unicodeBlock.value
  const supportedCps = new Set(
    currentBlock.value.codepoints || rangeToArray(currentBlock.value)
  )
  return blockData.chars
    .filter(c => supportedCps.has(c.cp))
    .map(c => ({
      ...c,
      hex: hexCp(c.cp),
      char: safeChar(c.cp),
    }))
})

const missingChars = computed(() => {
  if (!currentBlock.value || !unicodeBlock.value) return []
  const supportedCps = new Set(
    currentBlock.value.codepoints || rangeToArray(currentBlock.value)
  )
  return unicodeBlock.value.chars
    .filter(c => !supportedCps.has(c.cp))
    .map(c => ({
      ...c,
      hex: hexCp(c.cp),
    }))
})

const detail = computed(() => {
  if (selectedCp.value == null || !unicodeBlock.value) return null
  const ch = unicodeBlock.value.chars.find(c => c.cp === selectedCp.value)
  if (!ch) return null
  return {
    ...ch,
    char: safeChar(ch.cp),
    hex: hexCp(ch.cp),
    html: `&#${ch.cp};`,
    css: '\\' + ch.cp.toString(16).toUpperCase().padStart(4, '0'),
  }
})

function copy(text) {
  navigator.clipboard?.writeText(text)
}

function rangeToArray(block) {
  const out = []
  if (block.start == null || block.end == null) return out
  for (let cp = block.start; cp <= block.end; cp++) out.push(cp)
  return out
}

async function selectBlock(idx) {
  selectedBlockIdx.value = idx
  selectedCp.value = null
  const block = blocks.value[idx]
  if (block) {
    unicodeBlock.value = await fetchBlock(block.name)
  }
}

// Top-level await: runs during SSG so the rendered HTML contains real
// coverage data, not a perpetual "Loading…" placeholder. Font CSS
// injection stays in onMounted because it touches `document` (client-only).
coverage.value = await fetchCoverage(props.coverageFile || props.slug)
if (coverage.value && blocks.value.length > 0) {
  // Deep-link to initialBlockSlug when provided; else default to first block.
  let startIdx = 0
  if (props.initialBlockSlug) {
    const found = blocks.value.findIndex(b => blockSlug(b.name) === props.initialBlockSlug)
    if (found >= 0) startIdx = found
  }
  selectedBlockIdx.value = startIdx
  unicodeBlock.value = await fetchBlock(blocks.value[startIdx].name)
}
loading.value = false

onMounted(async () => {
  if (props.redistributable && props.fontPath) {
    const { fontId: fid, ensureInjected } = injectFontFace(
      props.slug, props.fontPath, props.redistributable
    )
    fontId.value = fid
    fontReady.value = ensureInjected()
  }
})
</script>

<template>
  <section class="fub" v-if="!loading && coverage">
    <!-- Summary -->
    <div class="fub-summary">
      <span class="fub-count">{{ coverage.total_codepoints.toLocaleString() }} codepoints</span>
      <span class="fub-sep">·</span>
      <span class="fub-count">{{ blocks.length }}/{{ coverage.total_blocks }} blocks</span>
      <span class="fub-planes">
        <span v-for="(on, key) in coverage.planes" :key="key" :class="['fub-plane', { on }]">{{ key.toUpperCase() }}</span>
      </span>
      <div class="fub-scripts" v-if="scripts.length">
        <span v-for="(s, i) in scripts" :key="s" class="fub-script">{{ s }}<span v-if="i < scripts.length - 1"> · </span></span>
      </div>
    </div>

    <p v-if="!redistributable" class="fub-notice">
      Glyph previews unavailable — proprietary license. Install via <code>fontist install "{{ slug }}"</code> to see full glyphs locally.
    </p>

    <!-- Block pills -->
    <div class="fub-pills">
      <button
        v-for="(b, i) in blocks"
        :key="b.name"
        :class="['fub-pill', { active: i === selectedBlockIdx }]"
        @click="selectBlock(i)"
      >
        <span class="fub-pill-name">{{ b.name }}</span>
        <span class="fub-pill-count">{{ b.codepoints?.length || b.count || '?' }}</span>
      </button>
    </div>

    <!-- Selected block: flowing characters -->
    <div class="fub-block" v-if="currentBlock">
      <div class="fub-block-head">
        <h3 class="fub-block-title">{{ currentBlock.name }}</h3>
        <span class="fub-block-range">{{ hexCp(currentBlock.start || 0) }}–{{ hexCp(currentBlock.end || 0) }}</span>
        <span class="fub-block-cov">{{ charsWithNames.length }}<span v-if="missingChars.length"> / {{ charsWithNames.length + missingChars.length }}</span> chars</span>
      </div>

      <details v-if="missingChars.length > 0 && redistributable" class="fub-gaps">
        <summary>{{ missingChars.length }} missing characters</summary>
        <span v-for="m in missingChars" :key="m.cp" class="fub-gap">{{ m.hex }} {{ m.n }}</span>
      </details>

      <!-- Characters as flowing inline links (Compart-style) -->
      <div class="fub-chars" v-if="redistributable && fontReady">
        <button
          v-for="ch in charsWithNames"
          :key="ch.cp"
          :class="['fub-char', { active: selectedCp === ch.cp }]"
          :style="{ fontFamily: `'${fontId}', sans-serif` }"
          :title="`${ch.hex} ${ch.n}`"
          @click="selectedCp = ch.cp"
        >
          <span class="fub-glyph">{{ ch.char }}</span>
        </button>
      </div>

      <!-- Proprietary: coverage only -->
      <div class="fub-cov-only" v-else>
        <p>Supports {{ charsWithNames.length }} characters in this block.</p>
        <details v-if="missingChars.length > 0">
          <summary>{{ missingChars.length }} not supported</summary>
          <code v-for="m in missingChars" :key="m.cp" class="fub-gap">{{ m.hex }} {{ m.n }}</code>
        </details>
      </div>

      <!-- Inline character detail (no modal!) -->
      <div class="fub-detail" v-if="detail">
        <span class="fub-detail-glyph" :style="redistributable ? { fontFamily: `'${fontId}', sans-serif` } : {}">{{ detail.char }}</span>
        <div class="fub-detail-info">
          <span class="fub-detail-hex">{{ detail.hex }}</span>
          <span class="fub-detail-name">{{ detail.n }}</span>
          <div class="fub-detail-codes">
            <code @click="copy(detail.html)">HTML {{ detail.html }}</code>
            <code @click="copy(detail.css)">CSS {{ detail.css }}</code>
            <code @click="copy(detail.char)">Copy char</code>
          </div>
        </div>
        <button class="fub-detail-close" @click="selectedCp = null">×</button>
      </div>
    </div>
  </section>

  <p v-else-if="loading" class="fub-status">Loading Unicode coverage…</p>
  <p v-else-if="error" class="fub-status">Coverage data unavailable.</p>
  <p v-else class="fub-status">No coverage data for this font yet.</p>
</template>

<style scoped>
/* All styles migrated to src/styles/main.css (@layer components). */
</style>
