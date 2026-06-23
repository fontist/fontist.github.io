<script setup lang="ts">
import { ref, computed, onMounted, watch } from 'vue'
import { useRoute, RouterLink } from 'vue-router'
import { marked } from 'marked'
import { useMarkdownLinks } from '../composables/useMarkdownLinks'

const route = useRoute()
const html = ref('')
const loading = ref(true)
const notFound = ref(false)
const contentRef = ref<HTMLElement | null>(null)

useMarkdownLinks(contentRef)

const licensePath = computed(() => {
  const params = route.params.path
  if (Array.isArray(params) && params.length > 0) return params.join('/')
  return ''
})

const basePath = import.meta.env.BASE_URL || '/'

async function loadLicense() {
  loading.value = true
  notFound.value = false
  html.value = ''

  const path = licensePath.value || ''
  const fileBase = path || 'index'

  const urls = [
    `${basePath}content/licenses/${fileBase}.md`,
    `${basePath}content/licenses/${path ? path + '/' : ''}index.md`,
    `${basePath}content/licenses/index.md`,
  ]

  for (const url of urls) {
    try {
      const res = await fetch(url)
      if (res.ok) {
        const md = await res.text()
        html.value = await marked(md)
        break
      }
    } catch {}
  }

  if (!html.value) notFound.value = true
  loading.value = false
}

onMounted(loadLicense)
watch(licensePath, loadLicense)
</script>

<template>
  <div class="page-container license-page">
    <div v-if="loading" class="lp-loading"><p>Loading…</p></div>
    <div v-else-if="notFound" class="lp-notfound">
      <h1>License page not found</h1>
      <RouterLink to="/licenses">← Back to Licenses</RouterLink>
    </div>
    <article v-else ref="contentRef" class="lp-content" v-html="html"></article>
  </div>
</template>

<style scoped>
.license-page { max-width: 800px; }
.lp-loading, .lp-notfound { padding: 3rem 1rem; text-align: center; color: var(--vp-c-text-2); }
.lp-content { line-height: 1.7; color: var(--vp-c-text-1); }
.lp-content :deep(h1) { font-size: 2rem; font-weight: 600; margin: 0 0 1rem; }
.lp-content :deep(h2) { font-size: 1.5rem; font-weight: 600; margin: 2rem 0 1rem; }
.lp-content :deep(p) { margin-bottom: 1rem; }
.lp-content :deep(a) { color: var(--fontist-rose, #bf4e6a); }
.lp-content :deep(code) { font-family: monospace; background: var(--vp-c-bg-soft, #f8f7f4); padding: 0.15em 0.35em; border-radius: 3px; }
.lp-content :deep(table) { width: 100%; border-collapse: collapse; margin: 1rem 0; }
.lp-content :deep(th), .lp-content :deep(td) { border: 1px solid var(--vp-c-divider); padding: 0.5rem; text-align: left; }
.lp-content :deep(img) { height: 20px; vertical-align: middle; }
</style>
