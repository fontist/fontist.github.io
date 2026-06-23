<script setup lang="ts">
import { ref, computed, watch } from 'vue'
import { useRoute, RouterLink } from 'vue-router'
import { marked } from 'marked'
import { useHead } from '@unhead/vue'
import { useMarkdownLinks } from '../composables/useMarkdownLinks'
import { loadParsedMarkdown } from '../lib/markdown/loader'

const route = useRoute()
const html = ref('')
const loading = ref(true)
const notFound = ref(false)
const title = ref('Guide')
const contentRef = ref<HTMLElement | null>(null)

useMarkdownLinks(contentRef)

const guidePath = computed(() => {
  const params = route.params.path
  if (Array.isArray(params) && params.length > 0) return params.join('/')
  return ''
})

async function loadGuide() {
  loading.value = true
  notFound.value = false
  html.value = ''

  const path = guidePath.value || ''
  const segments = path ? path.split('/') : []
  const fileBase = segments.length > 0 ? segments[segments.length - 1] : 'index'
  const dir = segments.length > 1 ? segments.slice(0, -1).join('/') + '/' : ''

  const candidates = [
    `content/guide/${dir}${fileBase}.md`,
    `content/guide/${path ? path + '/' : ''}index.md`,
    `content/guide/index.md`,
  ]

  for (const c of candidates) {
    const parsed = await loadParsedMarkdown(c)
    if (parsed) {
      html.value = await marked(parsed.body)
      title.value = parsed.frontmatter.title || 'Fontist Guide'
      break
    }
  }

  if (!html.value) notFound.value = true
  loading.value = false
}

await loadGuide()
watch(guidePath, loadGuide)

useHead(() => ({
  title: `${title.value} — Fontist`,
  link: [
    { rel: 'canonical', href: `https://www.fontist.org/guide/${guidePath.value}` },
  ],
}))
</script>

<template>
  <div class="page-container guide-page">
    <div v-if="loading" class="gp-loading"><p>Loading…</p></div>
    <div v-else-if="notFound" class="gp-notfound">
      <h1>Guide page not found</h1>
      <RouterLink to="/guide">← Back to Guide</RouterLink>
    </div>
    <article v-else ref="contentRef" class="gp-content" v-html="html"></article>
  </div>
</template>

<style scoped>
.guide-page { max-width: 800px; }
.gp-loading, .gp-notfound { padding: 3rem 1rem; text-align: center; color: var(--vp-c-text-2); }
</style>
