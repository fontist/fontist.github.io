import { readFileSync, readdirSync } from 'node:fs'
import { resolve } from 'node:path'

interface FormulaEntry {
  slug: string
}

interface UnicodeBlock {
  name: string
}

interface UnicodeBlocksFile {
  [index: string]: UnicodeBlock
}

const STATIC_ROUTES = [
  '/',
  '/about',
  '/blog',
  '/browse',
  '/compare',
  '/unicode',
] as const

const blockToSlug = (name: string): string =>
  name
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '')

function readJson<T>(path: string): T | null {
  try {
    return JSON.parse(readFileSync(resolve(process.cwd(), path), 'utf8')) as T
  } catch {
    return null
  }
}

function loadFormulaSlugs(): string[] {
  const data = readJson<FormulaEntry[]>('public/formulas-data.json')
  if (!data) return []
  return data.map((f) => f.slug).filter(Boolean)
}

function loadUnicodeBlockSlugs(): string[] {
  const data = readJson<UnicodeBlocksFile>('public/unicode-blocks.json')
  if (!data) return []
  return Object.values(data).map((b) => blockToSlug(b.name)).filter(Boolean)
}

function loadUnicodePlanes(): number[] {
  return Array.from({ length: 17 }, (_, i) => i)
}

function loadBlogSlugs(): string[] {
  try {
    const dir = resolve(process.cwd(), 'public/content/blog')
    const entries = readdirSync(dir)
    return entries
      .filter((f) => f.endsWith('.md'))
      .map((f) => f.replace(/\.md$/, ''))
  } catch {
    return []
  }
}

export function buildIncludedRoutes(): string[] {
  const formulaSlugs = loadFormulaSlugs()
  const blockSlugs = loadUnicodeBlockSlugs()

  const routes = new Set<string>(STATIC_ROUTES)

  for (const slug of formulaSlugs) {
    routes.add(`/formula/${slug}`)
    routes.add(`/font/${slug}`)
    routes.add(`/font/${slug}/unicode`)
  }

  for (const plane of loadUnicodePlanes()) {
    routes.add(`/unicode/plane/${plane}`)
  }

  for (const slug of blockSlugs) {
    routes.add(`/unicode/block/${slug}`)
  }

  for (const slug of loadBlogSlugs()) {
    routes.add(`/blog/${slug}`)
  }

  // Item 8 decision: /font/:slug/unicode/:block is lazy-rendered only.
  // Full prerender of the 4,283 × 346 matrix (~1.48M HTML files) is not viable.

  return [...routes]
}
