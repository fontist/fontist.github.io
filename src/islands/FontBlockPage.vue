<script setup lang="ts">
import { ref, computed, watch } from 'vue'
import { injectFontFace } from '../composables/useFontFace'
import { loadCoverage } from '../lib/unicode/coverage'
import type { UnicodeBlock } from '../lib/unicode'
import { loadAllBlocks, loadBlockCharacters, blockDisplayName, blockSlug, hexCp, charRoute } from '../lib/unicode'
import UnicodeBlockGrid from '../lib/unicode/components/UnicodeBlockGrid.vue'
import type { FontContext, Coverage } from '../lib/types/domain'

const props = defineProps({
  block: { type: String, required: true },
  slug: { type: String, required: true }
})

const slug = props.slug
const blockParam = props.block

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
  coverage.value = await loadCoverage(s)

  const allBlocks = await loadAllBlocks()
  const found = allBlocks.find(b => blockSlug(b.name) === blockParam.value)

  if (found) {
    const chars = await loadBlockCharacters(found.name)
    block.value = { ...found, characters: chars, assignedCount: chars.length }
  }
}

await loadData()
watch([slug, blockParam], loadData)


function goToChar(cp: number) {
  window.location.href = charRoute(cp)
}
</script>

<template>
  <div class="fbp" v-if="block">
    <header class="fbp-head">
      <a :href="`/font/${slug}/unicode`" class="fbp-back">← All blocks</a>
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
/* All styles migrated to src/styles/main.css (@layer components). */
</style>
