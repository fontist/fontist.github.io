export type Theme = 'light' | 'dark'

export const STORAGE_KEY = 'fontist-theme'

export function detectTheme(env: {
  localStorage?: Storage | null
  matchMedia?: ((query: string) => { matches: boolean }) | null
}): Theme {
  const stored = env.localStorage?.getItem(STORAGE_KEY)
  if (stored === 'light' || stored === 'dark') return stored
  const prefersDark = env.matchMedia?.('(prefers-color-scheme: dark)')?.matches
  return prefersDark ? 'dark' : 'light'
}

export function toggleTheme(current: Theme): Theme {
  return current === 'dark' ? 'light' : 'dark'
}

export function applyThemeClass(t: Theme, doc: Document): void {
  const el = doc.documentElement
  if (t === 'dark') el.classList.add('dark')
  else el.classList.remove('dark')
}
