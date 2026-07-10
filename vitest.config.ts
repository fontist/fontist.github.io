/// <reference types="vitest" />
import { defineConfig } from 'vitest/config'
import vue from '@vitejs/plugin-vue'
import tailwindcss from '@tailwindcss/vite'
import { resolve } from 'node:path'

export default defineConfig({
  plugins: [vue(), tailwindcss()],
  resolve: {
    alias: {
      '@': resolve(__dirname, 'src'),
    },
  },
  test: {
    environment: 'happy-dom',
    globals: true,
    include: [
      'tests/**/*.{test,spec}.{ts,mts,vue}',
      'src/**/*.vitest.{test,spec}.ts',
      'src/**/__vitest__/*.{test,spec}.ts',
    ],
    exclude: ['node_modules', 'dist', 'tests/nav-consistency.spec.ts'],
  },
})
