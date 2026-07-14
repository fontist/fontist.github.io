<script setup lang="ts">
import { ref, computed, watch } from 'vue'
import { hexCp, safeChar, charRoute } from '../lib/unicode'
import { fetchJson } from '../lib/ssr-fetch'
import UnicodeBlockGrid from '../lib/unicode/components/UnicodeBlockGrid.vue'

const props = defineProps<{
  property: 'scripts' | 'category' | 'combining' | 'bidiclass'
  title: string
  code: string
}>()

const data = ref<{ property: string; count: number; characters: any[] } | null>(null)

const indexUrl = computed(() => `unicode/indexes/${props.property}/${props.code}.json`)

const blockWithChars = computed(() => {
  if (!data.value) return null
  return {
    name: `${props.title}: ${props.code}`,
    start: 0,
    end: 0x10FFFF,
    range: '',
    plane: 'bmp' as const,
    displayName: `${props.title}: ${props.code}`,
    scriptGroup: '',
    characters: data.value.characters.map((c: any) => ({
      cp: c.cp,
      hex: hexCp(c.cp),
      char: safeChar(c.cp),
      name: c.n || '',
      category: '',
      script: '',
    })),
    assignedCount: data.value.characters.length,
    unicodeVersion: '',
  }
})

async function loadData() {
  data.value = null
  try {
    data.value = await fetchJson<typeof data.value>(indexUrl.value)
  } catch (e) { console.error(e) }
}

await loadData()
watch(() => props.code, loadData)

function goToChar(cp: number) {
  window.location.href = charRoute(cp)
}
</script>

<template>
  <div class="pdp" v-if="data">
    <header class="pdp-head">
      <a href="/unicode" class="pdp-back">← Unicode</a>
      <a :href="`/unicode/${property}`" class="pdp-up">{{ title }} ↑</a>
      <h1>{{ code }}</h1>
      <span class="pdp-count">{{ data.count.toLocaleString() }} characters</span>
    </header>

    <UnicodeBlockGrid
      v-if="blockWithChars"
      :block="blockWithChars"
      mode="standalone"
      @select="goToChar"
    />
  </div>

  <div v-else class="pdp-loading">No characters found for "{{ code }}".</div>
</template>

<style scoped>
/* All styles migrated to src/styles/main.css (@layer components). */
</style>
