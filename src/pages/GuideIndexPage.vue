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
      <p class="gi-eyebrow">§ Guide</p>
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
.guide-index { max-width: 960px; }
.gi-head { margin: 0 0 3rem; }
.gi-eyebrow {
  font-family: var(--spec-font-mono);
  font-size: 11px;
  letter-spacing: 0.22em;
  text-transform: uppercase;
  color: var(--spec-rose);
  margin: 0 0 12px;
}
.gi-head h1 {
  font-family: var(--spec-font-display);
  font-weight: 360;
  font-size: clamp(40px, 6vw, 64px);
  line-height: 1.02;
  letter-spacing: -0.025em;
  color: var(--spec-ink);
  margin: 0 0 1rem;
}
.gi-lede {
  font-family: var(--spec-font-display);
  font-style: italic;
  font-weight: 380;
  font-size: clamp(19px, 2vw, 24px);
  line-height: 1.45;
  color: var(--spec-ink-soft);
  max-width: 56ch;
  margin: 0;
}

.gi-intro {
  border-top: 1px solid var(--spec-rule);
  border-bottom: 1px solid var(--spec-rule);
  padding: 2rem 0;
  margin: 0 0 3rem;
}

.gi-group { margin-bottom: 3rem; }
.gi-group-title {
  font-family: var(--spec-font-mono);
  font-size: 11px;
  font-weight: 500;
  letter-spacing: 0.22em;
  text-transform: uppercase;
  color: var(--spec-mute);
  margin: 0 0 1rem;
}
.gi-list { list-style: none; padding: 0; margin: 0; display: grid; grid-template-columns: 1fr 1fr; gap: 0; border-top: 1px solid var(--spec-rule); border-left: 1px solid var(--spec-rule); }
.gi-list li { border-right: 1px solid var(--spec-rule); border-bottom: 1px solid var(--spec-rule); }
.gi-card {
  display: flex;
  flex-direction: column;
  padding: 1.25rem 1.25rem 1.4rem;
  height: 100%;
  text-decoration: none;
  transition: background 0.2s ease;
}
.gi-card:hover { background: var(--spec-paper-deep); }
.gi-card-title {
  font-family: var(--spec-font-display);
  font-weight: 400;
  font-size: 1.1rem;
  color: var(--spec-ink);
  margin-bottom: 0.25rem;
}
.gi-card:hover .gi-card-title { color: var(--spec-rose); }
.gi-card-desc {
  font-size: 13px;
  line-height: 1.5;
  color: var(--spec-mute);
}

@media (max-width: 720px) {
  .gi-list { grid-template-columns: 1fr; }
}
</style>
