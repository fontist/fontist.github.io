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
.lc {
  display: flex;
  flex-direction: column;
  gap: 0.6rem;
  padding: 1.25rem 1.25rem 1rem;
  background: var(--spec-paper);
  border: 1px solid var(--spec-rule);
  border-left-width: 3px;
  border-radius: 3px;
  text-decoration: none;
  color: var(--spec-ink);
  transition: transform 0.2s cubic-bezier(.2,.7,.3,1), border-color 0.2s ease, box-shadow 0.2s ease;
  height: 100%;
  min-height: 200px;
}

.lc--permissive    { border-left-color: #a8c19e; }
.lc--copyleft      { border-left-color: #c19e9e; }
.lc--public-domain { border-left-color: #c1b89e; }
.lc--special       { border-left-color: var(--spec-rule); }

.lc:hover {
  transform: translateY(-2px);
  box-shadow: 0 6px 16px rgba(28,26,24,0.08);
  border-color: var(--spec-ink-soft);
}

.lc-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 0.5rem;
}

.lc-cat {
  font-family: var(--spec-font-mono);
  font-size: 0.62rem;
  text-transform: uppercase;
  letter-spacing: 0.14em;
  color: var(--spec-mute);
  font-weight: 600;
}

.lc-spdx {
  font-family: var(--spec-font-mono);
  font-size: 0.72rem;
  color: var(--spec-ink-soft);
  letter-spacing: 0.02em;
}

.lc-name {
  font-family: var(--spec-font-display);
  font-size: 1.45rem;
  font-style: italic;
  font-weight: 400;
  letter-spacing: -0.01em;
  line-height: 1.1;
  margin: 0.1rem 0 0;
  color: var(--spec-ink);
}

.lc-blurb {
  font-family: var(--spec-font-body);
  font-size: 0.82rem;
  line-height: 1.5;
  color: var(--spec-ink-soft);
  margin: 0;
  flex: 1;
}

.lc-foot {
  display: flex;
  align-items: baseline;
  gap: 0.5rem;
  padding-top: 0.7rem;
  border-top: 1px solid var(--spec-rule);
  margin-top: auto;
}

.lc-foot-label {
  font-family: var(--spec-font-mono);
  font-size: 0.62rem;
  text-transform: uppercase;
  letter-spacing: 0.12em;
  color: var(--spec-mute);
}

.lc-foot-count {
  font-family: var(--spec-font-display);
  font-size: 1.1rem;
  font-weight: 600;
  color: var(--spec-ink);
  font-variant-numeric: tabular-nums;
  margin-left: auto;
}

.lc-foot-arrow {
  font-size: 1rem;
  color: var(--spec-mute);
  transition: color 0.2s ease, transform 0.2s ease;
}

.lc:hover .lc-foot-arrow {
  color: var(--fontist-rose);
  transform: translateX(3px);
}
</style>