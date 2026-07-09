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
      <p class="about-eyebrow">Fontist · About</p>
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
.about { max-width: 760px; margin: 0 auto; padding: 3rem 1.5rem 5rem; font-family: var(--spec-font-body); color: var(--spec-ink); }
.about-head { margin-bottom: 2.5rem; }
.about-eyebrow { display: inline-block; font-family: var(--spec-font-mono); font-size: 0.7rem; text-transform: uppercase; letter-spacing: 0.16em; color: var(--fontist-rose); font-weight: 600; margin-bottom: 0.75rem; }
.about-title { font-family: var(--spec-font-display); font-size: clamp(2.2rem, 5vw, 3.4rem); font-weight: 400; font-style: italic; letter-spacing: -0.02em; line-height: 1.05; color: var(--spec-ink); margin: 0 0 1rem; }
.about-lede { font-family: var(--spec-font-display); font-style: italic; font-size: 1.2rem; line-height: 1.5; color: var(--spec-ink-soft); margin: 0 0 1.75rem; max-width: 38em; }
.about-rule { border: none; border-top: 1px solid var(--vp-c-divider, rgba(28,26,24,0.16)); margin: 0; }

.about-body { font-size: 1.0rem; line-height: 1.7; }
.about-body :deep(h2) { font-family: var(--spec-font-display); font-size: 1.55rem; font-style: italic; font-weight: 400; letter-spacing: -0.015em; margin: 2.5rem 0 0.75rem; color: var(--spec-ink); position: relative; }
.about-body :deep(h2)::before { content: ''; display: block; width: 1.5rem; height: 1px; background: var(--fontist-rose); margin-bottom: 0.75rem; }
.about-body :deep(h3) { font-family: var(--spec-font-display); font-size: 1.2rem; font-weight: 400; margin: 1.75rem 0 0.5rem; color: var(--spec-ink); }
.about-body :deep(p) { margin: 0 0 1rem; }
.about-body :deep(ul), .about-body :deep(ol) { margin: 0 0 1.25rem; padding-left: 1.25rem; }
.about-body :deep(li) { margin-bottom: 0.35rem; }
.about-body :deep(li::marker) { color: var(--fontist-rose); }
.about-body :deep(a) { color: var(--fontist-rose); text-decoration: none; border-bottom: 1px solid currentColor; padding-bottom: 1px; }
.about-body :deep(code) { font-family: var(--spec-font-mono); font-size: 0.85em; background: var(--spec-paper-deep); padding: 0.1em 0.4em; border-radius: 2px; }
.about-body :deep(pre) { background: var(--spec-paper-deep); padding: 1.25rem 1.5rem; border-radius: 3px; border-left: 3px solid var(--fontist-rose); overflow-x: auto; margin: 1.5rem 0; font-family: var(--spec-font-mono); font-size: 0.85rem; line-height: 1.6; }
.about-body :deep(pre code) { background: transparent; padding: 0; }
.about-body :deep(blockquote) { margin: 1.5rem 0; padding: 0.5rem 0 0.5rem 1.25rem; border-left: 3px solid var(--fontist-rose); font-family: var(--spec-font-display); font-style: italic; font-size: 1.15rem; line-height: 1.5; color: var(--spec-ink-soft); }
.about-body :deep(strong) { font-weight: 600; color: var(--spec-ink); }
.about-body :deep(hr) { border: none; border-top: 1px solid var(--vp-c-divider, rgba(28,26,24,0.16)); margin: 2.5rem 0; }

.about-meta { margin-top: 3rem; padding: 1.5rem 1.75rem; background: var(--spec-paper-deep); border-left: 3px solid var(--fontist-rose); }
.about-meta-title { font-family: var(--spec-font-mono); font-size: 0.68rem; text-transform: uppercase; letter-spacing: 0.16em; color: var(--fontist-rose); font-weight: 600; margin: 0 0 0.75rem; }
.about-meta-list { list-style: none; margin: 0 0 0.75rem; padding: 0; display: flex; flex-direction: column; gap: 0.5rem; }
.about-meta-list li { font-family: var(--spec-font-body); font-size: 0.88rem; line-height: 1.5; color: var(--spec-ink-soft); padding-left: 1rem; position: relative; }
.about-meta-list li::before { content: '◆'; position: absolute; left: 0; color: var(--fontist-rose); font-size: 0.55rem; top: 0.55em; }
.about-meta-list strong { color: var(--spec-ink); font-weight: 600; }
.about-meta-foot { font-family: var(--spec-font-mono); font-size: 0.72rem; color: var(--spec-mute); margin: 1rem 0 0; letter-spacing: 0.02em; }
.about-meta-foot a { color: var(--fontist-rose); border-bottom: 1px solid currentColor; padding-bottom: 1px; }

.about-loading { padding: 4rem 1rem; text-align: center; color: var(--spec-mute); font-family: var(--spec-font-mono); }
</style>