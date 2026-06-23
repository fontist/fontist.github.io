<script setup lang="ts">
import { ref, computed, watch } from 'vue'
import { useRoute, RouterLink } from 'vue-router'
import { marked } from 'marked'
import { useHead } from '@unhead/vue'
import { useMarkdownLinks } from '../composables/useMarkdownLinks'
import { loadMarkdown } from '../lib/markdown/loader'

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
    const md = await loadMarkdown(c)
    if (md) {
      html.value = await marked(md)
      const m = md.match(/^#\s+(.+)$/m)
      title.value = m ? m[1].trim() : 'Fontist Guide'
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
.gp-content { line-height: 1.7; color: var(--vp-c-text-1); }
.gp-content :deep(h1) { font-size: 2rem; font-weight: 600; margin: 0 0 1rem; }
.gp-content :deep(h2) { font-size: 1.5rem; font-weight: 600; margin: 2rem 0 1rem; }
.gp-content :deep(h3) { font-size: 1.25rem; font-weight: 600; margin: 1.5rem 0 0.75rem; }
.gp-content :deep(p) { margin-bottom: 1rem; }
.gp-content :deep(ul), .gp-content :deep(ol) { margin-bottom: 1rem; padding-left: 1.5rem; }
.gp-content :deep(li) { margin-bottom: 0.5rem; }
.gp-content :deep(code) { font-family: monospace; background: var(--vp-c-bg-soft, #f8f7f4); padding: 0.15em 0.35em; border-radius: 3px; }
.gp-content :deep(pre) { background: #1a1918; color: #e1dfd2; padding: 1rem; border-radius: 8px; overflow-x: auto; margin-bottom: 1rem; }
.gp-content :deep(pre code) { background: none; padding: 0; }
.gp-content :deep(a) { color: var(--fontist-rose, #bf4e6a); }
.gp-content :deep(blockquote) { border-left: 3px solid var(--fontist-rose, #bf4e6a); padding-left: 1rem; margin: 1rem 0; color: var(--vp-c-text-2); }
</style>
