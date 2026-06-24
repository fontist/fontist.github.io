<script setup lang="ts">
import { ref, computed, watch } from 'vue'
import { useRoute, useRouter, RouterLink } from 'vue-router'
import { useHead } from '@unhead/vue'
import { injectFontFace } from '../composables/useFontFace'
import { fetchCoverage } from '../composables/useCoverage'
import { loadFontsRegistry, loadFontMetadata } from '../lib/fonts/loader'
import type { Coverage } from '../lib/types/domain'

const route = useRoute()
const router = useRouter()

interface FontEntry {
  slug: string
  name: string
  formulas: string[]
  styleCount: number
}

interface FontColumn {
  slug: string
  name: string
  fontId: string
  coverage: Coverage | null
  weight: number
  weightMin: number
  weightMax: number
  loading: boolean
}

const allFonts = ref<FontEntry[]>([])
const availableSlugs = ref<Set<string>>(new Set())
const columns = ref<FontColumn[]>([])
const searchText = ref('')
const loadingRegistry = ref(true)

const SPECIMEN_DEFAULT = 'Finding efficient flow · 0123456789'
const specimenText = ref(SPECIMEN_DEFAULT)

const slugsFromUrl = computed(() => {
  const param = route.params.fonts as string | undefined
  if (!param) return []
  return param.split(',').filter(Boolean).slice(0, 4)
})

const fontNames = computed(() => allFonts.value.map(f => `${f.name} (${f.slug})`).sort())

async function loadRegistry() {
  loadingRegistry.value = true
  try {
    const data = await loadFontsRegistry()
    allFonts.value = data.fonts.map((f) => ({
      slug: f.slug,
      name: f.canonical_name,
      formulas: f.formulas,
      styleCount: f.style_count,
    }))

    const meta = await loadFontMetadata()
    availableSlugs.value = new Set(meta.fonts.map((f) => f.slug))
  } catch (e) {
    console.error('Failed to load font registry', e)
  } finally {
    loadingRegistry.value = false
  }
}

async function addFont(slug: string) {
  if (columns.value.length >= 4) return
  if (columns.value.some(c => c.slug === slug)) return
  if (!availableSlugs.value.has(slug)) return

  const entry = allFonts.value.find(f => f.slug === slug)
  const { fontId, ensureInjected } = injectFontFace(slug, `fonts/${slug}.woff2`, true)
  ensureInjected()

  const col: FontColumn = {
    slug,
    name: entry?.name || slug,
    fontId,
    coverage: null,
    weight: 400,
    weightMin: 100,
    weightMax: 900,
    loading: true,
  }
  columns.value.push(col)

  col.coverage = await fetchCoverage(slug)
  if (col.coverage?.variable_axes) {
    const wght = col.coverage.variable_axes.find(a => a.tag === 'wght')
    if (wght) {
      col.weightMin = wght.min
      col.weightMax = wght.max
      col.weight = wght.default
    }
  }
  col.loading = false
  updateUrl()
}

function removeFont(slug: string) {
  columns.value = columns.value.filter(c => c.slug !== slug)
  updateUrl()
}

function updateUrl() {
  const slugs = columns.value.map(c => c.slug).join(',')
  const path = slugs ? `/compare/${slugs}` : '/compare'
  router.replace(path)
}

function onSearchSubmit() {
  const text = searchText.value.trim()
  if (!text) return
  const entry = allFonts.value.find(f =>
    f.slug === text || f.name.toLowerCase() === text.toLowerCase()
  )
  if (entry) {
    addFont(entry.slug)
    searchText.value = ''
  }
}

function specimenStyle(col: FontColumn): Record<string, string> {
  const s: Record<string, string> = { fontFamily: `'${col.fontId}', sans-serif` }
  if (col.weight && col.weight !== 400) {
    s.fontWeight = String(col.weight)
    s.fontVariationSettings = `"wght" ${col.weight}`
  }
  return s
}

await loadRegistry()
for (const slug of slugsFromUrl.value) {
  await addFont(slug)
}

useHead({
  title: 'Compare Fonts — Fontist',
  meta: [
    { name: 'description', content: 'Compare up to four fonts side by side. Specimen text, weight axes, and Unicode coverage comparison.' },
    { property: 'og:title', content: 'Compare Fonts — Fontist' },
    { property: 'og:type', content: 'website' },
  ],
  link: [
    { rel: 'canonical', href: 'https://www.fontist.org/compare' },
  ],
})

watch(slugsFromUrl, (newSlugs) => {
  const current = columns.value.map(c => c.slug)
  if (JSON.stringify(current) !== JSON.stringify(newSlugs)) {
    columns.value = []
    for (const slug of newSlugs) {
      addFont(slug)
    }
  }
})
</script>

<template>
  <div class="cmp">
    <header class="cmp-header">
      <h1 class="cmp-title">Compare Fonts</h1>
      <p class="cmp-subtitle">Side-by-side specimen comparison — select up to 4 fonts</p>
    </header>

    <!-- Font selector -->
    <div class="cmp-selector">
      <input
        v-model="searchText"
        list="font-list"
        placeholder="Type a font name or slug…"
        class="cmp-search"
        @keydown.enter="onSearchSubmit"
      />
      <datalist id="font-list">
        <option
          v-for="name in fontNames"
          :key="name"
          :value="name"
        />
      </datalist>
      <button
        class="cmp-add-btn"
        :disabled="!searchText.trim() || columns.length >= 4"
        @click="onSearchSubmit"
      >Add</button>
      <span class="cmp-count">{{ columns.length }}/4 selected</span>
    </div>

    <!-- Shared specimen editor -->
    <div class="cmp-specimen-bar" v-if="columns.length > 0">
      <label class="cmp-specimen-label">Shared specimen text</label>
      <input
        v-model="specimenText"
        class="cmp-specimen-input"
      />
    </div>

    <!-- Empty state -->
    <div class="cmp-empty" v-if="columns.length === 0 && !loadingRegistry">
      <p class="cmp-empty-text">No fonts selected. Search above to add fonts for comparison.</p>
      <div class="cmp-suggestions" v-if="availableSlugs.size > 0">
        <p class="cmp-suggestion-label">Try:</p>
        <button
          v-for="slug in ['inter', 'abel', 'acme', 'alegreya'].filter(s => availableSlugs.has(s)).slice(0, 4)"
          :key="slug"
          class="cmp-suggestion"
          @click="addFont(slug)"
        >{{ slug }}</button>
      </div>
    </div>

    <div v-else-if="loadingRegistry" class="cmp-loading">Loading font registry…</div>

    <!-- Comparison columns -->
    <div class="cmp-columns" v-if="columns.length > 0">
      <div
        v-for="col in columns"
        :key="col.slug"
        class="cmp-col"
      >
        <div class="cmp-col-head">
          <RouterLink :to="`/fonts/${col.slug}`" class="cmp-col-name">{{ col.name }}</RouterLink>
          <button class="cmp-remove" @click="removeFont(col.slug)">×</button>
        </div>
        <code class="cmp-col-slug">{{ col.slug }}</code>

        <!-- Large specimen -->
        <div class="cmp-specimen-hero" :style="specimenStyle(col)">{{ specimenText }}</div>

        <!-- Variable weight control -->
        <div class="cmp-weight" v-if="col.weightMax > col.weightMin">
          <label>
            <span>Weight</span>
            <span class="cmp-weight-val">{{ col.weight }}</span>
          </label>
          <input
            type="range"
            :min="col.weightMin"
            :max="col.weightMax"
            v-model.number="col.weight"
            class="cmp-slider"
          />
        </div>

        <!-- Coverage stats -->
        <div class="cmp-stats" v-if="col.coverage && !col.loading">
          <div class="cmp-stat">
            <span class="cmp-stat-num">{{ col.coverage.total_codepoints?.toLocaleString() }}</span>
            <span class="cmp-stat-label">codepoints</span>
          </div>
          <div class="cmp-stat">
            <span class="cmp-stat-num">{{ col.coverage.supported_blocks }}</span>
            <span class="cmp-stat-label">blocks</span>
          </div>
          <div class="cmp-stat" v-if="col.coverage.opentype_features?.length">
            <span class="cmp-stat-num">{{ col.coverage.opentype_features.length }}</span>
            <span class="cmp-stat-label">OT features</span>
          </div>
        </div>

        <RouterLink :to="`/fonts/${col.slug}/unicode`" class="cmp-cov-link">Unicode coverage →</RouterLink>
      </div>
    </div>
  </div>
</template>

<style scoped>
.cmp {
  max-width: 1200px;
  margin: 0 auto;
  padding: 2rem 1.5rem 4rem;
}

.cmp-header { margin-bottom: 1.5rem; }
.cmp-title {
  font-size: 1.8rem;
  font-weight: 700;
  margin: 0 0 0.25rem;
  color: var(--vp-c-text-1, #1a1a1a);
  letter-spacing: -0.02em;
}
.cmp-subtitle {
  font-size: 0.85rem;
  color: var(--vp-c-text-3, #888);
  margin: 0;
}

/* Selector */
.cmp-selector {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  margin-bottom: 1rem;
  flex-wrap: wrap;
}
.cmp-search {
  flex: 1;
  min-width: 200px;
  max-width: 400px;
  padding: 0.5rem 0.75rem;
  font-size: 0.85rem;
  border: 1px solid var(--vp-c-divider, #e2e2e3);
  border-radius: 4px;
  background: var(--vp-c-bg, #fff);
  color: var(--vp-c-text-1, #1a1a1a);
  outline: none;
  transition: border-color 0.15s;
}
.cmp-search:focus { border-color: var(--fontist-rose, #bf4e6a); }
.cmp-add-btn {
  padding: 0.5rem 1rem;
  font-size: 0.8rem;
  font-weight: 600;
  background: var(--fontist-rose, #bf4e6a);
  color: #fff;
  border: none;
  border-radius: 4px;
  cursor: pointer;
  transition: opacity 0.15s;
}
.cmp-add-btn:disabled { opacity: 0.4; cursor: not-allowed; }
.cmp-count {
  font-size: 0.75rem;
  font-family: var(--spec-font-mono);
  color: var(--vp-c-text-3, #888);
}

/* Shared specimen bar */
.cmp-specimen-bar {
  display: flex;
  align-items: center;
  gap: 0.75rem;
  padding: 0.75rem 0;
  border-bottom: 1px solid var(--vp-c-divider, #e8e6e0);
  margin-bottom: 1rem;
  flex-wrap: wrap;
}
.cmp-specimen-label {
  font-size: 0.68rem;
  font-weight: 600;
  text-transform: uppercase;
  letter-spacing: 0.08em;
  color: var(--vp-c-text-3, #888);
  white-space: nowrap;
}
.cmp-specimen-input {
  flex: 1;
  min-width: 200px;
  padding: 0.35rem 0.6rem;
  font-size: 0.82rem;
  border: 1px solid var(--vp-c-divider, #e8e6e0);
  border-radius: 4px;
  background: var(--vp-c-bg-soft, #faf8f5);
  color: var(--vp-c-text-1, #1a1a1a);
  outline: none;
}
.cmp-specimen-input:focus { border-color: var(--fontist-rose, #bf4e6a); }

/* Empty state */
.cmp-empty {
  text-align: center;
  padding: 3rem 1rem;
  color: var(--vp-c-text-3, #888);
}
.cmp-empty-text { font-size: 0.9rem; margin: 0 0 1rem; }
.cmp-suggestions {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 0.5rem;
  flex-wrap: wrap;
}
.cmp-suggestion-label { font-size: 0.78rem; margin: 0; }
.cmp-suggestion {
  padding: 0.3rem 0.8rem;
  font-size: 0.78rem;
  font-family: var(--spec-font-mono);
  background: var(--vp-c-bg-soft, #f6f6f7);
  border: 1px solid var(--vp-c-divider, #e8e6e0);
  border-radius: 4px;
  cursor: pointer;
  color: var(--vp-c-text-2, #555);
  transition: all 0.15s;
}
.cmp-suggestion:hover {
  border-color: var(--fontist-rose, #bf4e6a);
  color: var(--fontist-rose, #bf4e6a);
}

/* Comparison columns */
.cmp-columns {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(260px, 1fr));
  gap: 0;
  border: 1px solid var(--vp-c-divider, #e8e6e0);
  border-radius: 8px;
  overflow: hidden;
}
.cmp-col {
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
  padding: 1rem;
  border-right: 1px solid var(--vp-c-divider, #e8e6e0);
  background: var(--vp-c-bg, #fff);
}
.cmp-col:last-child { border-right: none; }

.cmp-col-head {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 0.5rem;
}
.cmp-col-name {
  font-size: 0.95rem;
  font-weight: 600;
  color: var(--vp-c-text-1, #1a1a1a);
  text-decoration: none;
}
.cmp-col-name:hover { color: var(--fontist-rose, #bf4e6a); }
.cmp-remove {
  width: 24px;
  height: 24px;
  border: none;
  background: transparent;
  font-size: 1.2rem;
  line-height: 1;
  color: var(--vp-c-text-3, #888);
  cursor: pointer;
  border-radius: 3px;
  transition: all 0.15s;
}
.cmp-remove:hover {
  background: var(--vp-c-bg-soft, #f6f6f7);
  color: var(--fontist-rose, #bf4e6a);
}
.cmp-col-slug {
  font-family: var(--spec-font-mono);
  font-size: 0.68rem;
  color: var(--vp-c-text-3, #aaa);
}

/* Large specimen */
.cmp-specimen-hero {
  font-size: clamp(1.3rem, 3vw, 1.8rem);
  line-height: 1.25;
  color: var(--vp-c-text-1, #1a1a1a);
  word-break: break-word;
  min-height: 4em;
  padding: 0.5rem 0;
  border-top: 1px solid var(--vp-c-divider, #f0eee8);
  border-bottom: 1px solid var(--vp-c-divider, #f0eee8);
}

/* Weight slider */
.cmp-weight label {
  display: flex;
  justify-content: space-between;
  font-size: 0.68rem;
  font-weight: 600;
  text-transform: uppercase;
  letter-spacing: 0.06em;
  color: var(--vp-c-text-3, #888);
  margin-bottom: 0.3rem;
}
.cmp-weight-val {
  font-family: var(--spec-font-mono);
  color: var(--fontist-rose, #bf4e6a);
}
.cmp-slider {
  -webkit-appearance: none;
  width: 100%;
  height: 3px;
  background: var(--vp-c-divider, #e8e6e0);
  border-radius: 2px;
  outline: none;
}
.cmp-slider::-webkit-slider-thumb {
  -webkit-appearance: none;
  width: 14px;
  height: 14px;
  background: var(--fontist-rose, #bf4e6a);
  border-radius: 50%;
  cursor: pointer;
}

/* Stats */
.cmp-stats {
  display: flex;
  gap: 1rem;
  padding-top: 0.5rem;
  border-top: 1px solid var(--vp-c-divider, #f0eee8);
}
.cmp-stat {
  display: flex;
  flex-direction: column;
  gap: 0.1rem;
}
.cmp-stat-num {
  font-family: var(--spec-font-mono);
  font-size: 1.1rem;
  font-weight: 700;
  color: var(--vp-c-text-1, #1a1a1a);
  font-variant-numeric: tabular-nums;
}
.cmp-stat-label {
  font-size: 0.62rem;
  text-transform: uppercase;
  letter-spacing: 0.06em;
  color: var(--vp-c-text-3, #888);
}
.cmp-cov-link {
  font-size: 0.75rem;
  color: var(--fontist-rose, #bf4e6a);
  text-decoration: none;
  margin-top: auto;
  padding-top: 0.5rem;
}
.cmp-cov-link:hover { text-decoration: underline; }

.cmp-loading {
  display: flex;
  align-items: center;
  justify-content: center;
  min-height: 40vh;
  color: var(--vp-c-text-3, #888);
}
</style>
