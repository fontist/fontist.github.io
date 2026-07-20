<script setup lang="ts">
import { ref, computed, watch } from 'vue'
import { loadAllFormulas } from '../lib/formulas/loader'
import { useAlphabetPaginatedBrowse } from '../composables/useAlphabetPaginatedBrowse'
import { getLicenseGroup, licenseIconPath, sourceIconPath, licenseIconForFormula, sourceIconForFormula } from '../lib/formulas/badges'
import type { FormulaData } from '../lib/types/domain'

interface FamilyGroup {
  name: string
  formulas: FormulaData[]
  maxStyles: number
  licenseName: string
  licenseType: string
  sourceType: string
}

const allFormulas = ref<FormulaData[]>([])
const selectedLicense = ref('all')
const selectedSource = ref('all')

const LICENSE_FILTERS = [
  { value: 'all', label: 'All', icon: 'all' },
  { value: 'ofl', label: 'OFL', icon: 'ofl' },
  { value: 'apache', label: 'Apache', icon: 'apache' },
  { value: 'mit', label: 'MIT', icon: 'mit' },
  { value: 'cc0', label: 'CC0', icon: 'cc0' },
  { value: 'other_open', label: 'Other Open', icon: 'open' },
  { value: 'freely_dist', label: 'Freely Dist.', icon: 'free' },
  { value: 'platform', label: 'Platform', icon: 'platform' },
  { value: 'bundled', label: 'Bundled', icon: 'bundled' },
  { value: 'unknown', label: 'Unknown', icon: 'unknown' },
]

const SOURCE_FILTERS = [
  { value: 'all', label: 'All' },
  { value: 'google', label: 'Google' },
  { value: 'sil', label: 'SIL' },
  { value: 'macos', label: 'Apple' },
  { value: 'manual', label: 'Expert' },
]

const licenseCounts = computed(() => {
  const counts: Record<string, number> = {}
  for (const f of allFormulas.value) {
    const g = getLicenseGroup(f)
    counts[g] = (counts[g] || 0) + 1
  }
  counts['all'] = allFormulas.value.length
  return counts
})

const sourceCounts = computed(() => {
  const counts: Record<string, number> = {}
  for (const f of allFormulas.value) {
    counts[f.sourceType] = (counts[f.sourceType] || 0) + 1
  }
  counts['all'] = allFormulas.value.length
  return counts
})

const filteredFormulas = computed(() => {
  let result = allFormulas.value
  if (selectedLicense.value !== 'all') {
    result = result.filter(f => getLicenseGroup(f) === selectedLicense.value)
  }
  if (selectedSource.value !== 'all') {
    result = result.filter(f => f.sourceType === selectedSource.value)
  }
  return result
})

const familyGroups = computed<FamilyGroup[]>(() => {
  const map = new Map<string, FamilyGroup>()
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
    const group = map.get(key)!
    group.formulas.push(f)
    if ((f.styleCount || 0) > group.maxStyles) group.maxStyles = f.styleCount
  }
  return [...map.values()].sort((a, b) => a.name.localeCompare(b.name))
})

const browse = useAlphabetPaginatedBrowse<FamilyGroup>(familyGroups, {
  pageSize: 50,
  nameAccessor: g => g.name,
  searchAccessor: g => [g.name, ...g.formulas.map(f => f.formulaName)],
  scrollSelector: '.formulas-browser',
})

watch([selectedLicense, selectedSource], () => browse.resetPage())

try {
  allFormulas.value = await loadAllFormulas()
} catch (e) {
  console.error('Failed to load formulas data:', e)
}
</script>

<template>
  <div class="formulas-browser browse-root">
    <div class="search-bar">
      <label class="search-field">
        <svg class="search-icon" viewBox="0 0 20 20" aria-hidden="true" focusable="false">
          <circle cx="9" cy="9" r="6" fill="none" stroke="currentColor" stroke-width="1.6" />
          <path d="M13.5 13.5 L17.5 17.5" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" />
        </svg>
        <input
          v-model="browse.searchQuery.value"
          type="search"
          placeholder="Search by name, family, or formula key…"
          class="search-input"
          aria-label="Search formulas"
        />
      </label>
      <span class="result-count">{{ browse.filteredItems.value.length.toLocaleString() }} families ({{ filteredFormulas.length.toLocaleString() }} formulas)</span>
    </div>

    <div class="filters">
      <div class="filter-row">
        <span class="filter-label">License</span>
        <div class="filter-chips">
          <button
            v-for="f in LICENSE_FILTERS"
            :key="f.value"
            :class="['chip', { on: selectedLicense === f.value }]"
            @click="selectedLicense = f.value"
          >
            {{ f.label }}
            <span class="chip-count">{{ licenseCounts[f.value] || 0 }}</span>
          </button>
        </div>
      </div>
      <div class="filter-row">
        <span class="filter-label">Source</span>
        <div class="filter-chips">
          <button
            v-for="f in SOURCE_FILTERS"
            :key="f.value"
            :class="['chip', { on: selectedSource === f.value }]"
            @click="selectedSource = f.value"
          >
            {{ f.label }}
            <span class="chip-count">{{ sourceCounts[f.value] || 0 }}</span>
          </button>
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
      Showing {{ browse.showingFrom.value.toLocaleString() }}–{{ browse.showingTo.value.toLocaleString() }} of {{ browse.filteredItems.value.length.toLocaleString() }} font families
    </div>

    <div class="family-list">
      <div
        v-for="letter in browse.activeLetters.value"
        :key="letter"
        :id="'letter-' + letter"
        class="letter-group"
      >
        <h3 class="letter-heading">{{ letter }}</h3>
        <div class="family-groups">
          <div
            v-for="fam in browse.groupedByLetter.value[letter]"
            :key="fam.name"
            class="family-group"
          >
            <div class="family-group-head">
              <span class="family-group-name">{{ fam.name }}</span>
              <span class="family-group-meta">{{ fam.formulas.length }} {{ fam.formulas.length === 1 ? 'formula' : 'formulas' }} · {{ fam.maxStyles }} styles</span>
              <span class="family-group-badges">
                <img v-for="badge in [licenseIconForFormula({ licenseType: fam.licenseType, licenseName: fam.licenseName } as FormulaData)]" :key="'lic'" :src="badge.src" :alt="badge.alt" :title="fam.licenseName" class="badge-icon" />
                <img v-for="badge in [sourceIconForFormula({ sourceType: fam.sourceType } as FormulaData)]" :key="'src'" :src="badge.src" :alt="badge.alt" :title="fam.sourceType" class="badge-icon" />
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
/* The field was a bare 1px underline at --color-rule (14% alpha in dark),
   with no fill or icon — on the dark theme it read as no control at all.
   Give it an explicit surface, a stronger edge and a search glyph so it is
   discoverable, while keeping the editorial type treatment. */
.search-field {
  flex: 1;
  display: flex;
  align-items: center;
  gap: 0.6rem;
  padding: 0.6rem 0.85rem;
  background: var(--color-paper-deep);
  border: 1px solid var(--color-rule-strong);
  border-radius: 3px;
  transition: border-color 0.2s ease, box-shadow 0.2s ease;
}
.search-field:focus-within {
  border-color: var(--color-accent);
  box-shadow: 0 0 0 3px var(--color-accent-soft);
}
.search-icon {
  width: 1rem;
  height: 1rem;
  flex: none;
  color: var(--color-mute);
}
.search-input {
  flex: 1;
  background: transparent;
  border: none;
  padding: 0;
  font-family: var(--font-body);
  font-size: 1rem;
  color: var(--color-ink);
  outline: none;
}
.search-input::placeholder { color: var(--color-mute); font-style: italic; }
/* Safari renders a default inner affordance on type=search. */
.search-input::-webkit-search-decoration,
.search-input::-webkit-search-cancel-button { -webkit-appearance: none; }
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
  min-width: 70px;
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

.family-groups { display: flex; flex-direction: column; }
.family-group {
  padding: 0.6rem 0;
  border-bottom: 1px solid transparent;
  transition: padding 0.15s;
}
.family-group:hover { padding-left: 0.5rem; padding-right: 0.5rem; border-bottom-color: var(--color-rule); }

.family-group-head { display: flex; align-items: center; gap: 0.6rem; margin-bottom: 0.15rem; }
.family-group-name {
  font-family: var(--font-display);
  font-size: 1.05rem;
  font-weight: 400;
  color: var(--color-ink);
  transition: color 0.2s;
  flex: 1;
}
.family-group:hover .family-group-name { color: var(--color-accent); }
.family-group-meta {
  font-family: var(--font-mono);
  font-size: 0.68rem;
  color: var(--color-mute);
  white-space: nowrap;
}
.family-group-badges { display: flex; align-items: center; gap: 0.3rem; opacity: 0.65; transition: opacity 0.2s; flex-shrink: 0; }
.family-group:hover .family-group-badges { opacity: 1; }
.badge-icon { width: 16px; height: 16px; }

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
.formula-sub-item:hover { background: var(--color-paper-deep); padding-left: 0.75rem; }
.formula-sub-key {
  font-family: var(--font-mono);
  font-size: 0.7rem;
  color: var(--color-ink-soft);
  transition: color 0.15s;
  flex: 1;
}
.formula-sub-item:hover .formula-sub-key { color: var(--color-accent); }
.formula-sub-meta { font-family: var(--font-mono); font-size: 0.65rem; color: var(--color-mute); white-space: nowrap; }

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
  .family-group-name { font-size: 0.95rem; }
  .formula-sub-key { font-size: 0.62rem; }
  .formula-sub-meta { font-size: 0.58rem; }
  .family-group-items { padding-left: 0.5rem; }
}
</style>
