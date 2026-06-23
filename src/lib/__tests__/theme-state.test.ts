import { test } from 'node:test'
import assert from 'node:assert/strict'
import { detectTheme, toggleTheme, STORAGE_KEY } from '../theme-state.ts'

function makeStorage(initial: Record<string, string> = {}): Storage {
  const store = { ...initial }
  return {
    getItem: (k: string) => (k in store ? store[k] : null),
    setItem: (k: string, v: string) => { store[k] = v },
    removeItem: (k: string) => { delete store[k] },
    clear: () => { for (const k of Object.keys(store)) delete store[k] },
    key: (i: number) => Object.keys(store)[i] ?? null,
    get length() { return Object.keys(store).length },
  } as Storage
}

test('detectTheme: returns stored theme when localStorage has "dark"', () => {
  const t = detectTheme({
    localStorage: makeStorage({ [STORAGE_KEY]: 'dark' }),
    matchMedia: () => ({ matches: false }),
  })
  assert.equal(t, 'dark')
})

test('detectTheme: returns stored theme when localStorage has "light"', () => {
  const t = detectTheme({
    localStorage: makeStorage({ [STORAGE_KEY]: 'light' }),
    matchMedia: () => ({ matches: true }),
  })
  assert.equal(t, 'light')
})

test('detectTheme: falls back to prefers-color-scheme when no stored value', () => {
  const t = detectTheme({
    localStorage: makeStorage({}),
    matchMedia: () => ({ matches: true }),
  })
  assert.equal(t, 'dark')
})

test('detectTheme: defaults to light when prefers-color-scheme is light', () => {
  const t = detectTheme({
    localStorage: makeStorage({}),
    matchMedia: () => ({ matches: false }),
  })
  assert.equal(t, 'light')
})

test('detectTheme: defaults to light when localStorage is null (SSR)', () => {
  const t = detectTheme({ localStorage: null, matchMedia: null })
  assert.equal(t, 'light')
})

test('detectTheme: ignores invalid stored values', () => {
  const t = detectTheme({
    localStorage: makeStorage({ [STORAGE_KEY]: 'purple' }),
    matchMedia: () => ({ matches: false }),
  })
  assert.equal(t, 'light')
})

test('toggleTheme: flips dark to light', () => {
  assert.equal(toggleTheme('dark'), 'light')
})

test('toggleTheme: flips light to dark', () => {
  assert.equal(toggleTheme('light'), 'dark')
})
