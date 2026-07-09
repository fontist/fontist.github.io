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
            <span class="post-date">
              <time :datetime="post.date">{{ post.date }}</time>
            </span>
            <span class="post-main">
              <span class="post-title">{{ post.title }}</span>
              <span v-if="post.description" class="post-desc">{{ post.description }}</span>
            </span>
            <span class="post-arrow" aria-hidden="true">→</span>
          </RouterLink>
        </li>
      </ul>
    </div>
  </div>
</template>

<style scoped>
.page-wrap {
  max-width: 880px;
  margin: 0 auto;
  padding: 3rem 1.5rem 5rem;
}
.blog-head { margin-bottom: 2.5rem; }
.eyebrow {
  font-family: var(--spec-font-mono);
  font-size: 0.7rem;
  letter-spacing: 0.16em;
  text-transform: uppercase;
  color: var(--fontist-rose);
  font-weight: 600;
  margin: 0 0 0.7rem;
}
.blog-head h1 {
  font-family: var(--spec-font-display);
  font-weight: 400;
  font-style: italic;
  font-size: clamp(2.2rem, 5vw, 3.4rem);
  line-height: 1.05;
  letter-spacing: -0.022em;
  color: var(--spec-ink);
  margin: 0 0 1rem;
  max-width: 18ch;
}
.blog-head .lede {
  font-family: var(--spec-font-body);
  font-size: 1.05rem;
  line-height: 1.55;
  color: var(--spec-ink-soft);
  max-width: 50ch;
  margin: 0;
}

.post-list { list-style: none; padding: 0; margin: 0; }
.post-item { border-top: 1px solid var(--spec-rule); }
.post-item:last-child { border-bottom: 1px solid var(--spec-rule); }

.post-link {
  display: grid;
  grid-template-columns: 120px 1fr 24px;
  gap: 1.5rem;
  align-items: baseline;
  padding: 1.25rem 0;
  text-decoration: none;
  transition: padding 0.2s ease, color 0.2s ease;
}

.post-link:hover {
  padding-left: 0.75rem;
  padding-right: 0.75rem;
}

.post-date {
  font-family: var(--spec-font-mono);
  font-size: 0.7rem;
  letter-spacing: 0.08em;
  color: var(--spec-mute);
  text-transform: uppercase;
}

.post-main {
  display: flex;
  flex-direction: column;
  gap: 0.2rem;
}

.post-title {
  font-family: var(--spec-font-display);
  font-weight: 400;
  font-size: clamp(1.1rem, 1.6vw, 1.4rem);
  line-height: 1.2;
  letter-spacing: -0.005em;
  color: var(--spec-ink);
  transition: color 0.2s ease;
}

.post-link:hover .post-title { color: var(--fontist-rose); }

.post-desc {
  font-family: var(--spec-font-body);
  font-size: 0.85rem;
  line-height: 1.5;
  color: var(--spec-ink-soft);
  max-width: 60ch;
}

.post-arrow {
  font-family: var(--spec-font-mono);
  font-size: 0.9rem;
  color: var(--spec-mute);
  transition: color 0.2s ease, transform 0.2s ease;
  align-self: center;
}

.post-link:hover .post-arrow {
  color: var(--fontist-rose);
  transform: translateX(3px);
}

@media (max-width: 600px) {
  .post-link {
    grid-template-columns: 1fr;
    gap: 0.3rem;
    padding: 1rem 0;
  }
  .post-arrow { display: none; }
}
</style>
