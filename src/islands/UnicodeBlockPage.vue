<script setup lang="ts">
import { ref, computed, watch } from 'vue'
import { loadAllBlocks, loadBlockCharacters, blockDisplayName, hexCp, scriptGroup, charRoute } from '../lib/unicode'
import type { UnicodeBlock } from '../lib/unicode'
import UnicodeBlockGrid from '../lib/unicode/components/UnicodeBlockGrid.vue'
import type { FontContext } from '../lib/types/domain'
import { resolveFontContexts, parseFontSlugsFromQuery } from '../lib/fonts/compare-context'

const props = defineProps({
  blockSlug: { type: String, required: true }
})

const blockSlugParam = props.blockSlug
const fontSlugs = computed(() => parseFontSlugsFromQuery((typeof window !== 'undefined' ? new URLSearchParams(window.location.search).get('fonts') : null)))

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


function goToChar(cp: number) {
  window.location.href = charRoute(cp)
}
</script>

<template>
  <div class="ubp" v-if="block">
    <header class="ubp-head">
      <a href="/unicode" class="ubp-back">← Unicode Browser</a>
      <h1>{{ blockDisplayName(block.name) }}</h1>
      <span class="ubp-meta">{{ hexCp(block.start) }}–{{ hexCp(block.end) }} · {{ characters.length }} assigned characters</span>
    </header>

    <div class="ubp-script" v-if="fontContexts.length > 0">{{ scriptGroup(block.name) }}</div>

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
/* All styles migrated to src/styles/main.css (@layer components). */
</style>
