<script setup lang="ts">
import { ref, computed, watch } from 'vue'
import { useRoute } from 'vue-router'
import { marked } from 'marked'
import { useHead } from '@unhead/vue'
import { useMarkdownLinks } from '../composables/useMarkdownLinks'
import { loadParsedMarkdown } from '../lib/markdown/loader'
import type { Frontmatter } from '../lib/markdown/loader'
import type { Ref } from 'vue'

const route = useRoute()
const html = ref('')
const loading = ref(true)
const frontmatter = ref<Frontmatter>({})
const contentRef = ref<HTMLElement | null>(null)
useMarkdownLinks(contentRef as Ref<HTMLElement | null>)

const slug = computed(() => route.params.slug as string)

const formattedDate = computed(() => {
  if (!frontmatter.value.date) return ''
  const d = new Date(frontmatter.value.date)
  if (isNaN(d.getTime())) return frontmatter.value.date
  return d.toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })
})

const authorsDisplay = computed(() => {
  const a = frontmatter.value.authors
  if (!a || a.length === 0) return ''
  if (a.length === 1) return a[0]
  if (a.length === 2) return `${a[0]} & ${a[1]}`
  return a.slice(0, -1).join(', ') + ' & ' + a[a.length - 1]
})

async function loadPost(s: string) {
  loading.value = true
  const parsed = await loadParsedMarkdown(`content/blog/${s}.md`)
  if (parsed) {
    html.value = await marked(parsed.body)
    frontmatter.value = parsed.frontmatter
  } else {
    html.value = '<p>Post not found.</p>'
    frontmatter.value = { title: 'Post not found' }
  }
  loading.value = false
}

await loadPost(slug.value)
watch(slug, (s) => { if (s) loadPost(s) })

const titleForHead = computed(() => frontmatter.value.title || '')
const descriptionForHead = computed(() => frontmatter.value.description || '')

useHead(() => ({
  title: titleForHead.value ? `${titleForHead.value} — Fontist Blog` : 'Fontist Blog',
  meta: [
    { property: 'og:title', content: titleForHead.value || 'Fontist Blog' },
    { property: 'og:type', content: 'article' },
    { property: 'article:published_time', content: frontmatter.value.date || '' },
    ...(descriptionForHead.value ? [{ name: 'description', content: descriptionForHead.value }] : []),
  ],
  link: [
    { rel: 'canonical', href: `https://www.fontist.org/blog/${slug.value}` },
  ],
}))
</script>

<template>
  <div class="page-container">
    <article ref="contentRef" class="md-doc blog-post" v-if="!loading">
      <header class="byline" v-if="authorsDisplay || formattedDate">
        <span v-if="authorsDisplay" class="byline-authors">{{ authorsDisplay }}</span>
        <span v-if="authorsDisplay && formattedDate" class="sep">·</span>
        <time v-if="formattedDate" :datetime="frontmatter.date">{{ formattedDate }}</time>
      </header>
      <div v-html="html"></div>
    </article>
    <div v-else class="loading">Loading…</div>
  </div>
</template>

<style scoped>
.page-container { max-width: 820px; margin: 0 auto; padding: clamp(48px, 8vw, 96px) clamp(20px, 4vw, 56px) 96px; }
.loading { text-align: center; padding: 4rem; color: var(--spec-mute); }
.byline {
  display: flex;
  align-items: center;
  flex-wrap: wrap;
  gap: 0.6em;
  padding: 14px 0;
  margin: 0 0 2.5rem;
  border-top: 1px solid var(--spec-rule);
  border-bottom: 1px solid var(--spec-rule);
  font-family: var(--spec-font-mono);
  font-size: 12px;
  letter-spacing: 0.06em;
  color: var(--spec-ink-soft);
}
.byline-authors { color: var(--spec-ink); font-weight: 500; }
.byline .sep { color: var(--spec-rose); }
</style>
