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
/* All styles migrated to src/styles/main.css (@layer components). */
</style>