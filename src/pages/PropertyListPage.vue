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
/* All styles migrated to src/styles/main.css (@layer components). */
</style>
