<script setup lang="ts">
import { ref } from 'vue'
import { RouterLink } from 'vue-router'
import { marked } from 'marked'
import { useHead } from '@unhead/vue'
import { fetchJson } from '../lib/ssr-fetch'
import { loadParsedMarkdown } from '../lib/markdown/loader'
import { useMarkdownLinks } from '../composables/useMarkdownLinks'
import type { Ref } from 'vue'

interface LicenseEntry { slug: string; title: string; description: string }

const licenses = ref<LicenseEntry[]>([])
const introHtml = ref('')
const contentRef = ref<HTMLElement | null>(null)
useMarkdownLinks(contentRef as Ref<HTMLElement | null>)

const data = await fetchJson<LicenseEntry[]>('content/licenses/index.json').catch(() => [] as LicenseEntry[])
licenses.value = Array.isArray(data) ? data : []

const intro = await loadParsedMarkdown('content/licenses/index.md')
if (intro) introHtml.value = await marked(intro.body)

useHead(() => ({
  title: 'Licenses — Fontist',
  meta: [
    { name: 'description', content: 'A field guide to font licenses: OFL, Apache, MIT, CC0, and the broader open-source typography landscape.' },
  ],
  link: [
    { rel: 'canonical', href: 'https://www.fontist.org/licenses' },
  ],
}))
</script>

<template>
  <div class="page-container licenses-index">
    <header class="li-head">
      <p class="li-eyebrow">§ Licenses</p>
      <h1>A Field Guide to Font Licenses</h1>
      <p class="li-lede">The legal side of typography — SPDX identifiers, what each license permits, and which fonts ship under them.</p>
    </header>

    <section v-if="introHtml" ref="contentRef" class="md-doc li-intro" v-html="introHtml"></section>

    <section class="li-list-wrap">
      <ul class="li-list">
        <li v-for="entry in licenses" :key="entry.slug">
          <RouterLink :to="`/licenses/${entry.slug}`" class="li-card">
            <span class="li-card-title">{{ entry.title }}</span>
            <span v-if="entry.description" class="li-card-desc">{{ entry.description }}</span>
            <span class="li-card-slug">{{ entry.slug }}</span>
          </RouterLink>
        </li>
      </ul>
    </section>
  </div>
</template>

<style scoped>
.licenses-index { max-width: 1040px; }
.li-head { margin: 0 0 3rem; }
.li-eyebrow {
  font-family: var(--spec-font-mono);
  font-size: 11px;
  letter-spacing: 0.22em;
  text-transform: uppercase;
  color: var(--spec-rose);
  margin: 0 0 12px;
}
.li-head h1 {
  font-family: var(--spec-font-display);
  font-weight: 360;
  font-size: clamp(40px, 6vw, 64px);
  line-height: 1.02;
  letter-spacing: -0.025em;
  color: var(--spec-ink);
  margin: 0 0 1rem;
}
.li-lede {
  font-family: var(--spec-font-display);
  font-style: italic;
  font-weight: 380;
  font-size: clamp(19px, 2vw, 24px);
  line-height: 1.45;
  color: var(--spec-ink-soft);
  max-width: 56ch;
  margin: 0;
}

.li-intro {
  border-top: 1px solid var(--spec-rule);
  border-bottom: 1px solid var(--spec-rule);
  padding: 2rem 0;
  margin: 0 0 3rem;
}

.li-list-wrap { margin-bottom: 4rem; }
.li-list {
  list-style: none;
  padding: 0;
  margin: 0;
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 0;
  border-top: 1px solid var(--spec-rule);
  border-left: 1px solid var(--spec-rule);
}
.li-list li { border-right: 1px solid var(--spec-rule); border-bottom: 1px solid var(--spec-rule); }
.li-card {
  display: flex;
  flex-direction: column;
  padding: 1.25rem 1.25rem 1.4rem;
  height: 100%;
  text-decoration: none;
  transition: background 0.2s ease;
}
.li-card:hover { background: var(--spec-paper-deep); }
.li-card-title {
  font-family: var(--spec-font-display);
  font-weight: 400;
  font-size: 1.1rem;
  color: var(--spec-ink);
  margin-bottom: 0.25rem;
}
.li-card:hover .li-card-title { color: var(--spec-rose); }
.li-card-desc {
  font-size: 13px;
  line-height: 1.5;
  color: var(--spec-mute);
  flex: 1;
  margin-bottom: 0.5rem;
}
.li-card-slug {
  font-family: var(--spec-font-mono);
  font-size: 10px;
  letter-spacing: 0.12em;
  text-transform: uppercase;
  color: var(--spec-mute);
}

@media (max-width: 860px) { .li-list { grid-template-columns: repeat(2, 1fr); } }
@media (max-width: 540px) { .li-list { grid-template-columns: 1fr; } }
</style>
