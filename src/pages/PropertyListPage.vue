<script setup lang="ts">
import { ref, computed } from 'vue'
import { RouterLink } from 'vue-router'
import { useHead } from '@unhead/vue'
import { hexCp } from '../lib/unicode'
import { fetchJson } from '../lib/ssr-fetch'

const props = defineProps<{
  property: 'scripts' | 'category' | 'combining' | 'bidiclass'
  title: string
  label: string
}>()

interface IndexEntry {
  value: string
  count: number
}

const entries = ref<IndexEntry[]>([])

const indexUrl = computed(() => `unicode/indexes/by-${props.property === 'scripts' ? 'script' : props.property === 'category' ? 'category' : props.property === 'combining' ? 'combining' : 'bidi'}.json`)
const detailPrefix = computed(() => `/unicode/${props.property}`)

try {
  const data = await fetchJson<Record<string, number>>(indexUrl.value)
  entries.value = Object.entries(data)
    .map(([value, count]) => ({ value, count: count as number }))
    .sort((a, b) => b.count - a.count)
} catch (e) { console.error(e) }

useHead({
  title: `${props.title} — Unicode ${props.property}`,
  link: [
    { rel: 'canonical', href: `https://www.fontist.org/unicode/${props.property}` },
  ],
})
</script>

<template>
  <div class="plp">
    <header class="plp-head">
      <RouterLink to="/unicode" class="plp-back">← Unicode</RouterLink>
      <h1>{{ title }}</h1>
      <span class="plp-count">{{ entries.length }} {{ label }}</span>
    </header>

    <div class="plp-grid">
      <RouterLink
        v-for="entry in entries"
        :key="entry.value"
        :to="`${detailPrefix}/${entry.value}`"
        class="plp-item"
      >
        <span class="plp-value">{{ entry.value }}</span>
        <span class="plp-count-num">{{ entry.count.toLocaleString() }}</span>
      </RouterLink>
    </div>
  </div>
</template>

<style scoped>
.plp { max-width: 880px; margin: 0 auto; padding: 2rem 1.5rem 4rem; }
.plp-head { margin-bottom: 1.5rem; padding-bottom: 0.75rem; border-bottom: 2px solid var(--vp-c-text-1, #1a1a1a); display: flex; align-items: baseline; gap: 1rem; flex-wrap: wrap; }
.plp-back { font-size: 0.75rem; color: var(--fontist-rose, #bf4e6a); text-decoration: none; }
.plp-head h1 { font-size: 1.4rem; font-weight: 700; margin: 0; }
.plp-count { font-size: 0.78rem; font-family: var(--spec-font-mono); color: var(--vp-c-text-3, #888); }

.plp-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(200px, 1fr)); gap: 1px; background: var(--vp-c-divider, #e8e6e0); border: 1px solid var(--vp-c-divider, #e8e6e0); }
.plp-item { display: flex; align-items: center; justify-content: space-between; padding: 0.7rem 1rem; background: var(--vp-c-bg, #fff); text-decoration: none; transition: background 0.1s; }
.plp-item:hover { background: var(--vp-c-bg-soft, #faf8f5); }
.plp-value { font-family: var(--spec-font-mono); font-size: 0.85rem; font-weight: 600; color: var(--vp-c-text-1, #1a1a1a); }
.plp-count-num { font-family: var(--spec-font-mono); font-size: 0.72rem; color: var(--vp-c-text-3, #888); }

.plp-loading { display: flex; align-items: center; justify-content: center; min-height: 40vh; color: var(--vp-c-text-3, #888); }
</style>
