<script setup lang="ts">
// LicensesPage — index of all licenses in the fontist archive.
// Reads from content/licenses/index.json (generated from *.yml files).
// Editorial specimen-book aesthetic: hero + pastel accent cards.

import { computed, ref } from 'vue'
import { RouterLink } from 'vue-router'
import { useHead } from '@unhead/vue'
import { loadLicenseIndex, formulaMatchesLicenseSync, type LicenseIndexEntry } from '../lib/licenses/classifier'
import { loadAllFormulas } from '../lib/formulas/loader'
import LicenseCard from '../components/LicenseCard.vue'

type LicenseEntry = LicenseIndexEntry

const allLicenses = ref<LicenseEntry[]>([])
const formulas = ref<Awaited<ReturnType<typeof loadAllFormulas>>>([])
const formulaCount = ref(0)

async function loadAll() {
  try {
    allLicenses.value = await loadLicenseIndex()
  } catch {
    allLicenses.value = []
  }
  try {
    const all = await loadAllFormulas()
    formulas.value = all
    formulaCount.value = all.length
  } catch {
    formulas.value = []
  }
}

await loadAll()

type Filter = 'all' | LicenseEntry['category']
const activeFilter = ref<Filter>('all')

const CATEGORY_LABELS: Record<string, string> = {
  'all':           'All',
  'permissive':    'Permissive',
  'copyleft':      'Copyleft',
  'public-domain': 'Public domain',
  'special':       'Special',
}

const filteredLicenses = computed(() => {
  if (activeFilter.value === 'all') return allLicenses.value
  return allLicenses.value.filter(l => l.category === activeFilter.value)
})

function formulaCountForLicense(license: LicenseEntry): number {
  let n = 0
  for (const f of formulas.value) {
    if (formulaMatchesLicenseSync(f, license)) n++
  }
  return n
}

const totalsByCategory = computed(() => {
  const counts: Record<string, number> = { permissive: 0, copyleft: 0, 'public-domain': 0, special: 0 }
  for (const f of formulas.value) {
    for (const lic of allLicenses.value) {
      if (formulaMatchesLicenseSync(f, lic)) { counts[lic.category]++; break }
    }
  }
  return counts
})

useHead({
  title: 'License Reference — Fontist',
  meta: [
    { name: 'description', content: 'A typography-focused reference to the licenses used by fonts in the Fontist archive.' },
  ],
  link: [{ rel: 'canonical', href: 'https://www.fontist.org/licenses' }],
})
</script>

<template>
  <div class="lpi">
    <header class="lpi-hero">
      <h1 class="lpi-title">License <em>Reference</em></h1>
      <p class="lpi-lede">
        A typography-focused guide to the licenses used by fonts in the Fontist
        archive. Each entry answers the practical question: <em>can I use this font
        commercially, embed it in a PDF, bundle it in an app, modify it?</em>
      </p>
    </header>

    <nav class="lpi-filter" aria-label="Filter licenses by category">
      <button
        :class="['lpi-filter-btn', { on: activeFilter === 'all' }]"
        @click="activeFilter = 'all'"
      >
        <span class="lpi-filter-name">All</span>
        <span class="lpi-filter-count">{{ formulaCount.toLocaleString() }}</span>
      </button>
      <button
        v-for="cat in (['permissive', 'copyleft', 'public-domain'] as const)"
        :key="cat"
        :class="['lpi-filter-btn', `lpi-filter-btn--${cat}`, { on: activeFilter === cat }]"
        @click="activeFilter = cat"
      >
        <span class="lpi-filter-name">{{ CATEGORY_LABELS[cat] }}</span>
        <span class="lpi-filter-count">{{ totalsByCategory[cat]?.toLocaleString() ?? 0 }}</span>
      </button>
    </nav>

    <section class="lpi-grid">
      <article
        v-for="lic in filteredLicenses"
        :key="lic.slug"
        class="lpi-cell"
      >
        <LicenseCard
          :name="lic.name"
          :spdx="lic.spdx"
          :short-name="lic.short_name"
          :category="lic.category"
          :blurb="lic.blurb"
          :formula-count="formulaCountForLicense(lic)"
          :href="`/licenses/${lic.slug}`"
        />
      </article>
    </section>

    <aside class="lpi-aside">
      <h2 class="lpi-aside-title">What licenses matter for typography?</h2>
      <p class="lpi-aside-body">
        The Fontist archive skews heavily toward <strong>SIL OFL</strong> (~{{ Math.round((totalsByCategory.permissive ?? 0) * 100 / Math.max(1, formulaCount)) }}% of open-license formulas) because
        the OFL is purpose-built for fonts. <strong>Apache 2.0</strong>, <strong>MIT</strong>, and <strong>BSD</strong> are general-purpose
        permissive licenses occasionally adopted by foundries. <strong>CC0</strong> is the only true public-domain dedication available for fonts.
        The <strong>LGPL/GPL with font exception</strong> covers a small number of legacy Ghostscript-era families.
      </p>
      <p class="lpi-aside-body">
        Each license's data is maintained as a YAML file in <code>content/licenses/{slug}.yml</code> — permissions, matchers, and examples are all data-driven.
      </p>
    </aside>
  </div>
</template>

<style scoped>
/* All styles migrated to src/styles/main.css (@layer components). */
</style>