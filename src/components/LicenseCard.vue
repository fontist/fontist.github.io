<script setup lang="ts">
// LicenseCard — the visual unit of the licenses index. Inspired by
// botanical specimen cards: short name in display serif on the left,
// SPDX + category + key fact on the right, formula count as the "specimen
// number." Pastel accent border matches the license category.

interface Props {
  name: string
  spdx?: string
  shortName?: string
  category: 'permissive' | 'copyleft' | 'public-domain' | 'special'
  blurb: string                  // one-line description
  formulaCount: number
  href: string
}

const props = defineProps<Props>()

const CATEGORY_LABELS: Record<Props['category'], string> = {
  'permissive':    'Permissive',
  'copyleft':      'Copyleft',
  'public-domain': 'Public domain',
  'special':       'Special',
}
</script>

<template>
  <a :href="href" :class="['lc', `lc--${category}`]">
    <div class="lc-header">
      <span class="lc-cat">{{ CATEGORY_LABELS[category] }}</span>
      <span v-if="spdx" class="lc-spdx">{{ spdx }}</span>
    </div>
    <h3 class="lc-name">{{ name }}</h3>
    <p class="lc-blurb">{{ blurb }}</p>
    <footer class="lc-foot">
      <span class="lc-foot-label">In archive</span>
      <span class="lc-foot-count">{{ formulaCount.toLocaleString() }}</span>
      <span class="lc-foot-arrow" aria-hidden="true">→</span>
    </footer>
  </a>
</template>

<style scoped>
/* All styles migrated to src/styles/main.css (@layer components). */
</style>