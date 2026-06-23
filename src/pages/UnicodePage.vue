<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { RouterLink } from 'vue-router'
import { loadAllBlocks, getPlanes, blockDisplayName, hexCp, blockSlug } from '../lib/unicode'
import type { UnicodeBlock } from '../lib/unicode'

const loading = ref(true)
const allBlocks = ref<UnicodeBlock[]>([])

const planes = computed(() => getPlanes(allBlocks.value))

onMounted(async () => {
  allBlocks.value = await loadAllBlocks()
  loading.value = false
})
</script>

<template>
  <div class="uc" v-if="!loading">
    <header class="uc-header">
      <h1>Unicode Browser</h1>
      <p>The complete Unicode standard. All 7 planes, all 346 blocks, every assigned character.</p>
    </header>

    <div class="uc-planes">
      <RouterLink
        v-for="plane in planes"
        :key="plane.key"
        :to="`/unicode/plane/${plane.key}`"
        class="uc-plane-card"
      >
        <span class="uc-plane-short">{{ plane.shortName }}</span>
        <span class="uc-plane-name">{{ plane.name }}</span>
        <span class="uc-plane-range">{{ plane.range }}</span>
        <span class="uc-plane-blocks">{{ plane.blocks.length }} blocks</span>
      </RouterLink>
    </div>
  </div>

  <div v-else class="uc-loading">Loading Unicode standard…</div>
</template>

<style scoped>
.uc { max-width: 1000px; margin: 0 auto; padding: 1.5rem; }
.uc-header { margin-bottom: 2rem; }
.uc-header h1 { font-size: 1.8rem; font-weight: 700; color: var(--vp-c-text-1, #1a1918); margin: 0 0 0.3rem; }
.uc-header p { font-size: 0.9rem; color: var(--vp-c-text-3, #888); margin: 0; }

.uc-planes { display: grid; grid-template-columns: repeat(auto-fill, minmax(280px, 1fr)); gap: 1rem; }
.uc-plane-card {
  display: flex; flex-direction: column; gap: 0.3rem;
  padding: 1.5rem; background: var(--vp-c-bg-soft, #f8f7f4);
  border: 1px solid var(--vp-c-divider, #e2e2e3); border-radius: 12px;
  text-decoration: none; transition: all 0.15s;
}
.uc-plane-card:hover {
  border-color: var(--fontist-rose, #bf4e6a);
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(0,0,0,0.06);
}
.uc-plane-short { font-size: 2rem; font-weight: 700; color: var(--fontist-rose, #bf4e6a); font-family: Georgia, serif; }
.uc-plane-name { font-size: 0.9rem; font-weight: 500; color: var(--vp-c-text-1, #333); }
.uc-plane-range { font-size: 0.7rem; font-family: monospace; color: var(--vp-c-text-3, #888); }
.uc-plane-blocks { font-size: 0.75rem; color: var(--vp-c-text-3, #888); margin-top: 0.5rem; }

.uc-loading { display: flex; align-items: center; justify-content: center; height: 60vh; color: var(--vp-c-text-3, #888); }
</style>
