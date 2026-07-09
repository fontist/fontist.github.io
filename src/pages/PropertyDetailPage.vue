<script setup lang="ts">
import { ref, computed, watch } from 'vue'
import { useRoute, useRouter, RouterLink } from 'vue-router'
import { useHead } from '@unhead/vue'
import { hexCp, safeChar, blockSlug, charRoute } from '../lib/unicode'
import { fetchJson } from '../lib/ssr-fetch'
import UnicodeBlockGrid from '../lib/unicode/components/UnicodeBlockGrid.vue'

const route = useRoute()
const router = useRouter()

const props = defineProps<{
  property: 'scripts' | 'category' | 'combining' | 'bidiclass'
  title: string
}>()

const data = ref<{ property: string; count: number; characters: any[] } | null>(null)

const valueParam = computed(() => route.params.code as string)
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

useHead(() => ({
  title: data.value
    ? `${props.title}: ${valueParam.value} (${data.value.count.toLocaleString()} chars) — Unicode`
    : `${props.title}: ${valueParam.value} — Unicode`,
  link: [
    { rel: 'canonical', href: `https://www.fontist.org/unicode/${props.property}/${valueParam.value}` },
  ],
}))

function goToChar(cp: number) {
  router.push(charRoute(cp))
}
</script>

<template>
  <div class="pdp" v-if="data">
    <header class="pdp-head">
      <RouterLink to="/unicode" class="pdp-back">← Unicode</RouterLink>
      <RouterLink :to="`/unicode/${property}`" class="pdp-up">{{ title }} ↑</RouterLink>
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
.pdp { max-width: 1200px; margin: 0 auto; padding: 1.5rem; }
.pdp-head { display: flex; align-items: baseline; gap: 1rem; flex-wrap: wrap; margin-bottom: 1rem; padding-bottom: 0.75rem; border-bottom: 2px solid var(--fontist-rose, #bf4e6a); }
.pdp-back { font-size: 0.85rem; color: var(--fontist-rose, #bf4e6a); text-decoration: none; }
.pdp-up { font-size: 0.78rem; color: var(--vp-c-text-3, #888); text-decoration: none; }
.pdp-up:hover { color: var(--fontist-rose, #bf4e6a); }
.pdp-head h1 { font-family: var(--spec-font-mono); font-size: 1.3rem; margin: 0; }
.pdp-count { font-size: 0.75rem; font-family: var(--spec-font-mono); color: var(--vp-c-text-3, #888); margin-left: auto; }
.pdp-loading { display: flex; align-items: center; justify-content: center; height: 50vh; color: var(--vp-c-text-3, #888); }
</style>
