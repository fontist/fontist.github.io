<script setup lang="ts">
import { data as posts } from "../posts.data";

function formatDate(dateStr: string): string {
  const date = new Date(dateStr);
  return date.toLocaleDateString("en-US", {
    month: "long",
    day: "numeric",
    year: "numeric",
  });
}

function formatLastUpdated(timestamp: number | undefined): string {
  if (!timestamp) return "";
  const date = new Date(timestamp);
  return date.toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

function formatAuthors(authors: string[]): string {
  if (!authors || authors.length === 0) return "";
  if (authors.length === 1) return authors[0];
  if (authors.length === 2) return `${authors[0]} & ${authors[1]}`;
  return authors.slice(0, -1).join(", ") + " & " + authors[authors.length - 1];
}
</script>

<template>
  <div class="blog-index">
    <article v-for="post in posts" :key="post.url" class="post-row">
      <a :href="post.url" class="post-link">
        <div class="post-meta">
          <time class="post-date" :datetime="post.date">{{ formatDate(post.date) }}</time>
          <span v-if="post.lastUpdated" class="post-updated">
            Updated {{ formatLastUpdated(post.lastUpdated) }}
          </span>
        </div>
        <h2 class="post-title">{{ post.title }}</h2>
        <p v-if="post.description" class="post-excerpt">{{ post.description }}</p>
        <div class="post-footer">
          <span v-if="post.authors" class="post-authors">{{ formatAuthors(post.authors) }}</span>
          <span class="post-read">Read →</span>
        </div>
      </a>
    </article>
  </div>
</template>

<style scoped>
.blog-index {
  margin-top: 2rem;
}

.post-row {
  border-top: 1px solid var(--spec-rule);
}
.post-row:last-child {
  border-bottom: 1px solid var(--spec-rule);
}

.post-link {
  display: block;
  padding: clamp(28px, 4vw, 48px) 0;
  text-decoration: none;
}

.post-meta {
  font-family: "IBM Plex Mono", ui-monospace, monospace;
  font-size: 11px;
  letter-spacing: 0.14em;
  text-transform: uppercase;
  margin-bottom: 12px;
}
.post-date { color: var(--spec-rose); }
.post-updated { color: var(--spec-mute); margin-left: 1em; }

.post-title {
  font-family: "Spectral", Georgia, serif;
  font-weight: 380;
  font-variation-settings: "opsz" 72;
  font-size: clamp(24px, 3vw, 36px);
  line-height: 1.15;
  letter-spacing: -0.02em;
  margin: 0 0 0.5em;
  color: var(--spec-ink);
  transition: color 0.2s ease;
}
.post-link:hover .post-title {
  color: var(--spec-rose);
}

.post-excerpt {
  font-family: "IBM Plex Sans", sans-serif;
  font-size: 15px;
  line-height: 1.6;
  color: var(--spec-ink-soft);
  margin: 0 0 16px;
}

.post-footer {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 1rem;
  flex-wrap: wrap;
}
.post-authors {
  font-family: "IBM Plex Mono", ui-monospace, monospace;
  font-size: 11px;
  letter-spacing: 0.06em;
  color: var(--spec-mute);
}
.post-read {
  font-family: "IBM Plex Mono", ui-monospace, monospace;
  font-size: 11px;
  letter-spacing: 0.12em;
  text-transform: uppercase;
  color: var(--spec-ink);
  border-bottom: 1px solid var(--spec-rule-strong);
  padding-bottom: 2px;
  transition: color 0.2s, border-color 0.2s;
}
.post-link:hover .post-read {
  color: var(--spec-rose);
  border-color: var(--spec-rose);
}

@media (max-width: 640px) {
  .post-footer { flex-direction: column; align-items: flex-start; gap: 0.5rem; }
}
</style>
