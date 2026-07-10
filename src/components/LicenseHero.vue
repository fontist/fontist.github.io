<script setup lang="ts">
// LicenseHero — the editorial "specimen card" header for a license detail page.
// Big Spectral serif name, SPDX identifier as a monospace badge, key stats
// in a horizontal mono strip. Editorial magazine feel — generous margins,
// subtle rule beneath, no decorative chrome.

interface Props {
  name: string                       // "SIL Open Font License 1.1"
  spdx?: string                      // "OFL-1.1"
  shortName?: string                 // "OFL" — used in mono badge
  version?: string                   // "1.1"
  category: 'permissive' | 'copyleft' | 'public-domain' | 'special'
  summary?: string                   // one-line tagline under the name
  formulaCount?: number              // # of formulas using this license
  formulaPercent?: number            // % of total archive
  yearAdopted?: string               // e.g. "2005"
}

const props = defineProps<Props>()

const categoryLabels: Record<Props['category'], string> = {
  'permissive':    'Permissive',
  'copyleft':      'Copyleft',
  'public-domain': 'Public domain',
  'special':       'Special',
}
</script>

<template>
  <header class="lh">
    <div class="lh-row">
      <span :class="['lh-cat', `lh-cat--${category}`]">{{ categoryLabels[category] }}</span>
      <span v-if="spdx" class="lh-spdx">
        <span class="lh-spdx-key">SPDX</span>
        <span class="lh-spdx-val">{{ spdx }}</span>
      </span>
    </div>

    <h1 class="lh-name">{{ name }}</h1>
    <p v-if="summary" class="lh-summary">{{ summary }}</p>

    <dl class="lh-stats">
      <div v-if="shortName" class="lh-stat">
        <dt class="lh-stat-k">Short</dt>
        <dd class="lh-stat-v">{{ shortName }}</dd>
      </div>
      <div v-if="version" class="lh-stat">
        <dt class="lh-stat-k">Version</dt>
        <dd class="lh-stat-v">{{ version }}</dd>
      </div>
      <div v-if="yearAdopted" class="lh-stat">
        <dt class="lh-stat-k">Published</dt>
        <dd class="lh-stat-v">{{ yearAdopted }}</dd>
      </div>
      <div v-if="formulaCount !== undefined" class="lh-stat lh-stat--emph">
        <dt class="lh-stat-k">In archive</dt>
        <dd class="lh-stat-v">
          <span class="lh-stat-num">{{ formulaCount.toLocaleString() }}</span>
          <span v-if="formulaPercent !== undefined" class="lh-stat-pct">· {{ formulaPercent }}%</span>
        </dd>
      </div>
    </dl>
  </header>
</template>

<style scoped>
/* All styles migrated to src/styles/main.css (@layer components). */
</style>