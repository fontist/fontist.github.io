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
.blog { max-width: 760px; margin: 0 auto; padding: 3rem 1.5rem 5rem; font-family: var(--spec-font-body); }

.blog-crumbs { display: flex; align-items: center; gap: 0.5rem; font-family: var(--spec-font-mono); font-size: 0.7rem; text-transform: uppercase; letter-spacing: 0.12em; color: var(--spec-mute); margin-bottom: 2rem; }
.blog-crumbs a { color: var(--fontist-rose); text-decoration: none; }
.blog-crumbs a:hover { text-decoration: underline; }
.blog-crumbs-sep { opacity: 0.5; }
.blog-crumbs-here { color: var(--spec-ink-soft); }

.blog-head { margin-bottom: 2.5rem; }
.blog-eyebrow { display: flex; align-items: center; flex-wrap: wrap; gap: 0.5rem; font-family: var(--spec-font-mono); font-size: 0.7rem; text-transform: uppercase; letter-spacing: 0.12em; color: var(--fontist-rose); font-weight: 600; margin-bottom: 1rem; }
.blog-eyebrow time, .blog-eyebrow .blog-author { color: var(--spec-ink-soft); font-weight: 500; }
.blog-eyebrow-sep { color: var(--spec-mute); }

.blog-title { font-family: var(--spec-font-display); font-size: clamp(2.2rem, 5vw, 3.4rem); font-weight: 400; font-style: italic; letter-spacing: -0.02em; line-height: 1.05; color: var(--spec-ink); margin: 0 0 1rem; }
.blog-lede { font-family: var(--spec-font-display); font-style: italic; font-size: 1.2rem; line-height: 1.5; color: var(--spec-ink-soft); margin: 0 0 1.75rem; max-width: 38em; }
.blog-rule { border: none; border-top: 1px solid var(--spec-rule); margin: 0; }

.blog-body { font-size: 1.0rem; line-height: 1.7; color: var(--spec-ink); }
.blog-body :deep(h1) { font-family: var(--spec-font-display); font-size: clamp(2rem, 5vw, 3rem); font-style: italic; font-weight: 400; letter-spacing: -0.02em; line-height: 1.05; margin: 2rem 0 1rem; color: var(--spec-ink); }
.blog-body :deep(h2) { font-family: var(--spec-font-display); font-size: 1.6rem; font-weight: 400; font-style: italic; letter-spacing: -0.015em; margin: 2.5rem 0 0.75rem; color: var(--spec-ink); position: relative; }
.blog-body :deep(h2)::before { content: ''; display: block; width: 1.5rem; height: 1px; background: var(--fontist-rose); margin-bottom: 0.75rem; }
.blog-body :deep(h3) { font-family: var(--spec-font-display); font-size: 1.2rem; font-weight: 400; margin: 1.75rem 0 0.5rem; color: var(--spec-ink); }
.blog-body :deep(p) { margin: 0 0 1rem; }
.blog-body :deep(ul), .blog-body :deep(ol) { margin: 0 0 1.25rem; padding-left: 1.25rem; }
.blog-body :deep(li) { margin-bottom: 0.35rem; }
.blog-body :deep(li::marker) { color: var(--fontist-rose); }
.blog-body :deep(a) { color: var(--fontist-rose); text-decoration: none; border-bottom: 1px solid currentColor; padding-bottom: 1px; }
.blog-body :deep(code) { font-family: var(--spec-font-mono); font-size: 0.85em; background: var(--spec-paper-deep); padding: 0.1em 0.4em; border-radius: 2px; }
.blog-body :deep(pre) { background: var(--spec-paper-deep); padding: 1.25rem 1.5rem; border-radius: 3px; border-left: 3px solid var(--fontist-rose); overflow-x: auto; margin: 1.5rem 0; font-family: var(--spec-font-mono); font-size: 0.85rem; line-height: 1.6; }
.blog-body :deep(pre code) { background: transparent; padding: 0; }
.blog-body :deep(blockquote) { margin: 1.5rem 0; padding: 0.5rem 0 0.5rem 1.25rem; border-left: 3px solid var(--fontist-rose); font-family: var(--spec-font-display); font-style: italic; font-size: 1.15rem; line-height: 1.5; color: var(--spec-ink-soft); }
.blog-body :deep(img) { display: block; margin: 1.5rem auto; border-radius: 3px; }
.blog-body :deep(hr) { border: none; border-top: 1px solid var(--spec-rule); margin: 2.5rem 0; }
.blog-body :deep(strong) { font-weight: 600; color: var(--spec-ink); }
.blog-body :deep(em) { font-style: italic; }
.blog-body :deep(figure) { margin: 1.5rem 0; }
.blog-body :deep(figcaption) { font-family: var(--spec-font-mono); font-size: 0.75rem; color: var(--spec-mute); text-align: center; margin-top: 0.5rem; }

.blog-foot { margin-top: 3rem; padding-top: 2rem; border-top: 1px solid var(--spec-rule); }
.blog-back { font-family: var(--spec-font-mono); font-size: 0.78rem; text-transform: uppercase; letter-spacing: 0.12em; color: var(--fontist-rose); text-decoration: none; }
.blog-back:hover { text-decoration: underline; }

.blog-loading { padding: 4rem 1rem; text-align: center; color: var(--spec-mute); font-family: var(--spec-font-mono); }
</style>