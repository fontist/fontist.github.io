<script setup lang="ts">
import { ref, computed, watch } from 'vue'
import { loadFontFamilies, type FontFamily } from '../lib/fonts/families-loader'
import { useAlphabetPaginatedBrowse } from '../composables/useAlphabetPaginatedBrowse'

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

const allFamilies = ref<FontFamily[]>([])
const selectedCategory = ref('all')
const selectedRedist = ref<'all' | 'redist' | 'proprietary'>('all')

const categoryCounts = computed(() => {
  const counts: Record<string, number> = { all: allFamilies.value.length, open: 0, free: 0, platform: 0, other: 0 }
  for (const f of allFamilies.value) counts[deriveCategory(f)]++
  return counts
})

const redistCounts = computed(() => ({
  all: allFamilies.value.length,
  redist: allFamilies.value.filter(f => f.redistributable).length,
  proprietary: allFamilies.value.filter(f => !f.redistributable).length,
}))

const filteredFamilies = computed(() => {
  let result = allFamilies.value
  if (selectedCategory.value !== 'all') {
    result = result.filter(f => deriveCategory(f) === selectedCategory.value)
  }
  if (selectedRedist.value === 'redist') result = result.filter(f => f.redistributable)
  else if (selectedRedist.value === 'proprietary') result = result.filter(f => !f.redistributable)
  return result
})

const browse = useAlphabetPaginatedBrowse<FontFamily>(filteredFamilies, {
  pageSize: 50,
  nameAccessor: f => f.name,
  searchAccessor: f => [f.name, f.slug, ...f.formula_slugs],
  scrollSelector: '.families-browser',
})

watch([selectedCategory, selectedRedist], () => browse.resetPage())

const index = await loadFontFamilies()
allFamilies.value = index.families
</script>

<template>
  <div class="families-browser browse-root">
    <div class="search-bar">
      <input
        v-model="browse.searchQuery.value"
        type="text"
        placeholder="Search by family name, slug, or formula…"
        class="search-input"
      />
      <span class="result-count">{{ browse.filteredItems.value.length.toLocaleString() }} families</span>
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
          <button :class="['chip', { on: selectedRedist === 'all' }]" @click="selectedRedist = 'all'">All <span class="chip-count">{{ redistCounts.all }}</span></button>
          <button :class="['chip', { on: selectedRedist === 'redist' }]" @click="selectedRedist = 'redist'">Yes <span class="chip-count">{{ redistCounts.redist }}</span></button>
          <button :class="['chip', { on: selectedRedist === 'proprietary' }]" @click="selectedRedist = 'proprietary'">No <span class="chip-count">{{ redistCounts.proprietary }}</span></button>
        </div>
      </div>
    </div>

    <nav class="alpha-nav">
      <button
        v-for="letter in 'ABCDEFGHIJKLMNOPQRSTUVWXYZ'.split('')"
        :key="letter"
        :disabled="!browse.groupedByLetter.value[letter]"
        :class="{ 'has-content': browse.groupedByLetter.value[letter] }"
        @click="browse.scrollToLetter(letter)"
      >{{ letter }}</button>
    </nav>

    <div class="showing-info">
      Showing {{ browse.showingFrom.value.toLocaleString() }}–{{ browse.showingTo.value.toLocaleString() }} of {{ browse.filteredItems.value.length.toLocaleString() }} families
    </div>

    <div class="family-list">
      <div
        v-for="letter in browse.activeLetters.value"
        :key="letter"
        :id="'letter-' + letter"
        class="letter-group"
      >
        <h3 class="letter-heading">{{ letter }}</h3>
        <div class="family-items">
          <a
            v-for="f in browse.groupedByLetter.value[letter]"
            :key="f.slug"
            :href="`/families/${f.slug}`"
            class="family-item"
          >
            <div class="family-line1">
              <span class="family-name">{{ f.name }}</span>
              <span :class="['family-redist', { yes: f.redistributable }]" :title="f.redistributable ? 'Redistributable' : 'Proprietary'">{{ f.redistributable ? '↯' : '⊘' }}</span>
            </div>
            <div class="family-line2">
              <span class="family-meta">{{ f.style_count }} {{ f.style_count === 1 ? 'style' : 'styles' }} · {{ f.formula_slugs.length }} {{ f.formula_slugs.length === 1 ? 'formula' : 'formulas' }}</span>
              <span class="family-license" :title="f.license_name">{{ f.license_name }}</span>
            </div>
          </a>
        </div>
      </div>
    </div>

    <nav v-if="browse.totalPages.value > 1" class="pagination">
      <button class="page-btn" :disabled="browse.currentPage.value === 1" @click="browse.goToPage(browse.currentPage.value - 1)">← Prev</button>
      <button v-if="browse.pageWindow.value[0] > 1" class="page-btn" @click="browse.goToPage(1)">1</button>
      <span v-if="browse.pageWindow.value[0] > 2" class="page-ellipsis">…</span>
      <button
        v-for="page in browse.pageWindow.value"
        :key="page"
        :class="['page-btn', { on: page === browse.currentPage.value }]"
        @click="browse.goToPage(page)"
      >{{ page }}</button>
      <span v-if="browse.pageWindow.value[browse.pageWindow.value.length - 1] < browse.totalPages.value - 1" class="page-ellipsis">…</span>
      <button v-if="browse.pageWindow.value[browse.pageWindow.value.length - 1] < browse.totalPages.value" class="page-btn" @click="browse.goToPage(browse.totalPages.value)">{{ browse.totalPages.value }}</button>
      <button class="page-btn" :disabled="browse.currentPage.value === browse.totalPages.value" @click="browse.goToPage(browse.currentPage.value + 1)">Next →</button>
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
.search-input:focus { border-bottom-color: var(--color-accent); }
.search-input::placeholder { color: var(--color-mute); font-style: italic; }
.result-count {
  font-family: var(--font-mono);
  font-size: 0.72rem;
  text-transform: uppercase;
  letter-spacing: 0.12em;
  color: var(--color-mute);
  white-space: nowrap;
}

.filters { display: flex; flex-direction: column; gap: 1rem; margin-bottom: 1.5rem; }
.filter-row { display: flex; align-items: center; gap: 0.75rem; flex-wrap: wrap; }
.filter-label {
  font-family: var(--font-mono);
  font-size: 0.68rem;
  text-transform: uppercase;
  letter-spacing: 0.14em;
  color: var(--color-mute);
  min-width: 90px;
}
.filter-chips { display: flex; flex-wrap: wrap; gap: 0.3rem; }
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
.chip:hover { border-color: var(--color-accent); color: var(--color-accent); }
.chip.on { background: var(--color-accent); border-color: var(--color-accent); color: var(--color-paper); }
.chip-count { font-size: 0.6rem; opacity: 0.7; }

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
.alpha-nav button.has-content { color: var(--color-ink-soft); }
.alpha-nav button.has-content:hover { background: var(--color-paper-deep); color: var(--color-accent); }
.alpha-nav button:disabled { opacity: 0.3; cursor: default; }

.showing-info {
  font-family: var(--font-mono);
  font-size: 0.68rem;
  color: var(--color-mute);
  margin: 1rem 0;
}

.letter-group { margin-bottom: 1.5rem; }
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

.family-items { display: flex; flex-direction: column; }
.family-item {
  display: flex;
  flex-direction: column;
  gap: 0.15rem;
  padding: 0.6rem 0;
  text-decoration: none;
  transition: padding 0.15s;
  border-bottom: 1px solid transparent;
}
.family-item:hover { padding-left: 0.5rem; padding-right: 0.5rem; border-bottom-color: var(--color-rule); }

.family-line1 { display: flex; align-items: center; gap: 0.6rem; }
.family-line2 { display: flex; align-items: center; gap: 0.6rem; padding-left: 0.1rem; }

.family-name {
  font-family: var(--font-display);
  font-size: 1.05rem;
  font-weight: 400;
  color: var(--color-ink);
  transition: color 0.2s;
  flex: 1;
}
.family-item:hover .family-name { color: var(--color-accent); }

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

.family-redist { font-size: 0.9rem; color: var(--color-mute); flex-shrink: 0; }
.family-redist.yes { color: var(--color-accent); }

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
.page-btn:hover:not(:disabled):not(.on) { border-color: var(--color-accent); color: var(--color-accent); }
.page-btn.on { background: var(--color-accent); border-color: var(--color-accent); color: var(--color-paper); }
.page-btn:disabled { opacity: 0.4; cursor: default; }
.page-ellipsis { font-family: var(--font-mono); font-size: 0.72rem; color: var(--color-mute); padding: 0 0.3rem; }

@media (max-width: 700px) {
  .filter-label { min-width: auto; }
  .family-name { font-size: 0.95rem; }
  .family-meta { font-size: 0.62rem; }
  .family-license { display: none; }
}
</style>
