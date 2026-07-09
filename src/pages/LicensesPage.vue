<script setup lang="ts">
// LicensesPage — index of all licenses in the fontist archive.
// Editorial specimen-book aesthetic: hero with display-serif title +
// mono categories, pastel accent border per license card matching its
// category. Cards link to per-license pages (kept as markdown content
// from public/content/licenses/{slug}.md for license text + lore).

import { computed, ref } from 'vue'
import { RouterLink } from 'vue-router'
import { useHead } from '@unhead/vue'
import { loadMarkdown } from '../lib/markdown/loader'
import { loadAllFormulas } from '../lib/formulas/loader'
import LicenseCard from '../components/LicenseCard.vue'
import { LICENSES, getFormulaCountForLicense, type LicenseCategory, type LicenseMeta } from '../lib/license-data'
import { LICENSE_MATCHERS } from '../lib/license-matchers'

const formulas = ref<Awaited<ReturnType<typeof loadAllFormulas>>>([])
const formulaCount = ref(0)
const intro = ref('')

async function loadAll() {
  try {
    const all = await loadAllFormulas()
    formulas.value = all
    formulaCount.value = all.length
  } catch {
    formulas.value = []
    formulaCount.value = 0
  }
  intro.value = await loadMarkdown('content/licenses/index.md') ?? ''
}

await loadAll()

type Filter = 'all' | LicenseCategory
const activeFilter = ref<Filter>('all')

const CATEGORY_LABELS: Record<Filter, string> = {
  'all':           'All',
  'permissive':    'Permissive',
  'copyleft':      'Copyleft',
  'public-domain': 'Public domain',
  'special':       'Special',
}

const filteredLicenses = computed(() => {
  if (activeFilter.value === 'all') return LICENSES
  return LICENSES.filter(l => l.category === activeFilter.value)
})

function formulaCountForLicense(license: LicenseMeta): number {
  return getFormulaCountForLicense(license, formulas.value)
}

const totalsByCategory = computed(() => {
  const counts: Record<LicenseCategory, number> = { permissive: 0, copyleft: 0, 'public-domain': 0, special: 0 }
  for (const f of formulas.value) {
    for (const lic of LICENSES) {
      const match = LICENSE_MATCHERS[lic.slug]
      if (match && match(f.licenseName)) { counts[lic.category]++; break }
    }
  }
  return counts
})

useHead({
  title: 'License Reference — Fontist',
  meta: [
    { name: 'description', content: 'A typography-focused reference to the licenses used by fonts in the Fontist archive: what each permits, requires, and forbids.' },
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
        v-for="cat in (['permissive', 'copyleft', 'public-domain'] as LicenseCategory[])"
        :key="cat"
        :class="['lpi-filter-btn', `lpi-filter-btn--${cat}`, { on: activeFilter === cat }]"
        @click="activeFilter = cat"
      >
        <span class="lpi-filter-name">{{ CATEGORY_LABELS[cat] }}</span>
        <span class="lpi-filter-count">{{ totalsByCategory[cat].toLocaleString() }}</span>
      </button>
    </nav>

    <section class="lpi-grid" :class="`lpi-grid--${activeFilter}`">
      <article
        v-for="lic in filteredLicenses"
        :key="lic.name"
        class="lpi-cell"
      >
        <LicenseCard
          :name="lic.name"
          :spdx="lic.spdx"
          :short-name="lic.shortName"
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
        The Fontist archive skews heavily toward <strong>SIL OFL</strong> (~{{ Math.round(totalsByCategory.permissive * 100 / Math.max(1, formulaCount)) }}% of open-license formulas) because
        the OFL is purpose-built for fonts: it covers embedding, subsetting, modification,
        and commercial use in plain language. <strong>Apache 2.0</strong>, <strong>MIT</strong>, and <strong>BSD</strong> are general-purpose
        permissive licenses occasionally adopted by foundries; they're interchangeable for most
        practical purposes. <strong>CC0</strong> is the only true public-domain dedication available for fonts.
        The <strong>LGPL/GPL with font exception</strong> covers a small number of legacy Ghostscript-era families.
      </p>
      <p class="lpi-aside-body">
        See also: <RouterLink to="/guide/license-considerations" class="lpi-aside-link">License considerations in the guide →</RouterLink>
      </p>
    </aside>
  </div>
</template>

<style scoped>
.lpi { max-width: 1200px; margin: 0 auto; padding: 3rem 1.5rem 5rem; }

/* ── Hero ───────────────────────────────────────────────────── */
.lpi-hero { margin-bottom: 2.5rem; max-width: 720px; }

.lpi-eyebrow {
  display: inline-block;
  font-family: var(--spec-font-mono);
  font-size: 0.7rem;
  text-transform: uppercase;
  letter-spacing: 0.16em;
  color: var(--fontist-rose);
  font-weight: 600;
  margin-bottom: 0.7rem;
}

.lpi-title {
  font-family: var(--spec-font-display);
  font-size: clamp(2.4rem, 6vw, 4rem);
  font-weight: 400;
  letter-spacing: -0.025em;
  line-height: 1.05;
  margin: 0 0 1rem;
  color: var(--spec-ink);
}

.lpi-title em {
  font-style: italic;
  color: var(--fontist-rose);
}

.lpi-lede {
  font-family: var(--spec-font-body);
  font-size: 1.05rem;
  line-height: 1.55;
  color: var(--spec-ink-soft);
  margin: 0;
}

.lpi-lede em {
  font-style: italic;
  color: var(--spec-ink);
}

/* ── Filter pills ──────────────────────────────────────────── */
.lpi-filter {
  display: flex;
  flex-wrap: wrap;
  gap: 0.5rem;
  padding-bottom: 1.25rem;
  margin-bottom: 1.5rem;
  border-bottom: 1px solid var(--vp-c-divider, rgba(28,26,24,0.16));
}

.lpi-filter-btn {
  display: inline-flex;
  align-items: baseline;
  gap: 0.5rem;
  padding: 0.4rem 0.85rem 0.35rem;
  background: transparent;
  border: 1px solid var(--vp-c-divider, rgba(28,26,24,0.16));
  border-radius: 2px;
  cursor: pointer;
  font-family: var(--spec-font-mono);
  color: var(--spec-ink-soft);
  transition: all 0.18s ease;
}

.lpi-filter-btn:hover {
  border-color: var(--fontist-rose);
  color: var(--spec-ink);
}

.lpi-filter-btn.on {
  background: var(--spec-ink);
  border-color: var(--spec-ink);
  color: var(--spec-paper);
}

.lpi-filter-btn--permissive.on    { background: #a8c19e; border-color: #a8c19e; color: #1c2e1c; }
.lpi-filter-btn--copyleft.on      { background: #c19e9e; border-color: #c19e9e; color: #3a1c1c; }
.lpi-filter-btn--public-domain.on { background: #c1b89e; border-color: #c1b89e; color: #2e2818; }

.lpi-filter-name {
  font-size: 0.78rem;
  font-weight: 600;
  text-transform: uppercase;
  letter-spacing: 0.08em;
}

.lpi-filter-count {
  font-family: var(--spec-font-display);
  font-size: 0.95rem;
  font-weight: 400;
  color: inherit;
  font-variant-numeric: tabular-nums;
  opacity: 0.7;
}

/* ── Grid ──────────────────────────────────────────────────── */
.lpi-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(280px, 1fr));
  gap: 1rem;
  margin-bottom: 3rem;
}

.lpi-cell { display: contents; }

/* ── Aside ─────────────────────────────────────────────────── */
.lpi-aside {
  max-width: 720px;
  padding: 1.75rem 1.75rem;
  background: var(--spec-paper-deep);
  border-left: 3px solid var(--fontist-rose);
}

.lpi-aside-title {
  font-family: var(--spec-font-display);
  font-size: 1.3rem;
  font-style: italic;
  font-weight: 400;
  color: var(--spec-ink);
  margin: 0 0 0.75rem;
  letter-spacing: -0.005em;
}

.lpi-aside-body {
  font-family: var(--spec-font-body);
  font-size: 0.92rem;
  line-height: 1.6;
  color: var(--spec-ink-soft);
  margin: 0 0 0.85rem;
}

.lpi-aside-body:last-child { margin-bottom: 0; }
.lpi-aside-body strong { color: var(--spec-ink); font-weight: 600; }

.lpi-aside-link {
  color: var(--fontist-rose);
  text-decoration: none;
  border-bottom: 1px solid currentColor;
  padding-bottom: 1px;
}

@media (max-width: 720px) {
  .lpi-hero { margin-bottom: 1.5rem; }
  .lpi-grid { grid-template-columns: 1fr; }
}
</style>