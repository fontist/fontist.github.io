import { ViteSSG } from 'vite-ssg'
import { routes } from './router'
import App from './App.vue'
import './styles/main.css'

export const createApp = ViteSSG(
  App,
  { routes, base: '/' },
  () => {
    // Per-page useHead() calls live in the page components (Phase C).
  },
)
