<script setup lang="ts">
import { ref } from 'vue'
import { RouterLink } from 'vue-router'
import { useHead } from '@unhead/vue'
import { fetchJson } from '../lib/ssr-fetch'

interface BlogPost {
  slug: string
  title: string
  date: string
  description?: string
}

const posts = ref<BlogPost[]>([])

try {
  posts.value = await fetchJson<BlogPost[]>('content/blog/index.json')
} catch {
  posts.value = [
    { slug: '2022-02-11-introducing-fontist', title: 'Introducing Fontist', date: '2022-02-11' },
    { slug: '2022-02-11-macos-fonts', title: 'macOS Fonts', date: '2022-02-11' },
    { slug: '2024-01-23-office-fonts', title: 'Office Fonts', date: '2024-01-23' },
    { slug: '2024-02-29-new-websites', title: 'New Websites', date: '2024-02-29' },
    { slug: '2024-03-02-creating-formulas', title: 'Creating Formulas', date: '2024-03-02' },
    { slug: '2026-03-12-unified-design', title: 'Unified Design and Logo', date: '2026-03-12' },
    { slug: '2026-04-14-formula-v5', title: 'Formula v5', date: '2026-04-14' },
    { slug: '2026-05-03-windows-fod-fonts', title: 'Windows FOD Fonts', date: '2026-05-03' },
  ]
}

useHead({
  title: 'Blog — Fontist',
  meta: [
    { name: 'description', content: 'News and updates from the Fontist project — releases, new features, and font discoveries.' },
    { property: 'og:title', content: 'Blog — Fontist' },
    { property: 'og:type', content: 'website' },
  ],
  link: [
    { rel: 'canonical', href: 'https://www.fontist.org/blog' },
  ],
})
</script>

<template>
  <div class="blog-index">
    <header class="blog-head">
      <h1>Blog</h1>
      <p>News and updates from the Fontist project.</p>
    </header>
    <ul class="post-list">
      <li v-for="post in posts" :key="post.slug" class="post-item">
        <RouterLink :to="`/blog/${post.slug}`" class="post-link">
          <span class="post-title">{{ post.title }}</span>
          <span class="post-date">{{ post.date }}</span>
        </RouterLink>
      </li>
    </ul>
  </div>
</template>

<style scoped>
.blog-index { max-width: 800px; margin: 0 auto; padding: 2rem 1.5rem 4rem; }
.blog-head { margin-bottom: 2rem; }
.blog-head h1 { font-size: 2rem; font-weight: 700; margin: 0 0 0.5rem; }
.blog-head p { color: #777; margin: 0; }
.post-list { list-style: none; padding: 0; margin: 0; }
.post-item { border-bottom: 1px solid #e8e6e0; }
.post-link { display: flex; justify-content: space-between; align-items: baseline; padding: 1rem 0; text-decoration: none; transition: color 0.1s; }
.post-link:hover .post-title { color: #bf4e6a; }
.post-title { font-size: 1.05rem; color: #333; }
.post-date { font-size: 0.82rem; font-family: monospace; color: #999; }
.loading { text-align: center; padding: 4rem; color: #888; }
</style>
