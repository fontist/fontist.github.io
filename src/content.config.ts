import { defineCollection, z } from 'astro:content'
import { glob } from 'astro/loaders'

// Astro 7 content-layer API: every collection uses a loader. Entries gained
// an `id` (slug-style path without extension) in place of `slug`.
const blog = defineCollection({
  loader: glob({ pattern: ['*.mdx', '*.md'], base: './src/content/blog' }),
  schema: z.object({
    title: z.string(),
    description: z.string().optional(),
    date: z.union([z.string(), z.number(), z.date()]).transform(v =>
      v instanceof Date ? v.toISOString().slice(0, 10) : String(v)
    ),
    authors: z.array(z.string()).optional(),
  }),
})

const guide = defineCollection({
  loader: glob({ pattern: ['*.mdx', '*.md', '**/index.mdx', '**/index.md'], base: './src/content/guide' }),
  schema: z.object({
    title: z.string(),
    description: z.string().optional(),
  }),
})

const pages = defineCollection({
  loader: glob({ pattern: ['*.mdx', '*.md'], base: './src/content/pages' }),
  schema: z.object({
    title: z.string(),
    description: z.string().optional(),
  }),
})

const licenses = defineCollection({
  loader: glob({ pattern: ['*.mdx', '*.md'], base: './src/content/licenses' }),
  schema: z.object({
    title: z.string(),
    description: z.string().optional(),
  }),
})

export const collections = { blog, guide, pages, licenses }
