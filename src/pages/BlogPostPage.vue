<script setup lang="ts">
// BlogPostPage — uses useMarkdownPage composable. Editorial chrome
// (breadcrumbs, eyebrow with date + author, italic title, lede) is
// page-specific.

import { computed, watch } from 'vue'
import { useRoute } from 'vue-router'
import { useHead } from '@unhead/vue'
import { useMarkdownPage } from '../composables/useMarkdownPage'

const route = useRoute()
const slug = computed(() => route.params.slug as string)

const { html, frontmatter, loading, contentRef, ready } = useMarkdownPage(
  () => `content/blog/${slug.value}.md`,
  { watchSource: slug },
)
await ready

const formattedDate = computed(() => {
  if (!frontmatter.value.date) return ''
  const d = new Date(frontmatter.value.date)
  if (isNaN(d.getTime())) return frontmatter.value.date
  return d.toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })
})

const isoDate = computed(() => {
  const d = new Date(frontmatter.value.date)
  return isNaN(d.getTime()) ? '' : d.toISOString().slice(0, 10)
})

const authorsDisplay = computed(() => {
  const a = frontmatter.value.authors
  if (!a || a.length === 0) return ''
  if (a.length === 1) return a[0]
  if (a.length === 2) return `${a[0]} & ${a[1]}`
  return a.slice(0, -1).join(', ') + ' & ' + a[a.length - 1]
})

useHead(() => ({
  title: frontmatter.value.title ? `${frontmatter.value.title} — Fontist Blog` : 'Fontist Blog',
  meta: [
    { property: 'og:title', content: frontmatter.value.title || 'Fontist Blog' },
    { property: 'og:type', content: 'article' },
    { property: 'article:published_time', content: frontmatter.value.date || '' },
    ...(frontmatter.value.description ? [{ name: 'description', content: frontmatter.value.description }] : []),
  ],
  link: [{ rel: 'canonical', href: `https://www.fontist.org/blog/${slug.value}` }],
}))
</script>

<template>
  <article ref="contentRef" class="blog" v-if="html || loading">
    <nav class="blog-crumbs" aria-label="Breadcrumb">
      <a href="/blog">Journal</a>
      <span class="blog-crumbs-sep" aria-hidden="true">›</span>
      <span class="blog-crumbs-here">{{ frontmatter.title || 'Untitled' }}</span>
    </nav>

    <header class="blog-head" v-if="frontmatter.title">
      <div v-if="formattedDate || authorsDisplay" class="blog-eyebrow">
        <time v-if="formattedDate" :datetime="isoDate">{{ formattedDate }}</time>
        <span v-if="formattedDate && authorsDisplay" class="blog-eyebrow-sep" aria-hidden="true">·</span>
        <span v-if="authorsDisplay" class="blog-author">{{ authorsDisplay }}</span>
      </div>

      <h1 class="blog-title">{{ frontmatter.title }}</h1>
      <p v-if="frontmatter.description" class="blog-lede">{{ frontmatter.description }}</p>

      <hr class="blog-rule" aria-hidden="true" />
    </header>

    <div class="blog-body" v-html="html"></div>

    <footer class="blog-foot" v-if="frontmatter.title">
      <a href="/blog" class="blog-back">← Back to the journal</a>
    </footer>
  </article>

  <div v-else class="blog-loading">
    <p>Loading post…</p>
  </div>
</template>

<style scoped>
/* All styles migrated to src/styles/main.css (@layer components). */
</style>