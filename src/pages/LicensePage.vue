<script setup lang="ts">
import { ref, computed, watch } from 'vue'
import { useRoute, RouterLink } from 'vue-router'
import { useHead } from '@unhead/vue'
import { marked } from 'marked'
import { loadParsedMarkdown } from '../lib/markdown/loader'
import { useMarkdownLinks } from '../composables/useMarkdownLinks'

const route = useRoute()
const html = ref('')
const notFound = ref(false)
const contentRef = ref<HTMLElement | null>(null)

useMarkdownLinks(contentRef)

const licensePath = computed(() => {
  const params = route.params.path
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

useHead(() => ({
  title: notFound.value
    ? 'License — Not Found'
    : `${(licensePath.value || 'Licenses').replace(/-/g, ' ').replace(/\b\w/g, c => c.toUpperCase())} — Fontist License`,
  link: [
    { rel: 'canonical', href: `https://www.fontist.org/licenses/${licensePath.value}` },
  ],
}))
</script>

<template>
  <div class="page-container license-page">
    <div v-if="notFound" class="lp-notfound">
      <h1>License page not found</h1>
      <RouterLink to="/licenses">← Back to Licenses</RouterLink>
    </div>
    <article v-else ref="contentRef" class="lp-content" v-html="html"></article>
  </div>
</template>

<style scoped>
.license-page { max-width: 800px; }
.lp-notfound { padding: 3rem 1rem; text-align: center; color: var(--vp-c-text-2); }
</style>
