<script setup lang="ts">
import { ref, computed, watch } from 'vue'
import { injectFontFace } from '../composables/useFontFace'
import { loadCoverage } from '../lib/unicode/coverage'
import { useFontVariation } from '../composables/useFontVariation'
import { featureInfo } from '../lib/unicode'
import { findFormula, type FormulaData } from '../lib/formulas/loader'
import type { Coverage, CoverageVariableAxis, CoverageFeature } from '../lib/types/domain'

const props = defineProps({
  slug: { type: String, required: true }
})

const slug = props.slug

const { state, variationCSS, featureCSS, initAxes, initFeatures, setAxis, toggleFeature, reset } = useFontVariation()

const formula = ref<FormulaData | null>(null)
const coverage = ref<Coverage | null>(null)
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

    const { fontId: fid, ensureInjected } = injectFontFace(s, `fonts/${s}.woff2`, true)
    fontId.value = fid
    fontReady.value = ensureInjected()
    coverage.value = await loadCoverage(s)

    reset()
    if (coverage.value?.variable_axes)
      initAxes(coverage.value.variable_axes.map(a => ({ tag: a.tag, default: a.default })))
    if (coverage.value?.opentype_features)
      initFeatures(coverage.value.opentype_features.map(f => ({ tag: f.tag })))
  } catch (e) { console.error(e) }
  finally { loading.value = false }
}

await loadData()
watch(slug, loadData)


const familyName = computed(() => formula.value?.name || slug.value)
const licenseName = computed(() => formula.value?.licenseName || 'Unknown')
const axes = computed<CoverageVariableAxis[]>(() => coverage.value?.variable_axes || [])
const features = computed<CoverageFeature[]>(() => coverage.value?.opentype_features || [])
const weightAxis = computed(() => axes.value.find(a => a.tag === 'wght'))

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
        <a :href="`/font/${slug}/unicode`" class="fp-nav-link">Unicode coverage →</a>
        <a :href="`/formula/${slug}`" class="fp-nav-link fp-nav-link--muted">Formula details →</a>
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
      <a :href="`/formula/${slug}`" class="fp-nav-link">View formula details →</a>
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
        <a :href="`/font/${slug}/unicode`" class="fp-stat-card">
          <span class="fp-stat-num">{{ cpCount }}</span>
          <span class="fp-stat-label">codepoints</span>
        </a>
        <a :href="`/font/${slug}/unicode`" class="fp-stat-card">
          <span class="fp-stat-num">{{ blockCount }}<span class="fp-stat-total">/346</span></span>
          <span class="fp-stat-label">blocks</span>
        </a>
        <a :href="`/formula/${slug}`" class="fp-stat-card">
          <span class="fp-stat-num">{{ formula.familyCount }}</span>
          <span class="fp-stat-label">families</span>
        </a>
        <a :href="`/formula/${slug}`" class="fp-stat-card">
          <span class="fp-stat-num">{{ formula.styleCount }}</span>
          <span class="fp-stat-label">styles</span>
        </a>
      </div>
    </section>
  </div>

  <div v-else-if="loading" class="fp-loading">Loading…</div>
  <div v-else class="fp-loading">
    <p>Font not found.</p>
    <a href="/browse" class="fp-nav-link">Browse all fonts →</a>
  </div>
</template>

<style scoped>
/* All styles migrated to src/styles/main.css (@layer components). */
</style>
