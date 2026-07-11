import { defineConfig } from 'astro/config'
import vue from '@astrojs/vue'
import mdx from '@astrojs/mdx'
import tailwindcss from '@tailwindcss/vite'

export default defineConfig({
  integrations: [vue(), mdx()],
  vite: {
    plugins: [tailwindcss()],
  },
  output: 'static',
  site: 'https://www.fontist.org',
  build: {
    format: 'directory',
  },
})
