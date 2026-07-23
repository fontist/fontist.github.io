import { describe, it, expect, beforeEach } from 'vitest'
import { nextTick } from 'vue'

// useFontVariation is a pure reactive module — no Vue lifecycle hooks needed to test logic.
import { useFontVariation } from '../../src/composables/useFontVariation'

// useFontFace is a pure DOM-mutation utility (no lifecycle hooks)
import { injectFontFace } from '../../src/composables/useFontFace'

describe('useFontVariation — reactive variation/feature state', () => {
  beforeEach(() => {
    const { reset } = useFontVariation()
    reset()
  })

  it('variationCSS is undefined when no axes set', () => {
    const { variationCSS } = useFontVariation()
    expect(variationCSS.value).toBeUndefined()
  })

  it('variationCSS renders font-variation-settings string', () => {
    const { initAxes, setAxis, variationCSS } = useFontVariation()
    initAxes([{ tag: 'wght', default: 400 }, { tag: 'wdth', default: 100 }])
    setAxis('wght', 700)
    expect(variationCSS.value).toBe("'wght' 700, 'wdth' 100")
  })

  it('featureCSS filters out non on/off values', () => {
    const { initFeatures, featureCSS } = useFontVariation()
    initFeatures([
      { tag: 'ss01', default: 'on' },
      { tag: 'liga', default: 'off' },
      { tag: 'dlig', default: 'unused' },
    ])
    expect(featureCSS.value).toBe("'ss01' 1, 'liga' 0")
  })

  it('featureCSS is undefined when no features on/off', () => {
    const { initFeatures, featureCSS } = useFontVariation()
    initFeatures([{ tag: 'liga', default: 'unused' }])
    expect(featureCSS.value).toBeUndefined()
  })

  it('toggleFeature flips on ↔ off', async () => {
    const { initFeatures, toggleFeature, state } = useFontVariation()
    initFeatures([{ tag: 'ss01', default: 'off' }])
    expect(state.features.ss01).toBe('off')
    toggleFeature('ss01')
    await nextTick()
    expect(state.features.ss01).toBe('on')
    toggleFeature('ss01')
    await nextTick()
    expect(state.features.ss01).toBe('off')
  })

  it('initAxes does not overwrite already-set axes', () => {
    const { initAxes, setAxis, state } = useFontVariation()
    initAxes([{ tag: 'wght', default: 400 }])
    setAxis('wght', 900)
    initAxes([{ tag: 'wght', default: 400 }])
    expect(state.axes.wght).toBe(900)
  })

  it('reset clears axes and features', () => {
    const { initAxes, initFeatures, reset, state } = useFontVariation()
    initAxes([{ tag: 'wght', default: 400 }])
    initFeatures([{ tag: 'ss01', default: 'on' }])
    reset()
    expect(Object.keys(state.axes)).toHaveLength(0)
    expect(Object.keys(state.features)).toHaveLength(0)
  })
})

describe('useFontFace — injectFontFace DOM injection', () => {
  it('returns lowercase font id with slug sanitized', () => {
    const { fontId } = injectFontFace('NotoSans_JP', 'path/font.woff2', true)
    expect(fontId).toBe('ff-NotoSans-JP')
  })

  it('ensureInjected returns false when font is not redistributable', () => {
    const { ensureInjected } = injectFontFace('prop', 'path/font.woff2', false)
    expect(ensureInjected()).toBe(false)
  })

  it('ensureInjected returns false when fontPath is empty', () => {
    const { ensureInjected } = injectFontFace('prop', '', true)
    expect(ensureInjected()).toBe(false)
  })

  it('ensureInjected injects <style> for redistributable font with path', () => {
    document.head.innerHTML = ''
    const { ensureInjected, fontId } = injectFontFace('abeezee', 'woff/google/abeezee/ABeeZee-Regular.woff', true)
    const result = ensureInjected()
    expect(result).toBe(true)
    const style = document.getElementById(`ff-style-${fontId}`)
    expect(style).toBeTruthy()
    expect(style!.textContent).toContain(`'${fontId}'`)
    expect(style!.textContent).toContain("format('woff')")
    expect(style!.textContent).toContain('font-display:swap')
  })

  it('ensureInjected is idempotent — calling twice does not double-inject', () => {
    document.head.innerHTML = ''
    const inj1 = injectFontFace('idem', 'woff/x.woff2', true)
    inj1.ensureInjected()
    const inj2 = injectFontFace('idem', 'woff/x.woff2', true)
    inj2.ensureInjected()
    const styles = document.querySelectorAll('style[id^="ff-style-"]')
    expect(styles.length).toBe(1)
  })
})
