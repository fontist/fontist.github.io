<script setup lang="ts">
// NotFound — editorial 404. Big italic display numeral, brief
// explanation, search-style suggestions. Maintains the specimen-book
// aesthetic instead of a generic error page.

import { RouterLink } from 'vue-router'

const suggestions: { label: string; to: string; hint: string }[] = [
  { label: 'Formulas',    to: '/formulas',    hint: 'Browse the registry' },
  { label: 'Families',    to: '/families',    hint: 'Type families in the archive' },
  { label: 'Unicode',     to: '/unicode',     hint: 'Unicode planes & blocks' },
  { label: 'Licenses',    to: '/licenses',    hint: 'Font license reference' },
  { label: 'Guide',       to: '/guide',       hint: 'Practical typography guide' },
  { label: 'About',       to: '/about',       hint: 'About the project' },
]
</script>

<template>
  <div class="nf">
    <div class="nf-rule" aria-hidden="true">
      <span class="nf-rule-line"></span>
      <span class="nf-rule-diamond">◆</span>
      <span class="nf-rule-line"></span>
    </div>

    <header class="nf-head">
      <span class="nf-eyebrow">404 · Not Found</span>
      <h1 class="nf-title">
        <span class="nf-title-num">404</span>
        <span class="nf-title-em">page not found</span>
      </h1>
      <p class="nf-lede">
        The page you're looking for doesn't exist — maybe it was renamed, removed,
        or the URL is mistyped.
      </p>
    </header>

    <section class="nf-suggestions">
      <p class="nf-suggestions-label">Looking for one of these?</p>
      <ul class="nf-suggestions-list">
        <li v-for="s in suggestions" :key="s.to" class="nf-suggestion">
          <RouterLink :to="s.to" class="nf-suggestion-link">
            <span class="nf-suggestion-label">{{ s.label }}</span>
            <span class="nf-suggestion-hint">{{ s.hint }}</span>
            <span class="nf-suggestion-arrow" aria-hidden="true">→</span>
          </RouterLink>
        </li>
      </ul>
    </section>

    <footer class="nf-foot">
      <RouterLink to="/" class="nf-back">← Back to Home</RouterLink>
    </footer>
  </div>
</template>

<style scoped>
.nf {
  max-width: 720px;
  margin: 0 auto;
  padding: 3rem 1.5rem 5rem;
  font-family: var(--spec-font-body);
}

/* ── Decorative top rule (mirrors footer) ──────────────────── */
.nf-rule {
  display: flex;
  align-items: center;
  gap: 0.75rem;
  margin-bottom: 2.5rem;
}
.nf-rule-line { flex: 1; height: 1px; background: var(--vp-c-divider, rgba(28,26,24,0.16)); }
.nf-rule-diamond { color: var(--fontist-rose); font-size: 0.65rem; opacity: 0.7; }

/* ── Header ────────────────────────────────────────────────── */
.nf-head { margin-bottom: 3rem; }

.nf-eyebrow {
  display: inline-block;
  font-family: var(--spec-font-mono);
  font-size: 0.7rem;
  text-transform: uppercase;
  letter-spacing: 0.16em;
  color: var(--fontist-rose);
  font-weight: 600;
  margin-bottom: 0.75rem;
}

.nf-title {
  font-family: var(--spec-font-display);
  font-weight: 400;
  margin: 0 0 1rem;
  color: var(--spec-ink);
  display: flex;
  flex-direction: column;
  gap: 0.2rem;
  line-height: 1.05;
}

.nf-title-num {
  font-size: clamp(4rem, 12vw, 7rem);
  font-weight: 400;
  letter-spacing: -0.03em;
  font-variant-numeric: tabular-nums;
  line-height: 0.9;
}

.nf-title-em {
  font-style: italic;
  font-size: clamp(1.4rem, 3vw, 2rem);
  color: var(--spec-ink-soft);
  letter-spacing: -0.01em;
}

.nf-lede {
  font-family: var(--spec-font-body);
  font-size: 1.0rem;
  line-height: 1.55;
  color: var(--spec-ink-soft);
  margin: 0;
  max-width: 50ch;
}

/* ── Suggestions ───────────────────────────────────────────── */
.nf-suggestions { margin-bottom: 2.5rem; }

.nf-suggestions-label {
  font-family: var(--spec-font-mono);
  font-size: 0.65rem;
  text-transform: uppercase;
  letter-spacing: 0.14em;
  color: var(--spec-mute);
  margin: 0 0 1rem;
}

.nf-suggestions-list {
  list-style: none;
  margin: 0;
  padding: 0;
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(200px, 1fr));
  gap: 0.6rem;
}

.nf-suggestion { margin: 0; padding: 0; }

.nf-suggestion-link {
  display: flex;
  flex-direction: column;
  gap: 0.15rem;
  padding: 0.85rem 1rem;
  background: var(--spec-paper);
  border: 1px solid var(--vp-c-divider, rgba(28,26,24,0.16));
  border-radius: 3px;
  text-decoration: none;
  color: var(--spec-ink);
  transition: transform 0.2s ease, box-shadow 0.2s ease, border-color 0.2s ease;
  position: relative;
}

.nf-suggestion-link:hover {
  transform: translateY(-2px);
  box-shadow: 0 4px 10px rgba(28,26,24,0.08);
  border-color: var(--fontist-rose);
}

.nf-suggestion-label {
  font-family: var(--spec-font-display);
  font-size: 1.05rem;
  font-style: italic;
  color: var(--spec-ink);
}

.nf-suggestion-hint {
  font-family: var(--spec-font-mono);
  font-size: 0.7rem;
  color: var(--spec-mute);
  letter-spacing: 0.02em;
}

.nf-suggestion-arrow {
  position: absolute;
  top: 0.85rem;
  right: 0.85rem;
  font-size: 0.9rem;
  color: var(--spec-mute);
  transition: color 0.2s ease, transform 0.2s ease;
}

.nf-suggestion-link:hover .nf-suggestion-arrow {
  color: var(--fontist-rose);
  transform: translateX(3px);
}

/* ── Footer link ───────────────────────────────────────────── */
.nf-foot {
  padding-top: 1.5rem;
  border-top: 1px solid var(--vp-c-divider, rgba(28,26,24,0.16));
}

.nf-back {
  font-family: var(--spec-font-mono);
  font-size: 0.78rem;
  text-transform: uppercase;
  letter-spacing: 0.12em;
  color: var(--fontist-rose);
  text-decoration: none;
}

.nf-back:hover { text-decoration: underline; }

@media (max-width: 540px) {
  .nf-suggestions-list { grid-template-columns: 1fr; }
}
</style>