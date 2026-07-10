<script setup lang="ts">
// UnicodePage — landing page for the Unicode browser.
// Editorial specimen-book treatment: big italic display title,
// plane cards with pastel accent stripes, summary stat strip.
// All 7 planes shown. Each card links to the per-plane detail page.

import { ref, computed } from 'vue'
import { RouterLink } from 'vue-router'
import { useHead } from '@unhead/vue'
import { loadAllBlocks, getPlanes, blockDisplayName, hexCp, blockSlug } from '../lib/unicode'
import type { UnicodeBlock } from '../lib/unicode'

const allBlocks = ref<UnicodeBlock[]>([])
const planes = computed(() => getPlanes(allBlocks.value))

allBlocks.value = await loadAllBlocks()

const totalBlocks = computed(() => allBlocks.value.length)
const totalCodepoints = computed(() => allBlocks.value.reduce((sum, b) => sum + (b.end - b.start + 1), 0))

useHead({
  title: 'Unicode Browser — Fontist',
  meta: [
    { name: 'description', content: 'Explore all Unicode planes, blocks, and codepoints. Browse scripts, categories, and bidirectional classes.' },
    { property: 'og:title', content: 'Unicode Browser — Fontist' },
    { property: 'og:type', content: 'website' },
  ],
  link: [
    { rel: 'canonical', href: 'https://www.fontist.org/unicode' },
  ],
})
</script>

<template>
  <div class="uc">
    <header class="uc-hero">
      <h1 class="uc-title">Unicode <em>Browser</em></h1>
      <p class="uc-lede">
        The complete Unicode standard. {{ totalCodepoints.toLocaleString() }} codepoints
        across {{ totalBlocks }} blocks in 7 planes — every assigned character in Unicode 17.0.0.
      </p>
    </header>

    <section class="uc-quickstats">
      <div class="uc-stat">
        <span class="uc-stat-num">{{ totalBlocks.toLocaleString() }}</span>
        <span class="uc-stat-label">Blocks</span>
      </div>
      <div class="uc-stat-divider"></div>
      <div class="uc-stat">
        <span class="uc-stat-num">{{ totalCodepoints.toLocaleString() }}</span>
        <span class="uc-stat-label">Codepoints</span>
      </div>
      <div class="uc-stat-divider"></div>
      <div class="uc-stat">
        <span class="uc-stat-num">17.0.0</span>
        <span class="uc-stat-label">Unicode version</span>
      </div>
      <div class="uc-stat-divider"></div>
      <div class="uc-stat">
        <span class="uc-stat-num">7</span>
        <span class="uc-stat-label">Planes</span>
      </div>
    </section>

    <section class="uc-section">
      <header class="uc-section-head">
        <h2 class="uc-section-title">Planes</h2>
        <p class="uc-section-sub">Each plane is a 65,536-codepoint region of Unicode.</p>
      </header>

      <div class="uc-planes">
        <RouterLink
          v-for="plane in planes"
          :key="plane.key"
          :to="`/unicode/plane/${plane.key}`"
          class="uc-plane"
        >
          <header class="uc-plane-head">
            <span class="uc-plane-short">{{ plane.shortName }}</span>
            <span class="uc-plane-arrow" aria-hidden="true">→</span>
          </header>
          <h3 class="uc-plane-name">{{ plane.name }}</h3>
          <span class="uc-plane-range">{{ plane.range }}</span>
          <footer class="uc-plane-foot">
            <span class="uc-plane-blocks">
              <span class="uc-plane-blocks-num">{{ plane.blocks.length }}</span>
              <span class="uc-plane-blocks-label">block{{ plane.blocks.length === 1 ? '' : 's' }}</span>
            </span>
          </footer>
        </RouterLink>
      </div>
    </section>

    <section class="uc-section">
      <header class="uc-section-head">
        <h2 class="uc-section-title">By property</h2>
        <p class="uc-section-sub">Browse every codepoint by its Unicode classification.</p>
      </header>

      <div class="uc-props">
        <RouterLink to="/unicode/scripts" class="uc-prop">
          <span class="uc-prop-name">Scripts</span>
          <span class="uc-prop-desc">Latin, Cyrillic, CJK, Arabic…</span>
        </RouterLink>
        <RouterLink to="/unicode/category" class="uc-prop">
          <span class="uc-prop-name">Categories</span>
          <span class="uc-prop-desc">Letters, marks, symbols, numbers…</span>
        </RouterLink>
        <RouterLink to="/unicode/combining" class="uc-prop">
          <span class="uc-prop-name">Combining classes</span>
          <span class="uc-prop-desc">Diacritics and joining marks</span>
        </RouterLink>
        <RouterLink to="/unicode/bidiclass" class="uc-prop">
          <span class="uc-prop-name">Bidirectional</span>
          <span class="uc-prop-desc">LTR, RTL, neutral, embedding…</span>
        </RouterLink>
      </div>
    </section>
  </div>
</template>

<style scoped>
/* All styles migrated to src/styles/main.css (@layer components). */
</style>