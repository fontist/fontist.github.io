<script setup lang="ts">
import { computed } from "vue";
import { useData } from "vitepress";

const { frontmatter, page } = useData();

const formattedDate = computed(() => {
  if (!frontmatter.value.date) return "";
  const date = new Date(frontmatter.value.date);
  return date.toLocaleDateString("en-US", {
    month: "long",
    day: "numeric",
    year: "numeric",
  });
});

const formattedLastUpdated = computed(() => {
  if (!page.value.lastUpdated) return "";
  const date = new Date(page.value.lastUpdated);
  return date.toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
});

const authors = computed(() => {
  const a = frontmatter.value.authors;
  if (!a || !Array.isArray(a)) return "";
  if (a.length === 1) return a[0];
  if (a.length === 2) return `${a[0]} & ${a[1]}`;
  return a.slice(0, -1).join(", ") + " & " + a[a.length - 1];
});
</script>

<template>
  <div class="blog-byline" v-if="authors || formattedDate">
    <span v-if="authors" class="byline-authors">{{ authors }}</span>
    <span v-if="authors && formattedDate" class="sep">·</span>
    <time v-if="formattedDate" :datetime="frontmatter.date">{{ formattedDate }}</time>
    <span v-if="formattedLastUpdated" class="updated">Updated {{ formattedLastUpdated }}</span>
  </div>
</template>

<style scoped>
.blog-byline {
  display: flex;
  align-items: center;
  flex-wrap: wrap;
  gap: 0.6em;
  padding: 14px 0;
  margin: 0 0 2rem;
  border-top: 1px solid var(--spec-rule);
  border-bottom: 1px solid var(--spec-rule);
  font-family: "IBM Plex Mono", ui-monospace, monospace;
  font-size: 12px;
  letter-spacing: 0.06em;
  color: var(--spec-ink-soft);
}
.byline-authors { color: var(--spec-ink); font-weight: 500; }
.sep { color: var(--spec-rose); }
.updated { margin-left: auto; color: var(--spec-mute); font-size: 11px; }

@media (max-width: 640px) {
  .updated { margin-left: 0; width: 100%; margin-top: 4px; }
}
</style>
