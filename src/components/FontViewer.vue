<script setup>
import { ref, computed, onMounted } from 'vue'
import { injectFontFace } from '../composables/useFontFace'
import { loadCoverage } from '../lib/unicode/coverage'
import { useUnicodeBlock } from '../composables/useUnicodeBlock'
import { useFontVariation } from '../composables/useFontVariation'

const props = defineProps({
  slug: { type: String, required: true },
  familyName: { type: String, default: '' },
  description: { type: String, default: '' },
  fontPath: { type: String, default: null },
  coverageFile: { type: String, default: null },
  redistributable: { type: Boolean, default: false },
  licenseName: { type: String, default: '' },
})

const fontId = ref('')
const { fetchBlock } = useUnicodeBlock()
const {
  state, variationCSS, featureCSS,
  initAxes, initFeatures, setAxis, toggleFeature,
} = useFontVariation()

// --- State ---
const fontReady = ref(false)
const coverage = ref(null)
const blockData = ref(null)
const loading = ref(true)
const selectedBlock = ref(null)
const selectedCp = ref(null)
const searchQuery = ref('')
const collapsedPlanes = ref({ bmp: false, smp: true, sip: true, higher: true })
const specimenEl = ref(null)

const DEFAULT_SPECIMEN =
  'Whereas recognition of the inherent dignity and of equal and inalienable rights ' +
  'of all members of the human family is the foundation of freedom, justice and peace ' +
  'in the world.'

const specimenText = ref(
  (props.description && props.description.trim().length > 40)
    ? props.description.trim()
    : DEFAULT_SPECIMEN
)

// --- Unicode general category labels ---
const CATEGORY_NAMES = {
  Lu: 'Uppercase Letter', Ll: 'Lowercase Letter', Lt: 'Titlecase Letter',
  Lm: 'Modifier Letter', Lo: 'Other Letter',
  Mn: 'Nonspacing Mark', Mc: 'Spacing Mark', Me: 'Enclosing Mark',
  Nd: 'Decimal Number', Nl: 'Letter Number', No: 'Other Number',
  Pc: 'Connector Punctuation', Pd: 'Dash Punctuation', Ps: 'Open Punctuation',
  Pe: 'Close Punctuation', Pi: 'Initial Punctuation', Pf: 'Final Punctuation',
  Po: 'Other Punctuation',
  Sm: 'Math Symbol', Sc: 'Currency Symbol', Sk: 'Modifier Symbol', So: 'Other Symbol',
  Zs: 'Space Separator', Zl: 'Line Separator', Zp: 'Paragraph Separator',
  Cc: 'Control', Cf: 'Format', Cs: 'Surrogate', Co: 'Private Use', Cn: 'Unassigned',
}

// --- Utilities ---
function safeChar(cp) {
  try { return String.fromCodePoint(cp) } catch { return '' }
}

function rangeToArray(block) {
  const out = []
  if (block.start == null || block.end == null) return out
  for (let cp = block.start; cp <= block.end; cp++) out.push(cp)
  return out
}

function hexCp(cp) {
  return 'U+' + cp.toString(16).toUpperCase().padStart(4, '0')
}

function planeOf(start) {
  if (start < 0x10000) return 'bmp'
  if (start < 0x20000) return 'smp'
  if (start < 0x30000) return 'sip'
  return 'higher'
}

function planeLabel(key) {
  return { bmp: 'BMP', smp: 'SMP', sip: 'SIP', higher: 'Higher' }[key] || key
}

function copy(text) {
  navigator.clipboard?.writeText(text)
}

// --- Computed ---
const blocks = computed(() => coverage.value?.blocks || [])
const axes = computed(() => coverage.value?.variable_axes || [])
const features = computed(() => coverage.value?.opentype_features || [])
const weightAxis = computed(() => axes.value.find(a => a.tag === 'wght'))
const otherAxes = computed(() => axes.value.filter(a => a.tag !== 'wght'))

const fontStyles = computed(() => {
  const s = { fontFamily: `'${fontId.value}', sans-serif` }
  if (variationCSS.value) s.fontVariationSettings = variationCSS.value
  if (featureCSS.value) s.fontFeatureSettings = featureCSS.value
  return s
})

const planeGroups = computed(() => {
  const groups = {}
  for (const b of blocks.value) {
    const p = planeOf(b.start || 0)
    if (!groups[p]) groups[p] = []
    groups[p].push(b)
  }
  const order = { bmp: 0, smp: 1, sip: 2, higher: 3 }
  return Object.entries(groups).sort(([a], [b]) => (order[a] ?? 9) - (order[b] ?? 9))
})

const supportedCpSet = computed(() => {
  if (!selectedBlock.value) return new Set()
  return new Set(selectedBlock.value.codepoints || rangeToArray(selectedBlock.value))
})

const charsWithNames = computed(() => {
  if (!blockData.value) return []
  return blockData.value.chars.map(c => ({
    ...c,
    hex: hexCp(c.cp),
    char: safeChar(c.cp),
    supported: supportedCpSet.value.has(c.cp),
  }))
})

const filteredChars = computed(() => {
  if (!searchQuery.value.trim()) return charsWithNames.value
  const q = searchQuery.value.toLowerCase()
  return charsWithNames.value.filter(c =>
    c.n?.toLowerCase().includes(q) ||
    c.hex?.toLowerCase().includes(q)
  )
})

const missingCount = computed(() => {
  if (!blockData.value) return 0
  return blockData.value.chars.filter(c => !supportedCpSet.value.has(c.cp)).length
})

const totalInBlock = computed(() => blockData.value?.chars.length || 0)

const detail = computed(() => {
  if (selectedCp.value == null || !blockData.value) return null
  const ch = blockData.value.chars.find(c => c.cp === selectedCp.value)
  if (!ch) return null
  return {
    ...ch,
    char: safeChar(ch.cp),
    hex: hexCp(ch.cp),
    html: `&#${ch.cp};`,
    css: '\\' + ch.cp.toString(16).toUpperCase().padStart(4, '0'),
    categoryName: CATEGORY_NAMES[ch.c] || ch.c,
  }
})

// --- Methods ---
async function selectBlock(block) {
  selectedBlock.value = block
  selectedCp.value = null
  searchQuery.value = ''
  blockData.value = await fetchBlock(block.name)
}

function togglePlane(key) {
  collapsedPlanes.value[key] = !collapsedPlanes.value[key]
}

// --- Lifecycle ---
// Top-level await: runs during SSG so coverage data renders into the
// shipped HTML. Font CSS injection stays in onMounted (touches `document`).
const cov = await loadCoverage(props.coverageFile || props.slug)
coverage.value = cov

if (cov?.variable_axes) {
  initAxes(cov.variable_axes.map(a => ({ tag: a.tag, default: a.default })))
}
if (cov?.opentype_features) {
  initFeatures(cov.opentype_features.map(f => ({ tag: f.tag })))
}
if (cov?.blocks?.length) {
  await selectBlock(cov.blocks[0])
}

loading.value = false

onMounted(async () => {
  if (specimenEl.value) {
    specimenEl.value.textContent = specimenText.value
  }

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
  <div class="fv">
    <!-- TOOLBAR -->
    <div class="fv-toolbar">
      <span class="fv-tb-name">{{ familyName || slug }}</span>

      <div class="fv-tb-controls" v-if="coverage">
        <!-- Weight axis -->
        <div class="fv-tb-axis" v-if="weightAxis">
          <span class="fv-axis-label">{{ weightAxis.name || 'Weight' }}</span>
          <input
            type="range"
            :min="weightAxis.min"
            :max="weightAxis.max"
            :value="state.axes['wght'] || weightAxis.default"
            @input="(e) => setAxis('wght', +e.target.value)"
            class="fv-slider"
          />
          <span class="fv-axis-value">{{ Math.round(state.axes['wght'] || weightAxis.default) }}</span>
        </div>

        <!-- Other axes -->
        <div class="fv-tb-axis" v-for="axis in otherAxes" :key="axis.tag">
          <span class="fv-axis-label">{{ axis.name || axis.tag }}</span>
          <input
            type="range"
            :min="axis.min"
            :max="axis.max"
            :value="state.axes[axis.tag] || axis.default"
            @input="(e) => setAxis(axis.tag, +e.target.value)"
            class="fv-slider"
          />
          <span class="fv-axis-value">{{ Math.round(state.axes[axis.tag] || axis.default) }}</span>
        </div>

        <!-- Feature chips -->
        <div class="fv-tb-features" v-if="features.length > 0">
          <button
            v-for="f in features"
            :key="f.tag"
            :class="['fv-chip', { on: state.features[f.tag] === 'on' }]"
            :title="f.name || f.tag"
            @click="toggleFeature(f.tag)"
          >{{ f.tag }}</button>
        </div>
      </div>

      <div class="fv-tb-right">
        <input
          v-model="searchQuery"
          type="text"
          class="fv-search"
          placeholder="Search glyphs..."
        />
      </div>
    </div>

    <!-- MAIN SPLIT -->
    <div class="fv-main">
      <!-- LEFT: Unicode tree -->
      <aside class="fv-left">
        <div class="fv-panel-head">Unicode Blocks</div>
        <div class="fv-tree" v-if="coverage">
          <div v-for="([key, planeBlocks]) in planeGroups" :key="key" class="fv-plane">
            <button class="fv-plane-head" @click="togglePlane(key)">
              <span class="fv-plane-arrow" :class="{ open: !collapsedPlanes[key] }">&#9656;</span>
              <span class="fv-plane-label">{{ planeLabel(key) }}</span>
              <span class="fv-plane-count">{{ planeBlocks.length }}</span>
            </button>
            <div class="fv-plane-body" v-show="!collapsedPlanes[key]">
              <button
                v-for="b in planeBlocks"
                :key="b.name"
                :class="['fv-block-item', { active: selectedBlock?.name === b.name }]"
                @click="selectBlock(b)"
              >
                <span class="fv-block-name">{{ b.name }}</span>
                <span class="fv-block-count">{{ b.codepoints?.length || '?' }}</span>
              </button>
            </div>
          </div>
        </div>
        <div v-else class="fv-panel-msg">Loading...</div>
      </aside>

      <!-- CENTER: Specimen + Glyph grid -->
      <main class="fv-center">
        <!-- Specimen -->
        <div class="fv-specimen-section">
          <div
            ref="specimenEl"
            class="fv-specimen"
            :contenteditable="true"
            :style="fontStyles"
            @input="(e) => specimenText = e.target.textContent"
          ></div>
        </div>

        <!-- Glyph grid -->
        <div class="fv-grid-section">
          <div class="fv-grid-head" v-if="selectedBlock">
            <span class="fv-grid-title">{{ selectedBlock.name }}</span>
            <span class="fv-grid-range">{{ hexCp(selectedBlock.start) }}-{{ hexCp(selectedBlock.end) }}</span>
            <span class="fv-grid-cov">
              {{ charsWithNames.length }}<template v-if="missingCount"> / {{ totalInBlock }}</template> glyphs
            </span>
          </div>

          <div class="fv-glyph-grid" v-if="redistributable && fontReady && blockData">
            <button
              v-for="ch in filteredChars"
              :key="ch.cp"
              :class="['fv-cell', { active: selectedCp === ch.cp, missing: !ch.supported }]"
              :style="ch.supported ? fontStyles : {}"
              :title="ch.supported ? `${ch.hex} ${ch.n}` : `${ch.hex} ${ch.n} (not in font)`"
              @click="selectedCp = ch.cp"
            >
              <span class="fv-cp">{{ ch.hex }}</span>
              <span class="fv-glyph">{{ ch.char }}</span>
              <span class="fv-name">{{ ch.n }}</span>
            </button>
            <p v-if="filteredChars.length === 0" class="fv-empty">No matching glyphs.</p>
          </div>

          <div class="fv-cov-only" v-else-if="!redistributable">
            <p class="fv-prop">Glyph previews unavailable - proprietary license.</p>
            <p class="fv-prop-hint">Install via <code>fontist install "{{ slug }}"</code> to see full glyphs locally.</p>
            <p v-if="selectedBlock" class="fv-prop">Supports {{ charsWithNames.length }} characters in {{ selectedBlock.name }}.</p>
          </div>

          <div v-else class="fv-panel-msg">Loading glyph data...</div>
        </div>
      </main>

      <!-- RIGHT: Inspector -->
      <aside class="fv-right">
        <!-- Character detail -->
        <template v-if="detail">
          <div class="fv-panel-head">Inspector</div>
          <div class="fv-ins-glyph-wrap">
            <span
              class="fv-ins-glyph"
              :style="redistributable ? fontStyles : {}"
            >{{ detail.char }}</span>
          </div>
          <dl class="fv-ins-list">
            <div class="fv-ins-row">
              <dt>Codepoint</dt>
              <dd class="fv-mono">{{ detail.hex }}</dd>
            </div>
            <div class="fv-ins-row">
              <dt>Name</dt>
              <dd>{{ detail.n }}</dd>
            </div>
            <div class="fv-ins-row">
              <dt>Category</dt>
              <dd>{{ detail.categoryName }} <span class="fv-cat-code">({{ detail.c }})</span></dd>
            </div>
            <div class="fv-ins-row">
              <dt>Script</dt>
              <dd>{{ detail.s }}</dd>
            </div>
            <div class="fv-ins-row">
              <dt>HTML Entity</dt>
              <dd class="fv-mono fv-copyable" @click="copy(detail.html)">{{ detail.html }}</dd>
            </div>
            <div class="fv-ins-row">
              <dt>CSS Escape</dt>
              <dd class="fv-mono fv-copyable" @click="copy(detail.css)">{{ detail.css }}</dd>
            </div>
          </dl>
          <div class="fv-ins-actions">
            <button class="fv-ins-btn" @click="copy(detail.char)">Copy Char</button>
            <button class="fv-ins-btn" @click="copy(detail.hex)">Copy U+</button>
          </div>
        </template>

        <!-- Coverage summary (no char selected) -->
        <template v-else-if="coverage">
          <div class="fv-panel-head">Coverage</div>
          <dl class="fv-ins-list">
            <div class="fv-ins-row">
              <dt>Codepoints</dt>
              <dd class="fv-mono">{{ coverage.total_codepoints?.toLocaleString() }}</dd>
            </div>
            <div class="fv-ins-row">
              <dt>Blocks</dt>
              <dd class="fv-mono">{{ coverage.supported_blocks }} / {{ coverage.total_blocks }}</dd>
            </div>
            <div class="fv-ins-row">
              <dt>Planes</dt>
              <dd>
                <span
                  v-for="(on, key) in coverage.planes"
                  :key="key"
                  :class="['fv-plane-tag', { on }]"
                >{{ key.toUpperCase() }}</span>
              </dd>
            </div>
            <div class="fv-ins-row" v-if="selectedBlock">
              <dt>Selected</dt>
              <dd>{{ selectedBlock.name }}</dd>
            </div>
            <div class="fv-ins-row" v-if="missingCount > 0">
              <dt>Gaps</dt>
              <dd class="fv-mono fv-gap">{{ missingCount }} missing</dd>
            </div>
            <div class="fv-ins-row" v-if="axes.length">
              <dt>Variable Axes</dt>
              <dd class="fv-mono">{{ axes.map(a => a.tag).join(', ') }}</dd>
            </div>
            <div class="fv-ins-row" v-if="features.length">
              <dt>OT Features</dt>
              <dd class="fv-mono">{{ features.length }}</dd>
            </div>
          </dl>
          <p class="fv-ins-hint">Click any glyph to inspect.</p>
        </template>

        <div v-else class="fv-panel-msg">Loading...</div>
      </aside>
    </div>

    <!-- STATUS BAR -->
    <div class="fv-statusbar">
      <template v-if="coverage">
        <span class="fv-stat">{{ coverage.total_codepoints?.toLocaleString() }} codepoints</span>
        <span class="fv-stat-sep">&middot;</span>
        <span class="fv-stat">{{ coverage.supported_blocks }}/{{ coverage.total_blocks }} blocks</span>
        <template v-if="coverage.planes">
          <span class="fv-stat-sep">&middot;</span>
          <span class="fv-stat">
            <span
              v-for="(on, key) in coverage.planes"
              :key="key"
              :class="['fv-stat-plane', { on }]"
            >{{ key.toUpperCase() }}</span>
          </span>
        </template>
        <span class="fv-stat-sep" v-if="missingCount > 0">&middot;</span>
        <span class="fv-stat fv-stat-gap" v-if="missingCount > 0">{{ missingCount }} gaps</span>
      </template>
      <span v-else class="fv-stat">Loading...</span>
      <span class="fv-stat-spacer"></span>
      <span class="fv-stat fv-stat-license">{{ licenseName || 'Unknown license' }}</span>
    </div>
  </div>
</template>

<style scoped>
/* All styles migrated to src/styles/main.css (@layer components). */
</style>
