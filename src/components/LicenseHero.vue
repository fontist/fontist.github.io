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
.lh {
  padding: 0 0 1.5rem;
  border-bottom: 1px solid var(--spec-rule);
  margin-bottom: 2.5rem;
}

.lh-row {
  display: flex;
  align-items: center;
  gap: 1.25rem;
  margin-bottom: 0.6rem;
  flex-wrap: wrap;
}

.lh-cat {
  display: inline-flex;
  align-items: center;
  font-family: var(--spec-font-mono);
  font-size: 0.66rem;
  font-weight: 600;
  text-transform: uppercase;
  letter-spacing: 0.14em;
  padding: 0.25rem 0.5rem 0.2rem;
  border: 1px solid var(--spec-rule);
  border-radius: 2px;
}
.lh-cat--permissive    { color: #6b8f71; border-color: #c9dcc8; background: rgba(201,220,200,0.4); }
.lh-cat--copyleft      { color: #8a6b6b; border-color: #f0d6d6; background: rgba(240,214,214,0.35); }
.lh-cat--public-domain { color: #8a7a5e; border-color: #edeed5; background: rgba(237,238,213,0.4); }
.lh-cat--special       { color: var(--spec-ink-soft); border-color: var(--spec-rule); background: transparent; }
html.dark .lh-cat--permissive    { color: #b6d2b8; }
html.dark .lh-cat--copyleft      { color: #d4b6b6; }
html.dark .lh-cat--public-domain { color: #c9c39e; }

.lh-spdx {
  display: inline-flex;
  align-items: baseline;
  gap: 0.4rem;
  font-family: var(--spec-font-mono);
  font-size: 0.72rem;
}

.lh-spdx-key {
  color: var(--spec-mute);
  text-transform: uppercase;
  letter-spacing: 0.08em;
  font-size: 0.62rem;
}

.lh-spdx-val {
  color: var(--spec-ink);
  font-weight: 600;
  letter-spacing: 0.02em;
}

.lh-name {
  font-family: var(--spec-font-display);
  font-size: clamp(2.2rem, 5vw, 3.4rem);
  font-weight: 400;
  font-style: italic;
  letter-spacing: -0.02em;
  line-height: 1.05;
  margin: 0.4rem 0 0.5rem;
  color: var(--spec-ink);
}

.lh-summary {
  font-family: var(--spec-font-body);
  font-size: 1rem;
  line-height: 1.55;
  color: var(--spec-ink-soft);
  margin: 0 0 1.5rem;
  max-width: 60ch;
}

.lh-stats {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(120px, 1fr));
  gap: 0 2rem;
  margin: 0;
  padding: 1rem 0 0;
  border-top: 1px solid var(--spec-rule);
}

.lh-stat { margin: 0; padding: 0; }

.lh-stat-k {
  font-family: var(--spec-font-mono);
  font-size: 0.62rem;
  text-transform: uppercase;
  letter-spacing: 0.12em;
  color: var(--spec-mute);
  margin: 0 0 0.15rem;
}

.lh-stat-v {
  font-family: var(--spec-font-display);
  font-size: 1.05rem;
  color: var(--spec-ink);
  margin: 0;
  font-feature-settings: "tnum" 1;
}

.lh-stat-num {
  font-weight: 600;
  font-size: 1.3rem;
}

.lh-stat-pct {
  font-family: var(--spec-font-mono);
  font-size: 0.75rem;
  color: var(--spec-mute);
  margin-left: 0.3rem;
  font-weight: 400;
}

.lh-stat--emph .lh-stat-v {
  color: var(--fontist-rose);
}
.lh-stat--emph .lh-stat-num {
  color: var(--fontist-rose);
}
</style>