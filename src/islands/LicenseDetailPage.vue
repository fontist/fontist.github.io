<script setup lang="ts">
// LicenseDetailPage — reads structured data from content/licenses/index.json
// (generated from *.yml files) + markdown body from content/licenses/{slug}.md.
// No hardcoded TS license data — everything is data-driven.

import { computed, ref, watch } from 'vue'
import { marked } from 'marked'
import { loadParsedMarkdown } from '../lib/markdown/loader'
import { useMarkdownLinks } from '../composables/useMarkdownLinks'
import LicenseHero from '../components/LicenseHero.vue'
import PermissionsMatrix from '../components/PermissionsMatrix.vue'
import { fetchJson } from '../lib/ssr-fetch'
import { loadAllFormulas as loadFormulasList, type FormulaData } from '../lib/formulas/loader'

const props = defineProps({
  path: { type: String, required: true }
})

interface LicenseEntry {
  slug: string
  name: string
  short_name?: string
  spdx?: string
  version?: string
  year_adopted?: string
  category: 'permissive' | 'copyleft' | 'public-domain' | 'special'
  blurb: string
  matchers?: string[]
  exclude_matchers?: string[]
  permissions?: Record<string, string>
  siblings?: string[]
  examples?: { name: string; note?: string }[]
}

const contentRef = ref<HTMLElement | null>(null)
const formulas = ref<FormulaData[]>([])
const html = ref('')
const notFound = ref(false)
const allLicenses = ref<LicenseEntry[]>([])

useMarkdownLinks(contentRef)

const licensePath = computed(() => {
  const params = props.path
  return Array.isArray(params) && params.length > 0 ? params.join('/') : ''
})

const license = computed<LicenseEntry | undefined>(() => {
  return allLicenses.value.find(l => l.slug === licensePath.value)
})

function licenseMatches(lic: LicenseEntry, licenseName: string | undefined): boolean {
  if (!licenseName || !lic.matchers) return false
  const ln = licenseName.toLowerCase()
  const matched = lic.matchers.some(m => ln.includes(m.toLowerCase()))
  if (!matched) return false
  if (lic.exclude_matchers) {
    return !lic.exclude_matchers.some(m => ln.includes(m.toLowerCase()))
  }
  return true
}

const matchingFormulas = computed(() => {
  if (!license.value) return []
  return formulas.value.filter(f => licenseMatches(license.value!, f.licenseName))
})

const siblings = computed(() => {
  if (!license.value?.siblings) return []
  return license.value.siblings
    .map(slug => allLicenses.value.find(l => l.slug === slug))
    .filter((l): l is LicenseEntry => !!l)
})

const formulaPercent = computed(() => {
  if (!license.value || formulas.value.length === 0) return 0
  return Math.round((matchingFormulas.value.length / formulas.value.length) * 1000) / 10
})

async function loadAll() {
  // Load license data from generated JSON + all formulas for counting
  try {
    allLicenses.value = await fetchJson<LicenseEntry[]>('content/licenses/index.json')
  } catch {
    allLicenses.value = []
  }
  try {
    formulas.value = await loadFormulasList()
  } catch {
    formulas.value = []
  }

  // Load markdown body for this license
  if (licensePath.value) {
    const candidates = [
      `content/licenses/${licensePath.value}.md`,
      `content/licenses/${licensePath.value.replace(/-/g, '_')}.md`,
    ]
    let found: string | null = null
    for (const p of candidates) {
      const parsed = await loadParsedMarkdown(p)
      if (parsed) { found = parsed.body; break }
    }
    if (found) {
      html.value = await marked(found)
    } else if (!license.value) {
      notFound.value = true
    }
  }
}

await loadAll()
watch(licensePath, loadAll)

</script>

<template>
  <div class="page-container license-detail">
    <div v-if="notFound" class="ld-notfound">
      <h1>License page not found</h1>
      <p>No license entry exists for <code>{{ licensePath }}</code>.</p>
      <a href="/licenses">← Back to License Reference</a>
    </div>

    <template v-else-if="license">
      <nav class="ld-crumbs">
        <a href="/licenses" class="ld-crumbs-link">Licenses</a>
        <span class="ld-crumbs-sep">›</span>
        <span class="ld-crumbs-here">{{ license.name }}</span>
      </nav>

      <LicenseHero
        :name="license.name"
        :spdx="license.spdx"
        :short-name="license.short_name"
        :version="license.version"
        :category="license.category"
        :summary="license.blurb"
        :formula-count="matchingFormulas.length"
        :formula-percent="formulaPercent"
        :year-adopted="license.year_adopted"
      />

      <section v-if="license.examples && license.examples.length > 0" class="ld-examples">
        <header class="ld-section-head">
          <h2 class="ld-section-title">Notable examples</h2>
          <p class="ld-section-sub">Well-known fonts using this license</p>
        </header>
        <ul class="ld-examples-list">
          <li v-for="ex in license.examples" :key="ex.name" class="ld-example">
            <span class="ld-example-name">{{ ex.name }}</span>
            <span v-if="ex.note" class="ld-example-note">{{ ex.note }}</span>
          </li>
        </ul>
      </section>

      <PermissionsMatrix v-if="license.permissions" :answers="license.permissions" />

      <section v-if="siblings.length > 0" class="ld-siblings">
        <header class="ld-section-head">
          <h2 class="ld-section-title">Compare with related licenses</h2>
          <p class="ld-section-sub">Pick the right license by understanding the differences</p>
        </header>
        <div class="ld-siblings-grid">
          <a
            v-for="sib in siblings"
            :key="sib.slug"
            :href="`/licenses/${sib.slug}`"
            :class="['ld-sibling', `ld-sibling--${sib.category}`]"
          >
            <div class="ld-sibling-head">
              <span :class="['ld-sibling-cat', `ld-sibling-cat--${sib.category}`]">{{ sib.short_name }}</span>
              <span class="ld-sibling-name">{{ sib.name }}</span>
            </div>
            <p class="ld-sibling-blurb">{{ sib.blurb }}</p>
            <span class="ld-sibling-arrow">→</span>
          </a>
        </div>
      </section>

      <section v-if="matchingFormulas.length > 0" class="ld-formulas">
        <header class="ld-section-head">
          <h2 class="ld-section-title">Formulas using this license</h2>
          <p class="ld-section-sub">{{ matchingFormulas.length }} formula{{ matchingFormulas.length === 1 ? '' : 's' }} in the archive</p>
        </header>
        <ul class="ld-formulas-list">
          <li v-for="f in matchingFormulas.slice(0, 20)" :key="f.slug" class="ld-formula">
            <a :href="`/v1/formulas/${f.slug}`" class="ld-formula-link">
              <span class="ld-formula-name">{{ f.name }}</span>
              <span class="ld-formula-slug">{{ f.slug }}</span>
            </a>
          </li>
        </ul>
        <p v-if="matchingFormulas.length > 20" class="ld-formulas-more">
          Showing 20 of {{ matchingFormulas.length }} — <a href="/v1/formulas">browse all formulas →</a>
        </p>
      </section>

      <article v-if="html" ref="contentRef" class="ld-body editorial-body" v-html="html"></article>
    </template>

    <div v-else-if="!notFound" class="ld-loading">Loading license…</div>
  </div>
</template>

<style scoped>
/* All styles migrated to src/styles/main.css (@layer components). */
</style>