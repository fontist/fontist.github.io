<script setup lang="ts">
// NotFound — editorial 404. Big italic display numeral, brief
// explanation, search-style suggestions. Maintains the specimen-book
// aesthetic instead of a generic error page.

const suggestions: { label: string; to: string; hint: string }[] = [
  { label: 'Formulas',    to: '/v1/formulas',    hint: 'Browse the registry' },
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
          <a :href="s.to" class="nf-suggestion-link">
            <span class="nf-suggestion-label">{{ s.label }}</span>
            <span class="nf-suggestion-hint">{{ s.hint }}</span>
            <span class="nf-suggestion-arrow" aria-hidden="true">→</span>
          </a>
        </li>
      </ul>
    </section>

    <footer class="nf-foot">
      <a href="/" class="nf-back">← Back to Home</a>
    </footer>
  </div>
</template>

<style scoped>
/* All styles migrated to src/styles/main.css (@layer components). */
</style>