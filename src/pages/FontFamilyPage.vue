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
    { rel: 'canonical', href: `https://www.fontist.org/fonts/${familySlug.value}` },
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
        <RouterLink :to="{ path: `/fonts/${familySlug}`, query: { view: 'specimen' } }" class="ffp-nav-link" active-class="on">Specimen</RouterLink>
        <RouterLink :to="{ path: `/fonts/${familySlug}`, query: { view: 'inspector' } }" class="ffp-nav-link" active-class="on">Inspector</RouterLink>
        <RouterLink :to="`/fonts/${familySlug}/unicode`" class="ffp-nav-link">Unicode coverage →</RouterLink>
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
          <RouterLink :to="`/formula/${slug}`" class="ffp-formula-link">{{ slug }}</RouterLink>
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
          :redistributable="currentFile.redistributable"
        />
      </template>
      <template v-else-if="currentFile">
        <FontSpecimen
          :key="currentFile.slug"
          :slug="currentFile.slug"
          :family-name="family.name"
          :font-path="currentFile.path"
          :redistributable="currentFile.redistributable"
        />
        <h2 class="ffp-section-title">Unicode Coverage</h2>
        <FontUnicodeBrowser
          :key="'fub-' + currentFile.slug"
          :slug="currentFile.slug"
          :font-path="currentFile.path"
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
    <RouterLink to="/fonts" class="ffp-nav-link">Browse all families →</RouterLink>
  </div>
</template>

<style scoped>
.ffp {
  max-width: 1100px;
  margin: 0 auto;
  padding: 2.5rem 1.5rem 5rem;
}

.ffp-header { margin-bottom: 1.5rem; }
.ffp-title-row {
  display: flex;
  align-items: baseline;
  gap: 0.75rem;
  flex-wrap: wrap;
}
.ffp-title-row h1 {
  font-size: clamp(2rem, 5vw, 3rem);
  font-weight: 700;
  margin: 0;
  letter-spacing: -0.02em;
  line-height: 1.1;
}
.ffp-license {
  font-size: 0.72rem;
  font-weight: 500;
  text-transform: uppercase;
  letter-spacing: 0.08em;
  color: var(--fontist-rose, #bf4e6a);
  padding: 0.2rem 0.6rem;
  border: 1px solid var(--fontist-rose, #bf4e6a);
  border-radius: 3px;
}
.ffp-badge {
  font-size: 0.7rem;
  font-weight: 600;
  padding: 0.2rem 0.55rem;
  border-radius: 3px;
  text-transform: uppercase;
  letter-spacing: 0.06em;
}
.ffp-badge--ok { background: rgba(63, 185, 80, 0.15); color: #3fb950; }
.ffp-badge--no { background: rgba(139, 150, 168, 0.15); color: #8b96a8; }
.ffp-meta {
  margin: 0.5rem 0 0;
  font-size: 0.82rem;
  color: var(--vp-c-text-3, #888);
}
.ffp-nav {
  display: flex;
  flex-wrap: wrap;
  gap: 1.25rem;
  margin-top: 1rem;
}
.ffp-nav-link {
  font-size: 0.82rem;
  font-weight: 500;
  color: var(--fontist-rose, #bf4e6a);
  text-decoration: none;
  transition: opacity 0.12s;
}
.ffp-nav-link:hover { opacity: 0.7; }
.ffp-nav-link.on { border-bottom: 2px solid var(--fontist-rose, #bf4e6a); padding-bottom: 2px; }
.ffp-nav-link--muted { color: var(--vp-c-text-3, #888); }

.ffp-provenance {
  margin-bottom: 1.5rem;
  padding: 0.9rem 1rem;
  background: var(--vp-c-bg-soft, #faf8f5);
  border-left: 3px solid var(--fontist-rose, #bf4e6a);
  border-radius: 0 4px 4px 0;
}
.ffp-section-title {
  font-size: 0.72rem;
  font-weight: 700;
  text-transform: uppercase;
  letter-spacing: 0.1em;
  margin: 0 0 0.5rem;
  color: var(--vp-c-text-3, #888);
}
.ffp-formula-list {
  list-style: none;
  margin: 0;
  padding: 0;
  display: flex;
  flex-wrap: wrap;
  gap: 0.5rem;
}
.ffp-formula-link {
  font-family: var(--spec-font-mono, monospace);
  font-size: 0.82rem;
  color: var(--vp-c-text-1, #1a1a1a);
  background: var(--vp-c-bg, #fff);
  border: 1px solid var(--vp-c-divider, #e8e6e0);
  padding: 0.25rem 0.6rem;
  border-radius: 3px;
  text-decoration: none;
  transition: all 0.12s;
}
.ffp-formula-link:hover {
  border-color: var(--fontist-rose, #bf4e6a);
  color: var(--fontist-rose, #bf4e6a);
}

.ffp-style-switcher { margin-bottom: 1.5rem; }
.ffp-chips {
  display: flex;
  flex-wrap: wrap;
  gap: 0.4rem;
}
.ffp-chip {
  display: inline-flex;
  flex-direction: column;
  align-items: flex-start;
  padding: 0.35rem 0.75rem;
  background: var(--vp-c-bg, #fff);
  border: 1px solid var(--vp-c-divider, #e8e6e0);
  border-radius: 4px;
  cursor: pointer;
  transition: all 0.15s;
  font-family: inherit;
}
.ffp-chip:hover { border-color: var(--fontist-rose, #bf4e6a); }
.ffp-chip.on {
  background: var(--fontist-rose, #bf4e6a);
  border-color: var(--fontist-rose, #bf4e6a);
}
.ffp-chip-style {
  font-size: 0.82rem;
  font-weight: 600;
  color: var(--vp-c-text-1, #1a1a1a);
}
.ffp-chip.on .ffp-chip-style { color: #fff; }
.ffp-chip-formula {
  font-family: var(--spec-font-mono, monospace);
  font-size: 0.68rem;
  color: var(--vp-c-text-3, #888);
}
.ffp-chip.on .ffp-chip-formula { color: rgba(255, 255, 255, 0.75); }

.ffp-body { margin-top: 1rem; }
.ffp-empty {
  padding: 1.5rem;
  text-align: center;
  background: var(--vp-c-bg-soft, #faf8f5);
  border-radius: 8px;
}
.ffp-empty p { margin: 0 0 0.3rem; color: var(--vp-c-text-2, #555); }
.ffp-empty-hint { font-size: 0.85rem; color: var(--vp-c-text-3, #888); }

.ffp-loading {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 0.5rem;
  min-height: 50vh;
  color: var(--vp-c-text-3, #888);
}
</style>
