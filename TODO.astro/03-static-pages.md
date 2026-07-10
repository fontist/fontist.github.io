# 03 — Static page migration

## Why
Static pages (no dynamic data fetching, no interactivity beyond theme)
are the easiest migration path. Get these right first to establish
patterns before tackling dynamic pages.

## Scope — pages to migrate

| Page | Source | Notes |
|------|--------|-------|
| HomePage | `src/pages/HomePage.vue` | Hero + ecosystem cards |
| AboutPage | `src/pages/AboutPage.vue` | Markdown via `useMarkdownPage` |
| BlogIndexPage | `src/pages/BlogIndexPage.vue` | List of blog posts from `content/blog/*.md` |
| BlogPostPage | `src/pages/BlogPostPage.vue` | Markdown body + frontmatter |
| GuideIndexPage, GuidePage, GuideTopicPage | `src/pages/Guide*.vue` | Markdown content |
| LicensesPage | `src/pages/LicensesPage.vue` | Reads `content/licenses/index.json` |
| LicenseDetailPage | `src/pages/LicenseDetailPage.vue` | Per-license YAML data |
| UnicodePage | `src/pages/UnicodePage.vue` | Plane index from `unicode-blocks.json` |
| UnicodePlanePage | `src/pages/UnicodePlanePage.vue` | Blocks in a plane |
| NotFound | `src/pages/NotFound.vue` | 404 page |

## Steps

1. **Convert HomePage first** as the pattern. `src/pages/index.astro`:
   ```astro
   ---
   import DefaultLayout from '../layouts/DefaultLayout.astro'
   import { loadFontsRegistry } from '../lib/fonts/loader'
   const fonts = await loadFontsRegistry()
   ---
   <DefaultLayout title="Fontist — Open Font Archive">
     <section class="home-hero">...</section>
     <section class="home-stats">
       <span>{fonts.fonts.length.toLocaleString()} fonts</span>
     </section>
   </DefaultLayout>
   ```
   The top-level `await` in `<script setup>` becomes synchronous frontmatter.

2. **Markdown pages** — use Astro's content collections:
   ```astro
   ---
   import { getCollection } from 'astro:content'
   const posts = await getCollection('blog')
   ---
   ```
   Config in `src/content/config.ts`:
   ```ts
   import { defineCollection, z } from 'astro:content'
   const blog = defineCollection({
     type: 'content',
     schema: z.object({
       title: z.string(),
       date: z.string(),
       description: z.string().optional(),
       authors: z.array(z.string()).optional(),
     }),
   })
   export const collections = { blog }
   ```

3. **License pages** — convert `LicensesPage.vue` to `licenses/index.astro`
   using the existing `loadAllFormulas()` helper.

4. **NotFound** — pure markup, trivial conversion.

5. After each page migration, run the appropriate Vitest to confirm
   nothing regressed. Update page-level tests to mount the new `.astro`
   page via `@astrojs/test` or Playwright.

## Acceptance
- [ ] All 10 static pages above render via Astro at the same URL paths
- [ ] Content collections validate blog/guide frontmatter at build time
- [ ] Lighthouse audit on About/Blog/Guide shows 0 unused JS
- [ ] Per-page OG tags generated via `<head>` slot
- [ ] Sitemap includes all static URLs

## Dependencies
- Phase 02 (layout)
