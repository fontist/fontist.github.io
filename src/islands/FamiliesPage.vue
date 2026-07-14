<script setup lang="ts">
import { computed, ref, watch } from 'vue'
import { loadFontFamilies, type FontFamily } from '../lib/fonts/families-loader'

const PAGE_SIZE = 50
const alphabet = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ'.split('')

const allFamilies = ref<FontFamily[]>([])
const searchQuery = ref('')
const selectedCategory = ref('all')
const selectedRedist = ref<'all' | 'redist' | 'proprietary'>('all')
const currentPage = ref(1)

const CATEGORIES = [
  { value: 'all', label: 'All' },
  { value: 'open', label: 'Open Source' },
  { value: 'free', label: 'Freely Distributable' },
  { value: 'platform', label: 'Platform / Bundled' },
  { value: 'other', label: 'Other / Unknown' },
]

function deriveCategory(f: FontFamily): string {
  const name = (f.license_name || '').toLowerCase()
  if (
    name.includes('open font') || name.includes('ofl') ||
    name.includes('apache') || name.includes('mit') ||
    name.includes('cc0') || name.includes('public domain') ||
    name.includes('bsd') || name.includes('ufl') || name.includes('ipa')
  ) return 'open'
  if (name.includes('freely') || name.includes('free use') || name.includes('freeware') || name.includes('gust')) return 'free'
  if (name.includes('apple') || name.includes('microsoft') || name.includes('platform') || name.includes('office') || name.includes('adobe') || name.includes('bundled')) return 'platform'
  return 'other'
}

const index = await loadFontFamilies()
allFamilies.value = index.families

const q = (typeof window !== 'undefined' ? new URLSearchParams(window.location.search).get('q') : null)
if (typeof q === 'string' && q) searchQuery.value = q

const redist = (typeof window !== 'undefined' ? new URLSearchParams(window.location.search).get('redist') : null)
if (redist === 'redist' || redist === 'proprietary') selectedRedist.value = redist

const categoryCounts = computed(() => {
  const counts: Record<string, number> = { all: allFamilies.value.length, open: 0, free: 0, platform: 0, other: 0 }
  for (const f of allFamilies.value) {
    counts[deriveCategory(f)]++
  }
  return counts
})

const filteredFamilies = computed(() => {
  let result = allFamilies.value
  if (searchQuery.value) {
    const q = searchQuery.value.toLowerCase()
    result = result.filter(
      f =>
        f.name.toLowerCase().includes(q) ||
        f.slug.toLowerCase().includes(q) ||
        f.formula_slugs.some(s => s.toLowerCase().includes(q)),
    )
  }
  if (selectedCategory.value !== 'all') {
    result = result.filter(f => deriveCategory(f) === selectedCategory.value)
  }
  if (selectedRedist.value === 'redist') result = result.filter(f => f.redistributable)
  else if (selectedRedist.value === 'proprietary') result = result.filter(f => !f.redistributable)
  return [...result].sort((a, b) => a.name.localeCompare(b.name))
})

const totalPages = computed(() => Math.max(1, Math.ceil(filteredFamilies.value.length / PAGE_SIZE)))

const pagedFamilies = computed(() => {
  const start = (currentPage.value - 1) * PAGE_SIZE
  return filteredFamilies.value.slice(start, start + PAGE_SIZE)
})

const groupedPaged = computed(() => {
  const groups: Record<string, FontFamily[]> = {}
  for (const f of pagedFamilies.value) {
    const letter = f.name.charAt(0).toUpperCase()
    if (!groups[letter]) groups[letter] = []
    groups[letter].push(f)
  }
  return groups
})

const activeLetters = computed(() =>
  alphabet.filter(letter => (groupedPaged.value[letter]?.length ?? 0) > 0),
)

const showingFrom = computed(() =>
  filteredFamilies.value.length === 0 ? 0 : (currentPage.value - 1) * PAGE_SIZE + 1,
)
const showingTo = computed(() =>
  Math.min(currentPage.value * PAGE_SIZE, filteredFamilies.value.length),
)

watch([searchQuery, selectedCategory, selectedRedist], () => {
  currentPage.value = 1
})

function scrollToLetter(letter: string) {
  const el = document.getElementById('letter-' + letter)
  if (el) el.scrollIntoView({ behavior: 'smooth', block: 'start' })
}

function goToPage(page: number) {
  currentPage.value = page
  const el = document.querySelector('.families-browser')
  if (el) el.scrollIntoView({ behavior: 'smooth', block: 'start' })
}

const pageWindow = computed(() => {
  const pages: number[] = []
  const start = Math.max(1, currentPage.value - 2)
  const end = Math.min(totalPages.value, currentPage.value + 2)
  for (let i = start; i <= end; i++) pages.push(i)
  return pages
})
</script>

<template>
  <div class="families-browser">
    <div class="search-bar">
      <input
        v-model="searchQuery"
        type="text"
        placeholder="Search by family name, slug, or formula…"
        class="search-input"
      />
      <span class="result-count">{{ filteredFamilies.length.toLocaleString() }} families</span>
    </div>

    <div class="filters">
      <div class="filter-row">
        <span class="filter-label">License</span>
        <div class="filter-chips">
          <button
            v-for="cat in CATEGORIES"
            :key="cat.value"
            :class="['chip', { on: selectedCategory === cat.value }]"
            @click="selectedCategory = cat.value"
          >
            {{ cat.label }}
            <span class="chip-count">{{ categoryCounts[cat.value] || 0 }}</span>
          </button>
        </div>
      </div>
      <div class="filter-row">
        <span class="filter-label">Redistributable</span>
        <div class="filter-chips">
          <button :class="['chip', { on: selectedRedist === 'all' }]" @click="selectedRedist = 'all'">All</button>
          <button :class="['chip', { on: selectedRedist === 'redist' }]" @click="selectedRedist = 'redist'">Yes</button>
          <button :class="['chip', { on: selectedRedist === 'proprietary' }]" @click="selectedRedist = 'proprietary'">No</button>
        </div>
      </div>
    </div>

    <div class="alpha-nav">
      <button
        v-for="letter in alphabet"
        :key="letter"
        :disabled="!groupedPaged[letter]"
        :class="{ 'has-content': groupedPaged[letter] }"
        @click="scrollToLetter(letter)"
      >{{ letter }}</button>
    </div>

    <div class="showing-info">
      Showing {{ showingFrom.toLocaleString() }}–{{ showingTo.toLocaleString() }} of {{ filteredFamilies.length.toLocaleString() }} families
    </div>

    <div class="family-list">
      <div
        v-for="letter in activeLetters"
        :key="letter"
        :id="'letter-' + letter"
        class="letter-group"
      >
        <h3 class="letter-heading">{{ letter }}</h3>
        <div class="family-items">
          <a
            v-for="f in groupedPaged[letter]"
            :key="f.slug"
            :href="`/families/${f.slug}`"
            class="family-item"
          >
            <div class="family-line1">
              <span class="family-name">{{ f.name }}</span>
              <span
                :class="['family-redist', { yes: f.redistributable }]"
                :title="f.redistributable ? 'Redistributable' : 'Proprietary'"
              >{{ f.redistributable ? '↯' : '⊘' }}</span>
            </div>
            <div class="family-line2">
              <span class="family-meta">
                {{ f.style_count }} {{ f.style_count === 1 ? 'style' : 'styles' }}
                · {{ f.formula_slugs.length }} {{ f.formula_slugs.length === 1 ? 'formula' : 'formulas' }}
              </span>
              <span class="family-license" :title="f.license_name">{{ f.license_name }}</span>
            </div>
          </a>
        </div>
      </div>
    </div>

    <nav v-if="totalPages > 1" class="pagination">
      <button class="page-btn" :disabled="currentPage === 1" @click="goToPage(currentPage - 1)">← Prev</button>
      <button v-if="pageWindow[0] > 1" class="page-btn" @click="goToPage(1)">1</button>
      <span v-if="pageWindow[0] > 2" class="page-ellipsis">…</span>
      <button
        v-for="page in pageWindow"
        :key="page"
        :class="['page-btn', { on: page === currentPage }]"
        @click="goToPage(page)"
      >{{ page }}</button>
      <span v-if="pageWindow[pageWindow.length - 1] < totalPages - 1" class="page-ellipsis">…</span>
      <button v-if="pageWindow[pageWindow.length - 1] < totalPages" class="page-btn" @click="goToPage(totalPages)">{{ totalPages }}</button>
      <button class="page-btn" :disabled="currentPage === totalPages" @click="goToPage(currentPage + 1)">Next →</button>
    </nav>
  </div>
</template>

<style scoped>
.search-bar {
  display: flex;
  align-items: center;
  gap: 1rem;
  padding-bottom: 1.5rem;
  border-bottom: 1px solid var(--color-rule);
  margin-bottom: 1.5rem;
}

.search-input {
  flex: 1;
  background: transparent;
  border: none;
  border-bottom: 1px solid var(--color-rule);
  padding: 0.5rem 0;
  font-family: var(--font-body);
  font-size: 1rem;
  color: var(--color-ink);
  outline: none;
  transition: border-color 0.2s;
}
.search-input:focus {
  border-bottom-color: var(--color-accent);
}
.search-input::placeholder {
  color: var(--color-mute);
}

.result-count {
  font-family: var(--font-mono);
  font-size: 0.72rem;
  text-transform: uppercase;
  letter-spacing: 0.12em;
  color: var(--color-mute);
  white-space: nowrap;
}

.filters {
  display: flex;
  flex-direction: column;
  gap: 1rem;
  margin-bottom: 1.5rem;
}

.filter-row {
  display: flex;
  align-items: center;
  gap: 0.75rem;
  flex-wrap: wrap;
}

.filter-label {
  font-family: var(--font-mono);
  font-size: 0.68rem;
  text-transform: uppercase;
  letter-spacing: 0.14em;
  color: var(--color-mute);
  min-width: 90px;
}

.filter-chips {
  display: flex;
  flex-wrap: wrap;
  gap: 0.3rem;
}

.chip {
  display: inline-flex;
  align-items: center;
  gap: 0.35rem;
  background: transparent;
  border: 1px solid var(--color-rule);
  border-radius: 2px;
  padding: 0.25rem 0.7rem;
  font-family: var(--font-mono);
  font-size: 0.68rem;
  text-transform: uppercase;
  letter-spacing: 0.1em;
  color: var(--color-ink-soft);
  cursor: pointer;
  transition: all 0.2s;
}
.chip:hover {
  border-color: var(--color-accent);
  color: var(--color-accent);
}
.chip.on {
  background: var(--color-accent);
  border-color: var(--color-accent);
  color: var(--color-paper);
}

.chip-count {
  font-size: 0.6rem;
  opacity: 0.7;
}

.alpha-nav {
  display: flex;
  flex-wrap: wrap;
  gap: 0.15rem;
  padding-bottom: 1rem;
  border-bottom: 1px solid var(--color-rule);
}

.alpha-nav button {
  background: transparent;
  border: none;
  width: 26px;
  height: 26px;
  font-family: var(--font-mono);
  font-size: 0.7rem;
  color: var(--color-mute);
  cursor: pointer;
  border-radius: 2px;
  transition: all 0.15s;
}
.alpha-nav button.has-content {
  color: var(--color-ink-soft);
}
.alpha-nav button.has-content:hover {
  background: var(--color-paper-deep);
  color: var(--color-accent);
}
.alpha-nav button:disabled {
  opacity: 0.3;
  cursor: default;
}

.showing-info {
  font-family: var(--font-mono);
  font-size: 0.68rem;
  color: var(--color-mute);
  margin: 1rem 0;
}

.family-list {
  min-height: 200px;
}

.letter-group {
  margin-bottom: 1.5rem;
}

.letter-heading {
  font-family: var(--font-display);
  font-size: 1.3rem;
  font-weight: 380;
  font-style: italic;
  color: var(--color-accent);
  margin: 0 0 0.3rem;
  padding-bottom: 0.3rem;
  border-bottom: 1px solid var(--color-rule);
}

.family-items {
  display: flex;
  flex-direction: column;
}

.family-item {
  display: flex;
  flex-direction: column;
  gap: 0.15rem;
  padding: 0.6rem 0;
  text-decoration: none;
  transition: padding 0.15s;
  border-bottom: 1px solid transparent;
}
.family-item:hover {
  padding-left: 0.5rem;
  padding-right: 0.5rem;
  border-bottom-color: var(--color-rule);
}

.family-line1 {
  display: flex;
  align-items: center;
  gap: 0.6rem;
}

.family-line2 {
  display: flex;
  align-items: center;
  gap: 0.6rem;
  padding-left: 0.1rem;
}

.family-name {
  font-family: var(--font-display);
  font-size: 1.05rem;
  font-weight: 400;
  color: var(--color-ink);
  transition: color 0.2s;
  flex: 1;
}
.family-item:hover .family-name {
  color: var(--color-accent);
}

.family-meta {
  font-family: var(--font-mono);
  font-size: 0.68rem;
  color: var(--color-mute);
  white-space: nowrap;
}

.family-license {
  font-family: var(--font-mono);
  font-size: 0.65rem;
  text-transform: uppercase;
  letter-spacing: 0.08em;
  color: var(--color-mute);
  margin-left: auto;
  max-width: 240px;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.family-redist {
  font-size: 0.9rem;
  color: var(--color-mute);
  flex-shrink: 0;
}
.family-redist.yes {
  color: var(--color-accent);
}

.pagination {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 0.3rem;
  padding: 2rem 0;
  border-top: 1px solid var(--color-rule);
  margin-top: 1rem;
  flex-wrap: wrap;
}

.page-btn {
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
.page-btn:hover:not(:disabled):not(.on) {
  border-color: var(--color-accent);
  color: var(--color-accent);
}
.page-btn.on {
  background: var(--color-accent);
  border-color: var(--color-accent);
  color: var(--color-paper);
}
.page-btn:disabled {
  opacity: 0.4;
  cursor: default;
}

.page-ellipsis {
  font-family: var(--font-mono);
  font-size: 0.72rem;
  color: var(--color-mute);
  padding: 0 0.3rem;
}

@media (max-width: 700px) {
  .family-item {
    padding: 0.5rem 0;
  }
  .family-name {
    font-size: 0.95rem;
  }
  .family-meta {
    font-size: 0.62rem;
  }
  .family-license {
    display: none;
  }
  .filter-label {
    min-width: auto;
  }
}
</style>
