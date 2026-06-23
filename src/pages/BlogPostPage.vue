<script setup lang="ts">
import { ref, computed, onMounted, watch } from 'vue'
import { useRoute } from 'vue-router'
import { marked } from 'marked'
import { useMarkdownLinks } from '../composables/useMarkdownLinks'
import type { Ref } from 'vue'

const route = useRoute()
const html = ref('')
const loading = ref(true)
const contentRef = ref<HTMLElement | null>(null)
useMarkdownLinks(contentRef as Ref<HTMLElement | null>)

const slug = computed(() => route.params.slug as string)

async function loadPost(s: string) {
  loading.value = true
  try {
    const res = await fetch(`/content/blog/${s}.md`)
    if (res.ok) {
      const md = await res.text()
      html.value = await marked(md)
    } else {
      html.value = '<p>Post not found.</p>'
    }
  } catch {
    html.value = '<p>Failed to load post.</p>'
  }
  loading.value = false
}

onMounted(() => loadPost(slug.value))
watch(slug, (s) => { if (s) loadPost(s) })
</script>

<template>
  <div class="page-container">
    <article ref="contentRef" class="markdown-content" v-html="html" v-if="!loading"></article>
    <div v-else class="loading">Loading…</div>
  </div>
</template>

<style scoped>
.page-container { max-width: 800px; margin: 0 auto; padding: 2rem 1.5rem 4rem; }
.markdown-content { line-height: 1.7; color: #333; }
.markdown-content :deep(h1) { font-size: 2rem; font-weight: 700; margin: 0 0 1rem; }
.markdown-content :deep(h2) { font-size: 1.5rem; font-weight: 600; margin: 2rem 0 1rem; }
.markdown-content :deep(h3) { font-size: 1.2rem; font-weight: 600; margin: 1.5rem 0 0.75rem; }
.markdown-content :deep(p) { margin-bottom: 1rem; }
.markdown-content :deep(a) { color: #bf4e6a; }
.markdown-content :deep(code) { font-family: monospace; background: #f6f6f7; padding: 0.15em 0.35em; border-radius: 3px; }
.markdown-content :deep(pre) { background: #1a1918; color: #e1dfd2; padding: 1rem; border-radius: 8px; overflow-x: auto; }
.markdown-content :deep(blockquote) { border-left: 3px solid #bf4e6a; padding-left: 1rem; margin: 1rem 0; color: #777; }
.loading { text-align: center; padding: 4rem; color: #888; }
</style>
