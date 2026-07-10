import { describe, it, expect } from 'vitest'
import { mount } from '@vue/test-utils'
import AstroDemoIsland from '../../src/components/AstroDemoIsland.vue'

describe('AstroDemoIsland — Vue island proof', () => {
  it('renders the label in button', () => {
    const w = mount(AstroDemoIsland, { props: { label: 'Press' } })
    expect(w.find('button').text()).toContain('Press')
    expect(w.find('button').text()).toContain('0')
  })

  it('increments count on click', async () => {
    const w = mount(AstroDemoIsland, { props: { label: 'L' } })
    expect(w.find('button').text()).toContain('0')
    await w.find('button').trigger('click')
    await w.find('button').trigger('click')
    expect(w.find('button').text()).toContain('2')
  })

  it('has Tailwind utility classes applied', () => {
    const w = mount(AstroDemoIsland, { props: { label: 'L' } })
    const btn = w.find('button')
    expect(btn.classes()).toContain('px-3')
    expect(btn.classes()).toContain('py-1')
    expect(btn.classes()).toContain('bg-ink')
    expect(btn.classes()).toContain('text-paper')
    expect(btn.classes()).toContain('font-mono')
  })

  it('uses default label when none provided', () => {
    const w = mount(AstroDemoIsland)
    expect(w.find('button').text()).toContain('Click')
  })
})
