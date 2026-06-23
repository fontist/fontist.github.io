<script setup>
import { ref, computed, onMounted } from 'vue'
import { injectFontFace } from '../composables/useFontFace'
import { fetchCoverage } from '../composables/useCoverage'
import { useFontVariation } from '../composables/useFontVariation'

const props = defineProps({
  slug: { type: String, required: true },
  familyName: { type: String, default: '' },
  description: { type: String, default: '' },
  fontPath: { type: String, default: null },
  redistributable: { type: Boolean, default: false },
})

const fontId = ref('')
const fontReady = ref(false)
const axes = ref([])
const features = ref([])
const heroText = ref('Whereas recognition of the inherent dignity')
const bodyText = ref(props.description || 'The quick brown fox jumps over the lazy dog. 0123456789')

const { state, variationCSS, featureCSS, initAxes, initFeatures, setAxis, toggleFeature } = useFontVariation()

const fontStyles = computed(() => {
  const s = { fontFamily: `'${fontId.value}', sans-serif` }
  if (variationCSS.value) s.fontVariationSettings = variationCSS.value
  if (featureCSS.value) s.fontFeatureSettings = featureCSS.value
  return s
})

const weightAxis = computed(() => axes.value.find(a => a.tag === 'wght'))

onMounted(async () => {
  if (props.redistributable && props.fontPath) {
    const { fontId: fid, ensureInjected } = injectFontFace(props.slug, props.fontPath, props.redistributable)
    fontId.value = fid
    fontReady.value = ensureInjected()
  }
  const cov = await fetchCoverage(props.slug)
  if (cov) {
    axes.value = cov.variable_axes || []
    features.value = cov.opentype_features || []
    initAxes(axes.value.map(a => ({ tag: a.tag, default: a.default })))
    initFeatures(features.value.map(f => ({ tag: f.tag })))
  }
})
</script>

<template>
  <section class="specimen" v-if="redistributable && fontReady">
    <!-- Full-bleed editable specimen -->
    <div
      class="specimen-hero"
      :contenteditable="true"
      :style="fontStyles"
      @input="(e) => heroText = e.target.textContent"
    >{{ heroText }}</div>

    <!-- Multi-size specimen strip -->
    <div class="specimen-strip">
      <div
        v-for="size in [48, 24, 16]"
        :key="size"
        class="specimen-line"
        :style="{ ...fontStyles, fontSize: size + 'px', lineHeight: 1.3 }"
        :contenteditable="true"
        @input="(e) => bodyText = e.target.textContent"
      >{{ bodyText }}</div>
    </div>

    <!-- Variable font controls -->
    <div class="specimen-controls" v-if="axes.length > 0 || features.length > 0">
      <div class="control-group" v-if="weightAxis">
        <label class="control-label">
          {{ weightAxis.name || 'Weight' }}
          <span class="control-value">{{ Math.round(state.axes['wght'] || weightAxis.default) }}</span>
        </label>
        <input
          type="range"
          :min="weightAxis.min"
          :max="weightAxis.max"
          :value="state.axes['wght'] || weightAxis.default"
          @input="(e) => setAxis('wght', +e.target.value)"
          class="control-slider"
        />
      </div>

      <div class="control-group" v-for="axis in axes.filter(a => a.tag !== 'wght')" :key="axis.tag">
        <label class="control-label">
          {{ axis.name || axis.tag }}
          <span class="control-value">{{ Math.round(state.axes[axis.tag] || axis.default) }}</span>
        </label>
        <input
          type="range"
          :min="axis.min"
          :max="axis.max"
          :value="state.axes[axis.tag] || axis.default"
          @input="(e) => setAxis(axis.tag, +e.target.value)"
          class="control-slider"
        />
      </div>

      <div class="control-features" v-if="features.length > 0">
        <button
          v-for="f in features"
          :key="f.tag"
          :class="['feature-chip', { on: state.features[f.tag] === 'on' }]"
          @click="toggleFeature(f.tag)"
        >{{ f.name || f.tag }}</button>
      </div>
    </div>
  </section>

  <!-- Proprietary: no specimen -->
  <section class="specimen-unavailable" v-else-if="!redistributable">
    <p class="unavailable-text">Specimen unavailable — this font's license does not permit web preview.</p>
    <p class="unavailable-hint">Install via <code>fontist install --formula "{{ slug }}"</code> to see full glyphs.</p>
  </section>
</template>

<style scoped>
.specimen {
  margin: 0 0 2rem 0;
}

.specimen-hero {
  font-size: clamp(3rem, 8vw, 6rem);
  font-weight: 500;
  line-height: 1;
  letter-spacing: -0.03em;
  color: var(--vp-c-text-1);
  outline: none;
  caret-color: var(--fontist-rose, #bf4e6a);
  padding: 0.5rem 0;
  cursor: text;
}

.specimen-hero:focus {
  background: var(--vp-c-bg-soft);
}

.specimen-strip {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
  margin: 1rem 0;
}

.specimen-line {
  color: var(--vp-c-text-2);
  outline: none;
  caret-color: var(--fontist-rose, #bf4e6a);
  cursor: text;
  padding: 0.2rem 0;
  word-break: break-word;
}

.specimen-line:focus {
  background: var(--vp-c-bg-soft);
}

/* Controls */
.specimen-controls {
  display: flex;
  flex-wrap: wrap;
  gap: 1rem 2rem;
  align-items: flex-end;
  padding: 1rem 0;
  border-top: 1px solid var(--vp-c-divider);
}

.control-group {
  display: flex;
  flex-direction: column;
  gap: 0.3rem;
  min-width: 120px;
}

.control-label {
  font-size: 0.7rem;
  text-transform: uppercase;
  letter-spacing: 0.08em;
  color: var(--vp-c-text-3);
  display: flex;
  justify-content: space-between;
}

.control-value {
  font-family: var(--vp-font-family-mono, monospace);
  color: var(--fontist-rose, #bf4e6a);
}

.control-slider {
  -webkit-appearance: none;
  width: 100%;
  height: 4px;
  background: var(--vp-c-divider);
  border-radius: 2px;
  outline: none;
}

.control-slider::-webkit-slider-thumb {
  -webkit-appearance: none;
  width: 16px;
  height: 16px;
  background: var(--fontist-rose, #bf4e6a);
  border-radius: 50%;
  cursor: pointer;
}

.control-slider::-moz-range-thumb {
  width: 16px;
  height: 16px;
  background: var(--fontist-rose, #bf4e6a);
  border-radius: 50%;
  cursor: pointer;
  border: none;
}

.control-features {
  display: flex;
  flex-wrap: wrap;
  gap: 0.4rem;
}

.feature-chip {
  padding: 0.2rem 0.6rem;
  font-size: 0.7rem;
  font-family: var(--vp-font-family-mono, monospace);
  background: var(--vp-c-bg-soft);
  color: var(--vp-c-text-3);
  border: 1px solid var(--vp-c-divider);
  border-radius: 10px;
  cursor: pointer;
  transition: all 0.15s;
}

.feature-chip.on {
  background: var(--fontist-rose, #bf4e6a);
  color: #fff;
  border-color: var(--fontist-rose, #bf4e6a);
}

/* Proprietary */
.specimen-unavailable {
  padding: 1.5rem;
  border-left: 3px solid var(--fontist-rose, #bf4e6a);
  background: var(--vp-c-bg-soft);
}

.unavailable-text {
  font-size: 0.9rem;
  color: var(--vp-c-text-2);
  margin: 0 0 0.3rem 0;
}

.unavailable-hint {
  font-size: 0.8rem;
  color: var(--vp-c-text-3);
  margin: 0;
}

.unavailable-hint code {
  font-family: var(--vp-font-family-mono, monospace);
  font-size: 0.75rem;
  background: var(--vp-c-bg);
  padding: 0.1em 0.3em;
  border-radius: 2px;
}
</style>
