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
  <div class="specimen">
    <div class="page-wrap">
      <header class="blog-head">
        <p class="eyebrow">§ Journal</p>
        <h1>Field Notes from the Pressroom</h1>
        <p class="lede">Releases, type discoveries, and engineering notes from the Fontist project.</p>
      </header>

      <ul class="post-list">
        <li v-for="post in posts" :key="post.slug" class="post-item">
          <RouterLink :to="`/blog/${post.slug}`" class="post-link">
            <span class="post-title">{{ post.title }}</span>
            <span class="post-date">
              <time :datetime="post.date">{{ post.date }}</time>
            </span>
          </RouterLink>
        </li>
      </ul>
    </div>
  </div>
</template>

<style scoped>
.page-wrap {
  max-width: 1320px;
  margin: 0 auto;
  padding: clamp(64px, 11vw, 140px) clamp(20px, 4vw, 56px);
}
.blog-head { margin-bottom: clamp(48px, 8vw, 96px); }
.eyebrow {
  font-family: var(--spec-font-mono);
  font-size: 11px;
  letter-spacing: 0.22em;
  text-transform: uppercase;
  color: var(--spec-rose);
  margin: 0 0 18px;
}
.blog-head h1 {
  font-family: var(--spec-font-display);
  font-weight: 360;
  font-variation-settings: "opsz" 120;
  font-size: clamp(40px, 6vw, 72px);
  line-height: 1.02;
  letter-spacing: -0.022em;
  color: var(--spec-ink);
  margin: 0 0 18px;
  max-width: 18ch;
}
.blog-head .lede {
  font-family: var(--spec-font-display);
  font-weight: 350;
  font-size: clamp(19px, 2vw, 25px);
  line-height: 1.4;
  color: var(--spec-ink-soft);
  max-width: 50ch;
  margin: 0;
}

.post-list { list-style: none; padding: 0; margin: 0; }
.post-item { border-top: 1px solid var(--spec-rule); }
.post-item:last-child { border-bottom: 1px solid var(--spec-rule); }
.post-link {
  display: grid;
  grid-template-columns: 1fr auto;
  gap: 1.5rem;
  align-items: baseline;
  padding: clamp(18px, 2vw, 26px) 0;
  text-decoration: none;
  transition: color 0.2s ease;
}
.post-link:hover .post-title { color: var(--spec-rose); }
.post-title {
  font-family: var(--spec-font-display);
  font-weight: 380;
  font-size: clamp(20px, 2vw, 26px);
  line-height: 1.2;
  letter-spacing: -0.01em;
  color: var(--spec-ink);
  transition: color 0.2s ease;
}
.post-date {
  font-family: var(--spec-font-mono);
  font-size: 12px;
  letter-spacing: 0.08em;
  color: var(--spec-mute);
  white-space: nowrap;
}

@media (max-width: 600px) {
  .post-link { grid-template-columns: 1fr; gap: 0.25rem; }
}
</style>
