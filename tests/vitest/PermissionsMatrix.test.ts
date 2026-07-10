import { describe, it, expect } from 'vitest'
import { mount } from '@vue/test-utils'
import PermissionsMatrix from '../../src/components/PermissionsMatrix.vue'

describe('PermissionsMatrix', () => {
  it('renders all 12 use-case rows', () => {
    const wrapper = mount(PermissionsMatrix, {
      props: {
        answers: {
          'commercial-static': 'yes',
          'modification': 'conditional',
          'standalone-sale': 'no',
        },
      },
    })
    const rows = wrapper.findAll('.pm-row')
    expect(rows).toHaveLength(12)
  })

  it('marks correct cells as active for each answer', () => {
    const wrapper = mount(PermissionsMatrix, {
      props: {
        answers: {
          'commercial-static': 'yes',
          'modification': 'conditional',
          'standalone-sale': 'no',
        },
      },
    })
    const yesCells = wrapper.findAll('.pm-cell--yes.pm-cell--active')
    const condCells = wrapper.findAll('.pm-cell--conditional.pm-cell--active')
    const noCells = wrapper.findAll('.pm-cell--no.pm-cell--active')
    // 1 explicit yes + 1 conditional + 1 explicit no + 9 unspecified (default to no)
    expect(yesCells.length).toBe(1)
    expect(condCells.length).toBe(1)
    expect(noCells.length).toBe(10)
  })

  it('renders legend with all 3 answer types', () => {
    const wrapper = mount(PermissionsMatrix, {
      props: { answers: {} },
    })
    const legendMarks = wrapper.findAll('.pm-legend-mark')
    expect(legendMarks.length).toBeGreaterThanOrEqual(3)
  })

  it('treats unspecified answers as "no"', () => {
    const wrapper = mount(PermissionsMatrix, {
      props: { answers: {} },
    })
    // All 12 use cases should show "no" active cells
    const noActive = wrapper.findAll('.pm-cell--no.pm-cell--active')
    expect(noActive).toHaveLength(12)
  })
})
