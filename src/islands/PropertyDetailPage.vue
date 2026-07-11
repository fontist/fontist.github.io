<script setup lang="ts">
import { ref, computed, watch } from 'vue'
import { hexCp, safeChar, blockSlug, charRoute } from '../lib/unicode'
import { fetchJson } from '../lib/ssr-fetch'
import UnicodeBlockGrid from '../lib/unicode/components/UnicodeBlockGrid.vue'

const props = defineProps<{
  property: 'scripts' | 'category' | 'combining' | 'bidiclass'
  title: string
}>()

const data = ref<{ property: string; count: number; characters: any[] } | null>(null)

const valueParam = props.code
const indexUrl = computed(() => `unicode/indexes/${props.property}/${valueParam.value}.json`)

const blockWithChars = computed(() => {
  if (!data.value) return null
  return {
    name: `${props.title}: ${valueParam.value}`,
    start: 0,
    end: 0x10FFFF,
    range: '',
    plane: 'bmp' as const,
    displayName: `${props.title}: ${valueParam.value}`,
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
watch([valueParam, () => props.property], loadData)


function goToChar(cp: number) {
  window.location.href = charRoute(cp)
}
</script>

<template>
  <div class="pdp" v-if="data">
    <header class="pdp-head">
      <a href="/unicode" class="pdp-back">← Unicode</a>
      <a :href="`/unicode/${property}`" class="pdp-up">{{ title }} ↑</a>
      <h1>{{ valueParam }}</h1>
      <span class="pdp-count">{{ data.count.toLocaleString() }} characters</span>
    </header>

    <UnicodeBlockGrid
      v-if="blockWithChars"
      :block="blockWithChars"
      mode="standalone"
      :max-chars="100000"
      @select="goToChar"
    />
  </div>

  <div v-else class="pdp-loading">No characters found for "{{ valueParam }}".</div>
</template>

<style scoped>
/* All styles migrated to src/styles/main.css (@layer components). */
</style>
