<script setup lang="ts">
import { ref, computed, watch } from 'vue'
import { loadAllBlocks, loadBlockCharacters, blockDisplayName, hexCp, scriptGroup, charRoute } from '../lib/unicode'
import type { UnicodeBlock } from '../lib/unicode'
import UnicodeBlockGrid from '../lib/unicode/components/UnicodeBlockGrid.vue'
import type { FontContext } from '../lib/types/domain'
import { resolveFontContexts, parseFontSlugsFromQuery } from '../lib/fonts/compare-context'

const PAGE_SIZE = 512

const props = defineProps({
  blockSlug: { type: String, required: true }
})

const blockSlugParam = props.blockSlug
const fontSlugs = computed(() => parseFontSlugsFromQuery((typeof window !== 'undefined' ? new URLSearchParams(window.location.search).get('fonts') : null)))

const block = ref<UnicodeBlock | null>(null)
const characters = ref<any[]>([])
const fontContexts = ref<FontContext[]>([])
const currentPage = ref(1)

const totalPages = computed(() => Math.max(1, Math.ceil(characters.value.length / PAGE_SIZE)))

const pagedCharacters = computed(() => {
  const start = (currentPage.value - 1) * PAGE_SIZE
  return characters.value.slice(start, start + PAGE_SIZE)
})

const pageStartCp = computed(() => {
  if (!block.value || pagedCharacters.value.length === 0) return ''
  return hexCp(pagedCharacters.value[0].cp)
})
const pageEndCp = computed(() => {
  if (!block.value || pagedCharacters.value.length === 0) return ''
  return hexCp(pagedCharacters.value[pagedCharacters.value.length - 1].cp)
})

const blockWithChars = computed(() =>
  block.value
    ? { ...block.value, characters: pagedCharacters.value, assignedCount: characters.value.length }
    : null
)

const isPrivateUse = computed(() =>
  block.value?.name.toLowerCase().includes('private use') ?? false
)

const gridMode = computed(() => (fontContexts.value.length > 1 ? 'multi-font' : fontContexts.value.length === 1 ? 'per-font' : 'standalone'))

async function loadData() {
  const allBlocks = await loadAllBlocks()
  const found = allBlocks.find(b => {
    const slug = b.name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '')
    return slug === blockSlugParam
  })
  if (found) {
    block.value = found
    characters.value = await loadBlockCharacters(found.name)
  } else {
    block.value = null
  }

  if (fontSlugs.value.length > 0) {
    fontContexts.value = await resolveFontContexts(fontSlugs.value)
  } else {
    fontContexts.value = []
  }

  const pageParam = typeof window !== 'undefined' ? new URLSearchParams(window.location.search).get('page') : null
  const p = pageParam ? parseInt(pageParam, 10) : 1
  currentPage.value = (isNaN(p) || p < 1) ? 1 : Math.min(p, totalPages.value)
}

await loadData()
watch([blockSlugParam, fontSlugs], loadData)

const compareTitle = computed(() => {
  if (fontContexts.value.length === 0) return null
  return fontContexts.value.map(f => f.familyName).join(' · ')
})

const pageWindow = computed(() => {
  const pages: number[] = []
  const start = Math.max(1, currentPage.value - 2)
  const end = Math.min(totalPages.value, currentPage.value + 2)
  for (let i = start; i <= end; i++) pages.push(i)
  return pages
})

function goToPage(page: number) {
  currentPage.value = page
  const el = document.querySelector('.ubp')
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
  <div class="ubp" v-if="block">
    <header class="ubp-head">
      <a href="/unicode" class="ubp-back">← Unicode Browser</a>
      <h1>{{ blockDisplayName(block.name) }}</h1>
      <span class="ubp-meta">{{ hexCp(block.start) }}–{{ hexCp(block.end) }} · {{ characters.length }} assigned characters</span>
    </header>

    <div class="ubp-script" v-if="fontContexts.length > 0">{{ scriptGroup(block.name) }}</div>

    <div v-if="fontContexts.length > 0" class="ubp-compare">
      <div class="ubp-compare-title">Comparing {{ fontContexts.length }} fonts:</div>
      <ul class="ubp-compare-list">
        <li v-for="f in fontContexts" :key="f.slug">
          <span class="ubp-compare-swatch" :style="{ background: f.color }"></span>
          <span class="ubp-compare-name">{{ f.familyName }}</span>
          <span class="ubp-compare-slug">{{ f.slug }}</span>
        </li>
      </ul>
    </div>

    <div class="ubp-script" v-if="fontContexts.length === 0">{{ scriptGroup(block.name) }}</div>

    <div class="ubp-pua-notice" v-if="isPrivateUse && characters.length === 0">
      <h2>Private Use Area — No Assigned Characters</h2>
      <p>
        Codepoints in this range are <strong>not assigned</strong> by the Unicode Standard.
        They are reserved for private, corporate, or application-specific use.
      </p>
      <p>
        Font developers and organizations may define their own glyphs here, but these
        assignments are not portable across systems. The Unicode Standard guarantees
        these codepoints will never be assigned characters.
      </p>
      <p class="ubp-pua-link">
        <a :href="`https://www.unicode.org/versions/latest/charts/`" target="_blank" rel="noopener">
          Unicode Standard documentation ↗
        </a>
      </p>
    </div>

    <template v-else-if="blockWithChars">
      <div v-if="totalPages > 1" class="ubp-page-info">
        Page {{ currentPage }} of {{ totalPages }} · {{ pageStartCp }}–{{ pageEndCp }}
      </div>

      <UnicodeBlockGrid
        :block="blockWithChars"
        :fonts="fontContexts"
        :mode="gridMode"
        :show-missing="true"
        :max-chars="PAGE_SIZE"
        @select="goToChar"
      />

      <nav v-if="totalPages > 1" class="ubp-pagination">
        <button class="ubp-page-btn" :disabled="currentPage === 1" @click="goToPage(currentPage - 1)">← Prev</button>
        <button v-if="pageWindow[0] > 1" class="ubp-page-btn" @click="goToPage(1)">1</button>
        <span v-if="pageWindow[0] > 2" class="ubp-page-ellipsis">…</span>
        <button
          v-for="page in pageWindow"
          :key="page"
          :class="['ubp-page-btn', { on: page === currentPage }]"
          @click="goToPage(page)"
        >{{ page }}</button>
        <span v-if="pageWindow[pageWindow.length - 1] < totalPages - 1" class="ubp-page-ellipsis">…</span>
        <button v-if="pageWindow[pageWindow.length - 1] < totalPages" class="ubp-page-btn" @click="goToPage(totalPages)">{{ totalPages }}</button>
        <button class="ubp-page-btn" :disabled="currentPage === totalPages" @click="goToPage(currentPage + 1)">Next →</button>
      </nav>
    </template>
  </div>

  <div v-else class="ubp-loading">Block "{{ blockSlugParam }}" not found.</div>
</template>

<style scoped>
.ubp-page-info {
  font-family: var(--font-mono);
  font-size: 0.72rem;
  color: var(--color-mute);
  margin-bottom: 1rem;
  padding: 0.5rem 0;
}

.ubp-pagination {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 0.3rem;
  padding: 2rem 0;
  margin-top: 1rem;
  flex-wrap: wrap;
}

.ubp-page-btn {
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
.ubp-page-btn:hover:not(:disabled):not(.on) {
  border-color: var(--color-accent);
  color: var(--color-accent);
}
.ubp-page-btn.on {
  background: var(--color-accent);
  border-color: var(--color-accent);
  color: var(--color-paper);
}
.ubp-page-btn:disabled {
  opacity: 0.4;
  cursor: default;
}

.ubp-page-ellipsis {
  font-family: var(--font-mono);
  font-size: 0.72rem;
  color: var(--color-mute);
  padding: 0 0.3rem;
}
</style>
