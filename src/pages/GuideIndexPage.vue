<script setup lang="ts">
import { ref } from 'vue'
import { RouterLink } from 'vue-router'
import { marked } from 'marked'
import { useHead } from '@unhead/vue'
import { fetchJson } from '../lib/ssr-fetch'
import { loadParsedMarkdown } from '../lib/markdown/loader'
import { useMarkdownLinks } from '../composables/useMarkdownLinks'
import type { Ref } from 'vue'

interface GuideEntry { slug: string; title: string; description: string }

const guides = ref<GuideEntry[]>([])
const introHtml = ref('')
const contentRef = ref<HTMLElement | null>(null)
useMarkdownLinks(contentRef as Ref<HTMLElement | null>)

const data = await fetchJson<GuideEntry[]>('content/guide/index.json').catch(() => [] as GuideEntry[])
guides.value = Array.isArray(data) ? data : []

const intro = await loadParsedMarkdown('content/guide/index.md')
if (intro) introHtml.value = await marked(intro.body)

function group(slug: string) {
  if (slug.startsWith('use-cases/')) return 'Use Cases'
  return 'Guides'
}

useHead(() => ({
  title: 'Guide — Fontist',
  meta: [
    { name: 'description', content: 'Guides for using Fontist formulas: font concepts, creating formulas, and deployment use cases.' },
  ],
  link: [
    { rel: 'canonical', href: 'https://www.fontist.org/guide' },
  ],
}))
</script>

<template>
  <div class="page-container guide-index">
    <header class="gi-head">
      <h1>Field Guide to Formulas</h1>
      <p class="gi-lede">How fonts work, how Fontist works, and how to write formulas that install them — from first principles to CI pipelines.</p>
    </header>

    <section v-if="introHtml" ref="contentRef" class="md-doc gi-intro" v-html="introHtml"></section>

    <section v-for="g in ['Guides', 'Use Cases']" :key="g" class="gi-group">
      <h2 class="gi-group-title">{{ g }}</h2>
      <ul class="gi-list">
        <li v-for="entry in guides.filter(e => group(e.slug) === g)" :key="entry.slug">
          <RouterLink :to="`/guide/${entry.slug}`" class="gi-card">
            <span class="gi-card-title">{{ entry.title }}</span>
            <span v-if="entry.description" class="gi-card-desc">{{ entry.description }}</span>
          </RouterLink>
        </li>
      </ul>
    </section>
  </div>
</template>

<style scoped>
/* All styles migrated to src/styles/main.css (@layer components). */
</style>
