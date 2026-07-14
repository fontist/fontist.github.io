<script setup lang="ts">
import { ref, computed, watch } from 'vue'
import { hexCp, safeChar, charRoute } from '../lib/unicode'
import { fetchJson } from '../lib/ssr-fetch'
import UnicodeBlockGrid from '../lib/unicode/components/UnicodeBlockGrid.vue'

const PAGE_SIZE = 512

const props = defineProps<{
  property: 'scripts' | 'category' | 'combining' | 'bidiclass'
  title: string
  code: string
}>()

const data = ref<{ property: string; count: number; characters: any[] } | null>(null)
const currentPage = ref(1)

const indexUrl = computed(() => `unicode/indexes/${props.property}/${props.code}.json`)

const allCharacters = computed(() => {
  if (!data.value) return []
  return data.value.characters.map((c: any) => ({
    cp: c.cp,
    hex: hexCp(c.cp),
    char: safeChar(c.cp),
    name: c.n || '',
    category: '',
    script: '',
  }))
})

const totalPages = computed(() => Math.max(1, Math.ceil(allCharacters.value.length / PAGE_SIZE)))

const pagedCharacters = computed(() => {
  const start = (currentPage.value - 1) * PAGE_SIZE
  return allCharacters.value.slice(start, start + PAGE_SIZE)
})

const pageStartCp = computed(() => pagedCharacters.value.length > 0 ? hexCp(pagedCharacters.value[0].cp) : '')
const pageEndCp = computed(() => pagedCharacters.value.length > 0 ? hexCp(pagedCharacters.value[pagedCharacters.value.length - 1].cp) : '')

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
    characters: pagedCharacters.value,
    assignedCount: allCharacters.value.length,
    unicodeVersion: '',
  }
})

async function loadData() {
  data.value = null
  currentPage.value = 1
  try {
    data.value = await fetchJson<typeof data.value>(indexUrl.value)
  } catch (e) { console.error(e) }

  const pageParam = typeof window !== 'undefined' ? new URLSearchParams(window.location.search).get('page') : null
  const p = pageParam ? parseInt(pageParam, 10) : 1
  currentPage.value = (isNaN(p) || p < 1) ? 1 : Math.min(p, totalPages.value)
}

await loadData()
watch(() => props.code, loadData)

const pageWindow = computed(() => {
  const pages: number[] = []
  const start = Math.max(1, currentPage.value - 2)
  const end = Math.min(totalPages.value, currentPage.value + 2)
  for (let i = start; i <= end; i++) pages.push(i)
  return pages
})

function goToPage(page: number) {
  currentPage.value = page
  const el = document.querySelector('.pdp')
  if (el) el.scrollIntoView({ behavior: 'smooth', block: 'start' })
  if (typeof window !== 'undefined') {
    const url = new URL(window.location.href)
    if (page > 1) url.searchParams.set('page', String(page))
    else url.searchParams.delete('page')
    window.history.replaceState({}, '', url)
  }
}

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

    <div v-if="totalPages > 1" class="pdp-page-info">
      Page {{ currentPage }} of {{ totalPages }} · {{ pageStartCp }}–{{ pageEndCp }}
    </div>

    <UnicodeBlockGrid
      v-if="blockWithChars"
      :block="blockWithChars"
      mode="standalone"
      :max-chars="PAGE_SIZE"
      @select="goToChar"
    />

    <nav v-if="totalPages > 1" class="pdp-pagination">
      <button class="pdp-page-btn" :disabled="currentPage === 1" @click="goToPage(currentPage - 1)">← Prev</button>
      <button v-if="pageWindow[0] > 1" class="pdp-page-btn" @click="goToPage(1)">1</button>
      <span v-if="pageWindow[0] > 2" class="pdp-page-ellipsis">…</span>
      <button
        v-for="page in pageWindow"
        :key="page"
        :class="['pdp-page-btn', { on: page === currentPage }]"
        @click="goToPage(page)"
      >{{ page }}</button>
      <span v-if="pageWindow[pageWindow.length - 1] < totalPages - 1" class="pdp-page-ellipsis">…</span>
      <button v-if="pageWindow[pageWindow.length - 1] < totalPages" class="pdp-page-btn" @click="goToPage(totalPages)">{{ totalPages }}</button>
      <button class="pdp-page-btn" :disabled="currentPage === totalPages" @click="goToPage(currentPage + 1)">Next →</button>
    </nav>
  </div>

  <div v-else class="pdp-loading">No characters found for "{{ code }}".</div>
</template>

<style scoped>
.pdp-page-info {
  font-family: var(--font-mono);
  font-size: 0.72rem;
  color: var(--color-mute);
  margin-bottom: 1rem;
  padding: 0.5rem 0;
}

.pdp-pagination {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 0.3rem;
  padding: 2rem 0;
  margin-top: 1rem;
  flex-wrap: wrap;
}

.pdp-page-btn {
  background: transparent;
  border: 1px solid var(--color-rule);
  border-radius: 2px;
  padding: 0.35rem 0.7rem;
  font-family: var(--font-mono);
  font-size: 0.72rem;
  color: var(--color-ink-soft);
  cursor: pointer;
  transition: all 0.15s;
  min-width: 32px;
}
.pdp-page-btn:hover:not(:disabled):not(.on) {
  border-color: var(--color-accent);
  color: var(--color-accent);
}
.pdp-page-btn.on {
  background: var(--color-accent);
  border-color: var(--color-accent);
  color: var(--color-paper);
}
.pdp-page-btn:disabled {
  opacity: 0.4;
  cursor: default;
}

.pdp-page-ellipsis {
  font-family: var(--font-mono);
  font-size: 0.72rem;
  color: var(--color-mute);
  padding: 0 0.3rem;
}
</style>
