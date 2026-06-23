<script setup lang="ts">
import { ref, computed, watch } from 'vue'
import { useRoute, RouterLink } from 'vue-router'
import { useHead } from '@unhead/vue'
import { injectFontFace } from '../composables/useFontFace'
import { fetchCoverage } from '../composables/useCoverage'
import { useFontVariation } from '../composables/useFontVariation'
import { featureInfo } from '../lib/unicode'
import { findFormula, type FormulaData } from '../lib/formulas/loader'

const route = useRoute()
const slug = computed(() => route.params.slug as string)

const { state, variationCSS, featureCSS, initAxes, initFeatures, setAxis, toggleFeature } = useFontVariation()

const formula = ref<FormulaData | null>(null)
const coverage = ref<any>(null)
const loading = ref(true)
const fontReady = ref(false)
const fontId = ref('')

const HERO_SPECIMEN = 'Finding efficient flow'
const BODY_SPECIMEN = 'fluffy fish affords fine flavor · whereas recognition of inherent dignity'
const LIGATURE_SPECIMEN = 'ff fi fl ffi ffl'
const NUMBER_SPECIMEN = '0123456789'

async function loadData() {
  loading.value = true
  const s = slug.value
  if (!s) { loading.value = false; return }

  try {
    formula.value = await findFormula(s)

    const { fontId: fid, ensureInjected } = injectFontFace(s, `fonts/${s}.woff`, true)
    fontId.value = fid
    fontReady.value = ensureInjected()
    coverage.value = await fetchCoverage(s)

    if (coverage.value?.variable_axes)
      initAxes(coverage.value.variable_axes.map((a: any) => ({ tag: a.tag, default: a.default })))
    if (coverage.value?.opentype_features)
      initFeatures(coverage.value.opentype_features.map((f: any) => ({ tag: f.tag })))
  } catch (e) { console.error(e) }
  finally { loading.value = false }
}

await loadData()
watch(slug, loadData)

useHead(() => ({
  title: formula.value ? `${formula.value.name} — Font Specimen` : 'Font Specimen — Fontist',
  meta: [
    { property: 'og:title', content: formula.value?.name || 'Fontist Font' },
    { property: 'og:type', content: 'website' },
    {
      name: 'description',
      content: formula.value
        ? `${formula.value.name} font specimen, Unicode coverage, variable axes, and OpenType features. Install with: fontist install ${formula.value.formulaName || formula.value.slug}.`
        : 'Interactive font specimen with Unicode coverage and OpenType features.',
    },
  ],
  link: [
    { rel: 'canonical', href: `https://www.fontist.org/font/${slug.value}` },
  ],
}))

const familyName = computed(() => formula.value?.name || slug.value)
const licenseName = computed(() => formula.value?.licenseName || 'Unknown')
const axes = computed(() => coverage.value?.variable_axes || [])
const features = computed(() => coverage.value?.opentype_features || [])
const weightAxis = computed(() => axes.value.find((a: any) => a.tag === 'wght'))

const specimenStyle = computed(() => {
  const s: Record<string, string> = { fontFamily: `'${fontId.value}', sans-serif` }
  if (variationCSS.value) s.fontVariationSettings = variationCSS.value
  if (featureCSS.value) s.fontFeatureSettings = featureCSS.value
  return s
})

const cpCount = computed(() => coverage.value?.total_codepoints?.toLocaleString() || '—')
const blockCount = computed(() => coverage.value?.supported_blocks || 0)
</script>

<template>
  <div class="fp" v-if="!loading && formula">
    <!-- Header -->
    <header class="fp-header">
      <div class="fp-title-row">
        <h1 class="fp-name">{{ familyName }}</h1>
        <span class="fp-license">{{ licenseName }}</span>
      </div>
      <nav class="fp-nav">
        <RouterLink :to="`/font/${slug}/unicode`" class="fp-nav-link">Unicode coverage →</RouterLink>
        <RouterLink :to="`/formula/${slug}`" class="fp-nav-link fp-nav-link--muted">Formula details →</RouterLink>
      </nav>
    </header>

    <!-- HERO SPECIMEN (interactive) -->
    <section class="fp-hero" v-if="fontReady">
      <div class="fp-specimen-hero" :contenteditable="true" :style="specimenStyle">{{ HERO_SPECIMEN }}</div>

      <div class="fp-specimen-body" v-if="axes.length > 0 || features.length > 0">
        <div class="fp-controls-row">
          <div class="fp-axis" v-for="axis in axes" :key="axis.tag">
            <label class="fp-axis-label">
              <span class="fp-axis-name">{{ axis.name || axis.tag }}</span>
              <span class="fp-axis-value">{{ Math.round(state.axes[axis.tag] ?? axis.default) }}</span>
            </label>
            <input
              type="range"
              :min="axis.min"
              :max="axis.max"
              :value="state.axes[axis.tag] ?? axis.default"
              :step="axis.tag === 'wdth' ? 0.1 : 1"
              @input="(e: any) => setAxis(axis.tag, +e.target.value)"
              class="fp-slider"
            />
            <div class="fp-axis-range">
              <span>{{ axis.min }}</span>
              <span>{{ axis.max }}</span>
            </div>
          </div>
        </div>

        <div class="fp-feature-toggles" v-if="features.length > 0">
          <span class="fp-toggles-label">Features</span>
          <div class="fp-chips">
            <button
              v-for="f in features"
              :key="f.tag"
              :class="['fp-chip', { on: state.features[f.tag] === 'on' }]"
              @click="toggleFeature(f.tag)"
            >
              <span class="fp-chip-tag">{{ f.tag }}</span>
              <span class="fp-chip-name">{{ featureInfo(f.tag).name }}</span>
            </button>
          </div>
        </div>
      </div>

      <div class="fp-specimen-samples">
        <p class="fp-sample" :style="specimenStyle" :contenteditable="true">{{ LIGATURE_SPECIMEN }}</p>
        <p class="fp-sample fp-sample--nums" :style="specimenStyle" :contenteditable="true">{{ NUMBER_SPECIMEN }}</p>
        <p class="fp-sample fp-sample--body" :style="specimenStyle" :contenteditable="true">{{ BODY_SPECIMEN }}</p>
      </div>

      <p class="fp-hint">Click any specimen text to edit. Drag sliders, toggle features — everything updates live.</p>
    </section>

    <div v-else-if="!loading" class="fp-unavailable">
      <p class="fp-unavailable-text">Specimen unavailable — this font's license does not permit web preview.</p>
      <RouterLink :to="`/formula/${slug}`" class="fp-nav-link">View formula details →</RouterLink>
    </div>

    <!-- FEATURE CATALOG (informational) -->
    <section class="fp-catalog" v-if="features.length > 0">
      <div class="fp-section-head">
        <h2 class="fp-section-title">OpenType Features</h2>
        <span class="fp-section-meta">{{ features.length }} supported</span>
      </div>
      <div class="fp-feature-grid">
        <div v-for="f in features" :key="f.tag" class="fp-feature-card">
          <div class="fp-feature-head">
            <span class="fp-feature-tag">{{ f.tag }}</span>
            <span class="fp-feature-name">{{ featureInfo(f.tag).name }}</span>
          </div>
          <p
            class="fp-feature-example"
            :style="{ ...specimenStyle, fontFeatureSettings: `'${f.tag}'` }"
          >{{ featureInfo(f.tag).example }}</p>
          <p class="fp-feature-desc">{{ featureInfo(f.tag).desc }}</p>
        </div>
      </div>
    </section>

    <!-- COVERAGE & METADATA -->
    <section class="fp-stats">
      <div class="fp-section-head">
        <h2 class="fp-section-title">Coverage</h2>
      </div>
      <div class="fp-stat-grid">
        <RouterLink :to="`/font/${slug}/unicode`" class="fp-stat-card">
          <span class="fp-stat-num">{{ cpCount }}</span>
          <span class="fp-stat-label">codepoints</span>
        </RouterLink>
        <RouterLink :to="`/font/${slug}/unicode`" class="fp-stat-card">
          <span class="fp-stat-num">{{ blockCount }}<span class="fp-stat-total">/346</span></span>
          <span class="fp-stat-label">blocks</span>
        </RouterLink>
        <RouterLink :to="`/formula/${slug}`" class="fp-stat-card">
          <span class="fp-stat-num">{{ formula.familyCount }}</span>
          <span class="fp-stat-label">families</span>
        </RouterLink>
        <RouterLink :to="`/formula/${slug}`" class="fp-stat-card">
          <span class="fp-stat-num">{{ formula.styleCount }}</span>
          <span class="fp-stat-label">styles</span>
        </RouterLink>
      </div>
    </section>
  </div>

  <div v-else-if="loading" class="fp-loading">Loading…</div>
  <div v-else class="fp-loading">
    <p>Font not found.</p>
    <RouterLink to="/browse" class="fp-nav-link">Browse all fonts →</RouterLink>
  </div>
</template>

<style scoped>
.fp {
  max-width: 960px;
  margin: 0 auto;
  padding: 2.5rem 1.5rem 5rem;
}

/* ===== HEADER ===== */
.fp-header {
  margin-bottom: 2.5rem;
}
.fp-title-row {
  display: flex;
  align-items: baseline;
  gap: 1rem;
  flex-wrap: wrap;
}
.fp-name {
  font-size: clamp(2rem, 5vw, 3rem);
  font-weight: 700;
  margin: 0;
  color: var(--vp-c-text-1, #1a1a1a);
  letter-spacing: -0.02em;
  line-height: 1.1;
}
.fp-license {
  font-size: 0.72rem;
  font-weight: 500;
  text-transform: uppercase;
  letter-spacing: 0.08em;
  color: var(--fontist-rose, #bf4e6a);
  padding: 0.2rem 0.6rem;
  border: 1px solid var(--fontist-rose, #bf4e6a);
  border-radius: 3px;
  white-space: nowrap;
}
.fp-nav {
  display: flex;
  gap: 1.5rem;
  margin-top: 0.5rem;
}
.fp-nav-link {
  font-size: 0.82rem;
  font-weight: 500;
  color: var(--fontist-rose, #bf4e6a);
  text-decoration: none;
  transition: opacity 0.12s;
}
.fp-nav-link:hover { opacity: 0.7; }
.fp-nav-link--muted { color: var(--vp-c-text-3, #888); }

/* ===== HERO SPECIMEN ===== */
.fp-hero {
  margin-bottom: 3rem;
}
.fp-specimen-hero {
  font-size: clamp(3rem, 9vw, 6.5rem);
  font-weight: 500;
  line-height: 1;
  letter-spacing: -0.03em;
  color: var(--vp-c-text-1, #1a1a1a);
  outline: none;
  caret-color: var(--fontist-rose, #bf4e6a);
  cursor: text;
  padding: 0.5rem 0 1rem;
  min-height: 1.2em;
  border-bottom: 2px solid var(--vp-c-divider, #e8e6e0);
  transition: border-color 0.2s;
}
.fp-specimen-hero:focus {
  border-bottom-color: var(--fontist-rose, #bf4e6a);
}

/* Controls below specimen */
.fp-specimen-body {
  padding: 1.5rem 0;
  border-bottom: 1px solid var(--vp-c-divider, #e8e6e0);
}
.fp-controls-row {
  display: flex;
  flex-wrap: wrap;
  gap: 2rem;
}
.fp-axis {
  display: flex;
  flex-direction: column;
  gap: 0.4rem;
  min-width: 180px;
  flex: 1;
  max-width: 320px;
}
.fp-axis-label {
  display: flex;
  justify-content: space-between;
  align-items: baseline;
}
.fp-axis-name {
  font-size: 0.68rem;
  font-weight: 600;
  text-transform: uppercase;
  letter-spacing: 0.08em;
  color: var(--vp-c-text-3, #888);
}
.fp-axis-value {
  font-family: var(--font-mono, 'SF Mono', monospace);
  font-size: 0.82rem;
  font-weight: 600;
  color: var(--fontist-rose, #bf4e6a);
  font-variant-numeric: tabular-nums;
}
.fp-slider {
  -webkit-appearance: none;
  appearance: none;
  width: 100%;
  height: 3px;
  background: var(--vp-c-divider, #e8e6e0);
  border-radius: 2px;
  outline: none;
  cursor: pointer;
}
.fp-slider::-webkit-slider-thumb {
  -webkit-appearance: none;
  width: 18px;
  height: 18px;
  background: var(--fontist-rose, #bf4e6a);
  border-radius: 50%;
  cursor: grab;
  border: 3px solid var(--vp-c-bg, #fff);
  box-shadow: 0 1px 4px rgba(191, 78, 106, 0.3);
  transition: transform 0.1s;
}
.fp-slider::-webkit-slider-thumb:hover { transform: scale(1.15); }
.fp-slider::-webkit-slider-thumb:active { cursor: grabbing; }
.fp-slider::-moz-range-thumb {
  width: 18px;
  height: 18px;
  background: var(--fontist-rose, #bf4e6a);
  border-radius: 50%;
  cursor: grab;
  border: 3px solid var(--vp-c-bg, #fff);
  box-shadow: 0 1px 4px rgba(191, 78, 106, 0.3);
}
.fp-axis-range {
  display: flex;
  justify-content: space-between;
  font-family: var(--font-mono, 'SF Mono', monospace);
  font-size: 0.62rem;
  color: var(--vp-c-text-3, #aaa);
}

.fp-feature-toggles {
  margin-top: 1.5rem;
}
.fp-toggles-label {
  font-size: 0.68rem;
  font-weight: 600;
  text-transform: uppercase;
  letter-spacing: 0.08em;
  color: var(--vp-c-text-3, #888);
  display: block;
  margin-bottom: 0.5rem;
}
.fp-chips {
  display: flex;
  flex-wrap: wrap;
  gap: 0.4rem;
}
.fp-chip {
  display: inline-flex;
  align-items: baseline;
  gap: 0.4rem;
  padding: 0.3rem 0.7rem;
  background: var(--vp-c-bg, #fff);
  border: 1px solid var(--vp-c-divider, #e8e6e0);
  border-radius: 4px;
  cursor: pointer;
  transition: all 0.15s;
  font-family: inherit;
}
.fp-chip:hover {
  border-color: var(--fontist-rose, #bf4e6a);
}
.fp-chip.on {
  background: var(--fontist-rose, #bf4e6a);
  border-color: var(--fontist-rose, #bf4e6a);
}
.fp-chip-tag {
  font-family: var(--font-mono, 'SF Mono', monospace);
  font-size: 0.68rem;
  font-weight: 700;
  color: var(--vp-c-text-3, #888);
}
.fp-chip.on .fp-chip-tag { color: rgba(255, 255, 255, 0.7); }
.fp-chip-name {
  font-size: 0.75rem;
  color: var(--vp-c-text-2, #555);
}
.fp-chip.on .fp-chip-name { color: #fff; }

/* Sample specimens */
.fp-specimen-samples {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
  padding: 1.5rem 0 0;
}
.fp-sample {
  margin: 0;
  font-size: 1.5rem;
  line-height: 1.4;
  color: var(--vp-c-text-2, #555);
  outline: none;
  caret-color: var(--fontist-rose, #bf4e6a);
  cursor: text;
}
.fp-sample:focus { color: var(--vp-c-text-1, #1a1a1a); }
.fp-sample--nums {
  font-size: 2rem;
  font-weight: 500;
  letter-spacing: 0.05em;
}
.fp-sample--body {
  font-size: 1.1rem;
  color: var(--vp-c-text-3, #888);
}
.fp-hint {
  font-size: 0.72rem;
  color: var(--vp-c-text-3, #aaa);
  margin: 1rem 0 0;
  font-style: italic;
}

.fp-unavailable {
  padding: 2rem;
  text-align: center;
  background: var(--vp-c-bg-soft, #faf8f5);
  border-radius: 8px;
  margin-bottom: 2rem;
}
.fp-unavailable-text {
  color: var(--vp-c-text-2, #555);
  margin: 0 0 0.5rem;
}

/* ===== FEATURE CATALOG ===== */
.fp-catalog { margin-bottom: 3rem; }
.fp-section-head {
  display: flex;
  align-items: baseline;
  gap: 0.75rem;
  margin-bottom: 1rem;
  padding-bottom: 0.5rem;
  border-bottom: 2px solid var(--vp-c-text-1, #1a1a1a);
}
.fp-section-title {
  font-size: 0.82rem;
  font-weight: 700;
  text-transform: uppercase;
  letter-spacing: 0.1em;
  margin: 0;
  color: var(--vp-c-text-1, #1a1a1a);
}
.fp-section-meta {
  font-family: var(--font-mono, 'SF Mono', monospace);
  font-size: 0.72rem;
  color: var(--vp-c-text-3, #888);
}
.fp-feature-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(260px, 1fr));
  gap: 1px;
  background: var(--vp-c-divider, #e8e6e0);
  border: 1px solid var(--vp-c-divider, #e8e6e0);
}
.fp-feature-card {
  background: var(--vp-c-bg, #fff);
  padding: 1rem 1.2rem;
  display: flex;
  flex-direction: column;
  gap: 0.4rem;
}
.fp-feature-head {
  display: flex;
  align-items: baseline;
  gap: 0.6rem;
}
.fp-feature-tag {
  font-family: var(--font-mono, 'SF Mono', monospace);
  font-size: 0.68rem;
  font-weight: 700;
  color: var(--fontist-rose, #bf4e6a);
  text-transform: lowercase;
}
.fp-feature-name {
  font-size: 0.85rem;
  font-weight: 600;
  color: var(--vp-c-text-1, #1a1a1a);
}
.fp-feature-example {
  font-size: 1.4rem;
  line-height: 1.3;
  color: var(--vp-c-text-1, #1a1a1a);
  margin: 0.3rem 0;
}
.fp-feature-desc {
  font-size: 0.75rem;
  line-height: 1.4;
  color: var(--vp-c-text-3, #888);
  margin: 0;
}

/* ===== COVERAGE STATS ===== */
.fp-stats { margin-bottom: 2rem; }
.fp-stat-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(140px, 1fr));
  gap: 1px;
  background: var(--vp-c-divider, #e8e6e0);
  border: 1px solid var(--vp-c-divider, #e8e6e0);
}
.fp-stat-card {
  display: flex;
  flex-direction: column;
  align-items: flex-start;
  gap: 0.2rem;
  padding: 1.2rem;
  background: var(--vp-c-bg, #fff);
  text-decoration: none;
  transition: background 0.15s;
}
.fp-stat-card:hover { background: var(--vp-c-bg-soft, #faf8f5); }
.fp-stat-num {
  font-family: var(--font-mono, 'SF Mono', monospace);
  font-size: 1.8rem;
  font-weight: 700;
  color: var(--vp-c-text-1, #1a1a1a);
  font-variant-numeric: tabular-nums;
  line-height: 1;
}
.fp-stat-total {
  font-size: 1rem;
  color: var(--vp-c-text-3, #aaa);
}
.fp-stat-label {
  font-size: 0.68rem;
  text-transform: uppercase;
  letter-spacing: 0.08em;
  color: var(--vp-c-text-3, #888);
}

/* ===== LOADING ===== */
.fp-loading {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 0.5rem;
  min-height: 50vh;
  color: var(--vp-c-text-3, #888);
}

@media (max-width: 640px) {
  .fp-controls-row { flex-direction: column; gap: 1rem; }
  .fp-axis { max-width: none; }
}
</style>
