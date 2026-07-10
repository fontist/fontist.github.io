<script setup lang="ts">
// AboutPage — uses useMarkdownPage composable for the rendering pipeline.
// Editorial chrome (eyebrow, italic title, lede, "The Suite" aside) is
// page-specific; the markdown loading + watching + head wiring is shared.

import { computed } from 'vue'
import { useHead } from '@unhead/vue'
import { useMarkdownPage } from '../composables/useMarkdownPage'

const { html, frontmatter, loading, contentRef, ready } = useMarkdownPage('content/about.md')
await ready

const title = computed(() => frontmatter.value.title || 'About Fontist')
const description = computed(() => frontmatter.value.description || 'About Fontist: an open-source font manager for installing, managing, and exploring openly-licensed fonts.')

useHead({
  title: computed(() => `${title.value} — Fontist`),
  meta: [
    { name: 'description', content: description },
    { property: 'og:title', content: title.value },
    { property: 'og:type', content: 'website' },
  ],
  link: [{ rel: 'canonical', href: 'https://www.fontist.org/about' }],
})
</script>

<template>
  <article ref="contentRef" class="about" v-if="!loading">
    <header class="about-head">
      <h1 class="about-title">{{ frontmatter.title || 'About Fontist' }}</h1>
      <p v-if="frontmatter.description" class="about-lede">{{ frontmatter.description }}</p>
      <hr class="about-rule" />
    </header>

    <div class="about-body" v-html="html"></div>

    <aside class="about-meta">
      <h3 class="about-meta-title">The Suite</h3>
      <ul class="about-meta-list">
        <li><strong>Fontist</strong> — the cross-platform font manager (Ruby CLI + API).</li>
        <li><strong>Fontisan</strong> — the font processor that powers Fontist (Ruby library, every major format).</li>
        <li><strong>Formulas</strong> — the registry of openly-licensed font formulae.</li>
      </ul>
      <p class="about-meta-foot">
        A <a href="https://ribose.com" rel="noreferrer">Ribose</a> open-source project.
      </p>
    </aside>
  </article>

  <div v-else class="about-loading">
    <p>Loading…</p>
  </div>
</template>

<style scoped>
/* All styles migrated to src/styles/main.css (@layer components). */
</style>