<script setup>
import { ref, computed, watch } from 'vue'
import { loadAllFormulas } from '../lib/formulas/loader'

// Lightweight query-string reader — works on both SSR (window not available)
// and client. Vue islands under Astro don't have vue-router, so we read
// directly from window.location when it exists.
function getQueryParam(key) {
  if (typeof window === 'undefined') return null
  return new URLSearchParams(window.location.search).get(key)
}


const alphabet = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ'.split('')

const formulasData = ref([])
const searchQuery = ref('')
const selectedLicenses = ref(['all'])
const selectedSources = ref(['all'])

const licenseOptions = [
  { value: 'all', label: 'All Licenses', icon: 'all', count: 0 },
  { value: 'ofl', label: 'OFL 1.1', icon: 'ofl', count: 0 },
  { value: 'apache', label: 'Apache 2.0', icon: 'apache', count: 0 },
  { value: 'mit', label: 'MIT', icon: 'mit', count: 0 },
  { value: 'cc0', label: 'CC0 / Public Domain', icon: 'cc0', count: 0 },
  { value: 'other_open', label: 'Other Open Source', icon: 'open', count: 0 },
  { value: 'freely_dist', label: 'Freely Distributable', icon: 'free', count: 0 },
  { value: 'platform', label: 'Platform Tied', icon: 'platform', count: 0 },
  { value: 'bundled', label: 'Bundled Software', icon: 'bundled', count: 0 },
  { value: 'unknown', label: 'License Not Specified', icon: 'unknown', count: 0 },
]

const sourceOptions = [
  { value: 'all', label: 'All Sources', icon: 'all', count: 0 },
  { value: 'google', label: 'Google Fonts', icon: 'google', count: 0 },
  { value: 'sil', label: 'SIL International', icon: 'sil', count: 0 },
  { value: 'macos', label: 'Apple', icon: 'apple', count: 0 },
  { value: 'manual', label: 'Expert Curated', icon: 'fontist', count: 0 },
]

// Map URL param values to internal license groups
const licenseParamMap = {
  'open_source': ['ofl', 'apache', 'mit', 'cc0', 'other_open'],
  'freely_distributable': ['freely_dist'],
  'platform_restricted': ['platform'],
  'bundled_software': ['bundled'],
  'ofl': ['ofl'],
  'apache': ['apache'],
  'mit': ['mit'],
}

function getLicenseGroup(f) {
  if (!f) return 'unknown'
  if (f.licenseCategory === 'open_source') {
    if (f.licenseType === 'ofl') return 'ofl'
    if (f.licenseType === 'apache') return 'apache'
    if (f.licenseType === 'mit') return 'mit'
    if (f.licenseType === 'cc0') return 'cc0'
    return 'other_open'
  }
  if (f.licenseCategory === 'freely_distributable') return 'freely_dist'
  if (f.licenseCategory === 'platform_restricted') return 'platform'
  if (f.licenseCategory === 'bundled_software') return 'bundled'
  return 'unknown'
}

function getLicenseBadge(f) {
  const basePath = import.meta.env.BASE_URL || '/'
  if (!f) return `<img src="${basePath}licenses/unknown.svg" alt="Unknown" class="license-icon" title="Unknown">`
  if (f.licenseType === 'ofl') return `<img src="${basePath}licenses/ofl.svg" alt="OFL" class="license-icon" title="OFL">`
  if (f.licenseType === 'apache') return `<img src="${basePath}licenses/apache.svg" alt="Apache" class="license-icon" title="Apache">`
  if (f.licenseType === 'mit') return `<img src="${basePath}licenses/mit.svg" alt="MIT" class="license-icon" title="MIT">`
  if (f.licenseType === 'cc0') return `<img src="${basePath}licenses/cc0.svg" alt="CC0" class="license-icon" title="CC0">`
  if (f.licenseType === 'macos') return `<img src="${basePath}licenses/platform-tied.svg" alt="Platform Tied" class="license-icon" title="Platform Tied">`
  if (f.licenseType === 'ms_office' || f.licenseType === 'ms_web_fonts') return `<img src="${basePath}licenses/microsoft.svg" alt="Microsoft" class="license-icon" title="Microsoft">`
  // Fallback by category
  if (f.licenseCategory === 'open_source') return `<img src="${basePath}licenses/open.svg" alt="Open Source" class="license-icon" title="Open Source">`
  if (f.licenseCategory === 'freely_distributable') return `<img src="${basePath}licenses/freely-distributed.svg" alt="Freely Distributable" class="license-icon" title="Freely Distributable">`
  if (f.licenseCategory === 'platform_restricted') return `<img src="${basePath}licenses/platform-tied.svg" alt="Platform Tied" class="license-icon" title="Platform Tied">`
  if (f.licenseCategory === 'bundled_software') return `<img src="${basePath}licenses/bundled.svg" alt="Bundled" class="license-icon" title="Bundled Software">`
  return `<img src="${basePath}licenses/unknown.svg" alt="Unknown" class="license-icon" title="Unknown">`
}

function getSourceBadge(f) {
  const basePath = import.meta.env.BASE_URL || '/'
  if (!f) return `<img src="${basePath}sources/fontist.svg" alt="Expert Curated" class="source-icon" title="Expert Curated">`
  if (f.sourceType === 'google') return `<img src="${basePath}sources/google.svg" alt="Google Fonts" class="source-icon" title="Google Fonts">`
  if (f.sourceType === 'sil') return `<img src="${basePath}sources/sil.svg" alt="SIL International" class="source-icon" title="SIL International">`
  if (f.sourceType === 'macos') return `<img src="${basePath}sources/apple.svg" alt="Apple" class="source-icon" title="Apple">`
  return `<img src="${basePath}sources/fontist.svg" alt="Expert Curated" class="source-icon" title="Expert Curated">`
}

function getSourceIcon(icon) {
  const basePath = import.meta.env.BASE_URL || '/'
  const icons = {
    all: `<img src="${basePath}sources/all.svg" alt="All" class="filter-icon-img">`,
    google: `<img src="${basePath}sources/google.svg" alt="Google" class="filter-icon-img">`,
    sil: `<img src="${basePath}sources/sil.svg" alt="SIL" class="filter-icon-img">`,
    apple: `<img src="${basePath}sources/apple.svg" alt="Apple" class="filter-icon-img">`,
    fontist: `<img src="${basePath}sources/fontist.svg" alt="Fontist" class="filter-icon-img">`,
  }
  return icons[icon] || icon
}

function getLicenseIcon(icon) {
  const basePath = import.meta.env.BASE_URL || '/'
  const icons = {
    all: `<img src="${basePath}licenses/open.svg" alt="All" class="filter-icon-img">`,
    ofl: `<img src="${basePath}licenses/ofl.svg" alt="OFL" class="filter-icon-img">`,
    apache: `<img src="${basePath}licenses/apache.svg" alt="Apache" class="filter-icon-img">`,
    mit: `<img src="${basePath}licenses/mit.svg" alt="MIT" class="filter-icon-img">`,
    cc0: `<img src="${basePath}licenses/cc0.svg" alt="CC0" class="filter-icon-img">`,
    open: `<img src="${basePath}licenses/open.svg" alt="Open Source" class="filter-icon-img">`,
    free: `<img src="${basePath}licenses/freely-distributed.svg" alt="Free" class="filter-icon-img">`,
    platform: `<img src="${basePath}licenses/platform-tied.svg" alt="Platform Tied" class="filter-icon-img">`,
    bundled: `<img src="${basePath}licenses/bundled.svg" alt="Bundled" class="filter-icon-img">`,
    unknown: `<img src="${basePath}licenses/unknown.svg" alt="Unknown" class="filter-icon-img">`,
  }
  return icons[icon] || icon
}

// Read query params from the URL (Astro islands have no vue-router).
function initFromQuery() {
  const q = getQueryParam('q')
  if (typeof q === 'string' && q) {
    searchQuery.value = q
  }

  const license = getQueryParam('license')
  if (typeof license === 'string' && licenseParamMap[license]) {
    selectedLicenses.value = licenseParamMap[license]
  }

  const source = getQueryParam('source')
  if (typeof source === 'string') {
    const srcOpt = sourceOptions.find(o => o.value === source)
    if (srcOpt) {
      selectedSources.value = [source]
    }
  }
}

// Top-level await: runs during SSG so the formulas index ships with
// the full list + license/source facets already populated.
try {
  initFromQuery()

  const data = await loadAllFormulas()
  formulasData.value = data

  // Set 'all' counts to total
  licenseOptions[0].count = data.length
  sourceOptions[0].count = data.length

  data.forEach(f => {
    const licOpt = licenseOptions.find(o => o.value === getLicenseGroup(f))
    if (licOpt) licOpt.count++
    const srcOpt = sourceOptions.find(o => o.value === f.sourceType)
    if (srcOpt) srcOpt.count++
  })
} catch (e) {
  console.error('Failed to load formulas data:', e)
}

const filteredFormulas = computed(() => {
  let result = formulasData.value
  if (searchQuery.value) {
    const q = searchQuery.value.toLowerCase()
    result = result.filter(f =>
      (f.name || '').toLowerCase().includes(q) ||
      (f.formulaName || '').toLowerCase().includes(q) ||
      ((f.familyNames || []).some(n => (n || '').toLowerCase().includes(q)))
    )
  }
  if (!selectedLicenses.value.includes('all')) {
    result = result.filter(f => selectedLicenses.value.includes(getLicenseGroup(f)))
  }
  if (!selectedSources.value.includes('all')) {
    result = result.filter(f => selectedSources.value.includes(f.sourceType))
  }
  return result
})

// Group formulas by font family name. Multiple formulas can provide the
// same font family (e.g. 6 macOS formulas for "Al Bayan"). Grouping
// reveals the font → faces → versions → formulas hierarchy.
const familyGroups = computed(() => {
  const map = new Map()
  for (const f of filteredFormulas.value) {
    const key = (f.name || '').toLowerCase()
    if (!map.has(key)) {
      map.set(key, {
        name: f.name || f.formulaName,
        formulas: [],
        maxStyles: 0,
        licenseName: f.licenseName,
        licenseType: f.licenseType,
        sourceType: f.sourceType,
      })
    }
    const group = map.get(key)
    group.formulas.push(f)
    if ((f.styleCount || 0) > group.maxStyles) group.maxStyles = f.styleCount
  }
  return [...map.values()].sort((a, b) => a.name.localeCompare(b.name))
})

const PAGE_SIZE = 50
const currentPage = ref(1)

const totalPages = computed(() => Math.max(1, Math.ceil(familyGroups.value.length / PAGE_SIZE)))

const pagedGroups = computed(() => {
  const start = (currentPage.value - 1) * PAGE_SIZE
  return familyGroups.value.slice(start, start + PAGE_SIZE)
})

const groupedByLetter = computed(() => {
  const groups = {}
  for (const fam of pagedGroups.value) {
    const letter = fam.name.charAt(0).toUpperCase()
    if (!groups[letter]) groups[letter] = []
    groups[letter].push(fam)
  }
  return groups
})

const showingFrom = computed(() =>
  familyGroups.value.length === 0 ? 0 : (currentPage.value - 1) * PAGE_SIZE + 1,
)
const showingTo = computed(() =>
  Math.min(currentPage.value * PAGE_SIZE, familyGroups.value.length),
)

watch([searchQuery, selectedLicenses, selectedSources], () => {
  currentPage.value = 1
})

const pageWindow = computed(() => {
  const pages = []
  const start = Math.max(1, currentPage.value - 2)
  const end = Math.min(totalPages.value, currentPage.value + 2)
  for (let i = start; i <= end; i++) pages.push(i)
  return pages
})

function goToPage(page) {
  currentPage.value = page
  const el = document.querySelector('.formulas-browser')
  if (el) el.scrollIntoView({ behavior: 'smooth', block: 'start' })
}

const activeLetters = computed(() => {
  return alphabet.filter(letter => {
    const group = groupedByLetter.value[letter]
    return group && group.length > 0
  })
})

function scrollToLetter(letter) {
  const el = document.getElementById('letter-' + letter)
  if (el) el.scrollIntoView({ behavior: 'smooth', block: 'start' })
}

function toggleLicense(value) {
  if (value === 'all') {
    selectedLicenses.value = ['all']
  } else {
    selectedLicenses.value = [value]
  }
}

function toggleSource(value) {
  if (value === 'all') {
    selectedSources.value = ['all']
  } else {
    selectedSources.value = [value]
  }
}
</script>

<template>
  <div class="formulas-browser">
    <div class="search-bar">
      <input v-model="searchQuery" type="text" placeholder="Search fonts by name, family, or formula key…" class="search-input" />
      <span class="result-count">{{ filteredFormulas.length.toLocaleString() }} formulas</span>
    </div>

    <div class="browser-layout">
      <aside class="filters-sidebar">
        <div class="filter-section">
          <h4 class="filter-heading">License</h4>
          <label v-for="opt in licenseOptions" :key="opt.value" class="filter-checkbox" :class="{ on: selectedLicenses.includes(opt.value) }">
            <input type="checkbox" :checked="selectedLicenses.includes(opt.value)" @change="toggleLicense(opt.value)" />
            <span class="filter-icon" v-html="getLicenseIcon(opt.icon)"></span>
            <span class="filter-text">{{ opt.label }}</span>
            <span class="filter-count">{{ opt.count }}</span>
          </label>
        </div>
        <div class="filter-section">
          <h4 class="filter-heading">Source</h4>
          <label v-for="opt in sourceOptions" :key="opt.value" class="filter-checkbox" :class="{ on: selectedSources.includes(opt.value) }">
            <input type="checkbox" :checked="selectedSources.includes(opt.value)" @change="toggleSource(opt.value)" />
            <span class="filter-icon" v-html="getSourceIcon(opt.icon)"></span>
            <span class="filter-text">{{ opt.label }}</span>
            <span class="filter-count">{{ opt.count }}</span>
          </label>
        </div>
      </aside>

      <main class="results-main">
        <nav class="alpha-nav">
          <button v-for="letter in alphabet" :key="letter" @click="scrollToLetter(letter)" :class="{ 'has-content': groupedByLetter[letter] }" :disabled="!groupedByLetter[letter]">{{ letter }}</button>
        </nav>

        <div class="showing-info">
          Showing {{ showingFrom.toLocaleString() }}–{{ showingTo.toLocaleString() }} of {{ familyGroups.length.toLocaleString() }} font families ({{ filteredFormulas.length.toLocaleString() }} formulas)
        </div>

        <div class="formula-list">
          <div v-for="letter in activeLetters" :key="letter" :id="'letter-' + letter" class="letter-group">
            <h3 class="letter-heading">{{ letter }}</h3>
            <div class="family-groups">
              <div
                v-for="fam in groupedByLetter[letter]"
                :key="fam.name"
                class="family-group"
              >
                <div class="family-group-head">
                  <span class="family-group-name">{{ fam.name }}</span>
                  <span class="family-group-meta">{{ fam.formulas.length }} {{ fam.formulas.length === 1 ? 'formula' : 'formulas' }} · {{ fam.maxStyles }} styles</span>
                  <span class="family-group-badges">
                    <span :title="fam.licenseName" v-html="getLicenseBadge({ licenseType: fam.licenseType, licenseName: fam.licenseName })"></span>
                    <span :title="fam.sourceType" v-html="getSourceBadge({ sourceType: fam.sourceType })"></span>
                  </span>
                </div>
                <div class="family-group-items">
                  <a
                    v-for="f in fam.formulas"
                    :key="f.slug"
                    :href="`/formulas/${f.slug}`"
                    class="formula-sub-item"
                  >
                    <span class="formula-sub-key">{{ f.formulaName }}</span>
                    <span class="formula-sub-meta">{{ f.familyCount }} {{ f.familyCount === 1 ? 'family' : 'families' }} · {{ f.styleCount }} {{ f.styleCount === 1 ? 'style' : 'styles' }}</span>
                  </a>
                </div>
              </div>
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
      </main>
    </div>
  </div>
</template>

<style scoped>
.search-bar {
  display: flex;
  align-items: center;
  gap: 1rem;
  padding-bottom: 1.5rem;
  border-bottom: 1px solid var(--color-rule);
  margin-bottom: 2rem;
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
  font-style: italic;
}

.result-count {
  font-family: var(--font-mono);
  font-size: 0.72rem;
  text-transform: uppercase;
  letter-spacing: 0.12em;
  color: var(--color-mute);
  white-space: nowrap;
}

.browser-layout {
  display: grid;
  grid-template-columns: 240px 1fr;
  gap: 3rem;
}

.filters-sidebar {
  position: sticky;
  top: 80px;
  align-self: start;
  display: flex;
  flex-direction: column;
  gap: 2rem;
  max-height: calc(100vh - 100px);
  overflow-y: auto;
  padding-right: 0.5rem;
}

.filter-section {
  display: flex;
  flex-direction: column;
}

.filter-heading {
  font-family: var(--font-mono);
  font-size: 0.68rem;
  text-transform: uppercase;
  letter-spacing: 0.16em;
  color: var(--color-accent);
  margin: 0 0 0.75rem;
  padding-bottom: 0.5rem;
  border-bottom: 1px solid var(--color-rule);
}

.filter-checkbox {
  display: flex;
  align-items: center;
  gap: 0.6rem;
  padding: 0.4rem 0.5rem;
  cursor: pointer;
  border-radius: 2px;
  transition: background 0.15s, color 0.15s;
}
.filter-checkbox:hover {
  background: var(--color-paper-deep);
}
.filter-checkbox.on {
  background: var(--color-paper-deep);
}
.filter-checkbox input {
  position: absolute;
  opacity: 0;
  pointer-events: none;
}
.filter-icon {
  display: inline-flex;
  flex-shrink: 0;
  width: 16px;
  height: 16px;
  opacity: 0.6;
  transition: opacity 0.15s;
}
.filter-checkbox.on .filter-icon,
.filter-checkbox:hover .filter-icon {
  opacity: 1;
}
.filter-icon :deep(img) {
  width: 16px;
  height: 16px;
}
.filter-text {
  font-family: var(--font-body);
  font-size: 0.82rem;
  color: var(--color-ink-soft);
  flex: 1;
  transition: color 0.15s;
}
.filter-checkbox.on .filter-text {
  color: var(--color-ink);
  font-weight: 500;
}
.filter-count {
  font-family: var(--font-mono);
  font-size: 0.68rem;
  color: var(--color-mute);
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

.family-groups {
  display: flex;
  flex-direction: column;
}

.family-group {
  padding: 0.6rem 0;
  border-bottom: 1px solid transparent;
  transition: padding 0.15s;
}
.family-group:hover {
  padding-left: 0.5rem;
  padding-right: 0.5rem;
  border-bottom-color: var(--color-rule);
}

.family-group-head {
  display: flex;
  align-items: center;
  gap: 0.6rem;
  margin-bottom: 0.15rem;
}

.family-group-name {
  font-family: var(--font-display);
  font-size: 1.05rem;
  font-weight: 400;
  color: var(--color-ink);
  transition: color 0.2s;
  flex: 1;
}
.family-group:hover .family-group-name {
  color: var(--color-accent);
}

.family-group-meta {
  font-family: var(--font-mono);
  font-size: 0.68rem;
  color: var(--color-mute);
  white-space: nowrap;
}

.family-group-badges {
  display: flex;
  align-items: center;
  gap: 0.3rem;
  opacity: 0.65;
  transition: opacity 0.2s;
  flex-shrink: 0;
}
.family-group:hover .family-group-badges {
  opacity: 1;
}
.family-group-badges :deep(img) {
  width: 16px;
  height: 16px;
}

.family-group-items {
  display: flex;
  flex-direction: column;
  gap: 0.1rem;
  padding-left: 0.75rem;
  border-left: 2px solid var(--color-rule);
  margin-left: 0.25rem;
  margin-top: 0.3rem;
}

.formula-sub-item {
  display: flex;
  align-items: center;
  gap: 0.6rem;
  padding: 0.2rem 0 0.2rem 0.5rem;
  text-decoration: none;
  transition: background 0.15s, padding 0.15s;
  border-radius: 2px;
}
.formula-sub-item:hover {
  background: var(--color-paper-deep);
  padding-left: 0.75rem;
}

.formula-sub-key {
  font-family: var(--font-mono);
  font-size: 0.7rem;
  color: var(--color-ink-soft);
  transition: color 0.15s;
  flex: 1;
}
.formula-sub-item:hover .formula-sub-key {
  color: var(--color-accent);
}

.formula-sub-meta {
  font-family: var(--font-mono);
  font-size: 0.65rem;
  color: var(--color-mute);
  white-space: nowrap;
}

.showing-info {
  font-family: var(--font-mono);
  font-size: 0.68rem;
  color: var(--color-mute);
  margin: 1rem 0;
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

@media (max-width: 800px) {
  .browser-layout {
    grid-template-columns: 1fr;
    gap: 1.5rem;
  }
  .filters-sidebar {
    position: static;
    max-height: none;
    flex-direction: row;
    flex-wrap: wrap;
    gap: 1.5rem;
    padding-right: 0;
  }
  .filter-section {
    flex: 1;
    min-width: 200px;
  }
  .family-group-name {
    font-size: 0.95rem;
  }
  .formula-sub-key {
    font-size: 0.62rem;
  }
  .formula-sub-meta {
    font-size: 0.58rem;
  }
  .family-group-items {
    padding-left: 0.5rem;
  }
}
</style>
