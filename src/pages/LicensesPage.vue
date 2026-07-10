<script setup lang="ts">
// LicensesPage — index of all licenses in the fontist archive.
// Reads from content/licenses/index.json (generated from *.yml files).
// Editorial specimen-book aesthetic: hero + pastel accent cards.

import { computed, ref } from 'vue'
import { RouterLink } from 'vue-router'
import { useHead } from '@unhead/vue'
import { fetchJson } from '../lib/ssr-fetch'
import { loadAllFormulas } from '../lib/formulas/loader'
import LicenseCard from '../components/LicenseCard.vue'

interface LicenseEntry {
  slug: string
  name: string
  short_name?: string
  spdx?: string
  category: 'permissive' | 'copyleft' | 'public-domain' | 'special'
  blurb: string
  matchers?: string[]
  exclude_matchers?: string[]
}

const allLicenses = ref<LicenseEntry[]>([])
const formulas = ref<Awaited<ReturnType<typeof loadAllFormulas>>>([])
const formulaCount = ref(0)

async function loadAll() {
  try {
    allLicenses.value = await fetchJson<LicenseEntry[]>('content/licenses/index.json')
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

function licenseMatches(license: LicenseEntry, licenseName: string | undefined): boolean {
  if (!licenseName || !license.matchers) return false
  const ln = licenseName.toLowerCase()
  const matched = license.matchers.some(m => ln.includes(m.toLowerCase()))
  if (!matched) return false
  if (license.exclude_matchers) {
    return !license.exclude_matchers.some(m => ln.includes(m.toLowerCase()))
  }
  return true
}

function formulaCountForLicense(license: LicenseEntry): number {
  return formulas.value.filter(f => licenseMatches(license, f.licenseName)).length
}

const totalsByCategory = computed(() => {
  const counts: Record<string, number> = { permissive: 0, copyleft: 0, 'public-domain': 0, special: 0 }
  for (const f of formulas.value) {
    for (const lic of allLicenses.value) {
      if (licenseMatches(lic, f.licenseName)) { counts[lic.category]++; break }
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
      <span class="lpi-eyebrow">Fontist Archive · Reference</span>
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
.lpi { max-width: 1200px; margin: 0 auto; padding: 3rem 1.5rem 5rem; }
.lpi-hero { margin-bottom: 2.5rem; max-width: 720px; }
.lpi-eyebrow { display: inline-block; font-family: var(--spec-font-mono); font-size: 0.7rem; text-transform: uppercase; letter-spacing: 0.16em; color: var(--fontist-rose); font-weight: 600; margin-bottom: 0.7rem; }
.lpi-title { font-family: var(--spec-font-display); font-size: clamp(2.4rem, 6vw, 4rem); font-weight: 400; letter-spacing: -0.025em; line-height: 1.05; margin: 0 0 1rem; color: var(--spec-ink); }
.lpi-title em { font-style: italic; color: var(--fontist-rose); }
.lpi-lede { font-family: var(--spec-font-body); font-size: 1.05rem; line-height: 1.55; color: var(--spec-ink-soft); margin: 0; }
.lpi-lede em { font-style: italic; color: var(--spec-ink); }
.lpi-filter { display: flex; flex-wrap: wrap; gap: 0.5rem; padding-bottom: 1.25rem; margin-bottom: 1.5rem; border-bottom: 1px solid var(--spec-rule); }
.lpi-filter-btn { display: inline-flex; align-items: baseline; gap: 0.5rem; padding: 0.4rem 0.85rem 0.35rem; background: transparent; border: 1px solid var(--spec-rule); border-radius: 2px; cursor: pointer; font-family: var(--spec-font-mono); color: var(--spec-ink-soft); transition: all 0.18s ease; }
.lpi-filter-btn:hover { border-color: var(--fontist-rose); color: var(--spec-ink); }
.lpi-filter-btn.on { background: var(--spec-ink); border-color: var(--spec-ink); color: var(--spec-paper); }
.lpi-filter-btn--permissive.on { background: #a8c19e; border-color: #a8c19e; color: #1c2e1c; }
.lpi-filter-btn--copyleft.on { background: #c19e9e; border-color: #c19e9e; color: #3a1c1c; }
.lpi-filter-btn--public-domain.on { background: #c1b89e; border-color: #c1b89e; color: #2e2818; }
.lpi-filter-name { font-size: 0.78rem; font-weight: 600; text-transform: uppercase; letter-spacing: 0.08em; }
.lpi-filter-count { font-family: var(--spec-font-display); font-size: 0.95rem; font-weight: 400; font-variant-numeric: tabular-nums; opacity: 0.7; }
.lpi-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(280px, 1fr)); gap: 1rem; margin-bottom: 3rem; }
.lpi-cell { display: contents; }
.lpi-aside { max-width: 720px; padding: 1.75rem 1.75rem; background: var(--spec-paper-deep); border-left: 3px solid var(--fontist-rose); }
.lpi-aside-title { font-family: var(--spec-font-display); font-size: 1.3rem; font-style: italic; font-weight: 400; color: var(--spec-ink); margin: 0 0 0.75rem; letter-spacing: -0.005em; }
.lpi-aside-body { font-family: var(--spec-font-body); font-size: 0.92rem; line-height: 1.6; color: var(--spec-ink-soft); margin: 0 0 0.85rem; }
.lpi-aside-body:last-child { margin-bottom: 0; }
.lpi-aside-body strong { color: var(--spec-ink); font-weight: 600; }
.lpi-aside-body code { font-family: var(--spec-font-mono); font-size: 0.85em; background: var(--spec-paper); padding: 0.1em 0.4em; border-radius: 2px; }
@media (max-width: 720px) { .lpi-hero { margin-bottom: 1.5rem; } .lpi-grid { grid-template-columns: 1fr; } }
</style>