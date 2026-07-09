<script setup lang="ts">
// GuideTopicPage — long-form article for one guide topic.
// Markdown pipeline goes through useMarkdownPage; the page is left to
// own the editorial chrome (breadcrumbs, related topics, body styling).

import { computed } from 'vue'
import { useRoute, RouterLink } from 'vue-router'
import { useHead } from '@unhead/vue'
import { useMarkdownPage } from '../composables/useMarkdownPage'
import { findTopic, CATEGORY_LABELS } from '../lib/guide-data'

const route = useRoute()
const topicPath = computed(() => {
  const params = route.params.path
  return Array.isArray(params) && params.length > 0 ? params.join('/') : ''
})
const topic = computed(() => findTopic(topicPath.value))

const related = computed(() => {
  if (!topic.value?.related) return []
  return topic.value.related
    .map(slug => findTopic(slug))
    .filter((t): t is NonNullable<typeof t> => !!t)
})

const { html, loading, contentRef, ready } = useMarkdownPage(
  () => `content/guide/${topicPath.value}.md`,
  {
    candidates: (src) => [src, src.replace(/\.md$/, '/index.md')],
    watchSource: topicPath,
  },
)
await ready

useHead(() => ({
  title: topic.value
    ? `${topic.value.title} — Fontist Guide`
    : 'Guide — Fontist',
  link: [{ rel: 'canonical', href: `https://www.fontist.org/guide/${topicPath.value}` }],
}))
</script>

<template>
  <div class="page-container guide-article">
    <div v-if="!html && !loading" class="ga-notfound">
      <h1>Guide article not found</h1>
      <RouterLink to="/guide">← Back to the Guide</RouterLink>
    </div>

    <article v-else ref="contentRef" class="ga-body">
      <header class="ga-head">
        <nav class="ga-crumbs">
          <RouterLink to="/guide" class="ga-crumbs-link">Guide</RouterLink>
          <span class="ga-crumbs-sep">›</span>
          <span v-if="topic" class="ga-crumbs-cat">{{ CATEGORY_LABELS[topic.category] }}</span>
          <span class="ga-crumbs-sep">›</span>
          <span class="ga-crumbs-here">{{ topic?.title }}</span>
        </nav>
      </header>

      <div class="ga-html" v-html="html"></div>

      <footer v-if="related.length > 0" class="ga-related">
        <h3 class="ga-related-title">Continue reading</h3>
        <ul class="ga-related-list">
          <li v-for="r in related" :key="r.slug" :class="['ga-related-item', `ga-related-item--${r.category}`]">
            <RouterLink :to="`/guide/${r.slug}`" class="ga-related-link">
              <span class="ga-related-cat">{{ CATEGORY_LABELS[r.category] }}</span>
              <span class="ga-related-name">{{ r.title }}</span>
              <span class="ga-related-blurb">{{ r.blurb }}</span>
              <span class="ga-related-arrow" aria-hidden="true">→</span>
            </RouterLink>
          </li>
        </ul>
      </footer>
    </article>

    <div v-if="loading && !html" class="ga-loading">Loading…</div>
  </div>
</template>

<style scoped>
.guide-article { max-width: 760px; }

.ga-notfound { padding: 4rem 1rem; text-align: center; }
.ga-notfound h1 { font-family: var(--spec-font-display); font-style: italic; font-weight: 400; font-size: 1.8rem; margin: 0 0 0.75rem; color: var(--spec-ink); }
.ga-notfound a { color: var(--fontist-rose); text-decoration: none; border-bottom: 1px solid currentColor; padding-bottom: 1px; }

.ga-crumbs { display: flex; align-items: center; flex-wrap: wrap; gap: 0.5rem; font-family: var(--spec-font-mono); font-size: 0.72rem; text-transform: uppercase; letter-spacing: 0.1em; margin-bottom: 1.5rem; color: var(--spec-mute); }
.ga-crumbs-link { color: var(--fontist-rose); text-decoration: none; }
.ga-crumbs-link:hover { text-decoration: underline; }
.ga-crumbs-cat, .ga-crumbs-here { color: var(--spec-ink-soft); }
.ga-crumbs-sep { opacity: 0.5; }

.ga-body { font-family: var(--spec-font-body); }
.ga-html { font-size: 1.0rem; line-height: 1.7; color: var(--spec-ink); }
.ga-html :deep(h1) { font-family: var(--spec-font-display); font-size: clamp(2.2rem, 5vw, 3.4rem); font-weight: 400; font-style: italic; letter-spacing: -0.02em; line-height: 1.05; margin: 0 0 1rem; color: var(--spec-ink); }
.ga-html :deep(h2) { font-family: var(--spec-font-display); font-size: 1.65rem; font-weight: 400; font-style: italic; letter-spacing: -0.015em; margin: 2.5rem 0 0.75rem; color: var(--spec-ink); position: relative; }
.ga-html :deep(h2)::before { content: ''; display: block; width: 1.5rem; height: 1px; background: var(--fontist-rose); margin-bottom: 0.75rem; }
.ga-html :deep(h3) { font-family: var(--spec-font-display); font-size: 1.2rem; font-weight: 400; margin: 1.75rem 0 0.5rem; color: var(--spec-ink); }
.ga-html :deep(p) { margin: 0 0 1rem; }
.ga-html :deep(ul), .ga-html :deep(ol) { margin: 0 0 1.25rem; padding-left: 1.25rem; }
.ga-html :deep(li) { margin-bottom: 0.35rem; }
.ga-html :deep(li::marker) { color: var(--fontist-rose); }
.ga-html :deep(a) { color: var(--fontist-rose); text-decoration: none; border-bottom: 1px solid currentColor; padding-bottom: 1px; }
.ga-html :deep(code) { font-family: var(--spec-font-mono); font-size: 0.85em; background: var(--spec-paper-deep); padding: 0.1em 0.4em; border-radius: 2px; }
.ga-html :deep(pre) { background: var(--spec-paper-deep); padding: 1.25rem 1.5rem; border-radius: 3px; border-left: 3px solid var(--fontist-rose); overflow-x: auto; margin: 1.5rem 0; font-family: var(--spec-font-mono); font-size: 0.85rem; line-height: 1.6; color: var(--spec-ink); }
.ga-html :deep(pre code) { background: transparent; padding: 0; }
.ga-html :deep(blockquote) { margin: 1.5rem 0; padding: 0.5rem 0 0.5rem 1.25rem; border-left: 3px solid var(--fontist-rose); font-family: var(--spec-font-display); font-style: italic; font-size: 1.15rem; line-height: 1.5; color: var(--spec-ink-soft); }
.ga-html :deep(hr) { border: none; border-top: 1px solid var(--vp-c-divider, rgba(28,26,24,0.16)); margin: 2.5rem 0; }
.ga-html :deep(table) { width: 100%; border-collapse: collapse; margin: 1.5rem 0; font-size: 0.9rem; }
.ga-html :deep(th), .ga-html :deep(td) { padding: 0.5rem 0.75rem; border-bottom: 1px solid var(--vp-c-divider, rgba(28,26,24,0.1)); text-align: left; vertical-align: top; }
.ga-html :deep(th) { font-family: var(--spec-font-mono); font-size: 0.7rem; text-transform: uppercase; letter-spacing: 0.1em; color: var(--spec-mute); font-weight: 600; }
.ga-html :deep(strong) { font-weight: 600; color: var(--spec-ink); }

.ga-related { margin-top: 3.5rem; padding-top: 2rem; border-top: 1px solid var(--vp-c-divider, rgba(28,26,24,0.16)); }
.ga-related-title { font-family: var(--spec-font-mono); font-size: 0.72rem; text-transform: uppercase; letter-spacing: 0.16em; color: var(--fontist-rose); font-weight: 600; margin: 0 0 1.25rem; }
.ga-related-list { list-style: none; margin: 0; padding: 0; display: grid; grid-template-columns: repeat(auto-fill, minmax(260px, 1fr)); gap: 0.75rem; }
.ga-related-item { margin: 0; padding: 0; }
.ga-related-link { display: flex; flex-direction: column; gap: 0.25rem; padding: 1rem 1.1rem 1rem 1.25rem; background: var(--spec-paper); border: 1px solid var(--vp-c-divider, rgba(28,26,24,0.16)); border-left-width: 3px; border-radius: 3px; text-decoration: none; color: var(--spec-ink); transition: transform 0.2s ease, box-shadow 0.2s ease; height: 100%; position: relative; }
.ga-related-item--getting-started .ga-related-link { border-left-color: #a8c19e; }
.ga-related-item--workflow        .ga-related-link { border-left-color: #c1b89e; }
.ga-related-item--typography      .ga-related-link { border-left-color: #c19e9e; }
.ga-related-item--legal           .ga-related-link { border-left-color: #c1a09e; }
.ga-related-link:hover { transform: translateY(-2px); box-shadow: 0 4px 10px rgba(28,26,24,0.08); }
.ga-related-cat { font-family: var(--spec-font-mono); font-size: 0.62rem; text-transform: uppercase; letter-spacing: 0.12em; color: var(--spec-mute); font-weight: 600; }
.ga-related-name { font-family: var(--spec-font-display); font-size: 1.05rem; font-style: italic; color: var(--spec-ink); }
.ga-related-blurb { font-family: var(--spec-font-body); font-size: 0.78rem; line-height: 1.5; color: var(--spec-ink-soft); margin: 0.15rem 0 0; }
.ga-related-arrow { position: absolute; right: 0.75rem; bottom: 0.5rem; font-size: 0.95rem; color: var(--spec-mute); transition: color 0.2s ease, transform 0.2s ease; }
.ga-related-link:hover .ga-related-arrow { color: var(--fontist-rose); transform: translateX(3px); }

.ga-loading { padding: 4rem 1rem; text-align: center; color: var(--spec-mute); font-family: var(--spec-font-mono); }
@media (max-width: 720px) { .ga-related-list { grid-template-columns: 1fr; } }
</style>