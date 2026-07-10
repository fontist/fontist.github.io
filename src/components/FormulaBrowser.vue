<script setup>
import { ref, computed } from 'vue'
import { RouterLink, useRoute } from 'vue-router'
import { loadAllFormulas } from '../lib/formulas/loader'

const route = useRoute()


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

// Read query params from vue-router (not window.location)
function initFromQuery() {
  const q = route.query.q
  if (typeof q === 'string' && q) {
    searchQuery.value = q
  }

  const license = route.query.license
  if (typeof license === 'string' && licenseParamMap[license]) {
    selectedLicenses.value = licenseParamMap[license]
  }

  const source = route.query.source
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
  return result.sort((a, b) => (a.name || '').localeCompare(b.name || ''))
})

const groupedFormulas = computed(() => {
  const groups = {}
  filteredFormulas.value.forEach(f => {
    if (!f || !f.name) return
    const letter = f.name.charAt(0).toUpperCase()
    if (!groups[letter]) groups[letter] = []
    groups[letter].push(f)
  })
  return groups
})

const activeLetters = computed(() => {
  return alphabet.filter(letter => {
    const group = groupedFormulas.value[letter]
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
    <div class="search-container">
      <input v-model="searchQuery" type="text" placeholder="Search fonts by name, family, or formula key..." class="search-input" />
      <span class="result-count">{{ filteredFormulas.length }} formulas</span>
    </div>

    <div class="browser-layout">
      <aside class="filters-sidebar">
        <div class="filter-section">
          <h4>License</h4>
          <label v-for="opt in licenseOptions" :key="opt.value" class="filter-checkbox">
            <input type="checkbox" :checked="selectedLicenses.includes(opt.value)" @change="toggleLicense(opt.value)" />
            <span class="filter-label"><span class="filter-icon" v-html="getLicenseIcon(opt.icon)"></span> {{ opt.label }} <span class="filter-count">({{ opt.count }})</span></span>
          </label>
        </div>
        <div class="filter-section">
          <h4>Source</h4>
          <label v-for="opt in sourceOptions" :key="opt.value" class="filter-checkbox">
            <input type="checkbox" :checked="selectedSources.includes(opt.value)" @change="toggleSource(opt.value)" />
            <span class="filter-label"><span class="filter-icon" v-html="getSourceIcon(opt.icon)"></span> {{ opt.label }} <span class="filter-count">({{ opt.count }})</span></span>
          </label>
        </div>
      </aside>

      <main class="results-main">
        <nav class="alpha-nav">
          <button v-for="letter in alphabet" :key="letter" @click="scrollToLetter(letter)" :class="{ 'has-content': groupedFormulas[letter] }" :disabled="!groupedFormulas[letter]">{{ letter }}</button>
        </nav>

        <div class="formula-list">
          <div v-for="letter in activeLetters" :key="letter" :id="'letter-' + letter" class="letter-group">
            <h3 class="letter-heading">{{ letter }}</h3>
            <div class="formula-items">
              <RouterLink v-for="f in groupedFormulas[letter]" :key="f.slug" :to="`/formulas/${f.slug}`" class="formula-item">
                <div class="formula-main">
                  <span class="formula-name">{{ f.name }}</span>
                  <span class="formula-key">{{ f.formulaName }}</span>
                </div>
                <div class="formula-meta">
                  <span class="formula-badges"><span :title="f.licenseName" v-html="getLicenseBadge(f)"></span> <span :title="f.sourceType" v-html="getSourceBadge(f)"></span></span>
                  <span class="formula-counts">{{ f.familyCount }} {{ f.familyCount === 1 ? 'family' : 'families' }}, {{ f.styleCount }} {{ f.styleCount === 1 ? 'style' : 'styles' }}</span>
                </div>
              </RouterLink>
            </div>
          </div>
        </div>
      </main>
    </div>
  </div>
</template>

<style scoped>
.formulas-browser {
  margin-top: 1rem;
  max-width: 100%;
}

.search-container {
  display: flex;
  align-items: baseline;
  gap: 1.25rem;
  margin-bottom: 1.5rem;
  padding: 0.6rem 0;
  border-bottom: 1px solid var(--spec-rule);
}

.search-input {
  flex: 1;
  padding: 0.5rem 0;
  font-family: var(--spec-font-display);
  font-style: italic;
  font-size: clamp(1.1rem, 1.6vw, 1.4rem);
  border: none;
  border-bottom: 1px solid transparent;
  background: transparent;
  color: var(--spec-ink);
  letter-spacing: -0.005em;
  transition: border-color 0.2s ease;
}

.search-input:focus {
  outline: none;
  border-bottom-color: var(--fontist-rose);
}

.search-input::placeholder {
  color: var(--spec-mute);
  font-style: italic;
}

.result-count {
  font-family: var(--spec-font-mono);
  font-size: 0.7rem;
  text-transform: uppercase;
  letter-spacing: 0.12em;
  color: var(--spec-mute);
  white-space: nowrap;
}

.browser-layout {
  display: grid;
  grid-template-columns: 200px 1fr;
  gap: 1.5rem;
  width: 100%;
}

.filters-sidebar {
  position: sticky;
  top: 1rem;
  max-height: calc(100vh - 3rem);
  overflow-y: auto;
  padding: 1rem;
  background: var(--color-paper-deep);
  border-radius: 8px;
  border: 1px solid var(--spec-rule);
  flex-shrink: 0;
}

/* Custom scrollbar for sidebar */
.filters-sidebar::-webkit-scrollbar {
  width: 6px;
}

.filters-sidebar::-webkit-scrollbar-track {
  background: transparent;
}

.filters-sidebar::-webkit-scrollbar-thumb {
  background: var(--spec-rule);
  border-radius: 3px;
}

.filters-sidebar::-webkit-scrollbar-thumb:hover {
  background: var(--color-mute);
}

.filter-section {
  margin-bottom: 1.5rem;
}

.filter-section:last-child {
  margin-bottom: 0;
}

.filter-section h4 {
  margin: 0 0 0.75rem 0;
  font-size: 0.85rem;
  font-weight: 600;
  color: var(--color-ink-soft);
  text-transform: uppercase;
  letter-spacing: 0.05em;
}

.filter-checkbox {
  display: flex;
  align-items: flex-start;
  gap: 0.5rem;
  margin-bottom: 0.5rem;
  cursor: pointer;
}

.filter-checkbox input {
  margin-top: 0.2rem;
  cursor: pointer;
}

.filter-label {
  font-size: 0.9rem;
  color: var(--color-ink);
}

.filter-icon {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 16px;
  height: 16px;
  margin-right: 0.25rem;
}

.filter-icon :deep(.filter-icon-img),
.filter-icon :deep(img) {
  width: 16px;
  height: 16px;
  display: inline-block;
  vertical-align: middle;
}

.filter-count {
  font-size: 0.8rem;
  color: var(--color-mute);
}

.results-main {
  min-width: 0;
  width: 100%;
  overflow: hidden;
}

.alpha-nav {
  display: flex;
  flex-wrap: wrap;
  gap: 0.2rem;
  margin-bottom: 1.5rem;
  padding-bottom: 1rem;
  border-bottom: 1px solid var(--spec-rule);
  position: sticky;
  top: calc(56px + 0.5rem);
  z-index: 10;
  background: var(--spec-paper);
  padding-top: 0.5rem;
}

.alpha-nav button {
  width: 28px;
  height: 28px;
  padding: 0;
  border: 1px solid var(--spec-rule);
  border-radius: 2px;
  background: transparent;
  color: var(--spec-mute);
  font-family: var(--spec-font-mono);
  font-size: 0.72rem;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.15s ease;
  letter-spacing: 0;
}

.alpha-nav button:hover:not(:disabled) {
  background: var(--spec-paper-deep);
  border-color: var(--fontist-rose);
  color: var(--fontist-rose);
}

.alpha-nav button.has-content {
  color: var(--spec-ink);
  background: var(--spec-paper);
}

.alpha-nav button:disabled {
  opacity: 0.3;
  cursor: default;
}

.letter-group {
  margin-bottom: 2rem;
  /* Skip rendering cost for off-screen letter groups. Massive perf win
     on a 4,283-formula list. The browser still ships the HTML for SEO. */
  content-visibility: auto;
  contain-intrinsic-size: auto 600px;
}

.letter-heading {
  font-family: var(--spec-font-display);
  font-size: 2rem;
  font-weight: 400;
  font-style: italic;
  color: var(--spec-ink);
  margin: 0 0 1rem 0;
  padding-bottom: 0.5rem;
  border-bottom: 1px solid var(--spec-rule);
  letter-spacing: -0.02em;
  position: relative;
}
.letter-heading::before {
  content: '';
  display: block;
  width: 1.5rem;
  height: 1px;
  background: var(--fontist-rose);
  margin-bottom: 0.6rem;
}

.formula-items {
  display: grid;
  gap: 0.5rem;
  grid-template-columns: repeat(auto-fill, minmax(320px, 1fr));
}

.formula-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 0.65rem 0.85rem;
  border: 1px solid var(--spec-rule);
  border-radius: 3px;
  background: var(--spec-paper);
  text-decoration: none;
  transition: transform 0.18s ease, border-color 0.18s ease, box-shadow 0.18s ease;
}

.formula-item:hover {
  border-color: var(--fontist-rose);
  transform: translateY(-1px);
  box-shadow: 0 2px 6px rgba(28,26,24,0.06);
}

.formula-main {
  display: flex;
  flex-direction: column;
  gap: 0.15rem;
  min-width: 0;
  flex: 1;
}

.formula-name {
  font-family: var(--spec-font-display);
  font-weight: 500;
  font-size: 0.98rem;
  color: var(--spec-ink);
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  letter-spacing: -0.005em;
}

.formula-key {
  font-family: var(--spec-font-mono);
  font-size: 0.72rem;
  color: var(--spec-mute);
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.formula-meta {
  display: flex;
  flex-direction: column;
  align-items: flex-end;
  gap: 0.25rem;
  flex-shrink: 0;
  margin-left: 0.5rem;
}

.formula-badges {
  display: flex;
  align-items: center;
  gap: 4px;
}

.formula-badges :deep(.source-icon) {
  width: 14px;
  height: 14px;
  display: inline-block;
  vertical-align: middle;
}

.formula-badges :deep(.license-icon) {
  width: 14px;
  height: 14px;
  display: inline-block;
  vertical-align: middle;
}

.formula-counts {
  font-size: 0.8rem;
  color: var(--color-mute);
  white-space: nowrap;
}

@media (max-width: 900px) {
  .browser-layout {
    grid-template-columns: 1fr;
  }

  .filters-sidebar {
    position: static;
    order: 2;
  }

  .results-main {
    order: 1;
  }

  .formula-items {
    grid-template-columns: 1fr;
  }
}

@media (max-width: 768px) {
  .formula-item {
    flex-direction: column;
    align-items: flex-start;
    gap: 0.5rem;
  }

  .formula-meta {
    flex-direction: row;
    align-items: center;
    width: 100%;
    justify-content: space-between;
    margin-left: 0;
  }
}
</style>
