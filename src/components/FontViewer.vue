<script setup>
import { ref, computed, onMounted } from 'vue'
import { injectFontFace } from '../composables/useFontFace'
import { fetchCoverage } from '../composables/useCoverage'
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
const cov = await fetchCoverage(props.coverageFile || props.slug)
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
/* ============ CONTAINER ============ */
.fv {
  display: flex;
  flex-direction: column;
  height: calc(100vh - var(--vp-nav-height, 56px));
  min-height: 400px;
  border: 1px solid var(--vp-c-divider, #e2e2e3);
  border-radius: 8px;
  overflow: hidden;
  background: var(--vp-c-bg, #fff);
  font-family: var(--vp-font-family-base, system-ui, sans-serif);
  font-size: 0.85rem;
  box-shadow: 0 2px 12px rgba(0, 0, 0, 0.05);
}

/* ============ TOOLBAR ============ */
.fv-toolbar {
  display: flex;
  align-items: center;
  gap: 0.75rem;
  padding: 0 0.75rem;
  height: 48px;
  min-height: 48px;
  background: var(--vp-c-bg, #fff);
  border-bottom: 1px solid var(--vp-c-divider, #e2e2e3);
  flex-wrap: nowrap;
  overflow-x: auto;
}

.fv-tb-name {
  font-size: 0.95rem;
  font-weight: 600;
  color: var(--vp-c-text-1, var(--fontist-dark, #333));
  white-space: nowrap;
  flex-shrink: 0;
}

.fv-tb-controls {
  display: flex;
  align-items: center;
  gap: 0.75rem;
  flex-wrap: nowrap;
}

.fv-tb-right {
  margin-left: auto;
  flex-shrink: 0;
}

/* Axis sliders */
.fv-tb-axis {
  display: flex;
  align-items: center;
  gap: 0.4rem;
  flex-shrink: 0;
}

.fv-axis-label {
  font-size: 0.68rem;
  text-transform: uppercase;
  letter-spacing: 0.05em;
  color: var(--vp-c-text-3, #888);
  font-weight: 500;
  white-space: nowrap;
}

.fv-slider {
  -webkit-appearance: none;
  appearance: none;
  width: 80px;
  height: 4px;
  background: var(--vp-c-divider, #e2e2e3);
  border-radius: 2px;
  outline: none;
}

.fv-slider::-webkit-slider-thumb {
  -webkit-appearance: none;
  appearance: none;
  width: 14px;
  height: 14px;
  background: var(--fontist-rose, #bf4e6a);
  border-radius: 50%;
  cursor: pointer;
  border: none;
}

.fv-slider::-moz-range-thumb {
  width: 14px;
  height: 14px;
  background: var(--fontist-rose, #bf4e6a);
  border-radius: 50%;
  cursor: pointer;
  border: none;
}

.fv-axis-value {
  font-family: var(--vp-font-family-mono, monospace);
  font-size: 0.72rem;
  color: var(--fontist-rose, #bf4e6a);
  min-width: 28px;
  text-align: right;
}

/* Feature chips */
.fv-tb-features {
  display: flex;
  gap: 0.25rem;
  flex-wrap: nowrap;
}

.fv-chip {
  padding: 0.15rem 0.5rem;
  font-size: 0.68rem;
  font-family: var(--vp-font-family-mono, monospace);
  background: var(--vp-c-bg-soft, #f6f6f7);
  color: var(--vp-c-text-3, #888);
  border: 1px solid var(--vp-c-divider, #e2e2e3);
  border-radius: 10px;
  cursor: pointer;
  transition: all 0.12s;
  line-height: 1.4;
  white-space: nowrap;
}

.fv-chip:hover {
  border-color: var(--fontist-rose, #bf4e6a);
  color: var(--vp-c-text-1, #333);
}

.fv-chip.on {
  background: var(--fontist-rose, #bf4e6a);
  color: #fff;
  border-color: var(--fontist-rose, #bf4e6a);
}

/* Search */
.fv-search {
  width: 140px;
  padding: 0.3rem 0.6rem;
  font-size: 0.78rem;
  background: var(--vp-c-bg-soft, #f6f6f7);
  border: 1px solid var(--vp-c-divider, #e2e2e3);
  border-radius: 4px;
  color: var(--vp-c-text-1, #333);
  outline: none;
  transition: border-color 0.12s;
}

.fv-search:focus {
  border-color: var(--fontist-rose, #bf4e6a);
}

.fv-search::placeholder {
  color: var(--vp-c-text-3, #888);
}

/* ============ MAIN SPLIT ============ */
.fv-main {
  display: grid;
  grid-template-columns: 240px 1fr 280px;
  flex: 1;
  overflow: hidden;
  min-height: 0;
}

/* ============ PANEL HEADERS ============ */
.fv-panel-head {
  padding: 0.5rem 0.75rem;
  font-size: 0.68rem;
  text-transform: uppercase;
  letter-spacing: 0.08em;
  color: var(--vp-c-text-3, #888);
  font-weight: 600;
  border-bottom: 1px solid var(--vp-c-divider, #e2e2e3);
  position: sticky;
  top: 0;
  z-index: 2;
}

.fv-panel-msg {
  padding: 1rem 0.75rem;
  font-size: 0.8rem;
  color: var(--vp-c-text-3, #888);
  font-style: italic;
}

/* ============ LEFT SIDEBAR ============ */
.fv-left {
  background: var(--vp-c-bg-soft, #f6f6f7);
  border-right: 1px solid var(--vp-c-divider, #e2e2e3);
  overflow-y: auto;
  overflow-x: hidden;
}

.fv-left .fv-panel-head {
  background: var(--vp-c-bg-soft, #f6f6f7);
}

/* Unicode tree */
.fv-tree {
  padding: 0.25rem 0;
}

.fv-plane {
  margin-bottom: 0.1rem;
}

.fv-plane-head {
  display: flex;
  align-items: center;
  gap: 0.3rem;
  width: 100%;
  padding: 0.3rem 0.75rem;
  background: transparent;
  border: none;
  cursor: pointer;
  color: var(--vp-c-text-2, #666);
  font-size: 0.75rem;
  font-weight: 600;
  text-align: left;
  transition: background 0.1s;
}

.fv-plane-head:hover {
  background: var(--vp-c-bg-alt, #eee);
}

.fv-plane-arrow {
  display: inline-block;
  width: 10px;
  font-size: 0.6rem;
  transition: transform 0.12s;
  color: var(--vp-c-text-3, #888);
  text-align: center;
}

.fv-plane-arrow.open {
  transform: rotate(90deg);
}

.fv-plane-label {
  flex: 1;
  font-family: var(--vp-font-family-mono, monospace);
}

.fv-plane-count {
  font-family: var(--vp-font-family-mono, monospace);
  font-size: 0.65rem;
  color: var(--vp-c-text-3, #888);
}

.fv-plane-body {
  padding-bottom: 0.25rem;
}

.fv-block-item {
  display: flex;
  align-items: center;
  justify-content: space-between;
  width: 100%;
  padding: 0.25rem 0.75rem 0.25rem 1.75rem;
  background: transparent;
  border: none;
  cursor: pointer;
  color: var(--vp-c-text-2, #666);
  font-size: 0.77rem;
  text-align: left;
  transition: all 0.1s;
  border-left: 2px solid transparent;
}

.fv-block-item:hover {
  background: var(--vp-c-bg-alt, #eee);
  color: var(--vp-c-text-1, #333);
}

.fv-block-item.active {
  background: var(--vp-c-brand-soft, rgba(191, 78, 106, 0.14));
  color: var(--fontist-rose, #bf4e6a);
  border-left-color: var(--fontist-rose, #bf4e6a);
  font-weight: 500;
}

.fv-block-name {
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.fv-block-count {
  font-family: var(--vp-font-family-mono, monospace);
  font-size: 0.65rem;
  color: var(--vp-c-text-3, #888);
  margin-left: 0.4rem;
  flex-shrink: 0;
}

/* ============ CENTER PANEL ============ */
.fv-center {
  display: flex;
  flex-direction: column;
  overflow: hidden;
  background: var(--vp-c-bg, #fff);
  min-width: 0;
}

/* Specimen — fixed pane, always visible */
.fv-specimen-section {
  flex-shrink: 0;
  padding: 1.25rem 1.5rem 1rem;
  border-bottom: 1px solid var(--vp-c-divider, #e2e2e3);
}

.fv-specimen {
  font-size: clamp(2rem, 4vw, 3.25rem);
  line-height: 1.15;
  font-weight: 400;
  letter-spacing: -0.02em;
  color: var(--vp-c-text-1, #333);
  outline: none;
  caret-color: var(--fontist-rose, #bf4e6a);
  cursor: text;
  word-break: break-word;
  min-height: 2.5em;
  border-radius: 4px;
  padding: 0.25rem 0;
  transition: background 0.12s;
}

.fv-specimen:focus {
  background: var(--vp-c-bg-soft, #f6f6f7);
}

/* Glyph grid — independent scroll pane */
.fv-grid-section {
  flex: 1;
  overflow-y: auto;
  overflow-x: hidden;
  padding: 0.75rem 1.5rem 1.5rem;
}

.fv-grid-head {
  display: flex;
  align-items: baseline;
  gap: 0.75rem;
  padding-bottom: 0.5rem;
  margin-bottom: 0.5rem;
  border-bottom: 1px solid var(--vp-c-divider, #e2e2e3);
}

.fv-grid-title {
  font-size: 0.9rem;
  font-weight: 600;
  color: var(--vp-c-text-1, #333);
}

.fv-grid-range {
  font-family: var(--vp-font-family-mono, monospace);
  font-size: 0.68rem;
  color: var(--vp-c-text-3, #888);
}

.fv-grid-cov {
  font-size: 0.68rem;
  color: var(--vp-c-text-2, #666);
  margin-left: auto;
}

/* Glyph grid — Compart-style fixed cells */
.fv-glyph-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, 158px);
  gap: 6px;
  padding: 6px;
}

.fv-cell {
  display: flex;
  flex-direction: column;
  align-items: center;
  width: 158px;
  min-height: 120px;
  padding: 8px;
  background: var(--vp-c-bg, #fff);
  border: 1px solid var(--vp-c-divider, #e2e2e3);
  border-radius: 6px;
  cursor: pointer;
  transition: border-color 0.12s, box-shadow 0.12s;
  gap: 4px;
  overflow: hidden;
}

.fv-cell:hover {
  border-color: var(--fontist-rose, #bf4e6a);
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.08);
}

.fv-cell.active {
  border-color: var(--fontist-rose, #bf4e6a);
  border-width: 2px;
}

.fv-cell.active .fv-cp,
.fv-cell.active .fv-name {
  color: var(--fontist-rose, #bf4e6a);
}

.fv-cell.missing {
  background: var(--vp-c-bg-alt, #f2f1ed);
  border-style: dashed;
}

.fv-cell.missing:hover {
  border-color: var(--vp-c-text-3, #888);
}

.fv-cp {
  font-size: 0.6rem;
  font-family: var(--vp-font-family-mono, monospace);
  color: var(--vp-c-text-3, #888);
  line-height: 1;
}

.fv-glyph {
  font-size: 2rem;
  line-height: 1;
  color: var(--vp-c-text-1, #333);
  flex: 1;
  display: flex;
  align-items: center;
  min-height: 2.5rem;
}

.fv-cell.missing .fv-glyph {
  color: var(--vp-c-text-3, #999);
  opacity: 0.35;
}

.fv-name {
  font-size: 0.55rem;
  text-align: center;
  color: var(--vp-c-text-3, #888);
  line-height: 1.15;
  word-break: break-word;
  overflow: hidden;
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  min-height: 1.3rem;
}

.fv-empty {
  grid-column: 1 / -1;
  padding: 1.5rem;
  text-align: center;
  color: var(--vp-c-text-3, #888);
  font-size: 0.85rem;
  background: var(--vp-c-bg, #fff);
  margin: 0;
}

/* Proprietary fallback */
.fv-cov-only {
  padding: 0.5rem 0;
}

.fv-prop {
  font-size: 0.82rem;
  color: var(--vp-c-text-2, #666);
  margin: 0 0 0.3rem 0;
}

.fv-prop-hint {
  font-size: 0.72rem;
  color: var(--vp-c-text-3, #888);
  margin: 0 0 0.5rem 0;
}

.fv-prop-hint code,
.fv-cov-only p code {
  font-family: var(--vp-font-family-mono, monospace);
  font-size: 0.7rem;
  background: var(--vp-c-bg-soft, #f6f6f7);
  padding: 0.1em 0.3em;
  border-radius: 2px;
}

/* ============ RIGHT INSPECTOR ============ */
.fv-right {
  background: var(--vp-c-bg-soft, #f6f6f7);
  border-left: 1px solid var(--vp-c-divider, #e2e2e3);
  overflow-y: auto;
}

.fv-right .fv-panel-head {
  background: var(--vp-c-bg-soft, #f6f6f7);
}

.fv-ins-glyph-wrap {
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 1.5rem 1rem;
  background: var(--vp-c-bg, #fff);
  border-bottom: 1px solid var(--vp-c-divider, #e2e2e3);
  min-height: 100px;
}

.fv-ins-glyph {
  font-size: 4rem;
  line-height: 1;
  color: var(--vp-c-text-1, #333);
}

.fv-ins-list {
  margin: 0;
  padding: 0.5rem 0;
}

.fv-ins-row {
  display: flex;
  flex-direction: column;
  padding: 0.3rem 0.75rem;
  gap: 0.1rem;
}

.fv-ins-row dt {
  font-size: 0.62rem;
  text-transform: uppercase;
  letter-spacing: 0.06em;
  color: var(--vp-c-text-3, #888);
  font-weight: 500;
}

.fv-ins-row dd {
  margin: 0;
  font-size: 0.8rem;
  color: var(--vp-c-text-1, #333);
  word-break: break-word;
}

.fv-mono {
  font-family: var(--vp-font-family-mono, monospace);
  font-size: 0.77rem;
}

.fv-cat-code {
  font-family: var(--vp-font-family-mono, monospace);
  font-size: 0.7rem;
  color: var(--vp-c-text-3, #888);
}

.fv-copyable {
  cursor: pointer;
  transition: color 0.1s;
}

.fv-copyable:hover {
  color: var(--fontist-rose, #bf4e6a);
}

.fv-gap {
  color: var(--fontist-rose, #bf4e6a);
}

.fv-ins-actions {
  display: flex;
  gap: 0.4rem;
  padding: 0.5rem 0.75rem;
  border-top: 1px solid var(--vp-c-divider, #e2e2e3);
}

.fv-ins-btn {
  flex: 1;
  padding: 0.35rem 0.5rem;
  font-size: 0.7rem;
  background: var(--vp-c-bg, #fff);
  color: var(--vp-c-text-2, #666);
  border: 1px solid var(--vp-c-divider, #e2e2e3);
  border-radius: 4px;
  cursor: pointer;
  transition: all 0.12s;
}

.fv-ins-btn:hover {
  border-color: var(--fontist-rose, #bf4e6a);
  color: var(--fontist-rose, #bf4e6a);
}

/* Plane tags */
.fv-plane-tag {
  display: inline-block;
  font-family: var(--vp-font-family-mono, monospace);
  font-size: 0.62rem;
  padding: 0.05rem 0.35rem;
  border-radius: 2px;
  background: var(--vp-c-bg-alt, #eee);
  color: var(--vp-c-text-3, #888);
  margin-right: 0.2rem;
}

.fv-plane-tag.on {
  background: var(--fontist-rose, #bf4e6a);
  color: #fff;
}

.fv-ins-hint {
  padding: 0.5rem 0.75rem;
  font-size: 0.72rem;
  color: var(--vp-c-text-3, #888);
  font-style: italic;
  margin: 0;
}

/* ============ STATUS BAR ============ */
.fv-statusbar {
  display: flex;
  align-items: center;
  gap: 0.4rem;
  padding: 0 0.75rem;
  height: 28px;
  min-height: 28px;
  background: var(--vp-c-bg-alt, #f6f6f7);
  border-top: 1px solid var(--vp-c-divider, #e2e2e3);
  font-size: 0.68rem;
  color: var(--vp-c-text-3, #888);
}

.fv-stat {
  white-space: nowrap;
}

.fv-stat-sep {
  color: var(--vp-c-text-3, #888);
  opacity: 0.4;
}

.fv-stat-spacer {
  flex: 1;
}

.fv-stat-gap {
  color: var(--fontist-rose, #bf4e6a);
}

.fv-stat-license {
  font-family: var(--vp-font-family-mono, monospace);
}

.fv-stat-plane {
  display: inline-block;
  font-family: var(--vp-font-family-mono, monospace);
  font-size: 0.58rem;
  padding: 0.05rem 0.3rem;
  border-radius: 2px;
  background: var(--vp-c-bg, #fff);
  color: var(--vp-c-text-3, #888);
  margin-right: 0.15rem;
}

.fv-stat-plane.on {
  background: var(--fontist-rose, #bf4e6a);
  color: #fff;
}

/* ============ SCROLLBARS ============ */
.fv-left::-webkit-scrollbar,
.fv-grid-section::-webkit-scrollbar,
.fv-right::-webkit-scrollbar {
  width: 6px;
}

.fv-left::-webkit-scrollbar-track,
.fv-grid-section::-webkit-scrollbar-track,
.fv-right::-webkit-scrollbar-track {
  background: transparent;
}

.fv-left::-webkit-scrollbar-thumb,
.fv-grid-section::-webkit-scrollbar-thumb,
.fv-right::-webkit-scrollbar-thumb {
  background: var(--vp-c-divider, #e2e2e3);
  border-radius: 3px;
}

.fv-left::-webkit-scrollbar-thumb:hover,
.fv-grid-section::-webkit-scrollbar-thumb:hover,
.fv-right::-webkit-scrollbar-thumb:hover {
  background: var(--vp-c-text-3, #888);
}

/* ============ RESPONSIVE ============ */
@media (max-width: 960px) {
  .fv {
    height: auto;
    max-height: none;
    min-height: 600px;
  }
  .fv-main {
    grid-template-columns: 1fr;
    grid-template-rows: auto 1fr auto;
  }
  .fv-left {
    max-height: 180px;
    border-right: none;
    border-bottom: 1px solid var(--vp-c-divider, #e2e2e3);
  }
  .fv-right {
    border-left: none;
    border-top: 1px solid var(--vp-c-divider, #e2e2e3);
    max-height: 300px;
  }
  .fv-toolbar {
    flex-wrap: wrap;
    height: auto;
    min-height: 48px;
    padding: 0.5rem 0.75rem;
  }
}
</style>
