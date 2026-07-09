<script setup lang="ts">
// SiteFooter — multi-column footer with editorial polish.
// Four columns: brand/manifest, Browse, Reference, About. Plus a
// thin top rule with a decorative rose diamond. Footer credit line
// at the bottom in mono.

import { RouterLink } from 'vue-router'

const year = new Date().getFullYear()

const COLUMNS: { title: string; links: { label: string; to: string; external?: boolean }[] }[] = [
  {
    title: 'Browse',
    links: [
      { label: 'Formulas',    to: '/formulas' },
      { label: 'Families',    to: '/families' },
      { label: 'Unicode',     to: '/unicode' },
      { label: 'Compare',     to: '/compare' },
    ],
  },
  {
    title: 'Reference',
    links: [
      { label: 'License guide',     to: '/licenses' },
      { label: 'Practical guide',   to: '/guide' },
      { label: 'About Fontist',     to: '/about' },
      { label: 'Blog',              to: '/blog' },
    ],
  },
  {
    title: 'Ecosystem',
    links: [
      { label: 'Fontist CLI',   to: 'https://www.fontist.org/fontist/',          external: true },
      { label: 'Fontisan',      to: 'https://www.fontist.org/fontisan/',         external: true },
      { label: 'Formulas repo', to: 'https://github.com/fontist/formulas',       external: true },
      { label: 'Ruby docs',     to: 'https://www.rubydoc.info/gems/fontist',     external: true },
    ],
  },
]
</script>

<template>
  <footer class="sf">
    <div class="sf-rule" aria-hidden="true">
      <span class="sf-rule-line"></span>
      <span class="sf-rule-diamond">◆</span>
      <span class="sf-rule-line"></span>
    </div>

    <div class="sf-inner">
      <div class="sf-brand">
        <RouterLink to="/" class="sf-brand-logo">
          <img src="/favicon.svg" alt="" class="sf-brand-img" />
          <span class="sf-brand-name">Fontist</span>
        </RouterLink>
        <p class="sf-brand-tag">
          Install, manage, and explore openly-licensed fonts across Windows, Linux, and macOS.
        </p>
        <p class="sf-brand-credit">
          A <a href="https://github.com/fontist" class="sf-brand-link">Fontist org</a> project · Open source · MIT
        </p>
      </div>

      <nav class="sf-cols" aria-label="Footer">
        <section v-for="col in COLUMNS" :key="col.title" class="sf-col">
          <h2 class="sf-col-title">{{ col.title }}</h2>
          <ul class="sf-col-list">
            <li v-for="link in col.links" :key="link.to" class="sf-col-item">
              <a
                v-if="link.external"
                :href="link.to"
                class="sf-col-link"
                rel="noopener noreferrer"
              >
                {{ link.label }}
                <span class="sf-col-arrow" aria-hidden="true">↗</span>
              </a>
              <RouterLink v-else :to="link.to" class="sf-col-link">
                {{ link.label }}
              </RouterLink>
            </li>
          </ul>
        </section>
      </nav>
    </div>

    <div class="sf-base">
      <span class="sf-base-copy">© {{ year }} Fontist · Ribose Ltd.</span>
      <span class="sf-base-sep" aria-hidden="true">·</span>
      <a href="https://github.com/fontist/fontist.org" class="sf-base-link">Source on GitHub</a>
      <span class="sf-base-sep" aria-hidden="true">·</span>
      <span class="sf-base-meta">Built with Vite + vite-ssg</span>
    </div>
  </footer>
</template>

<style scoped>
.sf {
  margin-top: auto;
  background: var(--spec-paper);
  border-top: none;
  font-family: var(--spec-font-body);
}

/* ── Decorative top rule with rose diamond ───────────────────── */
.sf-rule {
  display: flex;
  align-items: center;
  gap: 0.75rem;
  max-width: 1320px;
  margin: 0 auto;
  padding: 0 clamp(20px, 4vw, 56px);
}

.sf-rule-line {
  flex: 1;
  height: 1px;
  background: var(--vp-c-divider, rgba(28,26,24,0.16));
}

.sf-rule-diamond {
  color: var(--fontist-rose);
  font-size: 0.65rem;
  letter-spacing: 0.5em;
  opacity: 0.7;
}

/* ── Inner grid: brand + 3 columns ──────────────────────────── */
.sf-inner {
  max-width: 1320px;
  margin: 0 auto;
  padding: 2.5rem clamp(20px, 4vw, 56px) 2rem;
  display: grid;
  grid-template-columns: minmax(0, 1.4fr) repeat(3, minmax(0, 1fr));
  gap: 2.5rem;
}

/* ── Brand column ───────────────────────────────────────────── */
.sf-brand {
  display: flex;
  flex-direction: column;
  gap: 0.6rem;
}

.sf-brand-logo {
  display: inline-flex;
  align-items: center;
  gap: 0.5rem;
  text-decoration: none;
  margin-bottom: 0.4rem;
}

.sf-brand-img { width: 28px; height: 28px; }

.sf-brand-name {
  font-family: var(--spec-font-display);
  font-size: 1.3rem;
  font-weight: 400;
  letter-spacing: -0.01em;
  color: var(--spec-ink);
}

.sf-brand-tag {
  font-family: var(--spec-font-body);
  font-size: 0.85rem;
  line-height: 1.55;
  color: var(--spec-ink-soft);
  margin: 0;
  max-width: 30ch;
}

.sf-brand-credit {
  font-family: var(--spec-font-mono);
  font-size: 0.7rem;
  color: var(--spec-mute);
  margin: 0.4rem 0 0;
  letter-spacing: 0.02em;
}

.sf-brand-link {
  color: var(--fontist-rose);
  border-bottom: 1px solid currentColor;
  padding-bottom: 1px;
}

/* ── Link columns ──────────────────────────────────────────── */
.sf-cols {
  display: contents;
}

.sf-col-title {
  font-family: var(--spec-font-mono);
  font-size: 0.65rem;
  font-weight: 600;
  text-transform: uppercase;
  letter-spacing: 0.16em;
  color: var(--fontist-rose);
  margin: 0 0 0.85rem;
}

.sf-col-list {
  list-style: none;
  margin: 0;
  padding: 0;
  display: flex;
  flex-direction: column;
  gap: 0.4rem;
}

.sf-col-item { margin: 0; padding: 0; }

.sf-col-link {
  display: inline-flex;
  align-items: baseline;
  gap: 0.35rem;
  font-family: var(--spec-font-body);
  font-size: 0.85rem;
  color: var(--spec-ink-soft);
  text-decoration: none;
  transition: color 0.15s ease;
}

.sf-col-link:hover {
  color: var(--fontist-rose);
}

.sf-col-arrow {
  font-size: 0.7em;
  color: var(--spec-mute);
  transition: color 0.15s ease, transform 0.15s ease;
}

.sf-col-link:hover .sf-col-arrow {
  color: var(--fontist-rose);
  transform: translate(1px, -1px);
}

/* ── Base line ─────────────────────────────────────────────── */
.sf-base {
  display: flex;
  align-items: center;
  flex-wrap: wrap;
  gap: 0.5rem;
  max-width: 1320px;
  margin: 0 auto;
  padding: 1rem clamp(20px, 4vw, 56px) 1.5rem;
  border-top: 1px solid var(--vp-c-divider, rgba(28,26,24,0.16));
  font-family: var(--spec-font-mono);
  font-size: 0.68rem;
  color: var(--spec-mute);
  letter-spacing: 0.04em;
}

.sf-base-link {
  color: var(--spec-ink-soft);
  border-bottom: 1px solid currentColor;
  padding-bottom: 1px;
  transition: color 0.15s ease;
}

.sf-base-link:hover { color: var(--fontist-rose); }

.sf-base-sep { opacity: 0.5; }

.sf-base-meta {
  margin-left: auto;
  font-style: italic;
  opacity: 0.7;
}

/* ── Responsive: collapse to single column on narrow ──────── */
@media (max-width: 880px) {
  .sf-inner {
    grid-template-columns: 1fr 1fr;
    gap: 1.75rem 2rem;
  }
  .sf-brand {
    grid-column: span 2;
  }
}

@media (max-width: 540px) {
  .sf-inner {
    grid-template-columns: 1fr;
    gap: 1.5rem;
  }
  .sf-brand {
    grid-column: span 1;
  }
  .sf-base-meta {
    margin-left: 0;
    width: 100%;
  }
}
</style>