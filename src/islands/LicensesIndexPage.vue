<script setup lang="ts">
import { ref } from 'vue'
import { marked } from 'marked'
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

</script>

<template>
  <div class="page-container licenses-index">
    <header class="li-head">
      <h1>A Field Guide to Font Licenses</h1>
      <p class="li-lede">The legal side of typography — SPDX identifiers, what each license permits, and which fonts ship under them.</p>
    </header>

    <section v-if="introHtml" ref="contentRef" class="md-doc li-intro" v-html="introHtml"></section>

    <section class="li-list-wrap">
      <ul class="li-list">
        <li v-for="entry in licenses" :key="entry.slug">
          <a :href="`/licenses/${entry.slug}`" class="li-card">
            <span class="li-card-title">{{ entry.title }}</span>
            <span v-if="entry.description" class="li-card-desc">{{ entry.description }}</span>
            <span class="li-card-slug">{{ entry.slug }}</span>
          </a>
        </li>
      </ul>
    </section>
  </div>
</template>

<style scoped>
/* All styles migrated to src/styles/main.css (@layer components). */
</style>
