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
.tc {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
  padding: 1.25rem 1.25rem 1rem;
  background: var(--spec-paper);
  border: 1px solid var(--vp-c-divider, rgba(28,26,24,0.16));
  border-top-width: 3px;
  border-radius: 3px;
  text-decoration: none;
  color: var(--spec-ink);
  transition: transform 0.2s cubic-bezier(.2,.7,.3,1), border-color 0.2s ease, box-shadow 0.2s ease;
  height: 100%;
}

.tc--getting-started { border-top-color: #a8c19e; }
.tc--workflow        { border-top-color: #c1b89e; }
.tc--typography      { border-top-color: #c19e9e; }
.tc--legal           { border-top-color: #c1a09e; }

.tc:hover {
  transform: translateY(-2px);
  box-shadow: 0 6px 16px rgba(28,26,24,0.08);
}

.tc-cat {
  font-family: var(--spec-font-mono);
  font-size: 0.62rem;
  text-transform: uppercase;
  letter-spacing: 0.14em;
  color: var(--spec-mute);
  font-weight: 600;
}

.tc-title {
  font-family: var(--spec-font-display);
  font-size: 1.3rem;
  font-style: italic;
  font-weight: 400;
  letter-spacing: -0.01em;
  line-height: 1.15;
  margin: 0.15rem 0 0.4rem;
  color: var(--spec-ink);
}

.tc-blurb {
  font-family: var(--spec-font-body);
  font-size: 0.82rem;
  line-height: 1.5;
  color: var(--spec-ink-soft);
  margin: 0;
  flex: 1;
}

.tc-foot {
  display: flex;
  align-items: baseline;
  justify-content: space-between;
  padding-top: 0.7rem;
  border-top: 1px solid var(--vp-c-divider, rgba(28,26,24,0.1));
  margin-top: auto;
}

.tc-time {
  font-family: var(--spec-font-mono);
  font-size: 0.65rem;
  text-transform: uppercase;
  letter-spacing: 0.1em;
  color: var(--spec-mute);
}

.tc-arrow {
  font-size: 0.95rem;
  color: var(--spec-mute);
  transition: color 0.2s ease, transform 0.2s ease;
}

.tc:hover .tc-arrow {
  color: var(--fontist-rose);
  transform: translateX(3px);
}

/* Featured variant — takes full row, larger display */
.tc--featured {
  grid-column: span 2;
}

.tc--featured .tc-title {
  font-size: 2rem;
  font-style: italic;
}

.tc--featured .tc-blurb {
  font-size: 1rem;
  line-height: 1.55;
}

@media (max-width: 720px) {
  .tc--featured { grid-column: span 1; }
  .tc--featured .tc-title { font-size: 1.5rem; }
}
</style>