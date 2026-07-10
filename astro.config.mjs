import { defineConfig } from 'astro/config'
import vue from '@astrojs/vue'
import tailwindcss from '@tailwindcss/vite'

// Astro migration target config.
//
// Kept side-by-side with vite.config.ts (vite-ssg) until the migration
// in TODO.astro/ completes. CI/dev can use either; the eventual goal is
// to retire vite.config.ts + vite-ssg.
//
// Key choices:
//   - output: 'static' — emits pre-rendered HTML for every route
//     (replaces vite-ssg's ssgOptions.includedRoutes)
//   - build.format: 'directory' — emits /foo/index.html so both /foo
//     and /foo/ resolve on GitHub Pages (matches vite-ssg dirStyle:
//     'nested')
//   - Vue integration — lets us mount existing .vue components as
//     islands via client:load / client:visible / client:idle
//   - Tailwind 4 — Vite plugin, picks up src/styles/main.css with the
//     @theme block as-is
export default defineConfig({
  integrations: [vue()],
  vite: {
    plugins: [tailwindcss()],
  },
  output: 'static',
  site: 'https://www.fontist.org',
  build: {
    format: 'directory',
  },
})
