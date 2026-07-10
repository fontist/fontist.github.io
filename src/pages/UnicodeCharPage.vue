<script setup lang="ts">
import { ref, computed, watch } from 'vue'
import { useRoute, useRouter, RouterLink } from 'vue-router'
import { useHead } from '@unhead/vue'
import {
  loadAllBlocks, loadBlockCharacters, loadCodepointDetail, hexCp, safeChar, categoryName,
  blockDisplayName, blockSlug, PLANES, charRoute, bidiClassName, UNIHAN_CATEGORIES,
  isControlChar, controlAbbrev, controlName, cEscape,
  displayChar, combiningClassName, scriptDisplayName,
} from '../lib/unicode'
import type { UnicodeBlock } from '../lib/unicode'
import type { CodepointDetail } from '../lib/types/domain'
import UnihanCategorySection from '../lib/unicode/components/UnihanCategorySection.vue'

const route = useRoute()
const router = useRouter()
const hex = computed(() => route.params.hex as string)
const cp = computed(() => parseInt(hex.value, 16))

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
  router.push(charRoute(targetCp))
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
  detail.value = await loadCodepointDetail(hex.value)
}

allBlocks.value = await loadAllBlocks()
await loadForCurrentCp()
watch(hex, () => { loadForCurrentCp() })

useHead(() => ({
  title: charData.value?.name
    ? `U+${hex.value.toUpperCase()} ${charData.value.name} — Unicode Character`
    : `U+${hex.value.toUpperCase()} — Unicode Character`,
  meta: [
    { property: 'og:title', content: `U+${hex.value.toUpperCase()}${charData.value?.name ? ' ' + charData.value.name : ''}` },
    { property: 'og:type', content: 'website' },
  ],
  link: [
    { rel: 'canonical', href: `https://www.fontist.org/unicode/char/${hex.value}` },
  ],
}))
</script>

<template>
  <div class="ucp" v-if="charData">
    <!-- Breadcrumb -->
    <nav class="ucp-crumbs">
      <RouterLink to="/unicode">Unicode</RouterLink>
      <span>›</span>
      <RouterLink :to="`/unicode/plane/${planeKey}`">{{ plane?.shortName }}</RouterLink>
      <span>›</span>
      <RouterLink :to="`/unicode/block/${blockSlug(block.name)}`">{{ blockDisplayName(block.name) }}</RouterLink>
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
          <dd><RouterLink :to="`/unicode/category/${charData.category}`">{{ categoryName(charData.category) }}</RouterLink> <code>{{ charData.category }}</code></dd>
          <dt>Script</dt>
          <dd><RouterLink :to="`/unicode/scripts/${charData.script}`">{{ scriptDisplayName(charData.script) }}</RouterLink></dd>
          <dt>Block</dt>
          <dd><RouterLink :to="`/unicode/block/${blockSlug(block.name)}`">{{ blockDisplayName(block.name) }}</RouterLink></dd>
          <dt>Plane</dt>
          <dd><RouterLink :to="`/unicode/plane/${planeKey}`">{{ plane?.name }} ({{ plane?.shortName }})</RouterLink></dd>
          <dt v-if="charData.bidiClass">Bidirectional</dt>
          <dd v-if="charData.bidiClass"><RouterLink :to="`/unicode/bidiclass/${charData.bidiClass}`">{{ bidiClassName(charData.bidiClass) }}</RouterLink> <code>{{ charData.bidiClass }}</code></dd>
          <dt>Combining Class</dt>
          <dd><RouterLink :to="`/unicode/combining/${charData.combiningClass || 0}`">{{ combiningClassName(charData.combiningClass || 0) }}</RouterLink> <code>{{ charData.combiningClass || 0 }}</code></dd>
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
              <RouterLink :to="charRoute(charData.simpleUppercase)">
                {{ safeChar(parseInt(charData.simpleUppercase, 16)) }} {{ hexCp(parseInt(charData.simpleUppercase, 16)) }}
              </RouterLink>
            </dd>
          </template>
          <template v-if="charData.simpleLowercase">
            <dt>Lowercase</dt>
            <dd>
              <RouterLink :to="charRoute(charData.simpleLowercase)">
                {{ safeChar(parseInt(charData.simpleLowercase, 16)) }} {{ hexCp(parseInt(charData.simpleLowercase, 16)) }}
              </RouterLink>
            </dd>
          </template>
          <template v-if="charData.simpleTitlecase">
            <dt>Title Case</dt>
            <dd>
              <RouterLink :to="charRoute(charData.simpleTitlecase)">
                {{ safeChar(parseInt(charData.simpleTitlecase, 16)) }} {{ hexCp(parseInt(charData.simpleTitlecase, 16)) }}
              </RouterLink>
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
              <RouterLink v-if="part.match(/^[0-9A-Fa-f]+$/)" :to="charRoute(part)">
                {{ safeChar(parseInt(part, 16)) }}
              </RouterLink>
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
    <RouterLink to="/unicode">← Browse Unicode</RouterLink>
  </div>
</template>

<style scoped>
.ucp { max-width: 900px; margin: 0 auto; padding: 1.5rem; }

.ucp-crumbs { display: flex; align-items: center; gap: 0.5rem; font-size: 0.8rem; margin-bottom: 1rem; flex-wrap: wrap; }
.ucp-crumbs a { color: var(--fontist-rose, #bf4e6a); text-decoration: none; }
.ucp-crumbs span { color: var(--color-mute); }
.ucp-crumb-current { color: var(--color-ink); font-weight: 500; }

.ucp-nav { display: flex; align-items: center; justify-content: space-between; gap: 1rem; margin-bottom: 1.5rem; }
.ucp-nav-btn { display: flex; align-items: center; gap: 0.5rem; padding: 0.5rem 1rem; border: 1px solid var(--spec-rule); border-radius: 8px; background: var(--color-paper); color: var(--color-ink); cursor: pointer; transition: border-color 0.15s, background 0.15s, color 0.15s; }
.ucp-nav-btn:hover { border-color: var(--spec-rose, #b8475f); background: var(--color-paper-deep); color: var(--spec-rose, #b8475f); }
html.dark .ucp-nav-btn { background: var(--color-paper); color: var(--color-ink); }
html.dark .ucp-nav-btn:hover { border-color: var(--spec-rose, #d4718a); background: var(--color-paper-deep); color: var(--spec-rose, #d4718a); }
.ucp-nav-glyph { font-size: 1.5rem; }
.ucp-nav-hex { font-size: 0.7rem; font-family: monospace; color: var(--color-mute); }
.ucp-nav-current { font-size: 0.85rem; font-family: monospace; color: var(--color-mute); }
.ucp-nav-spacer { width: 80px; }

.ucp-prop-list { display: flex; flex-wrap: wrap; gap: 0.4rem; }
.ucp-prop-tag { display: inline-block; padding: 0.2rem 0.5rem; background: var(--color-paper-deep); border: 1px solid var(--spec-rule); border-radius: 6px; font-size: 0.78rem; }

.ucp-glyph-area { display: flex; align-items: center; justify-content: center; padding: 3rem 1rem 2rem; background: var(--color-paper-deep); border-radius: 12px; margin-bottom: 1.5rem; }
.ucp-glyph-stage {
  position: relative;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  min-height: 8rem;
  padding: 0.5rem 3rem;
}
.ucp-guides {
  position: absolute;
  inset: 0;
  pointer-events: none;
}
.ucp-guide {
  position: absolute;
  left: 0;
  right: 0;
  height: 0;
}
.ucp-guide--cap {
  top: 12%;
  border-top: 1px dashed rgba(0, 0, 0, 0.18);
}
.ucp-guide--xheight {
  top: 32%;
  border-top: 1px dashed rgba(0, 0, 0, 0.14);
}
.ucp-guide--baseline {
  bottom: 18%;
  border-top: 2px solid rgba(191, 78, 106, 0.40);
}
.ucp-glyph {
  position: relative;
  z-index: 1;
  font-family: 'Essenfont', 'Spectral', serif;
  font-size: 6rem;
  line-height: 1;
  color: var(--spec-ink);
}
.ucp-control-box {
  font-family: var(--font-mono);
  font-size: 2.5rem;
  font-weight: 700;
  letter-spacing: 0.04em;
  color: var(--color-mute);
  padding: 1rem 2rem;
  border: 2px dashed var(--color-mute);
  border-radius: 8px;
  background: var(--color-paper);
}

.ucp-name { font-size: 1.5rem; font-weight: 600; margin: 0 0 0.3rem; color: var(--color-ink); }
.ucp-name-abbrev { font-size: 1rem; font-weight: 500; font-family: var(--font-mono); color: var(--color-mute); margin-left: 0.5rem; }
.ucp-hex { font-family: monospace; font-size: 1.1rem; color: var(--fontist-rose, #bf4e6a); }

.ucp-nav-ctrl {
  font-family: var(--font-mono);
  font-size: 0.8rem !important;
  font-weight: 700;
  padding: 0.2rem 0.4rem;
  border: 1px dashed var(--color-mute);
  border-radius: 3px;
  color: var(--color-mute);
}

.ucp-sections { display: grid; grid-template-columns: repeat(auto-fill, minmax(300px, 1fr)); gap: 1.5rem; margin-top: 2rem; }
.ucp-section h2 { font-size: 0.8rem; font-weight: 700; text-transform: uppercase; letter-spacing: 0.08em; color: var(--fontist-rose, #bf4e6a); margin: 0 0 0.75rem; padding-bottom: 0.4rem; border-bottom: 1px solid var(--spec-rule); }
.ucp-section dl { display: grid; grid-template-columns: auto 1fr; gap: 0.4rem 1rem; margin: 0; }
.ucp-section dt { font-size: 0.75rem; font-weight: 600; color: var(--color-mute); white-space: nowrap; }
.ucp-section dd { margin: 0; font-size: 0.85rem; color: var(--color-ink); }
.ucp-section dd a { color: var(--fontist-rose, #bf4e6a); text-decoration: none; }
.ucp-section dd code { font-family: monospace; font-size: 0.75rem; cursor: pointer; background: var(--color-paper-deep); padding: 0.1rem 0.3rem; border-radius: 3px; }
.ucp-section dd code:hover { color: var(--fontist-rose, #bf4e6a); }

.ucp-notfound { display: flex; align-items: center; justify-content: center; flex-direction: column; gap: 0.5rem; height: 60vh; color: var(--color-mute); }
</style>
