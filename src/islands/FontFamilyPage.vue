<script setup lang="ts">
import { computed, ref } from 'vue'
import { loadFontFamily } from '../lib/fonts/families-loader'
import { pickFileWithData } from '../lib/fonts/pick-file'
import type { FontFamily, FontFamilyFile } from '../lib/types/domain'
import FontSpecimen from '../components/FontSpecimen.vue'
import FontUnicodeBrowser from '../components/FontUnicodeBrowser.vue'
import FontViewer from '../components/FontViewer.vue'

const props = defineProps({
  familySlug: { type: String, required: true }
})

const familySlug = props.familySlug
const view = computed(() => ((typeof window !== 'undefined' ? new URLSearchParams(window.location.search).get('view') : null) as string) || 'specimen')

const family = ref<FontFamily | null>(null)
const loading = ref(true)
const selectedFileSlug = ref<string | null>(null)
const selectableFiles = computed<FontFamilyFile[]>(() =>
  (family.value?.files || []).filter(f => f.redistributable),
)

const currentFile = computed<FontFamilyFile | null>(() => {
  const files = family.value?.files || []
  if (files.length === 0) return null
  // slug is not unique within a family (see pickFileWithData); among
  // equal-slug matches prefer one that actually has assets.
  if (selectedFileSlug.value) {
    const matches = files.filter(f => f.slug === selectedFileSlug.value)
    if (matches.length > 0) return pickFileWithData(matches) ?? null
  }
  return pickFileWithData(files) ?? null
})

async function loadFamily() {
  loading.value = true
  try {
    family.value = await loadFontFamily(familySlug)
    const initial = family.value?.files?.find(f => f.redistributable) || family.value?.files?.[0]
    selectedFileSlug.value = initial?.slug || null
  } finally {
    loading.value = false
  }
}

await loadFamily()

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
        <a :href="`/families/${familySlug}?view=specimen`" class="ffp-nav-link" :class="{ on: view === 'specimen' }">Specimen</a>
        <a :href="`/families/${familySlug}?view=inspector`" class="ffp-nav-link" :class="{ on: view === 'inspector' }">Inspector</a>
        <a :href="`/families/${familySlug}/unicode`" class="ffp-nav-link">Unicode coverage →</a>
        <a
          v-if="selectableFiles.length > 0"
          :href="`/unicode/block/basic-latin?fonts=${selectableFiles.map(f => f.slug).join(',')}`"
          class="ffp-nav-link ffp-nav-link--muted"
        >Compare files in Unicode browser →</a>
      </nav>
    </header>

    <aside class="ffp-provenance">
      <h2 class="ffp-section-title">Provided by</h2>
      <ul class="ffp-formula-list">
        <li v-for="slug in family.formula_slugs" :key="slug">
          <a :href="`/formulas/${slug}`" class="ffp-formula-link">{{ slug }}</a>
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
    <a href="/families" class="ffp-nav-link">Browse all families →</a>
  </div>
</template>

<style scoped>
/* All styles migrated to src/styles/main.css (@layer components). */
</style>
