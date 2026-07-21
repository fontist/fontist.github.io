import { defineConfig } from 'astro/config'
import vue from '@astrojs/vue'
import mdx from '@astrojs/mdx'
import tailwindcss from '@tailwindcss/vite'

export default defineConfig({
  integrations: [vue(), mdx()],
  vite: {
    plugins: [tailwindcss()],
    server: {
      watch: {
        // vendor/ is fetched build input (the archive-public clone, the ~16k
        // per-style metadata files under vendor/metadata AND under the
        // vendor/archive-*/metadata checkouts, the manifest). The dev server's
        // file watcher would try to watch all of it and exhaust file
        // descriptors (EMFILE), crashing HMR. Nothing in vendor/ is read at
        // dev-serve time — gen-font-families reads it once at build. Production
        // (astro build) does not watch at all, so this is dev-only.
        ignored: ['**/vendor/**'],
      },
    },
  },
  output: 'static',
  site: 'https://www.fontist.org',
  build: {
    format: 'directory',
  },
})
