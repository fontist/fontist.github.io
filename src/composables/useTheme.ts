import { ref, onMounted } from 'vue'
import {
  type Theme,
  STORAGE_KEY,
  detectTheme,
  toggleTheme,
  applyThemeClass,
} from '../lib/theme-state'

export type { Theme }

const theme = ref<Theme>('light')
let initialized = false

function init() {
  if (initialized) return
  initialized = true
  theme.value = detectTheme(
    typeof window === 'undefined'
      ? { localStorage: null, matchMedia: null }
      : { localStorage: window.localStorage, matchMedia: window.matchMedia?.bind(window) ?? null },
  )
  applyThemeClass(theme.value, document)
}

export function useTheme() {
  if (!initialized && typeof window !== 'undefined') init()

  onMounted(() => {
    if (!initialized) init()
    else applyThemeClass(theme.value, document)
  })

  function toggle() {
    if (!initialized) init()
    theme.value = toggleTheme(theme.value)
    if (typeof window !== 'undefined') {
      window.localStorage.setItem(STORAGE_KEY, theme.value)
    }
    applyThemeClass(theme.value, document)
  }

  return { theme, toggle }
}
