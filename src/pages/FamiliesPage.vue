<script setup lang="ts">
import { computed, ref } from 'vue'
import { RouterLink, useRoute } from 'vue-router'
import { useHead } from '@unhead/vue'
import { loadFontFamilies, type FontFamily } from '../lib/fonts/families-loader'

const route = useRoute()
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

const q = route.query.q
if (typeof q === 'string' && q) searchQuery.value = q

const redist = route.query.redist
if (redist === 'redist' || redist === 'proprietary') selectedRedist.value = redist

const license = route.query.license
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

useHead({
  title: 'Font Families — Fontist',
  meta: [
    {
      name: 'description',
      content:
        'Browse every font family indexed by Fontist. Search by name, filter by license, and see provenance across all providing formulas.',
    },
    { property: 'og:title', content: 'Font Families — Fontist' },
    { property: 'og:type', content: 'website' },
  ],
  link: [{ rel: 'canonical', href: 'https://www.fontist.org/families' }],
})
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
          <RouterLink
            v-for="f in groupedFamilies[letter]"
            :key="f.slug"
            :to="`/families/${f.slug}`"
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
          </RouterLink>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
.page-container {
  max-width: 1100px;
  margin: 0 auto;
  padding: 2.5rem 1.5rem 5rem;
}

.fp-hero { margin-bottom: 2rem; }
.fp-hero h1 {
  font-size: clamp(2rem, 5vw, 3rem);
  font-weight: 700;
  margin: 0 0 0.5rem;
  letter-spacing: -0.02em;
}
.fp-lede {
  font-size: 1rem;
  color: var(--color-ink-soft);
  max-width: 60ch;
  margin: 0;
}

.search-container {
  display: flex;
  align-items: center;
  gap: 1rem;
  margin-bottom: 1rem;
}
.search-input {
  flex: 1;
  padding: 0.7rem 1rem;
  font-size: 1rem;
  border: 2px solid var(--spec-rule);
  border-radius: 8px;
  background: var(--color-paper-deep);
  color: var(--color-ink);
}
.search-input:focus {
  outline: none;
  border-color: var(--fontist-rose, #bf4e6a);
}
.result-count {
  font-size: 0.85rem;
  color: var(--color-ink-soft);
  white-space: nowrap;
}

.filters-row {
  display: flex;
  gap: 2rem;
  flex-wrap: wrap;
  margin-bottom: 1.5rem;
  padding-bottom: 1rem;
  border-bottom: 1px solid var(--spec-rule);
}
.filter-group { display: flex; flex-direction: column; gap: 0.3rem; }
.filter-label {
  font-size: 0.65rem;
  font-weight: 600;
  text-transform: uppercase;
  letter-spacing: 0.08em;
  color: var(--color-mute);
}
.filter-select {
  padding: 0.3rem 0.5rem;
  border: 1px solid var(--spec-rule);
  border-radius: 4px;
  background: var(--color-paper);
  color: var(--color-ink);
  font-size: 0.85rem;
  font-family: inherit;
}
.filter-chips { display: flex; gap: 0.3rem; }
.chip {
  padding: 0.25rem 0.7rem;
  font-size: 0.78rem;
  background: var(--color-paper);
  color: var(--color-ink-soft);
  border: 1px solid var(--spec-rule);
  border-radius: 12px;
  cursor: pointer;
  transition: all 0.15s;
}
.chip:hover { border-color: var(--fontist-rose, #bf4e6a); }
.chip.on {
  background: var(--fontist-rose, #bf4e6a);
  color: #fff;
  border-color: var(--fontist-rose, #bf4e6a);
}

.alpha-nav {
  display: flex;
  flex-wrap: wrap;
  gap: 0.25rem;
  margin-bottom: 1.5rem;
}
.alpha-nav button {
  width: 32px;
  height: 32px;
  padding: 0;
  border: 1px solid var(--spec-rule);
  border-radius: 4px;
  background: var(--color-paper-deep);
  color: var(--color-mute);
  font-size: 0.85rem;
  font-weight: 500;
  cursor: pointer;
}
.alpha-nav button:hover:not(:disabled) {
  border-color: var(--fontist-rose, #bf4e6a);
  color: var(--fontist-rose, #bf4e6a);
}
.alpha-nav button.has-content {
  color: var(--color-ink);
  background: var(--color-paper);
}
.alpha-nav button:disabled { opacity: 0.4; cursor: default; }

.letter-group { margin-bottom: 2rem; }
.letter-heading {
  font-size: 1.4rem;
  font-weight: 700;
  color: var(--fontist-rose, #bf4e6a);
  margin: 0 0 0.75rem;
  padding-bottom: 0.3rem;
  border-bottom: 2px solid var(--fontist-rose, #bf4e6a);
}
.family-items {
  display: grid;
  gap: 0.4rem;
  grid-template-columns: repeat(auto-fill, minmax(340px, 1fr));
}
.family-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 0.6rem 0.9rem;
  border: 1px solid var(--spec-rule);
  border-radius: 6px;
  background: var(--color-paper);
  text-decoration: none;
  transition: all 0.15s;
}
.family-item:hover {
  border-color: var(--fontist-rose, #bf4e6a);
  background: var(--color-paper-deep);
  transform: translateX(3px);
}
.family-main {
  display: flex;
  flex-direction: column;
  gap: 0.15rem;
  min-width: 0;
  flex: 1;
}
.family-name {
  font-weight: 600;
  color: var(--color-ink);
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}
.family-meta {
  font-size: 0.78rem;
  color: var(--color-mute);
}
.family-badges {
  display: flex;
  flex-direction: column;
  align-items: flex-end;
  gap: 0.2rem;
  flex-shrink: 0;
  margin-left: 0.5rem;
}
.badge-license {
  font-size: 0.68rem;
  font-family: var(--spec-font-mono, monospace);
  color: var(--color-ink-soft);
  background: var(--color-paper-deep);
  border: 1px solid var(--spec-rule);
  padding: 0.1rem 0.35rem;
  border-radius: 3px;
  max-width: 100px;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}
.badge-redist {
  font-size: 0.95rem;
  line-height: 1;
}
.badge-redist.yes { color: var(--fontist-rose, #bf4e6a); }
.badge-redist:not(.yes) { color: var(--color-mute); }

@media (max-width: 768px) {
  .family-items { grid-template-columns: 1fr; }
  .filters-row { gap: 1rem; }
}
</style>
