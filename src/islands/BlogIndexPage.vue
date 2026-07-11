<script setup lang="ts">
import { ref } from 'vue'
import { fetchJson } from '../lib/ssr-fetch'

interface BlogPost {
  slug: string
  title: string
  date: string
  description?: string
}

const posts = ref<BlogPost[]>([])

try {
  const data = await fetchJson<BlogPost[]>('content/blog/index.json')
  posts.value = data.sort((a, b) => b.date.localeCompare(a.date))
} catch {
  posts.value = [
    { slug: '2026-05-03-windows-fod-fonts', title: 'Windows FOD Fonts', date: '2026-05-03' },
    { slug: '2026-04-14-formula-v5', title: 'Formula v5', date: '2026-04-14' },
    { slug: '2026-03-12-unified-design', title: 'Unified Design and Logo', date: '2026-03-12' },
    { slug: '2024-03-02-creating-formulas', title: 'Creating Formulas', date: '2024-03-02' },
    { slug: '2024-02-29-new-websites', title: 'New Websites', date: '2024-02-29' },
    { slug: '2024-01-23-office-fonts', title: 'Office Fonts', date: '2024-01-23' },
    { slug: '2022-02-11-introducing-fontist', title: 'Introducing Fontist', date: '2022-02-11' },
    { slug: '2022-02-11-macos-fonts', title: 'macOS Fonts', date: '2022-02-11' },
  ]
}

</script>

<template>
  <div class="specimen">
    <div class="page-wrap">
      <header class="blog-head">
        <h1>Field Notes from the Pressroom</h1>
        <p class="lede">Releases, type discoveries, and engineering notes from the Fontist project.</p>
      </header>

      <ul class="post-list">
        <li v-for="post in posts" :key="post.slug" class="post-item">
          <a :href="`/blog/${post.slug}`" class="post-link">
            <span class="post-date">
              <time :datetime="post.date">{{ post.date }}</time>
            </span>
            <span class="post-main">
              <span class="post-title">{{ post.title }}</span>
              <span v-if="post.description" class="post-desc">{{ post.description }}</span>
            </span>
            <span class="post-arrow" aria-hidden="true">→</span>
          </a>
        </li>
      </ul>
    </div>
  </div>
</template>

<style scoped>
/* All styles migrated to src/styles/main.css (@layer components). */
</style>
