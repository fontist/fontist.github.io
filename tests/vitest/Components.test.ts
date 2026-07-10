import { describe, it, expect } from 'vitest'
import { mount } from '@vue/test-utils'
import LicenseHero from '../../src/components/LicenseHero.vue'
import LicenseCard from '../../src/components/LicenseCard.vue'
import SiteFooter from '../../src/components/SiteFooter.vue'
import TopicCard from '../../src/components/TopicCard.vue'

describe('LicenseHero', () => {
  it('renders license name in display serif italic', () => {
    const wrapper = mount(LicenseHero, {
      props: {
        name: 'SIL Open Font License 1.1',
        spdx: 'OFL-1.1',
        shortName: 'OFL',
        category: 'permissive',
        summary: 'The workhorse font license.',
        formulaCount: 2029,
        formulaPercent: 47.4,
      },
    })
    expect(wrapper.find('.lh-name').text()).toBe('SIL Open Font License 1.1')
    expect(wrapper.find('.lh-spdx-val').text()).toBe('OFL-1.1')
    expect(wrapper.find('.lh-cat').text()).toBe('Permissive')
  })

  it('renders formula count with percentage', () => {
    const wrapper = mount(LicenseHero, {
      props: {
        name: 'MIT',
        spdx: 'MIT',
        category: 'permissive',
        summary: 'Short license.',
        formulaCount: 50,
        formulaPercent: 1.2,
      },
    })
    const num = wrapper.find('.lh-stat-num')
    expect(num.text()).toContain('50')
  })

  it('omits stats section when formulaCount is undefined', () => {
    const wrapper = mount(LicenseHero, {
      props: {
        name: 'Unknown',
        category: 'special',
        summary: 'Unknown license.',
      },
    })
    expect(wrapper.find('.lh-stat--emph').exists()).toBe(false)
  })
})

describe('LicenseCard', () => {
  it('renders license name + SPDX + blurb', () => {
    const wrapper = mount(LicenseCard, {
      props: {
        name: 'SIL Open Font License 1.1',
        spdx: 'OFL-1.1',
        shortName: 'OFL',
        category: 'permissive',
        blurb: 'The workhorse font license.',
        formulaCount: 2029,
        href: '/licenses/ofl',
      },
    })
    expect(wrapper.find('.lc-name').text()).toBe('SIL Open Font License 1.1')
    expect(wrapper.find('.lc-spdx').text()).toBe('OFL-1.1')
    expect(wrapper.find('.lc-blurb').text()).toContain('workhorse')
    expect(wrapper.find('.lc-foot-count').text()).toContain('2,029')
    expect(wrapper.attributes('href')).toBe('/licenses/ofl')
  })

  it('applies permissive category border color', () => {
    const wrapper = mount(LicenseCard, {
      props: {
        name: 'OFL',
        category: 'permissive',
        blurb: 'test',
        formulaCount: 1,
        href: '/licenses/ofl',
      },
    })
    expect(wrapper.classes()).toContain('lc--permissive')
  })

  it('applies copyleft category border color', () => {
    const wrapper = mount(LicenseCard, {
      props: {
        name: 'GPL',
        category: 'copyleft',
        blurb: 'test',
        formulaCount: 3,
        href: '/licenses/gpl',
      },
    })
    expect(wrapper.classes()).toContain('lc--copyleft')
  })
})

describe('SiteFooter', () => {
  it('renders rose diamond rule', () => {
    const wrapper = mount(SiteFooter, { global: { stubs: ['RouterLink'] } })
    expect(wrapper.find('.sf-rule-diamond').exists()).toBe(true)
  })

  it('renders 3 link columns', () => {
    const wrapper = mount(SiteFooter, { global: { stubs: ['RouterLink'] } })
    const cols = wrapper.findAll('.sf-col')
    expect(cols).toHaveLength(3)
  })

  it('renders copyright in base line', () => {
    const wrapper = mount(SiteFooter, { global: { stubs: ['RouterLink'] } })
    const base = wrapper.find('.sf-base-copy')
    expect(base.text()).toContain('Fontist')
    expect(base.text()).toContain('Ribose')
  })
})

describe('TopicCard', () => {
  it('renders title + blurb + reading time', () => {
    const wrapper = mount(TopicCard, {
      props: {
        title: 'What is a Formula?',
        blurb: 'Understanding Fontist formulas.',
        href: '/guide/what-is-formula',
        category: 'getting-started',
        readingMinutes: 4,
      },
    })
    expect(wrapper.find('.tc-title').text()).toBe('What is a Formula?')
    expect(wrapper.find('.tc-blurb').text()).toContain('formulas')
    expect(wrapper.find('.tc-time').text()).toContain('4 min')
  })

  it('applies category border color', () => {
    const wrapper = mount(TopicCard, {
      props: {
        title: 'Test',
        blurb: 'test',
        href: '/guide/test',
        category: 'typography',
      },
    })
    expect(wrapper.classes()).toContain('tc--typography')
  })

  it('renders featured variant spanning 2 columns', () => {
    const wrapper = mount(TopicCard, {
      props: {
        title: 'Featured',
        blurb: 'test',
        href: '/guide/featured',
        category: 'getting-started',
        featured: true,
      },
    })
    expect(wrapper.classes()).toContain('tc--featured')
  })
})
