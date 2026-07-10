<script setup lang="ts">
// TopicCard — the visual unit of the guide index. Each card represents
// one article. Editorial magazine spread feel: category eyebrow,
// italic-Spectral title, blurb, reading time. Pastel accent stripe
// per category.

interface Props {
  title: string
  blurb: string
  href: string
  category: 'getting-started' | 'workflow' | 'typography' | 'legal'
  readingMinutes?: number
  featured?: boolean
}

const props = defineProps<Props>()

const CATEGORY_LABELS: Record<Props['category'], string> = {
  'getting-started': 'Getting started',
  'workflow':        'Workflow',
  'typography':      'Typography',
  'legal':           'License & legal',
}
</script>

<template>
  <a
    :href="href"
    :class="['tc', `tc--${category}`, { 'tc--featured': featured }]"
  >
    <span class="tc-cat">{{ CATEGORY_LABELS[category] }}</span>
    <h3 class="tc-title">{{ title }}</h3>
    <p class="tc-blurb">{{ blurb }}</p>
    <footer class="tc-foot">
      <span v-if="readingMinutes" class="tc-time">{{ readingMinutes }} min read</span>
      <span class="tc-arrow" aria-hidden="true">→</span>
    </footer>
  </a>
</template>

<style scoped>
/* All styles migrated to src/styles/main.css (@layer components). */
</style>