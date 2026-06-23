<script setup lang="ts">
import { ref, computed, onMounted, watch } from 'vue'
import { useRoute, useRouter, RouterLink } from 'vue-router'
import { injectFontFace } from '../composables/useFontFace'
import { fetchCoverage } from '../composables/useCoverage'
import type { UnicodeBlock, FontContext } from '../lib/unicode'
import { loadAllBlocks, getPlanes, PLANES, blockDisplayName, hexCp } from '../lib/unicode'

const route = useRoute()
const router = useRouter()
const slug = computed(() => route.params.slug as string)

const loading = ref(true)
const allBlocks = ref<UnicodeBlock[]>([])
const coverage = ref<any>(null)
const fontReady = ref(false)
const fontId = ref('')

const fontCtx = computed<FontContext | null>(() => {
  if (!coverage.value) return null
  return {
    slug: slug.value,
    familyName: slug.value,
    fontId: fontId.value,
    woff2Path: `fonts/${slug.value}.woff2`,
    redistributable: true,
    coverage: new Set(coverage.value.codepoints || []),
    color: '#bf4e6a',
  }
})

const planes = computed(() => allBlocks.value.length ? getPlanes(allBlocks.value) : [])

async function loadData() {
  loading.value = true
  const s = slug.value
  if (!s) { loading.value = false; return }
  const { fontId: fid, ensureInjected } = injectFontFace(s, `fonts/${s}.woff2`, true)
  fontId.value = fid
  fontReady.value = ensureInjected()
  coverage.value = await fetchCoverage(s)
  allBlocks.value = await loadAllBlocks()
  loading.value = false
}

onMounted(loadData)
watch(slug, loadData)

function blockSupportCount(block: UnicodeBlock): number {
  if (!coverage.value?.blocks) return 0
  const cov = coverage.value.blocks.find((b: any) => b.name === block.name)
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
  const blockSlug = blockName.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '')
  router.push(`/font/${slug.value}/unicode/${blockSlug}`)
}
</script>

<template>
  <div class="fup" v-if="!loading">
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

  <div v-else class="fup-loading">Loading Unicode data…</div>
</template>

<style scoped>
.fup { padding: 1.5rem; max-width: 1000px; margin: 0 auto; }
.fup-head { display: flex; align-items: baseline; gap: 1rem; margin-bottom: 1.5rem; border-bottom: 1px solid var(--vp-c-divider, #e2e2e3); padding-bottom: 0.75rem; }
.fup-back { font-size: 0.85rem; color: var(--fontist-rose, #bf4e6a); text-decoration: none; }
.fup-head h1 { font-size: 1.3rem; margin: 0; color: var(--vp-c-text-1, #333); }
.fup-summary { font-size: 0.78rem; color: var(--vp-c-text-3, #888); margin-left: auto; font-family: monospace; }

.fup-plane { margin-bottom: 2rem; }
.fup-plane-name { font-size: 0.95rem; font-weight: 600; color: var(--vp-c-text-1, #333); margin-bottom: 0.5rem; display: flex; align-items: baseline; gap: 0.5rem; }
.fup-plane-range { font-size: 0.7rem; color: var(--vp-c-text-3, #888); font-family: monospace; }

.fup-blocks { display: flex; flex-direction: column; gap: 2px; }
.fup-block { display: flex; align-items: center; gap: 0.75rem; padding: 0.4rem 0.6rem; border-radius: 4px; background: var(--vp-c-bg-soft, #f6f6f7); cursor: default; transition: background 0.1s; }
.fup-block.full, .fup-block.partial { cursor: pointer; }
.fup-block.full:hover, .fup-block.partial:hover { background: var(--vp-c-bg-alt, #ededed); }
.fup-block.none { opacity: 0.35; }
.fup-block-info { flex: 1; display: flex; align-items: baseline; gap: 0.5rem; }
.fup-block-name { font-size: 0.82rem; color: var(--vp-c-text-1, #333); }
.fup-block-range { font-size: 0.65rem; color: var(--vp-c-text-3, #888); font-family: monospace; }
.fup-block-cov { display: flex; gap: 0.1rem; font-family: monospace; font-size: 0.72rem; }
.fup-block-count { color: var(--fontist-rose, #bf4e6a); font-weight: 600; }
.fup-block-total { color: var(--vp-c-text-3, #888); }
.fup-block-bar { width: 80px; height: 4px; background: var(--vp-c-divider, #e2e2e3); border-radius: 2px; overflow: hidden; }
.fup-block-fill { height: 100%; background: var(--fontist-rose, #bf4e6a); border-radius: 2px; transition: width 0.3s; }

.fup-loading { display: flex; align-items: center; justify-content: center; height: 60vh; color: var(--vp-c-text-3, #888); }
</style>
