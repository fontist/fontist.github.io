<script setup lang="ts">
import { computed, ref, watch } from 'vue'
import { useRoute, RouterLink } from 'vue-router'
import { useHead } from '@unhead/vue'
import { loadFontFamily } from '../lib/fonts/families-loader'
import type { FontFamily, FontFamilyFile } from '../lib/types/domain'
import FontSpecimen from '../components/FontSpecimen.vue'
import FontUnicodeBrowser from '../components/FontUnicodeBrowser.vue'
import FontViewer from '../components/FontViewer.vue'

const route = useRoute()
const familySlug = computed(() => route.params.familySlug as string)
const view = computed(() => (route.query.view as string) || 'specimen')

const family = ref<FontFamily | null>(null)
const loading = ref(true)
const selectedFileSlug = ref<string | null>(null)
const selectableFiles = computed<FontFamilyFile[]>(() =>
  (family.value?.files || []).filter(f => f.redistributable),
)

const currentFile = computed<FontFamilyFile | null>(() => {
  const files = family.value?.files || []
  if (files.length === 0) return null
  if (selectedFileSlug.value) {
    const found = files.find(f => f.slug === selectedFileSlug.value)
    if (found) return found
  }
  return files[0]
})

async function loadFamily() {
  loading.value = true
  try {
    family.value = await loadFontFamily(familySlug.value)
    const initial = family.value?.files?.find(f => f.redistributable) || family.value?.files?.[0]
    selectedFileSlug.value = initial?.slug || null
  } finally {
    loading.value = false
  }
}

await loadFamily()
watch(familySlug, loadFamily)

useHead(() => ({
  title: family.value ? `${family.value.name} — Font Family` : 'Font Family — Fontist',
  meta: [
    { property: 'og:title', content: family.value?.name || 'Fontist Font Family' },
    { property: 'og:type', content: 'website' },
    {
      name: 'description',
      content: family.value
        ? `${family.value.name} font family on Fontist. ${family.value.formula_slugs.length} providing formula(s), ${family.value.style_count} style(s), license: ${family.value.license_name}.`
        : 'Font family detail on Fontist.',
    },
  ],
  link: [
    { rel: 'canonical', href: `https://www.fontist.org/families/${familySlug.value}` },
  ],
}))

function selectFile(slug: string) {
  selectedFileSlug.value = slug
}
</script>

<template>
  <div class="ffp" v-if="!loading && family">
    <header class="ffp-header">
      <div class="ffp-title-row">
        <h1>{{ family.name }}</h1>
        <span class="ffp-license">{{ family.license_name }}</span>
        <span
          v-if="family.redistributable"
          class="ffp-badge ffp-badge--ok"
          title="At least one redistributable file"
        >Redistributable</span>
        <span v-else class="ffp-badge ffp-badge--no" title="No redistributable files">Proprietary</span>
      </div>
      <p class="ffp-meta">
        {{ family.style_count }} {{ family.style_count === 1 ? 'style' : 'styles' }}
        · {{ family.formula_slugs.length }} providing {{ family.formula_slugs.length === 1 ? 'formula' : 'formulas' }}
        · {{ family.files.length }} {{ family.files.length === 1 ? 'file' : 'files' }}
      </p>
      <nav class="ffp-nav">
        <RouterLink :to="{ path: `/families/${familySlug}`, query: { view: 'specimen' } }" class="ffp-nav-link" active-class="on">Specimen</RouterLink>
        <RouterLink :to="{ path: `/families/${familySlug}`, query: { view: 'inspector' } }" class="ffp-nav-link" active-class="on">Inspector</RouterLink>
        <RouterLink :to="`/families/${familySlug}/unicode`" class="ffp-nav-link">Unicode coverage →</RouterLink>
        <RouterLink
          v-if="selectableFiles.length > 0"
          :to="`/unicode/block/basic-latin?fonts=${selectableFiles.map(f => f.slug).join(',')}`"
          class="ffp-nav-link ffp-nav-link--muted"
        >Compare files in Unicode browser →</RouterLink>
      </nav>
    </header>

    <aside class="ffp-provenance">
      <h2 class="ffp-section-title">Provided by</h2>
      <ul class="ffp-formula-list">
        <li v-for="slug in family.formula_slugs" :key="slug">
          <RouterLink :to="`/formulas/${slug}`" class="ffp-formula-link">{{ slug }}</RouterLink>
        </li>
      </ul>
    </aside>

    <section v-if="selectableFiles.length > 1" class="ffp-style-switcher">
      <h2 class="ffp-section-title">Files</h2>
      <div class="ffp-chips">
        <button
          v-for="f in selectableFiles"
          :key="f.slug"
          :class="['ffp-chip', { on: currentFile?.slug === f.slug }]"
          @click="selectFile(f.slug)"
        >
          <span class="ffp-chip-style">{{ f.style }}</span>
          <span class="ffp-chip-formula">{{ f.formula_slug }}</span>
        </button>
      </div>
    </section>

    <main class="ffp-body">
      <template v-if="view === 'inspector' && currentFile">
        <FontViewer
          :key="currentFile.slug"
          :slug="currentFile.slug"
          :font-path="currentFile.path"
          :coverage-file="currentFile.coverage_file"
          :redistributable="currentFile.redistributable"
        />
      </template>
      <template v-else-if="currentFile">
        <FontSpecimen
          :key="currentFile.slug"
          :slug="currentFile.slug"
          :family-name="family.name"
          :font-path="currentFile.path"
          :coverage-file="currentFile.coverage_file"
          :redistributable="currentFile.redistributable"
        />
        <h2 class="ffp-section-title">Unicode Coverage</h2>
        <FontUnicodeBrowser
          :key="'fub-' + currentFile.slug"
          :slug="currentFile.slug"
          :font-path="currentFile.path"
          :coverage-file="currentFile.coverage_file"
          :redistributable="currentFile.redistributable"
        />
      </template>
      <div v-else class="ffp-empty">
        <p>No specimen available for this family.</p>
        <p class="ffp-empty-hint">All files are proprietary — install via Fontist to view glyphs locally.</p>
      </div>
    </main>
  </div>

  <div v-else-if="loading" class="ffp-loading">Loading…</div>
  <div v-else class="ffp-loading">
    <p>Family not found.</p>
    <RouterLink to="/families" class="ffp-nav-link">Browse all families →</RouterLink>
  </div>
</template>

<style scoped>
/* All styles migrated to src/styles/main.css (@layer components). */
</style>
