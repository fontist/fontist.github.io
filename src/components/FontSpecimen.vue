<script setup>
import { ref, computed, onMounted, watch, nextTick } from 'vue'
import { injectFontFace } from '../composables/useFontFace'
import { loadCoverage } from '../lib/unicode/coverage'
import { useFontVariation } from '../composables/useFontVariation'

const props = defineProps({
  slug: { type: String, required: true },
  familyName: { type: String, default: '' },
  description: { type: String, default: '' },
  fontPath: { type: String, default: null },
  coverageFile: { type: String, default: null },
  redistributable: { type: Boolean, default: false },
})

const fontId = ref(`ff-${props.slug.replace(/[^a-z0-9]/gi, '-')}`)
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

// The specimen fields are contenteditable AND were rendering their value via
// `{{ heroText }}` / `{{ bodyText }}`. Every keystroke wrote back to the ref,
// Vue re-rendered the text node, and the browser dropped the caret to
// position 0 — so typing or deleting jumped the cursor to the start.
//
// Treat them as uncontrolled instead: seed the DOM once, and afterwards push
// the value only into elements that are NOT focused. That keeps the mirrored
// strip sizes in sync with the field being edited without ever rewriting the
// node the user is typing in.
const heroEl = ref(null)
const bodyEls = ref([])

function syncText(el, value) {
  if (!el || el === document.activeElement) return
  if (el.textContent !== value) el.textContent = value
}

function onHeroInput(e) {
  heroText.value = e.target.textContent
}

function onBodyInput(e) {
  bodyText.value = e.target.textContent
}

watch(bodyText, (v) => bodyEls.value.forEach((el) => syncText(el, v)))
watch(heroText, (v) => syncText(heroEl.value, v))

onMounted(async () => {
  await nextTick()
  syncText(heroEl.value, heroText.value)
  bodyEls.value.forEach((el) => syncText(el, bodyText.value))
})

onMounted(async () => {
  if (props.redistributable && props.fontPath) {
    const { fontId: fid } = injectFontFace(props.slug, props.fontPath, props.redistributable)
    fontId.value = fid
  }
  const cov = await loadCoverage(props.coverageFile || props.slug)
  if (cov) {
    axes.value = cov.variable_axes || []
    features.value = cov.opentype_features || []
    initAxes(axes.value.map(a => ({ tag: a.tag, default: a.default })))
    initFeatures(features.value.map(f => ({ tag: f.tag })))
  }
})
</script>

<template>
  <section class="specimen" v-if="redistributable">
    <!-- Full-bleed editable specimen -->
    <!-- Content is set imperatively (see syncText) so editing never rewrites
         the focused node and resets the caret. -->
    <div
      ref="heroEl"
      class="specimen-hero"
      :contenteditable="true"
      :style="fontStyles"
      spellcheck="false"
      @input="onHeroInput"
    ></div>

    <!-- Multi-size specimen strip -->
    <div class="specimen-strip">
      <div
        v-for="(size, i) in [48, 24, 16]"
        :key="size"
        :ref="(el) => { if (el) bodyEls[i] = el }"
        class="specimen-line"
        :style="{ ...fontStyles, fontSize: size + 'px', lineHeight: 1.3 }"
        :contenteditable="true"
        spellcheck="false"
        @input="onBodyInput"
      ></div>
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
/* All styles migrated to src/styles/main.css (@layer components). */
</style>
