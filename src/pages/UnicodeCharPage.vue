<script setup lang="ts">
import { ref, computed } from 'vue'
import { useRoute, useRouter, RouterLink } from 'vue-router'
import { useHead } from '@unhead/vue'
import {
  loadAllBlocks, loadBlockCharacters, hexCp, safeChar, categoryName,
  blockDisplayName, blockSlug, PLANES,
  isControlChar, controlAbbrev, controlName, cEscape,
  displayChar, combiningClassName, scriptDisplayName,
} from '../lib/unicode'
import type { UnicodeBlock } from '../lib/unicode'

const route = useRoute()
const router = useRouter()
const hex = computed(() => route.params.hex as string)
const cp = computed(() => parseInt(hex.value, 16))

const allBlocks = ref<UnicodeBlock[]>([])
const charData = ref<any>(null)
const allCharsInBlock = ref<any[]>([])

const block = computed(() => allBlocks.value.find(b => cp.value >= b.start && cp.value <= b.end))
const planeKey = computed(() => block.value?.plane || 'bmp')
const plane = computed(() => PLANES.find(p => p.key === planeKey.value))

const isControl = computed(() => isControlChar(charData.value?.c || '', cp.value))
const abbrev = computed(() => controlAbbrev(cp.value))
const ctrlName = computed(() => controlName(cp.value))
const escapeSeq = computed(() => cEscape(cp.value))
const displayName = computed(() => {
  if (isControl.value && ctrlName.value) {
    return `<${ctrlName.value}>`
  }
  return charData.value?.n || ''
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

const bidiNames: Record<string, string> = {
  L: 'Left-to-Right', R: 'Right-to-Left', AL: 'Right-to-Left Arabic',
  EN: 'European Number', ES: 'European Separator', ET: 'European Terminator',
  AN: 'Arabic Number', CS: 'Common Separator', NSM: 'Nonspacing Mark',
  BN: 'Boundary Neutral', B: 'Paragraph Separator', S: 'Segment Separator',
  WS: 'Whitespace', ON: 'Other Neutral',
  LRE: 'L-to-R Embedding', LRO: 'L-to-R Override', RLE: 'R-to-L Embedding',
  RLO: 'R-to-L Override', PDF: 'Pop Directional Format', LRI: 'L-to-R Isolate',
  RLI: 'R-to-L Isolate', FSI: 'First Strong Isolate', PDI: 'Pop Directional Isolate',
}

function navigateToCp(targetCp: number) {
  const h = targetCp.toString(16).toUpperCase().padStart(4, '0')
  router.push(`/unicode/char/${h}`)
}

allBlocks.value = await loadAllBlocks()
const b = block.value
if (b) {
  allCharsInBlock.value = await loadBlockCharacters(b.name)
  charData.value = allCharsInBlock.value.find((c: any) => c.cp === cp.value)
}

useHead(() => ({
  title: charData.value?.n
    ? `U+${hex.value.toUpperCase()} ${charData.value.n} — Unicode Character`
    : `U+${hex.value.toUpperCase()} — Unicode Character`,
  meta: [
    { property: 'og:title', content: `U+${hex.value.toUpperCase()}${charData.value?.n ? ' ' + charData.value.n : ''}` },
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
        ← <span class="ucp-nav-glyph" v-if="!isControlChar(prevCp.c || '', prevCp.cp)">{{ displayChar(prevCp.cp, prevCp.c || '') }}</span>
        <span class="ucp-nav-glyph ucp-nav-ctrl" v-else>{{ controlAbbrev(prevCp.cp) }}</span>
        <span class="ucp-nav-hex">{{ hexCp(prevCp.cp) }}</span>
      </button>
      <span v-else class="ucp-nav-spacer"></span>

      <span class="ucp-nav-current">{{ hexCp(cp) }}</span>

      <button v-if="nextCp" @click="navigateToCp(nextCp.cp)" class="ucp-nav-btn ucp-next">
        <span class="ucp-nav-glyph" v-if="!isControlChar(nextCp.c || '', nextCp.cp)">{{ displayChar(nextCp.cp, nextCp.c || '') }}</span>
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
        <span class="ucp-glyph">{{ displayChar(cp, charData.c) }}</span>
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
          <dd><RouterLink :to="`/unicode/category/${charData.c}`">{{ categoryName(charData.c) }}</RouterLink> <code>{{ charData.c }}</code></dd>
          <dt>Script</dt>
          <dd><RouterLink :to="`/unicode/scripts/${charData.s}`">{{ scriptDisplayName(charData.s) }}</RouterLink></dd>
          <dt>Block</dt>
          <dd><RouterLink :to="`/unicode/block/${blockSlug(block.name)}`">{{ blockDisplayName(block.name) }}</RouterLink></dd>
          <dt>Plane</dt>
          <dd><RouterLink :to="`/unicode/plane/${planeKey}`">{{ plane?.name }} ({{ plane?.shortName }})</RouterLink></dd>
          <dt v-if="charData.bc">Bidirectional</dt>
          <dd v-if="charData.bc"><RouterLink :to="`/unicode/bidiclass/${charData.bc}`">{{ bidiNames[charData.bc] || charData.bc }}</RouterLink> <code>{{ charData.bc }}</code></dd>
          <dt>Combining Class</dt>
          <dd><RouterLink :to="`/unicode/combining/${charData.cc || 0}`">{{ combiningClassName(charData.cc || 0) }}</RouterLink> <code>{{ charData.cc || 0 }}</code></dd>
          <dt v-if="charData.mir">Mirrored</dt>
          <dd v-if="charData.mir">Yes</dd>
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
      <section class="ucp-section" v-if="charData.up || charData.lo || charData.ti">
        <h2>Case Mappings</h2>
        <dl>
          <template v-if="charData.up">
            <dt>Uppercase</dt>
            <dd>
              <RouterLink :to="`/unicode/char/${charData.up.toUpperCase().padStart(4,'0')}`">
                {{ safeChar(parseInt(charData.up, 16)) }} {{ hexCp(parseInt(charData.up, 16)) }}
              </RouterLink>
            </dd>
          </template>
          <template v-if="charData.lo">
            <dt>Lowercase</dt>
            <dd>
              <RouterLink :to="`/unicode/char/${charData.lo.toUpperCase().padStart(4,'0')}`">
                {{ safeChar(parseInt(charData.lo, 16)) }} {{ hexCp(parseInt(charData.lo, 16)) }}
              </RouterLink>
            </dd>
          </template>
          <template v-if="charData.ti">
            <dt>Title Case</dt>
            <dd>
              <RouterLink :to="`/unicode/char/${charData.ti.toUpperCase().padStart(4,'0')}`">
                {{ safeChar(parseInt(charData.ti, 16)) }} {{ hexCp(parseInt(charData.ti, 16)) }}
              </RouterLink>
            </dd>
          </template>
        </dl>
      </section>

      <!-- Decomposition -->
      <section class="ucp-section" v-if="charData.dm">
        <h2>Decomposition</h2>
        <dl>
          <dt>Decomposes To</dt>
          <dd>
            <template v-for="(part, i) in charData.dm.split(' ')" :key="i">
              <RouterLink v-if="part.match(/^[0-9A-Fa-f]+$/)" :to="`/unicode/char/${part.toUpperCase().padStart(4,'0')}`">
                {{ safeChar(parseInt(part, 16)) }}
              </RouterLink>
              <code v-else>{{ part }}</code>
              <span v-if="i < charData.dm.split(' ').length - 1"> </span>
            </template>
          </dd>
        </dl>
      </section>
    </div>
  </div>

  <div v-else-if="!loading" class="ucp-notfound">
    Character U+{{ hex }} not found.
    <RouterLink to="/unicode">← Browse Unicode</RouterLink>
  </div>
  <div v-else class="ucp-loading">Loading…</div>
</template>

<style scoped>
.ucp { max-width: 900px; margin: 0 auto; padding: 1.5rem; }

.ucp-crumbs { display: flex; align-items: center; gap: 0.5rem; font-size: 0.8rem; margin-bottom: 1rem; flex-wrap: wrap; }
.ucp-crumbs a { color: var(--fontist-rose, #bf4e6a); text-decoration: none; }
.ucp-crumbs span { color: var(--vp-c-text-3, #888); }
.ucp-crumb-current { color: var(--vp-c-text-1, #333); font-weight: 500; }

.ucp-nav { display: flex; align-items: center; justify-content: space-between; gap: 1rem; margin-bottom: 1.5rem; }
.ucp-nav-btn { display: flex; align-items: center; gap: 0.5rem; padding: 0.5rem 1rem; border: 1px solid var(--vp-c-divider, #e2e2e3); border-radius: 8px; background: var(--vp-c-bg, #fff); color: var(--vp-c-text-1, #1c1a18); cursor: pointer; transition: border-color 0.15s, background 0.15s, color 0.15s; }
.ucp-nav-btn:hover { border-color: var(--spec-rose, #b8475f); background: var(--vp-c-bg-soft, #f8f7f4); color: var(--spec-rose, #b8475f); }
html.dark .ucp-nav-btn { background: var(--vp-c-bg, #161513); color: var(--vp-c-text-1, #ecdfd0); }
html.dark .ucp-nav-btn:hover { border-color: var(--spec-rose, #d4718a); background: var(--vp-c-bg-soft, #211f1c); color: var(--spec-rose, #d4718a); }
.ucp-nav-glyph { font-size: 1.5rem; }
.ucp-nav-hex { font-size: 0.7rem; font-family: monospace; color: var(--vp-c-text-3, #888); }
.ucp-nav-current { font-size: 0.85rem; font-family: monospace; color: var(--vp-c-text-3, #888); }
.ucp-nav-spacer { width: 80px; }

.ucp-glyph-area { display: flex; align-items: center; justify-content: center; padding: 3rem 1rem 2rem; background: var(--vp-c-bg-soft, #f8f7f4); border-radius: 12px; margin-bottom: 1.5rem; }
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
  font-size: 6rem;
  line-height: 1;
  color: var(--vp-c-text-1, #333);
}
.ucp-control-box {
  font-family: var(--vp-font-family-mono, monospace);
  font-size: 2.5rem;
  font-weight: 700;
  letter-spacing: 0.04em;
  color: var(--vp-c-text-3, #888);
  padding: 1rem 2rem;
  border: 2px dashed var(--vp-c-text-3, #aaa);
  border-radius: 8px;
  background: var(--vp-c-bg, #fff);
}

.ucp-name { font-size: 1.5rem; font-weight: 600; margin: 0 0 0.3rem; color: var(--vp-c-text-1, #333); }
.ucp-name-abbrev { font-size: 1rem; font-weight: 500; font-family: var(--vp-font-family-mono, monospace); color: var(--vp-c-text-3, #888); margin-left: 0.5rem; }
.ucp-hex { font-family: monospace; font-size: 1.1rem; color: var(--fontist-rose, #bf4e6a); }

.ucp-nav-ctrl {
  font-family: var(--vp-font-family-mono, monospace);
  font-size: 0.8rem !important;
  font-weight: 700;
  padding: 0.2rem 0.4rem;
  border: 1px dashed var(--vp-c-text-3, #aaa);
  border-radius: 3px;
  color: var(--vp-c-text-3, #888);
}

.ucp-sections { display: grid; grid-template-columns: repeat(auto-fill, minmax(300px, 1fr)); gap: 1.5rem; margin-top: 2rem; }
.ucp-section h2 { font-size: 0.8rem; font-weight: 700; text-transform: uppercase; letter-spacing: 0.08em; color: var(--fontist-rose, #bf4e6a); margin: 0 0 0.75rem; padding-bottom: 0.4rem; border-bottom: 1px solid var(--vp-c-divider, #e2e2e3); }
.ucp-section dl { display: grid; grid-template-columns: auto 1fr; gap: 0.4rem 1rem; margin: 0; }
.ucp-section dt { font-size: 0.75rem; font-weight: 600; color: var(--vp-c-text-3, #888); white-space: nowrap; }
.ucp-section dd { margin: 0; font-size: 0.85rem; color: var(--vp-c-text-1, #333); }
.ucp-section dd a { color: var(--fontist-rose, #bf4e6a); text-decoration: none; }
.ucp-section dd code { font-family: monospace; font-size: 0.75rem; cursor: pointer; background: var(--vp-c-bg-soft, #f8f7f4); padding: 0.1rem 0.3rem; border-radius: 3px; }
.ucp-section dd code:hover { color: var(--fontist-rose, #bf4e6a); }

.ucp-loading, .ucp-notfound { display: flex; align-items: center; justify-content: center; flex-direction: column; gap: 0.5rem; height: 60vh; color: var(--vp-c-text-3, #888); }
</style>
