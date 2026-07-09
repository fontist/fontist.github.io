import { ViteSSG } from 'vite-ssg'
import { routes } from './router'
import App from './App.vue'
import './styles/main.css'
import './styles/essenfont-faces.css'

export const createApp = ViteSSG(
  App,
  {
    routes,
    base: '/',
    scrollBehavior(to, from, savedPosition) {
      if (savedPosition) return savedPosition
      if (to.hash) return { el: to.hash, behavior: 'smooth' }
      if (to.path !== from.path) return { top: 0 }
      return undefined
    },
  },
  () => {
    // Per-page useHead() calls live in the page components (Phase C).
  },
)
