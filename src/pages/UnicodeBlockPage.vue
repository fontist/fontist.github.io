<script setup lang="ts">
import { ref, computed, watch } from 'vue'
import { useRoute, useRouter, RouterLink } from 'vue-router'
import { useHead } from '@unhead/vue'
import { loadAllBlocks, loadBlockCharacters, blockDisplayName, hexCp, scriptGroup } from '../lib/unicode'
import type { UnicodeBlock } from '../lib/unicode'
import UnicodeBlockGrid from '../lib/unicode/components/UnicodeBlockGrid.vue'
import type { FontContext } from '../lib/types/domain'
import { resolveFontContexts, parseFontSlugsFromQuery } from '../lib/fonts/compare-context'

const route = useRoute()
const router = useRouter()
const blockSlugParam = computed(() => route.params.blockSlug as string)
const fontSlugs = computed(() => parseFontSlugsFromQuery(route.query.fonts))

const block = ref<UnicodeBlock | null>(null)
const characters = ref<any[]>([])
const fontContexts = ref<FontContext[]>([])

const blockWithChars = computed(() =>
  block.value
    ? { ...block.value, characters: characters.value, assignedCount: characters.value.length }
    : null
)

const isPrivateUse = computed(() =>
  block.value?.name.toLowerCase().includes('private use') ?? false
)

const gridMode = computed(() => (fontContexts.value.length > 1 ? 'multi-font' : fontContexts.value.length === 1 ? 'per-font' : 'standalone'))

async function loadData() {
  const allBlocks = await loadAllBlocks()
  const found = allBlocks.find(b => {
    const slug = b.name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '')
    return slug === blockSlugParam.value
  })
  if (found) {
    block.value = found
    characters.value = await loadBlockCharacters(found.name)
  } else {
    block.value = null
  }

  if (fontSlugs.value.length > 0) {
    fontContexts.value = await resolveFontContexts(fontSlugs.value)
  } else {
    fontContexts.value = []
  }
}

await loadData()
watch([blockSlugParam, fontSlugs], loadData)

const compareTitle = computed(() => {
  if (fontContexts.value.length === 0) return null
  return fontContexts.value.map(f => f.familyName).join(' · ')
})

useHead(() => ({
  title: block.value
    ? compareTitle.value
      ? `${blockDisplayName(block.value.name)} — ${fontContexts.value.length} fonts compared`
      : `${blockDisplayName(block.value.name)} — Unicode Block`
    : 'Unicode Block — Fontist',
  meta: [
    { property: 'og:title', content: block.value ? blockDisplayName(block.value.name) : 'Unicode Block' },
    { property: 'og:type', content: 'website' },
  ],
  link: [
    { rel: 'canonical', href: `https://www.fontist.org/unicode/block/${blockSlugParam.value}` },
  ],
}))

function goToChar(cp: number) {
  const hex = cp.toString(16).toUpperCase().padStart(4, '0')
  router.push(`/unicode/char/${hex}`)
}
</script>

<template>
  <div class="ubp" v-if="block">
    <header class="ubp-head">
      <RouterLink to="/unicode" class="ubp-back">← Unicode Browser</RouterLink>
      <h1>{{ blockDisplayName(block.name) }}</h1>
      <span class="ubp-meta">{{ hexCp(block.start) }}–{{ hexCp(block.end) }} · {{ characters.length }} assigned characters</span>
    </header>

    <div class="ubp-script">{{ scriptGroup(block.name) }}</div>

    <div v-if="fontContexts.length > 0" class="ubp-compare">
      <div class="ubp-compare-title">Comparing {{ fontContexts.length }} fonts:</div>
      <ul class="ubp-compare-list">
        <li v-for="f in fontContexts" :key="f.slug">
          <span class="ubp-compare-swatch" :style="{ background: f.color }"></span>
          <span class="ubp-compare-name">{{ f.familyName }}</span>
          <span class="ubp-compare-slug">{{ f.slug }}</span>
        </li>
      </ul>
    </div>

    <div class="ubp-script" v-if="fontContexts.length === 0">{{ scriptGroup(block.name) }}</div>

    <div class="ubp-pua-notice" v-if="isPrivateUse && characters.length === 0">
      <h2>Private Use Area — No Assigned Characters</h2>
      <p>
        Codepoints in this range are <strong>not assigned</strong> by the Unicode Standard.
        They are reserved for private, corporate, or application-specific use.
      </p>
      <p>
        Font developers and organizations may define their own glyphs here, but these
        assignments are not portable across systems. The Unicode Standard guarantees
        these codepoints will never be assigned characters.
      </p>
      <p class="ubp-pua-link">
        <a :href="`https://www.unicode.org/versions/latest/charts/`" target="_blank" rel="noopener">
          Unicode Standard documentation ↗
        </a>
      </p>
    </div>

    <UnicodeBlockGrid
      v-else-if="blockWithChars"
      :block="blockWithChars"
      :fonts="fontContexts"
      :mode="gridMode"
      :show-missing="true"
      :max-chars="10000"
      @select="goToChar"
    />
  </div>

  <div v-else class="ubp-loading">Block "{{ blockSlugParam }}" not found.</div>
</template>

<style scoped>
.ubp { max-width: 1200px; margin: 0 auto; padding: 1.5rem; }
.ubp-head { display: flex; align-items: baseline; gap: 1rem; flex-wrap: wrap; margin-bottom: 0.5rem; padding-bottom: 0.75rem; border-bottom: 2px solid var(--fontist-rose, #bf4e6a); }
.ubp-back { font-size: 0.85rem; color: var(--fontist-rose, #bf4e6a); text-decoration: none; }
.ubp-head h1 { font-size: 1.4rem; font-weight: 600; margin: 0; color: var(--vp-c-text-1, #333); }
.ubp-meta { font-size: 0.75rem; font-family: monospace; color: var(--vp-c-text-3, #888); margin-left: auto; }
.ubp-script {
  font-size: 0.7rem; text-transform: uppercase; letter-spacing: 0.1em;
  color: var(--fontist-rose, #bf4e6a); margin-bottom: 1rem;
}
.ubp-loading { display: flex; align-items: center; justify-content: center; height: 60vh; color: var(--vp-c-text-3, #888); }

.ubp-compare {
  margin-bottom: 1rem;
  padding: 0.6rem 0.85rem;
  background: var(--vp-c-bg-soft, #faf8f5);
  border: 1px solid var(--vp-c-divider, #e8e6e0);
  border-radius: 6px;
}
.ubp-compare-title {
  font-size: 0.72rem;
  font-weight: 700;
  text-transform: uppercase;
  letter-spacing: 0.08em;
  color: var(--vp-c-text-3, #888);
  margin-bottom: 0.4rem;
}
.ubp-compare-list {
  list-style: none;
  margin: 0;
  padding: 0;
  display: flex;
  flex-wrap: wrap;
  gap: 0.75rem 1.25rem;
}
.ubp-compare-list li {
  display: inline-flex;
  align-items: center;
  gap: 0.4rem;
}
.ubp-compare-swatch {
  display: inline-block;
  width: 14px;
  height: 14px;
  border-radius: 3px;
  border: 1px solid rgba(0,0,0,0.15);
}
.ubp-compare-name { font-size: 0.85rem; font-weight: 600; color: var(--vp-c-text-1, #333); }
.ubp-compare-slug {
  font-family: var(--spec-font-mono, monospace);
  font-size: 0.72rem;
  color: var(--vp-c-text-3, #888);
}

.ubp-pua-notice {
  padding: 2rem;
  background: var(--vp-c-bg-soft, #f8f7f4);
  border-left: 4px solid var(--fontist-rose, #bf4e6a);
  border-radius: 8px;
  margin-bottom: 2rem;
}
.ubp-pua-notice h2 {
  font-size: 1.1rem;
  font-weight: 600;
  margin: 0 0 0.75rem;
  color: var(--vp-c-text-1, #333);
}
.ubp-pua-notice p {
  font-size: 0.88rem;
  line-height: 1.6;
  color: var(--vp-c-text-2, #555);
  margin: 0 0 0.5rem;
}
.ubp-pua-link { margin-top: 1rem !important; }
.ubp-pua-link a {
  color: var(--fontist-rose, #bf4e6a);
  text-decoration: none;
  font-size: 0.82rem;
}
.ubp-pua-link a:hover { text-decoration: underline; }
</style>

<style scoped>
.ubp { max-width: 1200px; margin: 0 auto; padding: 1.5rem; }
.ubp-head { display: flex; align-items: baseline; gap: 1rem; flex-wrap: wrap; margin-bottom: 0.5rem; padding-bottom: 0.75rem; border-bottom: 2px solid var(--fontist-rose, #bf4e6a); }
.ubp-back { font-size: 0.85rem; color: var(--fontist-rose, #bf4e6a); text-decoration: none; }
.ubp-head h1 { font-size: 1.4rem; font-weight: 600; margin: 0; color: var(--vp-c-text-1, #333); }
.ubp-meta { font-size: 0.75rem; font-family: monospace; color: var(--vp-c-text-3, #888); margin-left: auto; }
.ubp-script {
  font-size: 0.7rem; text-transform: uppercase; letter-spacing: 0.1em;
  color: var(--fontist-rose, #bf4e6a); margin-bottom: 1rem;
}
.ubp-loading { display: flex; align-items: center; justify-content: center; height: 60vh; color: var(--vp-c-text-3, #888); }

.ubp-pua-notice {
  padding: 2rem;
  background: var(--vp-c-bg-soft, #f8f7f4);
  border-left: 4px solid var(--fontist-rose, #bf4e6a);
  border-radius: 8px;
  margin-bottom: 2rem;
}
.ubp-pua-notice h2 {
  font-size: 1.1rem;
  font-weight: 600;
  margin: 0 0 0.75rem;
  color: var(--vp-c-text-1, #333);
}
.ubp-pua-notice p {
  font-size: 0.88rem;
  line-height: 1.6;
  color: var(--vp-c-text-2, #555);
  margin: 0 0 0.5rem;
}
.ubp-pua-link { margin-top: 1rem !important; }
.ubp-pua-link a {
  color: var(--fontist-rose, #bf4e6a);
  text-decoration: none;
  font-size: 0.82rem;
}
.ubp-pua-link a:hover { text-decoration: underline; }
</style>
