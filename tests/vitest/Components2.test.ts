import { describe, it, expect, vi, beforeEach } from 'vitest'
import { mount } from '@vue/test-utils'
import { nextTick } from 'vue'

import LicenseBadge from '../../src/components/LicenseBadge.vue'
import FontSpecimen from '../../src/components/FontSpecimen.vue'
import NavDocsDropdown from '../../src/components/NavDocsDropdown.vue'
import ShaCopy from '../../src/components/ShaCopy.vue'

describe('LicenseBadge — img src/alt', () => {
  it('renders img with data URL src', () => {
    const w = mount(LicenseBadge, { props: { label: 'License', text: 'OFL' } })
    const img = w.find('img')
    expect(img.exists()).toBe(true)
    expect(img.attributes('src')).toMatch(/^data:image\/svg\+xml,/)
  })

  it('uses label + text in alt', () => {
    const w = mount(LicenseBadge, { props: { label: 'License', text: 'MIT' } })
    expect(w.find('img').attributes('alt')).toBe('License: MIT')
  })

  it('encodes color into SVG payload', () => {
    const w = mount(LicenseBadge, {
      props: { label: 'L', text: 'X', color: '#ff0000' },
    })
    const src = w.find('img').attributes('src') ?? ''
    expect(src).toContain(encodeURIComponent('#ff0000').replace(/%23/, '%23'))
    // hex color should appear URL-encoded somewhere in payload
    expect(decodeURIComponent(src)).toContain('#ff0000')
  })

  it('default color is #28a745', () => {
    const w = mount(LicenseBadge, { props: { label: 'L', text: 'X' } })
    const src = w.find('img').attributes('src') ?? ''
    expect(decodeURIComponent(src)).toContain('#28a745')
  })
})

describe('FontSpecimen — availability gating', () => {
  beforeEach(() => {
    document.head.innerHTML = ''
  })

  it('renders specimen hero when redistributable + path', () => {
    const w = mount(FontSpecimen, {
      props: {
        slug: 'abeezee',
        familyName: 'ABeeZee',
        redistributable: true,
        fontPath: 'woff/google/abeezee/ABeeZee-Regular.woff',
        coverageFile: 'coverage/google/abeezee/ABeeZee-Regular.json',
      },
    })
    expect(w.find('.specimen').exists()).toBe(true)
    expect(w.find('.specimen-hero').exists()).toBe(true)
    expect(w.find('.specimen-unavailable').exists()).toBe(false)
  })

  it('renders unavailable section when not redistributable', () => {
    const w = mount(FontSpecimen, {
      props: {
        slug: 'proprietary',
        redistributable: false,
      },
    })
    expect(w.find('.specimen').exists()).toBe(false)
    expect(w.find('.specimen-unavailable').exists()).toBe(true)
    expect(w.text()).toContain('Specimen unavailable')
    expect(w.text()).toContain('fontist install --formula "proprietary"')
  })

  it('shows editable specimen-strip with 3 size lines', () => {
    const w = mount(FontSpecimen, {
      props: {
        slug: 'abeezee',
        redistributable: true,
        fontPath: 'woff/x.woff',
      },
    })
    const lines = w.findAll('.specimen-line')
    expect(lines.length).toBe(3)
    // Each line is contenteditable
    for (const line of lines) {
      expect(line.attributes('contenteditable')).toBe('true')
    }
  })

  it('hides controls when no axes/features loaded', () => {
    const w = mount(FontSpecimen, {
      props: { slug: 'abeezee', redistributable: true, fontPath: 'woff/x.woff' },
    })
    expect(w.find('.specimen-controls').exists()).toBe(false)
  })

  it('hero text is contenteditable', () => {
    const w = mount(FontSpecimen, {
      props: { slug: 'abeezee', redistributable: true, fontPath: 'woff/x.woff' },
    })
    const hero = w.find('.specimen-hero')
    expect(hero.attributes('contenteditable')).toBe('true')
  })
})

describe('NavDocsDropdown — menu structure', () => {
  it('renders a trigger button', () => {
    const w = mount(NavDocsDropdown)
    // Should have some kind of clickable trigger
    const trigger = w.find('button, a, [role="button"]')
    expect(trigger.exists()).toBe(true)
  })

  it('renders without throwing even when items are empty', () => {
    expect(() => mount(NavDocsDropdown)).not.toThrow()
  })
})

describe('ShaCopy — clipboard behavior', () => {
  beforeEach(() => {
    // happy-dom: navigator.clipboard may not exist; provide a stub.
    if (!navigator.clipboard) {
      Object.defineProperty(navigator, 'clipboard', {
        value: { writeText: vi.fn().mockResolvedValue(undefined) },
        configurable: true,
        writable: true,
      })
    } else {
      vi.spyOn(navigator.clipboard, 'writeText').mockResolvedValue(undefined)
    }
  })

  it('mounts without throwing', async () => {
    document.body.innerHTML = ''
    expect(() => mount(ShaCopy)).not.toThrow()
  })
})
