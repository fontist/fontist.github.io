<script setup lang="ts">
import { ref, computed, watch } from 'vue'
import { injectFontFace } from '../composables/useFontFace'
import { loadCoverage } from '../lib/unicode/coverage'
import { loadFontsRegistry, loadFontMetadata } from '../lib/fonts/loader'
import type { Coverage } from '../lib/types/domain'

const props = defineProps({
  fonts: { type: String, required: true }
})

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
const slugToMetadata = ref<Map<string, { woff_file?: string; coverage_file?: string }>>(new Map())
const columns = ref<FontColumn[]>([])
const searchText = ref('')
const loadingRegistry = ref(true)

const SPECIMEN_DEFAULT = 'Finding efficient flow · 0123456789'
const specimenText = ref(SPECIMEN_DEFAULT)

const slugsFromUrl = computed(() => {
  const param = props.fonts as string | undefined
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
    const bySlug = new Map<string, { woff_file?: string; coverage_file?: string }>()
    for (const f of meta.fonts) {
      // Families with multiple styles all map back to the canonical family
      // slug here, and ComparePage indexes at the family level.
      //
      // Prefer whichever record actually carries asset paths rather than
      // taking the first seen: the same slug can appear as a `manual` formula
      // with no archive assets and a `google` one with them, and if the empty
      // record wins, coverage falls back to a bare-slug path that 404s.
      const existing = bySlug.get(f.slug)
      const existingHasData = !!(existing?.woff_file || existing?.coverage_file)
      if (!existing || (!existingHasData && (f.woff_file || f.coverage_file))) {
        bySlug.set(f.slug, {
          woff_file: f.woff_file,
          coverage_file: f.coverage_file,
        })
      }
    }
    slugToMetadata.value = bySlug
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
  const meta = slugToMetadata.value.get(slug) || {}
  const fontPath = meta.woff_file || null
  const coveragePath = meta.coverage_file || slug

  let fontId = `ff-${slug.replace(/[^a-z0-9]/gi, '-')}`
  if (fontPath) {
    const r = injectFontFace(slug, fontPath, true)
    r.ensureInjected()
    fontId = r.fontId
  }

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

  col.coverage = await loadCoverage(coveragePath)
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
  window.location.replace(path)
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
          <a :href="`/fonts/${col.slug}`" class="cmp-col-name">{{ col.name }}</a>
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

        <a :href="`/fonts/${col.slug}/unicode`" class="cmp-cov-link">Unicode coverage →</a>
      </div>
    </div>
  </div>
</template>

<style scoped>
/* All styles migrated to src/styles/main.css (@layer components). */
</style>
