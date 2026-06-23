<script setup lang="ts">
import { ref, computed, watch } from 'vue'
import { useRoute, useRouter, RouterLink } from 'vue-router'
import { useHead } from '@unhead/vue'
import { injectFontFace } from '../composables/useFontFace'
import { fetchCoverage } from '../composables/useCoverage'
import type { UnicodeBlock } from '../lib/unicode'
import { loadAllBlocks, loadBlockCharacters, blockDisplayName, blockSlug, hexCp } from '../lib/unicode'
import UnicodeBlockGrid from '../lib/unicode/components/UnicodeBlockGrid.vue'
import type { FontContext, Coverage } from '../lib/types/domain'

const route = useRoute()
const router = useRouter()
const slug = computed(() => route.params.slug as string)
const blockParam = computed(() => route.params.block as string)

const block = ref<UnicodeBlock | null>(null)
const coverage = ref<Coverage | null>(null)
const fontReady = ref(false)
const selectedCp = ref<number | null>(null)
const fontId = ref('')

const fontCtx = computed<FontContext | null>(() => {
  if (!coverage.value) return null
  return {
    slug: slug.value, familyName: slug.value, fontId: fontId.value,
    fontPath: `fonts/${slug.value}.woff2`, redistributable: true,
    coverage: new Set(coverage.value.codepoints || []), color: '#bf4e6a',
  }
})

const supportedCount = computed(() => {
  if (!block.value || !coverage.value) return 0
  const cps = new Set(coverage.value.codepoints || [])
  return block.value.characters.filter(c => cps.has(c.cp)).length
})

const missingCount = computed(() => {
  if (!block.value) return 0
  return block.value.characters.length - supportedCount.value
})

async function loadData() {
  const s = slug.value
  if (!s) return
  const { fontId: fid, ensureInjected } = injectFontFace(s, `fonts/${s}.woff2`, true)
  fontId.value = fid
  fontReady.value = ensureInjected()
  coverage.value = await fetchCoverage(s)

  const allBlocks = await loadAllBlocks()
  const found = allBlocks.find(b => blockSlug(b.name) === blockParam.value)

  if (found) {
    const chars = await loadBlockCharacters(found.name)
    block.value = { ...found, characters: chars, assignedCount: chars.length }
  }
}

await loadData()
watch([slug, blockParam], loadData)

useHead(() => ({
  title: block.value
    ? `${slug.value} / ${blockDisplayName(block.value.name)} — Coverage`
    : `${slug.value} — Coverage`,
  link: [
    { rel: 'canonical', href: `https://www.fontist.org/font/${slug.value}/unicode/${blockParam.value}` },
  ],
}))

function goToChar(cp: number) {
  const hex = cp.toString(16).toUpperCase().padStart(4, '0')
  router.push(`/unicode/char/${hex}`)
}
</script>

<template>
  <div class="fbp" v-if="block">
    <header class="fbp-head">
      <RouterLink :to="`/font/${slug}/unicode`" class="fbp-back">← All blocks</RouterLink>
      <h1>{{ blockDisplayName(block.name) }}</h1>
      <span class="fbp-meta">
        {{ hexCp(block.start) }}–{{ hexCp(block.end) }} ·
        <strong>{{ supportedCount }}</strong>/{{ block.characters.length }} supported ·
        <strong>{{ missingCount }}</strong> missing
      </span>
    </header>

    <UnicodeBlockGrid
      :block="block"
      :fonts="fontCtx ? [fontCtx] : []"
      mode="per-font"
      :show-missing="true"
      @select="goToChar"
    />
  </div>

  <div v-else class="fbp-loading">Block not found.</div>
</template>

<style scoped>
.fbp { padding: 1.5rem; max-width: 1200px; margin: 0 auto; }
.fbp-head { display: flex; align-items: baseline; gap: 1rem; margin-bottom: 1rem; padding-bottom: 0.75rem; border-bottom: 1px solid var(--vp-c-divider, #e2e2e3); }
.fbp-back { font-size: 0.85rem; color: var(--fontist-rose, #bf4e6a); text-decoration: none; }
.fbp-head h1 { font-size: 1.3rem; margin: 0; color: var(--vp-c-text-1, #333); }
.fbp-meta { font-size: 0.78rem; color: var(--vp-c-text-3, #888); font-family: monospace; margin-left: auto; }
.fbp-loading { display: flex; align-items: center; justify-content: center; height: 60vh; color: var(--vp-c-text-3, #888); }
</style>
