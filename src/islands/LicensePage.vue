<script setup lang="ts">
import { ref, computed, watch } from 'vue'
import { marked } from 'marked'
import { loadParsedMarkdown } from '../lib/markdown/loader'
import { useMarkdownLinks } from '../composables/useMarkdownLinks'

const props = defineProps({
  path: { type: String, required: true }
})

const html = ref('')
const notFound = ref(false)
const contentRef = ref<HTMLElement | null>(null)

useMarkdownLinks(contentRef)

const licensePath = computed(() => {
  const params = props.path
  if (Array.isArray(params) && params.length > 0) return params.join('/')
  return ''
})

const candidates = computed(() => {
  const path = licensePath.value || ''
  const fileBase = path || 'index'
  return [
    `content/licenses/${fileBase}.md`,
    `content/licenses/${path ? path + '/' : ''}index.md`,
    `content/licenses/index.md`,
  ]
})

async function loadLicense() {
  html.value = ''
  notFound.value = false

  for (const p of candidates.value) {
    const parsed = await loadParsedMarkdown(p)
    if (parsed) {
      html.value = await marked(parsed.body)
      return
    }
  }
  notFound.value = true
}

await loadLicense()
watch(licensePath, loadLicense)

</script>

<template>
  <div class="page-container license-page">
    <div v-if="notFound" class="lp-notfound">
      <h1>License page not found</h1>
      <a href="/licenses">← Back to Licenses</a>
    </div>
    <article v-else ref="contentRef" class="lp-content" v-html="html"></article>
  </div>
</template>

<style scoped>
/* All styles migrated to src/styles/main.css (@layer components). */
</style>
