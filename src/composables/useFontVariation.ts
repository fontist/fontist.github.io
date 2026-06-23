import { reactive, computed } from 'vue'

const state = reactive({
  axes: {} as Record<string, number>,
  features: {} as Record<string, string>,
})

export function useFontVariation() {
  const variationCSS = computed(() => {
    const entries = Object.entries(state.axes)
    if (entries.length === 0) return undefined
    return entries.map(([k, v]) => `'${k}' ${v}`).join(', ')
  })

  const featureCSS = computed(() => {
    const entries = Object.entries(state.features).filter(([, v]) => v === 'on' || v === 'off')
    if (entries.length === 0) return undefined
    return entries.map(([k, v]) => `'${k}' ${v === 'on' ? 1 : 0}`).join(', ')
  })

  function initAxes(axes: Array<{ tag: string; default: number }>) {
    for (const a of axes) {
      if (!(a.tag in state.axes)) state.axes[a.tag] = a.default
    }
  }

  function initFeatures(features: Array<{ tag: string; default?: string }>) {
    for (const f of features) {
      if (!(f.tag in state.features)) state.features[f.tag] = f.default || 'off'
    }
  }

  function setAxis(tag: string, value: number) {
    state.axes[tag] = value
  }

  function toggleFeature(tag: string) {
    state.features[tag] = state.features[tag] === 'on' ? 'off' : 'on'
  }

  return { state, variationCSS, featureCSS, initAxes, initFeatures, setAxis, toggleFeature }
}
