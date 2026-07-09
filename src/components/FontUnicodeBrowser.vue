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
.fub { font-family: var(--vp-font-family-base, system-ui, sans-serif); }
.fub-status { color: var(--vp-c-text-3); font-style: italic; font-size: 0.9rem; }

/* Summary */
.fub-summary { margin-bottom: 1rem; }
.fub-count { font-size: 0.9rem; color: var(--vp-c-text-1); font-weight: 500; }
.fub-sep { color: var(--vp-c-text-3); margin: 0 0.3rem; }
.fub-planes { display: inline-flex; gap: 0.2rem; margin-left: 0.5rem; }
.fub-plane {
  font-size: 0.65rem; font-family: var(--vp-font-family-mono, monospace);
  padding: 0.05rem 0.3rem; border-radius: 2px;
  background: var(--vp-c-bg-alt); color: var(--vp-c-text-3);
}
.fub-plane.on { background: var(--fontist-rose, #bf4e6a); color: #fff; }
.fub-scripts { margin-top: 0.3rem; font-size: 0.75rem; color: var(--vp-c-text-2); }
.fub-script { font-weight: 500; }

.fub-notice {
  font-size: 0.8rem; color: var(--vp-c-text-3);
  padding: 0.5rem 0.75rem; margin: 0 0 1rem 0;
  border-left: 3px solid var(--fontist-rose, #bf4e6a);
  background: var(--vp-c-bg-soft);
}
.fub-notice code { font-family: var(--vp-font-family-mono, monospace); font-size: 0.75rem; background: var(--vp-c-bg); padding: 0.1em 0.3em; border-radius: 2px; }

/* Block pills */
.fub-pills {
  display: flex; flex-wrap: wrap; gap: 0.3rem;
  margin-bottom: 1rem;
}
.fub-pill {
  display: inline-flex; align-items: center; gap: 0.35rem;
  padding: 0.25rem 0.6rem;
  font-size: 0.75rem;
  background: var(--vp-c-bg-soft); color: var(--vp-c-text-2);
  border: 1px solid var(--vp-c-divider); border-radius: 12px;
  cursor: pointer; transition: all 0.15s;
}
.fub-pill:hover { border-color: var(--fontist-rose, #bf4e6a); color: var(--vp-c-text-1); }
.fub-pill.active {
  background: var(--fontist-rose, #bf4e6a); color: #fff;
  border-color: var(--fontist-rose, #bf4e6a);
}
.fub-pill-count {
  font-family: var(--vp-font-family-mono, monospace); font-size: 0.65rem; opacity: 0.7;
}

/* Block header */
.fub-block-head {
  display: flex; align-items: baseline; gap: 0.75rem;
  padding-bottom: 0.4rem; border-bottom: 1px solid var(--vp-c-divider);
  margin-bottom: 0.5rem;
}
.fub-block-title { font-size: 1.1rem; font-weight: 600; margin: 0; color: var(--vp-c-text-1); }
.fub-block-range { font-size: 0.7rem; font-family: var(--vp-font-family-mono, monospace); color: var(--vp-c-text-3); }
.fub-block-cov { font-size: 0.7rem; color: var(--vp-c-text-2); margin-left: auto; }

/* Gaps */
.fub-gaps { margin-bottom: 0.5rem; font-size: 0.75rem; }
.fub-gaps summary { cursor: pointer; color: var(--vp-c-text-3); }
.fub-gap {
  display: inline-block; margin: 0.15rem 0.3rem 0.15rem 0;
  font-family: var(--vp-font-family-mono, monospace); font-size: 0.7rem;
  color: var(--vp-c-text-3);
}

/* Characters — flowing inline (Compart-style, NOT grid) */
.fub-chars {
  display: flex; flex-wrap: wrap; gap: 0;
  line-height: 2.2;
}
.fub-char {
  display: inline-flex; align-items: center; justify-content: center;
  min-width: 2rem; height: 2rem; padding: 0 0.2rem;
  background: transparent; border: none; border-radius: 3px;
  cursor: pointer; transition: background 0.08s;
}
.fub-char:hover { background: var(--vp-c-bg-soft); }
.fub-char.active { background: var(--fontist-rose, #bf4e6a); }
.fub-char.active .fub-glyph { color: #fff; }
.fub-glyph { font-size: 1.4rem; line-height: 1; color: var(--vp-c-text-1); }

/* Proprietary coverage-only */
.fub-cov-only p { font-size: 0.85rem; color: var(--vp-c-text-2); margin: 0.5rem 0; }
.fub-cov-only details { margin-top: 0.3rem; }
.fub-cov-only summary { cursor: pointer; font-size: 0.75rem; color: var(--vp-c-text-3); }

/* Inline detail (no modal) */
.fub-detail {
  display: flex; align-items: center; gap: 1rem;
  margin-top: 0.75rem; padding: 0.6rem 0.8rem;
  background: var(--vp-c-bg-soft); border-radius: 4px;
  border-left: 3px solid var(--fontist-rose, #bf4e6a);
}
.fub-detail-glyph { font-size: 2.5rem; line-height: 1; color: var(--vp-c-text-1); }
.fub-detail-info { flex: 1; display: flex; flex-wrap: wrap; gap: 0.3rem 0.75rem; align-items: center; }
.fub-detail-hex { font-family: var(--vp-font-family-mono, monospace); font-size: 0.8rem; font-weight: 600; color: var(--vp-c-text-1); }
.fub-detail-name { font-size: 0.8rem; color: var(--vp-c-text-2); }
.fub-detail-codes { display: flex; gap: 0.4rem; }
.fub-detail-codes code {
  font-size: 0.7rem; font-family: var(--vp-font-family-mono, monospace);
  background: var(--vp-c-bg); padding: 0.15rem 0.35rem; border-radius: 2px;
  color: var(--vp-c-text-3); cursor: pointer; transition: color 0.1s;
}
.fub-detail-codes code:hover { color: var(--fontist-rose, #bf4e6a); }
.fub-detail-close {
  width: 24px; height: 24px; border: none; background: transparent;
  font-size: 1.1rem; cursor: pointer; color: var(--vp-c-text-3); border-radius: 3px;
}
.fub-detail-close:hover { background: var(--vp-c-bg); }

@media (max-width: 640px) {
  .fub-glyph { font-size: 1.1rem; }
  .fub-detail { flex-wrap: wrap; }
  .fub-block-head { flex-wrap: wrap; }
}
</style>
