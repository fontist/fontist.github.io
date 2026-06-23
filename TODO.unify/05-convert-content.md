# 05 — Convert Existing fontist.org Content to vite-ssg Pages

## Current VitePress Content

### Markdown Files to Convert
- `index.md` — homepage with hero + features
- `about.md` — about Fontist
- `blog/index.md` — blog listing
- `blog/*.md` — 8 blog posts (2022-2026)
- `integrations/github-actions.md` — GitHub Actions integration

### VitePress Features in Use
- `.vitepress/config.ts` — site config (title, nav, sidebar)
- `.vitepress/theme/` — custom theme (default + overrides)
- `.vitepress/components/` — custom components
- `.vitepress/formula-count.data.ts` — build-time data loading
- `.vitepress/posts.data.ts` — blog post metadata
- `scripts/dirify-urls.mjs` — URL rewriting for clean URLs

## Conversion Plan

### Homepage (`index.md` → `src/pages/HomePage.vue`)
- Parse front matter → Vue component props
- Convert VitePress template syntax → Vue template
- Keep hero section, feature cards, CTA buttons
- Formula count data: fetch from `formulas-data.json` at build time

### About Page (`about.md` → `src/pages/AboutPage.vue`)
- Render markdown via `marked` (same pattern as GuidePage)
- Preserve content exactly

### Blog (`blog/` → `src/pages/Blog*.vue`)
- `BlogIndexPage.vue` — lists all posts (fetch blog/*.md, show titles + dates)
- `BlogPostPage.vue` — renders single post (fetch .md, render via marked)
- Route: `/blog` and `/blog/:slug`
- Blog post metadata (title, date) extracted from front matter

### Integrations (`integrations/github-actions.md` → `src/pages/IntegrationsPage.vue`)
- Same markdown rendering pattern as About

### Layout
- `src/layouts/DefaultLayout.vue` — nav bar + footer
- Nav bar links: Home, Browse, Unicode, Guide, Licenses, Blog, About
- Footer: links to GitHub, Fontist.org, Fontisan

### Router
```typescript
{ path: '/', component: () => import('./pages/HomePage.vue') },
{ path: '/about', component: () => import('./pages/AboutPage.vue') },
{ path: '/blog', component: () => import('./pages/BlogIndexPage.vue') },
{ path: '/blog/:slug', component: () => import('./pages/BlogPostPage.vue') },
{ path: '/integrations/github-actions', component: () => import('./pages/IntegrationsPage.vue') },
```

## Markdown Rendering Pattern
Reuse the `useMarkdownLinks` composable for SPA navigation in rendered markdown:

```vue
<script setup>
import { useMarkdownLinks } from '../composables/useMarkdownLinks'
const contentRef = ref<HTMLElement | null>(null)
useMarkdownLinks(contentRef)
</script>
<template>
  <article ref="contentRef" v-html="html"></article>
</template>
```

## Migration Steps

### 5.1 Extract content from markdown files
- Read each `.md` file
- Separate front matter from content
- Store as: `public/content/blog/*.md` (raw markdown) + metadata

### 5.2 Create page components
- HomePage.vue — hardcoded Vue template (not markdown)
- AboutPage.vue — markdown fetch + render
- BlogIndexPage.vue — list blog posts from metadata
- BlogPostPage.vue — markdown fetch + render

### 5.3 Delete VitePress
- Remove `.vitepress/` directory
- Remove `scripts/dirify-urls.mjs`
- Remove VitePress from package.json

## Verification
- Homepage renders with hero, features, formula count
- About page renders markdown content
- Blog index lists all 8 posts
- Clicking a blog post renders its content
- No VitePress references remain
