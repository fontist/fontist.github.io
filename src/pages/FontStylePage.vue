<script setup lang="ts">
import { computed, ref, watch } from 'vue'
import { useRoute, useRouter, RouterLink } from 'vue-router'
import { useHead } from '@unhead/vue'
import { findFilesBySlug, type FamilyFileEntry } from '../lib/fonts/families-loader'
import type { FontFamily, FontFamilyFile } from '../lib/types/domain'
import FontSpecimen from '../components/FontSpecimen.vue'
import FontViewer from '../components/FontViewer.vue'
import NotFound from './NotFound.vue'

const route = useRoute()
const router = useRouter()
const fontSlug = computed(() => route.params.fontSlug as string)
const view = computed(() => (route.query.view as string) || 'specimen')
const requestedFormula = computed(() => (route.query.formula as string) || '')

const entries = ref<FamilyFileEntry[]>([])
const loading = ref(true)

const redistributableEntries = computed(() => entries.value.filter(e => e.file.redistributable))
const hasMultipleFormulas = computed(() => {
  const seen = new Set(entries.value.map(e => e.file.formula_slug))
  return seen.size > 1
})

const requestedMissing = computed(() => {
  if (!requestedFormula.value) return false
  return !entries.value.some(e => e.file.formula_slug === requestedFormula.value)
})

const activeEntry = computed<FamilyFileEntry | null>(() => {
  if (entries.value.length === 0) return null
  if (requestedFormula.value) {
    const hit = entries.value.find(e => e.file.formula_slug === requestedFormula.value)
    if (hit) return hit
  }
  const pool = redistributableEntries.value
  return (pool.length > 0 ? pool : entries.value)[0]
})

const activeFamily = computed<FontFamily | null>(() => activeEntry.value?.family ?? null)
const activeFile = computed<FontFamilyFile | null>(() => activeEntry.value?.file ?? null)

async function load() {
  loading.value = true
  try {
    entries.value = await findFilesBySlug(fontSlug.value)
  } finally {
    loading.value = false
  }
}

await load()
watch(fontSlug, load)

useHead(() => ({
  title: activeEntry.value
    ? `${activeFamily.value?.name} ${activeFile.value?.style} — Fontist`
    : 'Font — Fontist',
  meta: [
    { property: 'og:title', content: activeEntry.value ? `${activeFamily.value?.name} ${activeFile.value?.style}` : 'Fontist Font' },
    { property: 'og:type', content: 'website' },
    {
      name: 'description',
      content: activeEntry.value
        ? `${activeFamily.value?.name} ${activeFile.value?.style} on Fontist. Provided by ${entries.value.length} formula(s).`
        : 'Individual font style on Fontist.',
    },
  ],
  link: [{ rel: 'canonical', href: `https://www.fontist.org/fonts/${fontSlug.value}` }],
}))

function switchFormula(formulaSlug: string) {
  router.replace({ path: `/fonts/${fontSlug.value}`, query: { ...route.query, formula: formulaSlug } })
}
</script>

<template>
  <NotFound v-if="!loading && entries.length === 0" />
  <div class="fsp" v-else-if="!loading && activeEntry">
    <header class="fsp-header">
      <p class="fsp-family-link">
        <RouterLink :to="`/families/${activeFamily?.slug}`" class="fsp-back">← {{ activeFamily?.name }}</RouterLink>
      </p>
      <div class="fsp-title-row">
        <h1>{{ activeFile?.style }}</h1>
        <span v-if="activeFamily" class="fsp-license">{{ activeFamily.license_name }}</span>
        <span
          v-if="activeFile?.redistributable"
          class="fsp-badge fsp-badge--ok"
          title="Freely redistributable"
        >Redistributable</span>
        <span v-else class="fsp-badge fsp-badge--no" title="Proprietary">Proprietary</span>
      </div>
      <p class="fsp-meta">
        Style <code class="fsp-code">{{ fontSlug }}</code>
        · {{ entries.length }} providing {{ entries.length === 1 ? 'formula' : 'formulas' }}
      </p>
      <p v-if="requestedMissing" class="fsp-notice">
        Requested formula <code>{{ requestedFormula }}</code> not available for this style — showing default.
      </p>
      <nav class="fsp-nav">
        <RouterLink :to="{ path: `/fonts/${fontSlug}`, query: { view: 'specimen' } }" class="fsp-nav-link" active-class="on">Specimen</RouterLink>
        <RouterLink :to="{ path: `/fonts/${fontSlug}`, query: { view: 'inspector' } }" class="fsp-nav-link" active-class="on">Inspector</RouterLink>
        <RouterLink :to="`/fonts/${fontSlug}/unicode`" class="fsp-nav-link">Unicode coverage →</RouterLink>
      </nav>
    </header>

    <aside class="fsp-provenance">
      <h2 class="fsp-section-title">Provided by</h2>
      <ul class="fsp-formula-list">
        <li v-for="e in entries" :key="e.file.formula_slug">
          <RouterLink :to="`/formulas/${e.file.formula_slug}`" class="fsp-formula-link">{{ e.file.formula_slug }}</RouterLink>
        </li>
      </ul>
    </aside>

    <section v-if="hasMultipleFormulas" class="fsp-formula-switcher">
      <h2 class="fsp-section-title">Formula version</h2>
      <div class="fsp-chips">
        <button
          v-for="e in entries"
          :key="e.file.formula_slug"
          :class="['fsp-chip', { on: activeFile?.formula_slug === e.file.formula_slug }]"
          @click="switchFormula(e.file.formula_slug)"
        >
          <span class="fsp-chip-formula">{{ e.file.formula_slug }}</span>
          <span v-if="!e.file.redistributable" class="fsp-chip-flag">proprietary</span>
        </button>
      </div>
    </section>

    <main class="fsp-body">
      <template v-if="view === 'inspector' && activeFile">
        <FontViewer
          :key="activeFile.slug + '|' + activeFile.formula_slug"
          :slug="activeFile.slug"
          :font-path="activeFile.path"
          :coverage-file="activeFile.coverage_file"
          :redistributable="activeFile.redistributable"
        />
      </template>
      <template v-else-if="activeFile">
        <FontSpecimen
          :key="activeFile.slug + '|' + activeFile.formula_slug"
          :slug="activeFile.slug"
          :family-name="activeFamily?.name || ''"
          :font-path="activeFile.path"
          :coverage-file="activeFile.coverage_file"
          :redistributable="activeFile.redistributable"
        />
      </template>
      <div v-else class="fsp-empty">
        <p>No specimen available for this style.</p>
        <p class="fsp-empty-hint">All versions are proprietary — install via Fontist to view glyphs locally.</p>
      </div>
    </main>
  </div>

  <div v-else class="fsp-loading">Loading…</div>
</template>

<style scoped>
/* All styles migrated to src/styles/main.css (@layer components). */
</style>
