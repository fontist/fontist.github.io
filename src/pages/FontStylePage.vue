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
.fsp {
  max-width: 1100px;
  margin: 0 auto;
  padding: 2.5rem 1.5rem 5rem;
}

.fsp-header {
  margin-bottom: 2rem;
  padding-bottom: 1.5rem;
  border-bottom: 1px solid var(--vp-c-divider, rgba(28,26,24,0.16));
}
.fsp-family-link {
  margin: 0 0 0.6rem;
  font-family: var(--spec-font-mono);
  font-size: 0.7rem;
  text-transform: uppercase;
  letter-spacing: 0.12em;
}
.fsp-back {
  color: var(--fontist-rose);
  text-decoration: none;
}
.fsp-back:hover { text-decoration: underline; }

.fsp-title-row {
  display: flex;
  align-items: baseline;
  gap: 0.85rem;
  flex-wrap: wrap;
  margin-bottom: 0.5rem;
}
.fsp-title-row h1 {
  font-family: var(--spec-font-display);
  font-size: clamp(2rem, 5vw, 3rem);
  font-weight: 400;
  font-style: italic;
  letter-spacing: -0.02em;
  line-height: 1.05;
  margin: 0;
  color: var(--spec-ink);
}
.fsp-license {
  font-size: 0.72rem;
  font-weight: 500;
  text-transform: uppercase;
  letter-spacing: 0.08em;
  color: var(--fontist-rose, #bf4e6a);
  padding: 0.2rem 0.6rem;
  border: 1px solid var(--fontist-rose, #bf4e6a);
  border-radius: 3px;
}
.fsp-badge {
  font-size: 0.7rem;
  font-weight: 600;
  padding: 0.2rem 0.55rem;
  border-radius: 3px;
  text-transform: uppercase;
  letter-spacing: 0.06em;
}
.fsp-badge--ok { background: rgba(63, 185, 80, 0.15); color: #3fb950; }
.fsp-badge--no { background: rgba(139, 150, 168, 0.15); color: #8b96a8; }
.fsp-meta {
  margin: 0.5rem 0 0;
  font-size: 0.82rem;
  color: var(--vp-c-text-3, #888);
}
.fsp-code {
  font-family: var(--spec-font-mono, monospace);
  font-size: 0.78rem;
  background: var(--vp-c-bg-soft, #faf8f5);
  border: 1px solid var(--vp-c-divider, #e8e6e0);
  padding: 0.05rem 0.35rem;
  border-radius: 3px;
}
.fsp-notice {
  margin: 0.75rem 0 0;
  font-size: 0.82rem;
  color: #8b6f00;
  background: rgba(255, 196, 0, 0.1);
  border-left: 3px solid #8b6f00;
  padding: 0.5rem 0.75rem;
  border-radius: 0 4px 4px 0;
}
.fsp-nav {
  display: flex;
  flex-wrap: wrap;
  gap: 1.25rem;
  margin-top: 1rem;
}
.fsp-nav-link {
  font-size: 0.82rem;
  font-weight: 500;
  color: var(--fontist-rose, #bf4e6a);
  text-decoration: none;
  transition: opacity 0.12s;
}
.fsp-nav-link:hover { opacity: 0.7; }
.fsp-nav-link.on { border-bottom: 2px solid var(--fontist-rose, #bf4e6a); padding-bottom: 2px; }

.fsp-provenance {
  margin-bottom: 1.5rem;
  padding: 0.9rem 1rem;
  background: var(--vp-c-bg-soft, #faf8f5);
  border-left: 3px solid var(--fontist-rose, #bf4e6a);
  border-radius: 0 4px 4px 0;
}
.fsp-section-title {
  font-family: var(--spec-font-display);
  font-size: 1.05rem;
  font-style: italic;
  font-weight: 400;
  margin: 0 0 0.65rem;
  color: var(--spec-ink);
  position: relative;
  padding-bottom: 0.4rem;
  border-bottom: 1px solid var(--vp-c-divider, rgba(28,26,24,0.16));
}
.fsp-section-title::before {
  content: '';
  display: block;
  width: 1.25rem;
  height: 1px;
  background: var(--fontist-rose);
  margin-bottom: 0.5rem;
}
.fsp-formula-list {
  list-style: none;
  margin: 0;
  padding: 0;
  display: flex;
  flex-wrap: wrap;
  gap: 0.5rem;
}
.fsp-formula-link {
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
.fsp-formula-link:hover {
  border-color: var(--fontist-rose, #bf4e6a);
  color: var(--fontist-rose, #bf4e6a);
}

.fsp-formula-switcher { margin-bottom: 1.5rem; }
.fsp-chips {
  display: flex;
  flex-wrap: wrap;
  gap: 0.4rem;
}
.fsp-chip {
  display: inline-flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.35rem 0.75rem;
  background: var(--vp-c-bg, #fff);
  border: 1px solid var(--vp-c-divider, #e8e6e0);
  border-radius: 4px;
  cursor: pointer;
  transition: all 0.15s;
  font-family: inherit;
}
.fsp-chip:hover { border-color: var(--fontist-rose, #bf4e6a); }
.fsp-chip.on {
  background: var(--fontist-rose, #bf4e6a);
  border-color: var(--fontist-rose, #bf4e6a);
}
.fsp-chip-formula {
  font-family: var(--spec-font-mono, monospace);
  font-size: 0.78rem;
  color: var(--vp-c-text-1, #1a1a1a);
}
.fsp-chip.on .fsp-chip-formula { color: #fff; }
.fsp-chip-flag {
  font-size: 0.62rem;
  text-transform: uppercase;
  letter-spacing: 0.06em;
  color: var(--vp-c-text-3, #888);
  border-left: 1px solid var(--vp-c-divider, #e8e6e0);
  padding-left: 0.5rem;
}
.fsp-chip.on .fsp-chip-flag { color: rgba(255, 255, 255, 0.75); border-left-color: rgba(255, 255, 255, 0.3); }

.fsp-body { margin-top: 1rem; }
.fsp-empty {
  padding: 1.5rem;
  text-align: center;
  background: var(--vp-c-bg-soft, #faf8f5);
  border-radius: 8px;
}
.fsp-empty p { margin: 0 0 0.3rem; color: var(--vp-c-text-2, #555); }
.fsp-empty-hint { font-size: 0.85rem; color: var(--vp-c-text-3, #888); }

.fsp-loading {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 0.5rem;
  min-height: 50vh;
  color: var(--vp-c-text-3, #888);
}
</style>
