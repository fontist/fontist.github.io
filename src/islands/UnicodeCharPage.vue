<script setup lang="ts">
import { ref, computed, watch } from 'vue'
import {
  loadAllBlocks, loadBlockCharacters, loadCodepointDetail, hexCp, safeChar, categoryName,
  blockDisplayName, blockSlug, PLANES, charRoute, bidiClassName, UNIHAN_CATEGORIES,
  isControlChar, controlAbbrev, controlName, cEscape,
  displayChar, combiningClassName, scriptDisplayName,
} from '../lib/unicode'
import type { UnicodeBlock } from '../lib/unicode'
import type { CodepointDetail } from '../lib/types/domain'
import UnihanCategorySection from '../lib/unicode/components/UnihanCategorySection.vue'

const props = defineProps({
  hex: { type: String, required: true }
})

const hex = props.hex
const cp = computed(() => parseInt(hex, 16))

const allBlocks = ref<UnicodeBlock[]>([])
const charData = ref<any>(null)
const detail = ref<CodepointDetail | null>(null)
const allCharsInBlock = ref<any[]>([])

const block = computed(() => allBlocks.value.find(b => cp.value >= b.start && cp.value <= b.end))
const planeKey = computed(() => block.value?.plane || 'bmp')
const plane = computed(() => PLANES.find(p => p.key === planeKey.value))

const isControl = computed(() => isControlChar(charData.value?.category || '', cp.value))
const abbrev = computed(() => controlAbbrev(cp.value))
const ctrlName = computed(() => controlName(cp.value))
const escapeSeq = computed(() => cEscape(cp.value))
const displayName = computed(() => {
  if (isControl.value && ctrlName.value) {
    return `<${ctrlName.value}>`
  }
  return charData.value?.name || ''
})

const charIndex = computed(() => allCharsInBlock.value.findIndex((c: any) => c.cp === cp.value))
const prevCp = computed(() => charIndex.value > 0 ? allCharsInBlock.value[charIndex.value - 1] : null)
const nextCp = computed(() => charIndex.value >= 0 && charIndex.value < allCharsInBlock.value.length - 1 ? allCharsInBlock.value[charIndex.value + 1] : null)

const utf8 = computed(() => {
  const buf = new TextEncoder().encode(String.fromCodePoint(cp.value))
  return Array.from(buf).map(b => '0x' + b.toString(16).toUpperCase().padStart(2, '0')).join(' ')
})

const utf16 = computed(() => {
  const cpVal = cp.value
  if (cpVal <= 0xFFFF) return '0x' + cpVal.toString(16).toUpperCase().padStart(4, '0')
  const offset = cpVal - 0x10000
  const hi = 0xD800 + (offset >> 10)
  const lo = 0xDC00 + (offset & 0x3FF)
  return '0x' + hi.toString(16).toUpperCase().padStart(4, '0') + ' 0x' + lo.toString(16).toUpperCase().padStart(4, '0')
})

const urlEncoded = computed(() => encodeURIComponent(String.fromCodePoint(cp.value)))

function navigateToCp(targetCp: number) {
  window.location.href = charRoute(targetCp)
}

// Fetch + populate all per-codepoint data for the current route. Called
// once on initial mount (below) and re-called whenever the route's hex
// param changes (vue-router reuses the component instance, so top-level
// await alone would leave refs stale across navigations).
async function loadForCurrentCp() {
  // Reset transient refs so a previous char's data doesn't bleed in
  // when the new codepoint has no per-codepoint JSON to load.
  charData.value = null
  detail.value = null

  const b = block.value
  if (b) {
    allCharsInBlock.value = await loadBlockCharacters(b.name)
    charData.value = allCharsInBlock.value.find((c: any) => c.cp === cp.value)
  }

  // Richer per-codepoint JSON (display props, segmentation, Indic/Hangul/
  // Emoji bundles, full binary_properties list, Unihan). Loads via the
  // shared loader so SSG can pre-render.
  detail.value = await loadCodepointDetail(hex)
}

allBlocks.value = await loadAllBlocks()
await loadForCurrentCp()
watch(hex, () => { loadForCurrentCp() })

</script>

<template>
  <div class="ucp" v-if="charData">
    <!-- Breadcrumb -->
    <nav class="ucp-crumbs">
      <a href="/unicode">Unicode</a>
      <span>›</span>
      <a :href="`/unicode/plane/${planeKey}`">{{ plane?.shortName }}</a>
      <span>›</span>
      <a :href="`/unicode/block/${blockSlug(block.name)}`">{{ blockDisplayName(block.name) }}</a>
      <span>›</span>
      <span class="ucp-crumb-current">{{ hexCp(cp) }}</span>
    </nav>

    <!-- Prev/Next -->
    <div class="ucp-nav">
      <button v-if="prevCp" @click="navigateToCp(prevCp.cp)" class="ucp-nav-btn ucp-prev">
        ← <span class="ucp-nav-glyph" v-if="!isControlChar(prevCp.category || '', prevCp.cp)">{{ displayChar(prevCp.cp, prevCp.category || '') }}</span>
        <span class="ucp-nav-glyph ucp-nav-ctrl" v-else>{{ controlAbbrev(prevCp.cp) }}</span>
        <span class="ucp-nav-hex">{{ hexCp(prevCp.cp) }}</span>
      </button>
      <span v-else class="ucp-nav-spacer"></span>

      <span class="ucp-nav-current">{{ hexCp(cp) }}</span>

      <button v-if="nextCp" @click="navigateToCp(nextCp.cp)" class="ucp-nav-btn ucp-next">
        <span class="ucp-nav-glyph" v-if="!isControlChar(nextCp.category || '', nextCp.cp)">{{ displayChar(nextCp.cp, nextCp.category || '') }}</span>
        <span class="ucp-nav-glyph ucp-nav-ctrl" v-else>{{ controlAbbrev(nextCp.cp) }}</span>
        <span class="ucp-nav-hex">{{ hexCp(nextCp.cp) }}</span> →
      </button>
      <span v-else class="ucp-nav-spacer"></span>
    </div>

    <!-- Large glyph with typographic guide lines -->
    <div class="ucp-glyph-area">
      <div class="ucp-glyph-stage" v-if="!isControl">
        <div class="ucp-guides">
          <span class="ucp-guide ucp-guide--cap" title="Cap height"></span>
          <span class="ucp-guide ucp-guide--xheight" title="x-height"></span>
          <span class="ucp-guide ucp-guide--baseline" title="Baseline"></span>
        </div>
        <span class="ucp-glyph">{{ displayChar(cp, charData.category) }}</span>
      </div>
      <span v-else class="ucp-control-box">{{ abbrev }}</span>
    </div>

    <!-- Name + codepoint -->
    <h1 class="ucp-name">
      {{ displayName }}
      <span class="ucp-name-abbrev" v-if="isControl && abbrev">({{ abbrev }})</span>
    </h1>
    <code class="ucp-hex">{{ hexCp(cp) }}</code>

    <!-- Metadata grid -->
    <div class="ucp-sections">
      <!-- Classification -->
      <section class="ucp-section">
        <h2>Classification</h2>
        <dl>
          <dt v-if="block?.unicodeVersion">Unicode Version</dt>
          <dd v-if="block?.unicodeVersion">{{ block.unicodeVersion }}</dd>
          <dt>Category</dt>
          <dd><a :href="`/unicode/category/${charData.category}`">{{ categoryName(charData.category) }}</a> <code>{{ charData.category }}</code></dd>
          <dt>Script</dt>
          <dd><a :href="`/unicode/scripts/${charData.script}`">{{ scriptDisplayName(charData.script) }}</a></dd>
          <dt>Block</dt>
          <dd><a :href="`/unicode/block/${blockSlug(block.name)}`">{{ blockDisplayName(block.name) }}</a></dd>
          <dt>Plane</dt>
          <dd><a :href="`/unicode/plane/${planeKey}`">{{ plane?.name }} ({{ plane?.shortName }})</a></dd>
          <dt v-if="charData.bidiClass">Bidirectional</dt>
          <dd v-if="charData.bidiClass"><a :href="`/unicode/bidiclass/${charData.bidiClass}`">{{ bidiClassName(charData.bidiClass) }}</a> <code>{{ charData.bidiClass }}</code></dd>
          <dt>Combining Class</dt>
          <dd><a :href="`/unicode/combining/${charData.combiningClass || 0}`">{{ combiningClassName(charData.combiningClass || 0) }}</a> <code>{{ charData.combiningClass || 0 }}</code></dd>
          <dt v-if="charData.mirrored">Mirrored</dt>
          <dd v-if="charData.mirrored">Yes</dd>
          <dt v-if="escapeSeq">Escape Sequence</dt>
          <dd v-if="escapeSeq"><code>{{ escapeSeq }}</code></dd>
        </dl>
      </section>

      <!-- Encodings -->
      <section class="ucp-section">
        <h2>Encodings</h2>
        <dl>
          <dt>HTML Decimal</dt>
          <dd><code @click="navigator.clipboard.writeText(`&#${cp};`)">&amp;#{{ cp }};</code></dd>
          <dt>HTML Hex</dt>
          <dd><code @click="navigator.clipboard.writeText(`&#x${hex};`)">&amp;#x{{ hex }};</code></dd>
          <dt>CSS Escape</dt>
          <dd><code @click="navigator.clipboard.writeText(`\\${hex}`)">\{{ hex }}</code></dd>
          <dt>JavaScript</dt>
          <dd><code @click="navigator.clipboard.writeText(`\\u${hex}`)">\u{{ hex }}</code></dd>
          <dt>URL Encoded</dt>
          <dd><code>{{ urlEncoded }}</code></dd>
          <dt>UTF-8</dt>
          <dd><code>{{ utf8 }}</code></dd>
          <dt>UTF-16</dt>
          <dd><code>{{ utf16 }}</code></dd>
          <dt>UTF-32</dt>
          <dd><code>0x{{ cp.toString(16).toUpperCase().padStart(8, '0') }}</code></dd>
        </dl>
      </section>

      <!-- Case mappings -->
      <section class="ucp-section" v-if="charData.simpleUppercase || charData.simpleLowercase || charData.simpleTitlecase">
        <h2>Case Mappings</h2>
        <dl>
          <template v-if="charData.simpleUppercase">
            <dt>Uppercase</dt>
            <dd>
              <a :href="charRoute(charData.simpleUppercase)">
                {{ safeChar(parseInt(charData.simpleUppercase, 16)) }} {{ hexCp(parseInt(charData.simpleUppercase, 16)) }}
              </a>
            </dd>
          </template>
          <template v-if="charData.simpleLowercase">
            <dt>Lowercase</dt>
            <dd>
              <a :href="charRoute(charData.simpleLowercase)">
                {{ safeChar(parseInt(charData.simpleLowercase, 16)) }} {{ hexCp(parseInt(charData.simpleLowercase, 16)) }}
              </a>
            </dd>
          </template>
          <template v-if="charData.simpleTitlecase">
            <dt>Title Case</dt>
            <dd>
              <a :href="charRoute(charData.simpleTitlecase)">
                {{ safeChar(parseInt(charData.simpleTitlecase, 16)) }} {{ hexCp(parseInt(charData.simpleTitlecase, 16)) }}
              </a>
            </dd>
          </template>
        </dl>
      </section>

      <!-- Decomposition -->
      <section class="ucp-section" v-if="charData.decomposition">
        <h2>Decomposition</h2>
        <dl>
          <dt>Decomposes To</dt>
          <dd>
            <template v-for="(part, i) in charData.decomposition.split(' ')" :key="i">
              <a v-if="part.match(/^[0-9A-Fa-f]+$/)" :href="charRoute(part)">
                {{ safeChar(parseInt(part, 16)) }}
              </a>
              <code v-else>{{ part }}</code>
              <span v-if="i < charData.decomposition.split(' ').length - 1"> </span>
            </template>
          </dd>
        </dl>
      </section>

      <!-- Display properties (from per-codepoint JSON) -->
      <section class="ucp-section" v-if="detail?.display">
        <h2>Display</h2>
        <dl>
          <dt v-if="detail.display.east_asian_width">East Asian Width</dt>
          <dd v-if="detail.display.east_asian_width"><code>{{ detail.display.east_asian_width }}</code></dd>
          <dt v-if="detail.display.line_break_class">Line Break Class</dt>
          <dd v-if="detail.display.line_break_class"><code>{{ detail.display.line_break_class }}</code></dd>
          <dt v-if="detail.display.vertical_orientation">Vertical Orientation</dt>
          <dd v-if="detail.display.vertical_orientation"><code>{{ detail.display.vertical_orientation }}</code></dd>
        </dl>
      </section>

      <!-- Segmentation (UAX #29) -->
      <section class="ucp-section" v-if="detail?.break_segmentation">
        <h2>Segmentation</h2>
        <dl>
          <dt v-if="detail.break_segmentation.grapheme">Grapheme Cluster</dt>
          <dd v-if="detail.break_segmentation.grapheme"><code>{{ detail.break_segmentation.grapheme }}</code></dd>
          <dt v-if="detail.break_segmentation.word">Word Boundary</dt>
          <dd v-if="detail.break_segmentation.word"><code>{{ detail.break_segmentation.word }}</code></dd>
          <dt v-if="detail.break_segmentation.sentence">Sentence Boundary</dt>
          <dd v-if="detail.break_segmentation.sentence"><code>{{ detail.break_segmentation.sentence }}</code></dd>
        </dl>
      </section>

      <!-- Indic shaping (Brahmic scripts) -->
      <section class="ucp-section" v-if="detail?.indic && (detail.indic.positional_category || detail.indic.syllabic_category)">
        <h2>Indic Shaping</h2>
        <dl>
          <dt v-if="detail.indic.positional_category">Positional Category</dt>
          <dd v-if="detail.indic.positional_category"><code>{{ detail.indic.positional_category }}</code></dd>
          <dt v-if="detail.indic.syllabic_category">Syllabic Category</dt>
          <dd v-if="detail.indic.syllabic_category"><code>{{ detail.indic.syllabic_category }}</code></dd>
        </dl>
      </section>

      <!-- Hangul syllable metadata -->
      <section class="ucp-section" v-if="detail?.hangul && detail.hangul.type && detail.hangul.type !== 'NA'">
        <h2>Hangul</h2>
        <dl>
          <dt>Syllable Type</dt>
          <dd><code>{{ detail.hangul.type }}</code></dd>
          <dt v-if="detail.hangul.jamo_short_name">Jamo Short Name</dt>
          <dd v-if="detail.hangul.jamo_short_name">{{ detail.hangul.jamo_short_name }}</dd>
        </dl>
      </section>

      <!-- Emoji properties -->
      <section class="ucp-section" v-if="detail?.emoji && (detail.emoji.is_emoji || detail.emoji.is_extended_pictographic)">
        <h2>Emoji</h2>
        <dl>
          <dt v-if="detail.emoji.is_emoji">Emoji</dt>
          <dd v-if="detail.emoji.is_emoji">Yes</dd>
          <dt v-if="detail.emoji.is_presentation_default">Default Presentation</dt>
          <dd v-if="detail.emoji.is_presentation_default">Emoji</dd>
          <dt v-if="detail.emoji.is_modifier">Modifier</dt>
          <dd v-if="detail.emoji.is_modifier">Yes</dd>
          <dt v-if="detail.emoji.is_base">Modifier Base</dt>
          <dd v-if="detail.emoji.is_base">Yes</dd>
          <dt v-if="detail.emoji.is_component">Component</dt>
          <dd v-if="detail.emoji.is_component">Yes</dd>
          <dt v-if="detail.emoji.is_extended_pictographic">Extended Pictographic</dt>
          <dd v-if="detail.emoji.is_extended_pictographic">Yes</dd>
        </dl>
      </section>

      <!-- Binary properties -->
      <section class="ucp-section" v-if="detail?.binary_properties && detail.binary_properties.length > 0">
        <h2>Binary Properties</h2>
        <div class="ucp-prop-list">
          <code v-for="prop in detail.binary_properties" :key="prop" class="ucp-prop-tag">{{ prop }}</code>
        </div>
      </section>

      <!-- Unihan dictionary data (CJK) — categorized via UNIHAN_CATEGORIES
           registry (constants.ts). Adding a new category = one line in the
           registry. -->
      <template v-if="detail?.unihan">
        <UnihanCategorySection
          v-for="spec in UNIHAN_CATEGORIES"
          :key="spec.key"
          :heading="spec.heading"
          :fields="detail.unihan[spec.key]"
          :render="spec.render"
          :self-cp="cp"
        />
      </template>
    </div>
  </div>

  <div v-else class="ucp-notfound">
    Character U+{{ hex }} not found.
    <a href="/unicode">← Browse Unicode</a>
  </div>
</template>

<style scoped>
/* All styles migrated to src/styles/main.css (@layer components). */
</style>
