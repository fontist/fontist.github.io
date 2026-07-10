import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'
import tailwindcss from '@tailwindcss/vite'
import { readFileSync } from 'node:fs'
import { resolve } from 'node:path'

function readSsgRoutes(): string[] {
  try {
    const p = resolve(process.cwd(), 'public/ssg-routes.json')
    return JSON.parse(readFileSync(p, 'utf8'))
  } catch {
    return ['/']
  }
}

export default defineConfig({
  plugins: [vue(), tailwindcss()],
  base: '/',
  ssgOptions: {
    dirStyle: 'nested',
    includedRoutes: () => readSsgRoutes(),
  },
})
