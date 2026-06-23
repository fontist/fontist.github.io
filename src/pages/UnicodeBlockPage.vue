<script setup lang="ts">
import { ref, computed, onMounted, watch } from 'vue'
import { useRoute, useRouter, RouterLink } from 'vue-router'
import { loadAllBlocks, loadBlockCharacters, blockDisplayName, hexCp, scriptGroup } from '../lib/unicode'
import type { UnicodeBlock } from '../lib/unicode'
import UnicodeBlockGrid from '../lib/unicode/components/UnicodeBlockGrid.vue'

const route = useRoute()
const router = useRouter()
const blockSlugParam = computed(() => route.params.blockSlug as string)

const loading = ref(true)
const block = ref<UnicodeBlock | null>(null)
const characters = ref<any[]>([])

const blockWithChars = computed(() =>
  block.value
    ? { ...block.value, characters: characters.value, assignedCount: characters.value.length }
    : null
)

const isPrivateUse = computed(() =>
  block.value?.name.toLowerCase().includes('private use') ?? false
)

async function loadData() {
  loading.value = true
  const allBlocks = await loadAllBlocks()
  const found = allBlocks.find(b => {
    const slug = b.name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '')
    return slug === blockSlugParam.value
  })
  if (found) {
    block.value = found
    characters.value = await loadBlockCharacters(found.name)
  }
  loading.value = false
}

onMounted(loadData)
watch(blockSlugParam, loadData)

function goToChar(cp: number) {
  const hex = cp.toString(16).toUpperCase().padStart(4, '0')
  router.push(`/unicode/char/${hex}`)
}
</script>

<template>
  <div class="ubp" v-if="!loading && block">
    <header class="ubp-head">
      <RouterLink to="/unicode" class="ubp-back">← Unicode Browser</RouterLink>
      <h1>{{ blockDisplayName(block.name) }}</h1>
      <span class="ubp-meta">{{ hexCp(block.start) }}–{{ hexCp(block.end) }} · {{ characters.length }} assigned characters</span>
    </header>

    <div class="ubp-script">{{ scriptGroup(block.name) }}</div>

    <!-- Private Use Area notice -->
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
      mode="standalone"
      :max-chars="10000"
      @select="goToChar"
    />
  </div>

  <div v-else-if="!loading" class="ubp-loading">Block "{{ blockSlugParam }}" not found.</div>
  <div v-else class="ubp-loading">Loading…</div>
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
