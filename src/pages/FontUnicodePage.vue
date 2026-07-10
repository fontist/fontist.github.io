<script setup lang="ts">
import { ref, computed, watch } from 'vue'
import { useRoute, useRouter, RouterLink } from 'vue-router'
import { useHead } from '@unhead/vue'
import { injectFontFace } from '../composables/useFontFace'
import { fetchCoverage } from '../composables/useCoverage'
import type { UnicodeBlock } from '../lib/unicode'
import { loadAllBlocks, getPlanes, PLANES, blockDisplayName, blockSlug, hexCp } from '../lib/unicode'
import type { FontContext, Coverage } from '../lib/types/domain'

const route = useRoute()
const router = useRouter()
const slug = computed(() => route.params.slug as string)

const allBlocks = ref<UnicodeBlock[]>([])
const coverage = ref<Coverage | null>(null)
const fontReady = ref(false)
const fontId = ref('')

const fontCtx = computed<FontContext | null>(() => {
  if (!coverage.value) return null
  return {
    slug: slug.value,
    familyName: slug.value,
    fontId: fontId.value,
    fontPath: `fonts/${slug.value}.woff2`,
    redistributable: true,
    coverage: new Set(coverage.value.codepoints || []),
    color: '#bf4e6a',
  }
})

const planes = computed(() => allBlocks.value.length ? getPlanes(allBlocks.value) : [])

async function loadData() {
  const s = slug.value
  if (!s) return
  const { fontId: fid, ensureInjected } = injectFontFace(s, `fonts/${s}.woff2`, true)
  fontId.value = fid
  fontReady.value = ensureInjected()
  coverage.value = await fetchCoverage(s)
  allBlocks.value = await loadAllBlocks()
}

await loadData()
watch(slug, loadData)

useHead(() => ({
  title: `${slug.value.replace(/\b\w/g, c => c.toUpperCase())} — Unicode Coverage`,
  meta: [
    { property: 'og:title', content: `${slug.value} Unicode Coverage` },
    { property: 'og:type', content: 'website' },
  ],
  link: [
    { rel: 'canonical', href: `https://www.fontist.org/font/${slug.value}/unicode` },
  ],
}))

function blockSupportCount(block: UnicodeBlock): number {
  if (!coverage.value?.blocks) return 0
  const cov = coverage.value.blocks.find(b => b.name === block.name)
  return cov?.codepoints?.length || 0
}

function blockStatus(block: UnicodeBlock): string {
  const count = blockSupportCount(block)
  const total = block.end - block.start + 1
  if (count === 0) return 'none'
  if (count >= total * 0.99) return 'full'
  return 'partial'
}

function navigateToBlock(blockName: string) {
  router.push(`/font/${slug.value}/unicode/${blockSlug(blockName)}`)
}
</script>

<template>
  <div class="fup">
    <header class="fup-head">
      <RouterLink :to="`/font/${slug}`" class="fup-back">← {{ slug }}</RouterLink>
      <h1>Unicode Coverage</h1>
      <span v-if="coverage" class="fup-summary">
        {{ coverage.total_codepoints }} codepoints · {{ coverage.supported_blocks }}/{{ coverage.total_blocks }} blocks
      </span>
    </header>

    <div class="fup-planes">
      <section v-for="plane in planes" :key="plane.key" class="fup-plane">
        <h2 class="fup-plane-name">
          {{ plane.shortName }} — {{ plane.name }}
          <span class="fup-plane-range">{{ plane.range }}</span>
        </h2>

        <div class="fup-blocks">
          <div v-for="block in plane.blocks" :key="block.name"
            :class="['fup-block', blockStatus(block)]"
            @click="blockSupportCount(block) > 0 && navigateToBlock(block.name)">
            <div class="fup-block-info">
              <span class="fup-block-name">{{ blockDisplayName(block.name) }}</span>
              <span class="fup-block-range">{{ hexCp(block.start) }}–{{ hexCp(block.end) }}</span>
            </div>
            <div class="fup-block-cov">
              <span class="fup-block-count">{{ blockSupportCount(block) }}</span>
              <span class="fup-block-total">/ {{ block.end - block.start + 1 }}</span>
            </div>
            <div class="fup-block-bar">
              <div class="fup-block-fill" :style="{
                width: (blockSupportCount(block) / (block.end - block.start + 1) * 100) + '%'
              }"></div>
            </div>
          </div>
        </div>
      </section>
    </div>
  </div>
</template>

<style scoped>
/* All styles migrated to src/styles/main.css (@layer components). */
</style>
