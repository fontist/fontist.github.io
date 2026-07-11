<script setup lang="ts">
import { computed, ref } from 'vue'
import { loadFontFamilies, type FontFamily } from '../lib/fonts/families-loader'

const alphabet = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ'.split('')

const allFamilies = ref<FontFamily[]>([])
const searchQuery = ref('')
const selectedRedist = ref<'all' | 'redist' | 'proprietary'>('all')
const selectedLicense = ref<string>('all')
const licenseOptions = ref<{ value: string; label: string; count: number }[]>([
  { value: 'all', label: 'All Licenses', count: 0 },
])

// Top-level await: runs during SSG so the page ships with the family
// list and license facets already populated. Query-param reads stay
// here too — they pick up `?q=…&redist=…` from the route at render time.
const index = await loadFontFamilies()
allFamilies.value = index.families

const counts = new Map<string, number>()
for (const f of index.families) {
  const key = f.license_name || 'Unknown'
  counts.set(key, (counts.get(key) ?? 0) + 1)
}
licenseOptions.value = [
  { value: 'all', label: 'All Licenses', count: index.families.length },
  ...[...counts.entries()]
    .sort((a, b) => b[1] - a[1])
    .map(([value, count]) => ({ value, label: value, count })),
]

const q = (typeof window !== 'undefined' ? new URLSearchParams(window.location.search).get('q') : null)
if (typeof q === 'string' && q) searchQuery.value = q

const redist = (typeof window !== 'undefined' ? new URLSearchParams(window.location.search).get('redist') : null)
if (redist === 'redist' || redist === 'proprietary') selectedRedist.value = redist

const license = (typeof window !== 'undefined' ? new URLSearchParams(window.location.search).get('license') : null)
if (
  typeof license === 'string' &&
  license &&
  licenseOptions.value.some(o => o.value === license)
) {
  selectedLicense.value = license
}

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
  if (selectedRedist.value === 'redist') result = result.filter(f => f.redistributable)
  else if (selectedRedist.value === 'proprietary') result = result.filter(f => !f.redistributable)
  if (selectedLicense.value !== 'all') {
    result = result.filter(f => (f.license_name || 'Unknown') === selectedLicense.value)
  }
  return [...result].sort((a, b) => a.name.localeCompare(b.name))
})

const groupedFamilies = computed(() => {
  const groups: Record<string, FontFamily[]> = {}
  for (const f of filteredFamilies.value) {
    const letter = f.name.charAt(0).toUpperCase()
    if (!groups[letter]) groups[letter] = []
    groups[letter].push(f)
  }
  return groups
})

const activeLetters = computed(() =>
  alphabet.filter(letter => (groupedFamilies.value[letter]?.length ?? 0) > 0),
)

function scrollToLetter(letter: string) {
  const el = document.getElementById('letter-' + letter)
  if (el) el.scrollIntoView({ behavior: 'smooth', block: 'start' })
}

</script>

<template>
  <div class="page-container">
    <header class="fp-hero">
      <h1>Font Families</h1>
      <p class="fp-lede">
        Every font family indexed by Fontist. One family may be shipped by multiple formulas — this
        view groups them into a single canonical entry.
      </p>
    </header>

    <div class="search-container">
      <input
        v-model="searchQuery"
        type="text"
        placeholder="Search by family name, slug, or formula…"
        class="search-input"
      />
      <span class="result-count">{{ filteredFamilies.length }} families</span>
    </div>

    <div class="filters-row">
      <div class="filter-group">
        <span class="filter-label">License</span>
        <select v-model="selectedLicense" class="filter-select">
          <option v-for="opt in licenseOptions" :key="opt.value" :value="opt.value">
            {{ opt.label }} ({{ opt.count }})
          </option>
        </select>
      </div>
      <div class="filter-group">
        <span class="filter-label">Redistributable</span>
        <div class="filter-chips">
          <button
            :class="['chip', { on: selectedRedist === 'all' }]"
            @click="selectedRedist = 'all'"
          >All</button>
          <button
            :class="['chip', { on: selectedRedist === 'redist' }]"
            @click="selectedRedist = 'redist'"
          >Yes</button>
          <button
            :class="['chip', { on: selectedRedist === 'proprietary' }]"
            @click="selectedRedist = 'proprietary'"
          >No</button>
        </div>
      </div>
    </div>

    <nav class="alpha-nav">
      <button
        v-for="letter in alphabet"
        :key="letter"
        :disabled="!groupedFamilies[letter]"
        :class="{ 'has-content': groupedFamilies[letter] }"
        @click="scrollToLetter(letter)"
      >{{ letter }}</button>
    </nav>

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
            v-for="f in groupedFamilies[letter]"
            :key="f.slug"
            :href="`/families/${f.slug}`"
            class="family-item"
          >
            <div class="family-main">
              <span class="family-name">{{ f.name }}</span>
              <span class="family-meta">
                {{ f.style_count }} {{ f.style_count === 1 ? 'style' : 'styles' }}
                · {{ f.formula_slugs.length }} {{ f.formula_slugs.length === 1 ? 'formula' : 'formulas' }}
              </span>
            </div>
            <div class="family-badges">
              <span class="badge-license" :title="f.license_name">{{ f.license_name }}</span>
              <span
                :class="['badge-redist', { yes: f.redistributable }]"
                :title="f.redistributable ? 'Redistributable' : 'Proprietary'"
              >{{ f.redistributable ? '↯' : '⊘' }}</span>
            </div>
          </a>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
/* All styles migrated to src/styles/main.css (@layer components). */
</style>
