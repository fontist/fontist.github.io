<script setup lang="ts">
import { ref } from 'vue'
import { marked } from 'marked'
import { useHead } from '@unhead/vue'
import { useMarkdownLinks } from '../composables/useMarkdownLinks'
import { loadParsedMarkdown } from '../lib/markdown/loader'
import type { Ref } from 'vue'

const html = ref('')
const loading = ref(true)
const contentRef = ref<HTMLElement | null>(null)
useMarkdownLinks(contentRef as Ref<HTMLElement | null>)

const parsed = await loadParsedMarkdown('content/about.md')
if (parsed) {
  html.value = await marked(parsed.body)
}
loading.value = false

useHead(() => ({
  title: parsed?.frontmatter.title ? `${parsed.frontmatter.title} — Fontist` : 'About — Fontist',
  meta: [
    { name: 'description', content: parsed?.frontmatter.description || 'About Fontist: an open-source font manager for installing, managing, and exploring openly-licensed fonts.' },
    { property: 'og:title', content: parsed?.frontmatter.title || 'About — Fontist' },
    { property: 'og:type', content: 'website' },
  ],
  link: [
    { rel: 'canonical', href: 'https://www.fontist.org/about' },
  ],
}))
</script>

<template>
  <div class="page-container">
    <article ref="contentRef" class="md-doc" v-if="!loading" v-html="html"></article>
    <div v-else class="loading">Loading…</div>
  </div>
</template>

<style scoped>
.page-container { max-width: 820px; margin: 0 auto; padding: clamp(48px, 8vw, 96px) clamp(20px, 4vw, 56px) 96px; }
.loading { text-align: center; padding: 4rem; color: var(--spec-mute); }
</style>
