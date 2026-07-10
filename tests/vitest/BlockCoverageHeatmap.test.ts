import { describe, it, expect } from 'vitest'
import { mount } from '@vue/test-utils'
import BlockCoverageHeatmap from '../../src/components/BlockCoverageHeatmap.vue'
import type { Coverage } from '../../src/lib/types/domain'

const mockCoverage: Coverage = {
  slug: 'google/abel',
  redistributable: true,
  total_codepoints: 248,
  supported_blocks: 11,
  total_blocks: 11,
  planes: { bmp: true, smp: false, sip: false },
  codepoints: [65, 66],
  blocks: [
    { name: 'Basic_Latin', range: 'U+0000–U+007F', start: 0, end: 127, codepoints: [65, 66] },
  ],
  variable_axes: [],
  opentype_features: [],
}

const mockUnicodeBlocks = [
  { name: 'Basic Latin', start: 0, end: 127 },
  { name: 'Latin-1 Supplement', start: 128, end: 255 },
]

describe('BlockCoverageHeatmap', () => {
  it('renders headline stat as % of global Unicode blocks', () => {
    const wrapper = mount(BlockCoverageHeatmap, {
      props: {
        fontSlug: 'abel',
        coverage: mockCoverage,
        unicodeBlocks: mockUnicodeBlocks,
      },
      global: { stubs: ['RouterLink'] },
    })
    const headline = wrapper.find('.cov-stats-num')
    expect(headline.exists()).toBe(true)
    // 1 supported block out of 2 total = 50%
    expect(headline.text()).toContain('50')
  })

  it('renders one tile per Unicode block', () => {
    const wrapper = mount(BlockCoverageHeatmap, {
      props: {
        fontSlug: 'abel',
        coverage: mockCoverage,
        unicodeBlocks: mockUnicodeBlocks,
      },
      global: { stubs: ['RouterLink'] },
    })
    const tiles = wrapper.findAll('.cov-tile')
    expect(tiles).toHaveLength(2)
  })

  it('assigns correct bucket class for partial coverage', () => {
    const wrapper = mount(BlockCoverageHeatmap, {
      props: {
        fontSlug: 'abel',
        coverage: mockCoverage,
        unicodeBlocks: mockUnicodeBlocks,
      },
      global: { stubs: ['RouterLink'] },
    })
    // Basic Latin: 2/128 ≈ 1.6% → 'low' bucket
    const firstTile = wrapper.findAll('.cov-tile')[0]
    expect(firstTile.classes()).toContain('t-low')
    // Latin-1 Supplement: 0/128 = 0% → 't-0' bucket
    const secondTile = wrapper.findAll('.cov-tile')[1]
    expect(secondTile.classes()).toContain('t-0')
  })

  it('renders plane filter pills', () => {
    const wrapper = mount(BlockCoverageHeatmap, {
      props: {
        fontSlug: 'abel',
        coverage: mockCoverage,
        unicodeBlocks: mockUnicodeBlocks,
      },
      global: { stubs: ['RouterLink'] },
    })
    const pills = wrapper.findAll('.cov-filter-pill')
    expect(pills.length).toBeGreaterThan(0)
    expect(pills[0].text()).toContain('All planes')
  })

  it('renders legend', () => {
    const wrapper = mount(BlockCoverageHeatmap, {
      props: {
        fontSlug: 'abel',
        coverage: mockCoverage,
        unicodeBlocks: mockUnicodeBlocks,
      },
      global: { stubs: ['RouterLink'] },
    })
    expect(wrapper.find('.cov-legend').exists()).toBe(true)
    expect(wrapper.findAll('.cov-legend-tile').length).toBeGreaterThanOrEqual(5)
  })

  it('shows "no coverage data" state when coverage is null', () => {
    const wrapper = mount(BlockCoverageHeatmap, {
      props: {
        fontSlug: 'unknown-font',
        coverage: null,
        unicodeBlocks: mockUnicodeBlocks,
      },
      global: { stubs: ['RouterLink'] },
    })
    expect(wrapper.find('.cov--nodata').exists()).toBe(true)
    const tiles = wrapper.findAll('.cov-tile')
    expect(tiles[0].classes()).toContain('t-unknown')
  })
})
