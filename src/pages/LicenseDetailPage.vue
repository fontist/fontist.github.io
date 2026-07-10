<script setup lang="ts">
// LicenseDetailPage — reads structured data from content/licenses/index.json
// (generated from *.yml files) + markdown body from content/licenses/{slug}.md.
// No hardcoded TS license data — everything is data-driven.

import { computed, ref, watch } from 'vue'
import { useRoute, RouterLink } from 'vue-router'
import { useHead } from '@unhead/vue'
import { marked } from 'marked'
import { loadParsedMarkdown } from '../lib/markdown/loader'
import { useMarkdownLinks } from '../composables/useMarkdownLinks'
import LicenseHero from '../components/LicenseHero.vue'
import PermissionsMatrix from '../components/PermissionsMatrix.vue'
import { fetchJson } from '../lib/ssr-fetch'
import { loadAllFormulas as loadFormulasList, type FormulaData } from '../lib/formulas/loader'

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

const route = useRoute()
const contentRef = ref<HTMLElement | null>(null)
const formulas = ref<FormulaData[]>([])
const html = ref('')
const notFound = ref(false)
const allLicenses = ref<LicenseEntry[]>([])

useMarkdownLinks(contentRef)

const licensePath = computed(() => {
  const params = route.params.path
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

useHead(() => ({
  title: license.value
    ? `${license.value.name} — Fontist License Reference`
    : notFound.value
      ? 'License — Not Found'
      : 'License — Fontist',
  link: [{ rel: 'canonical', href: `https://www.fontist.org/licenses/${licensePath.value}` }],
}))
</script>

<template>
  <div class="page-container license-detail">
    <div v-if="notFound" class="ld-notfound">
      <h1>License page not found</h1>
      <p>No license entry exists for <code>{{ licensePath }}</code>.</p>
      <RouterLink to="/licenses">← Back to License Reference</RouterLink>
    </div>

    <template v-else-if="license">
      <nav class="ld-crumbs">
        <RouterLink to="/licenses" class="ld-crumbs-link">Licenses</RouterLink>
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
          <RouterLink
            v-for="sib in siblings"
            :key="sib.slug"
            :to="`/licenses/${sib.slug}`"
            :class="['ld-sibling', `ld-sibling--${sib.category}`]"
          >
            <div class="ld-sibling-head">
              <span :class="['ld-sibling-cat', `ld-sibling-cat--${sib.category}`]">{{ sib.short_name }}</span>
              <span class="ld-sibling-name">{{ sib.name }}</span>
            </div>
            <p class="ld-sibling-blurb">{{ sib.blurb }}</p>
            <span class="ld-sibling-arrow">→</span>
          </RouterLink>
        </div>
      </section>

      <section v-if="matchingFormulas.length > 0" class="ld-formulas">
        <header class="ld-section-head">
          <h2 class="ld-section-title">Formulas using this license</h2>
          <p class="ld-section-sub">{{ matchingFormulas.length }} formula{{ matchingFormulas.length === 1 ? '' : 's' }} in the archive</p>
        </header>
        <ul class="ld-formulas-list">
          <li v-for="f in matchingFormulas.slice(0, 20)" :key="f.slug" class="ld-formula">
            <RouterLink :to="`/formulas/${f.slug}`" class="ld-formula-link">
              <span class="ld-formula-name">{{ f.name }}</span>
              <span class="ld-formula-slug">{{ f.slug }}</span>
            </RouterLink>
          </li>
        </ul>
        <p v-if="matchingFormulas.length > 20" class="ld-formulas-more">
          Showing 20 of {{ matchingFormulas.length }} — <RouterLink to="/formulas">browse all formulas →</RouterLink>
        </p>
      </section>

      <article v-if="html" ref="contentRef" class="ld-body editorial-body" v-html="html"></article>
    </template>

    <div v-else-if="!notFound" class="ld-loading">Loading license…</div>
  </div>
</template>

<style scoped>
.license-detail { max-width: 900px; }
.ld-notfound { padding: 4rem 1rem; text-align: center; }
.ld-notfound h1 { font-family: var(--spec-font-display); font-style: italic; font-weight: 400; font-size: 1.8rem; margin: 0 0 0.75rem; color: var(--spec-ink); }
.ld-notfound p { color: var(--spec-ink-soft); margin: 0 0 1.5rem; }
.ld-notfound a { color: var(--fontist-rose); text-decoration: none; border-bottom: 1px solid currentColor; padding-bottom: 1px; }
.ld-notfound code { font-family: var(--spec-font-mono); font-size: 0.85rem; background: var(--spec-paper-deep); padding: 0.1em 0.4em; border-radius: 2px; }
.ld-crumbs { display: flex; align-items: center; gap: 0.5rem; font-family: var(--spec-font-mono); font-size: 0.72rem; text-transform: uppercase; letter-spacing: 0.1em; margin-bottom: 1.5rem; }
.ld-crumbs-link { color: var(--fontist-rose); text-decoration: none; }
.ld-crumbs-link:hover { text-decoration: underline; }
.ld-crumbs-sep { color: var(--spec-mute); }
.ld-crumbs-here { color: var(--spec-mute); }
.ld-section-head { margin-bottom: 1rem; }
.ld-section-title { font-family: var(--spec-font-display); font-size: 1.3rem; font-style: italic; font-weight: 400; margin: 0 0 0.2rem; color: var(--spec-ink); letter-spacing: -0.005em; }
.ld-section-sub { font-family: var(--spec-font-mono); font-size: 0.72rem; text-transform: uppercase; letter-spacing: 0.1em; color: var(--spec-mute); margin: 0; }
.ld-examples { margin: 2.5rem 0; }
.ld-examples-list { list-style: none; margin: 0; padding: 0; display: grid; grid-template-columns: repeat(auto-fill, minmax(220px, 1fr)); gap: 0.5rem 1.25rem; }
.ld-example { display: flex; flex-direction: column; gap: 0.15rem; padding: 0.5rem 0; border-bottom: 1px solid var(--spec-rule); }
.ld-example-name { font-family: var(--spec-font-display); font-size: 1.1rem; color: var(--spec-ink); font-weight: 500; letter-spacing: -0.005em; }
.ld-example-note { font-family: var(--spec-font-body); font-size: 0.78rem; color: var(--spec-ink-soft); font-style: italic; }
.ld-siblings { margin: 3rem 0; }
.ld-siblings-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(280px, 1fr)); gap: 0.75rem; }
.ld-sibling { display: block; padding: 1rem 1.1rem 1rem 1.25rem; background: var(--spec-paper); border: 1px solid var(--spec-rule); border-left-width: 3px; border-radius: 3px; text-decoration: none; color: var(--spec-ink); transition: transform 0.2s ease, box-shadow 0.2s ease, border-color 0.2s ease; position: relative; }
.ld-sibling--permissive { border-left-color: #a8c19e; }
.ld-sibling--copyleft { border-left-color: #c19e9e; }
.ld-sibling--public-domain { border-left-color: #c1b89e; }
.ld-sibling:hover { transform: translateY(-2px); box-shadow: 0 4px 10px rgba(28,26,24,0.08); }
.ld-sibling-head { display: flex; flex-direction: column; gap: 0.2rem; margin-bottom: 0.5rem; }
.ld-sibling-cat { font-family: var(--spec-font-mono); font-size: 0.65rem; text-transform: uppercase; letter-spacing: 0.12em; font-weight: 600; color: var(--spec-mute); }
.ld-sibling-cat--permissive { color: #6b8f71; }
.ld-sibling-cat--copyleft { color: #8a6b6b; }
.ld-sibling-cat--public-domain { color: #8a7a5e; }
.ld-sibling-name { font-family: var(--spec-font-display); font-size: 1.05rem; font-style: italic; color: var(--spec-ink); }
.ld-sibling-blurb { font-family: var(--spec-font-body); font-size: 0.78rem; line-height: 1.5; color: var(--spec-ink-soft); margin: 0; }
.ld-sibling-arrow { position: absolute; right: 0.75rem; bottom: 0.5rem; font-size: 0.95rem; color: var(--spec-mute); transition: color 0.2s ease, transform 0.2s ease; }
.ld-sibling:hover .ld-sibling-arrow { color: var(--fontist-rose); transform: translateX(3px); }
.ld-formulas { margin: 3rem 0; }
.ld-formulas-list { list-style: none; margin: 0; padding: 0; display: grid; grid-template-columns: repeat(auto-fill, minmax(220px, 1fr)); gap: 0.4rem 1.5rem; }
.ld-formula { margin: 0; padding: 0; }
.ld-formula-link { display: flex; flex-direction: column; gap: 0.1rem; padding: 0.5rem 0; border-bottom: 1px solid var(--spec-rule); text-decoration: none; transition: border-color 0.15s ease; }
.ld-formula-link:hover { border-bottom-color: var(--fontist-rose); }
.ld-formula-name { font-family: var(--spec-font-display); font-size: 0.95rem; color: var(--spec-ink); }
.ld-formula-slug { font-family: var(--spec-font-mono); font-size: 0.7rem; color: var(--spec-mute); }
.ld-formulas-more { font-family: var(--spec-font-mono); font-size: 0.75rem; color: var(--spec-mute); margin: 1rem 0 0; }
.ld-formulas-more a { color: var(--fontist-rose); text-decoration: none; border-bottom: 1px solid currentColor; padding-bottom: 1px; }
.ld-body { margin-top: 2.5rem; padding-top: 1.5rem; border-top: 1px solid var(--spec-rule); }
.ld-loading { padding: 4rem 1rem; text-align: center; color: var(--spec-mute); font-family: var(--spec-font-mono); }
@media (max-width: 720px) { .ld-siblings-grid { grid-template-columns: 1fr; } .ld-formulas-list { grid-template-columns: 1fr 1fr; } }
</style>