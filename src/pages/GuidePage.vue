<script setup lang="ts">
// GuidePage — index of all articles. Featured article takes the lead
// position; remaining articles grouped by category. Same editorial
// treatment as /licenses: pastel accent stripes per category.

import { computed } from 'vue'
import TopicCard from '../components/TopicCard.vue'
import { GUIDE_TOPICS, CATEGORY_LABELS, topicsByCategory, type TopicCategory } from '../lib/guide-data'

const featured = computed(() => GUIDE_TOPICS.find(t => t.featured) ?? GUIDE_TOPICS[0])
const rest = computed(() => GUIDE_TOPICS.filter(t => t !== featured.value))

const byCategory = computed(() => {
  const groups = topicsByCategory()
  return (Object.entries(groups) as [TopicCategory, typeof GUIDE_TOPICS][])
    .map(([key, topics]) => ({ key, label: CATEGORY_LABELS[key], topics }))
    .filter(g => g.topics.length > 0)
})
</script>

<template>
  <div class="gpi">
    <header class="gpi-hero">
      <span class="gpi-eyebrow">Fontist · Practical Guide</span>
      <h1 class="gpi-title">The <em>Typography</em> Guide</h1>
      <p class="gpi-lede">
        Practical articles on using Fontist, choosing fonts, navigating licenses,
        and understanding the typographic ecosystem your projects depend on.
      </p>
    </header>

    <section class="gpi-featured" v-if="featured">
      <TopicCard
        :title="featured.title"
        :blurb="featured.blurb"
        :href="`/guide/${featured.slug}`"
        :category="featured.category"
        :reading-minutes="featured.readingMinutes"
        :featured="true"
      />
    </section>

    <section
      v-for="group in byCategory"
      :key="group.key"
      class="gpi-section"
    >
      <header class="gpi-section-head">
        <h2 class="gpi-section-title">{{ group.label }}</h2>
        <p class="gpi-section-sub">{{ group.topics.length }} article{{ group.topics.length === 1 ? '' : 's' }}</p>
      </header>
      <div class="gpi-grid">
        <TopicCard
          v-for="topic in group.topics"
          :key="topic.slug"
          :title="topic.title"
          :blurb="topic.blurb"
          :href="`/guide/${topic.slug}`"
          :category="topic.category"
          :reading-minutes="topic.readingMinutes"
        />
      </div>
    </section>
  </div>
</template>

<style scoped>
.gpi { max-width: 1200px; margin: 0 auto; padding: 3rem 1.5rem 5rem; }

/* ── Hero ───────────────────────────────────────────────────── */
.gpi-hero { margin-bottom: 3rem; max-width: 720px; }

.gpi-eyebrow {
  display: inline-block;
  font-family: var(--spec-font-mono);
  font-size: 0.7rem;
  text-transform: uppercase;
  letter-spacing: 0.16em;
  color: var(--fontist-rose);
  font-weight: 600;
  margin-bottom: 0.7rem;
}

.gpi-title {
  font-family: var(--spec-font-display);
  font-size: clamp(2.4rem, 6vw, 4rem);
  font-weight: 400;
  letter-spacing: -0.025em;
  line-height: 1.05;
  margin: 0 0 1rem;
  color: var(--spec-ink);
}

.gpi-title em {
  font-style: italic;
  color: var(--fontist-rose);
}

.gpi-lede {
  font-family: var(--spec-font-body);
  font-size: 1.05rem;
  line-height: 1.55;
  color: var(--spec-ink-soft);
  margin: 0;
}

/* ── Featured ──────────────────────────────────────────────── */
.gpi-featured { margin-bottom: 2.5rem; }

/* ── Sections ──────────────────────────────────────────────── */
.gpi-section { margin-bottom: 2.5rem; }
.gpi-section-head { margin-bottom: 1.25rem; padding-bottom: 0.5rem; border-bottom: 1px solid var(--spec-rule); }
.gpi-section-title {
  font-family: var(--spec-font-display);
  font-size: 1.5rem;
  font-style: italic;
  font-weight: 400;
  margin: 0;
  color: var(--spec-ink);
  letter-spacing: -0.01em;
}
.gpi-section-sub {
  font-family: var(--spec-font-mono);
  font-size: 0.7rem;
  text-transform: uppercase;
  letter-spacing: 0.1em;
  color: var(--spec-mute);
  margin: 0.25rem 0 0;
}

.gpi-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(280px, 1fr));
  gap: 1rem;
}

@media (max-width: 720px) {
  .gpi-grid { grid-template-columns: 1fr; }
}
</style>