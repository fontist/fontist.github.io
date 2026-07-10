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
      <span class="uc-eyebrow">Fontist · Unicode Reference</span>
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
.uc { max-width: 1200px; margin: 0 auto; padding: 3rem 1.5rem 5rem; }

/* ── Hero ──────────────────────────────────────────────────── */
.uc-hero { margin-bottom: 2.5rem; max-width: 720px; }

.uc-eyebrow {
  display: inline-block;
  font-family: var(--spec-font-mono);
  font-size: 0.7rem;
  text-transform: uppercase;
  letter-spacing: 0.16em;
  color: var(--fontist-rose);
  font-weight: 600;
  margin-bottom: 0.7rem;
}

.uc-title {
  font-family: var(--spec-font-display);
  font-size: clamp(2.4rem, 6vw, 4rem);
  font-weight: 400;
  letter-spacing: -0.025em;
  line-height: 1.05;
  margin: 0 0 1rem;
  color: var(--spec-ink);
}
.uc-title em {
  font-style: italic;
  color: var(--fontist-rose);
}

.uc-lede {
  font-family: var(--spec-font-body);
  font-size: 1.05rem;
  line-height: 1.55;
  color: var(--spec-ink-soft);
  margin: 0;
}

/* ── Quick stats strip ─────────────────────────────────────── */
.uc-quickstats {
  display: flex;
  align-items: baseline;
  gap: 1.5rem;
  padding: 1.25rem 0;
  margin-bottom: 3rem;
  border-top: 1px solid var(--spec-rule);
  border-bottom: 1px solid var(--spec-rule);
  flex-wrap: wrap;
}

.uc-stat { display: flex; flex-direction: column; gap: 0.15rem; }

.uc-stat-num {
  font-family: var(--spec-font-display);
  font-size: 1.5rem;
  font-weight: 400;
  color: var(--spec-ink);
  line-height: 1;
  font-variant-numeric: tabular-nums;
  font-feature-settings: "tnum" 1, "lnum" 1;
}

.uc-stat-label {
  font-family: var(--spec-font-mono);
  font-size: 0.62rem;
  text-transform: uppercase;
  letter-spacing: 0.12em;
  color: var(--spec-mute);
}

.uc-stat-divider {
  width: 1px;
  align-self: stretch;
  background: var(--spec-rule);
}

/* ── Sections ──────────────────────────────────────────────── */
.uc-section { margin-bottom: 3rem; }

.uc-section-head {
  margin-bottom: 1.5rem;
  padding-bottom: 0.5rem;
  border-bottom: 1px solid var(--spec-rule);
}

.uc-section-title {
  font-family: var(--spec-font-display);
  font-size: 1.5rem;
  font-style: italic;
  font-weight: 400;
  margin: 0;
  color: var(--spec-ink);
  letter-spacing: -0.01em;
}

.uc-section-sub {
  font-family: var(--spec-font-mono);
  font-size: 0.7rem;
  text-transform: uppercase;
  letter-spacing: 0.1em;
  color: var(--spec-mute);
  margin: 0.25rem 0 0;
}

/* ── Plane cards ───────────────────────────────────────────── */
.uc-planes {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(280px, 1fr));
  gap: 0.85rem;
}

.uc-plane {
  display: flex;
  flex-direction: column;
  gap: 0.4rem;
  padding: 1.25rem 1.25rem 1rem;
  background: var(--spec-paper);
  border: 1px solid var(--spec-rule);
  border-left: 3px solid var(--fontist-rose);
  border-radius: 3px;
  text-decoration: none;
  color: var(--spec-ink);
  transition: transform 0.2s ease, box-shadow 0.2s ease, border-color 0.2s ease;
  position: relative;
}

.uc-plane:hover {
  transform: translateY(-2px);
  box-shadow: 0 6px 16px rgba(28,26,24,0.08);
}

.uc-plane-head {
  display: flex;
  align-items: baseline;
  justify-content: space-between;
}

.uc-plane-short {
  font-family: var(--spec-font-mono);
  font-size: 0.65rem;
  text-transform: uppercase;
  letter-spacing: 0.16em;
  color: var(--fontist-rose);
  font-weight: 600;
}

.uc-plane-arrow {
  color: var(--spec-mute);
  font-size: 1rem;
  transition: color 0.2s ease, transform 0.2s ease;
}

.uc-plane:hover .uc-plane-arrow {
  color: var(--fontist-rose);
  transform: translateX(3px);
}

.uc-plane-name {
  font-family: var(--spec-font-display);
  font-size: 1.3rem;
  font-style: italic;
  font-weight: 400;
  margin: 0;
  color: var(--spec-ink);
  letter-spacing: -0.005em;
  line-height: 1.15;
}

.uc-plane-range {
  font-family: var(--spec-font-mono);
  font-size: 0.72rem;
  color: var(--spec-ink-soft);
}

.uc-plane-foot {
  margin-top: auto;
  padding-top: 0.7rem;
  border-top: 1px solid var(--spec-rule);
}

.uc-plane-blocks {
  display: flex;
  align-items: baseline;
  gap: 0.4rem;
}

.uc-plane-blocks-num {
  font-family: var(--spec-font-display);
  font-size: 1.1rem;
  font-weight: 600;
  color: var(--spec-ink);
  font-variant-numeric: tabular-nums;
}

.uc-plane-blocks-label {
  font-family: var(--spec-font-mono);
  font-size: 0.62rem;
  text-transform: uppercase;
  letter-spacing: 0.1em;
  color: var(--spec-mute);
}

/* ── Property cards ────────────────────────────────────────── */
.uc-props {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(220px, 1fr));
  gap: 0.85rem;
}

.uc-prop {
  display: flex;
  flex-direction: column;
  gap: 0.25rem;
  padding: 1rem 1.1rem;
  background: var(--spec-paper);
  border: 1px solid var(--spec-rule);
  border-radius: 3px;
  text-decoration: none;
  color: var(--spec-ink);
  transition: transform 0.2s ease, box-shadow 0.2s ease, border-color 0.2s ease;
}

.uc-prop:hover {
  transform: translateY(-2px);
  box-shadow: 0 4px 10px rgba(28,26,24,0.08);
  border-color: var(--fontist-rose);
}

.uc-prop-name {
  font-family: var(--spec-font-display);
  font-size: 1.05rem;
  font-style: italic;
  color: var(--spec-ink);
}

.uc-prop-desc {
  font-family: var(--spec-font-body);
  font-size: 0.78rem;
  line-height: 1.5;
  color: var(--spec-ink-soft);
}

@media (max-width: 720px) {
  .uc-planes { grid-template-columns: 1fr; }
  .uc-props { grid-template-columns: 1fr 1fr; }
  .uc-quickstats { gap: 1rem; }
  .uc-stat-num { font-size: 1.25rem; }
}
</style>