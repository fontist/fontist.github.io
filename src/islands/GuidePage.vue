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
/* All styles migrated to src/styles/main.css (@layer components). */
</style>