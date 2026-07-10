#!/usr/bin/env node
// gen-blog-index — scans public/content/blog/*.md and writes
// public/content/blog/index.json with title/date/description for each post.
//
// Sorted newest-first by date so any consumer using `.slice(0, N)` sees
// the most recent posts (regression-tested by blog-index.test.mjs).

import { readFileSync, readdirSync, writeFileSync } from 'node:fs'
import { resolve, dirname } from 'node:path'
import { fileURLToPath } from 'node:url'
import { frontmatterGetter, titleFromHeading } from '../src/lib/markdown/frontmatter.mjs'

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..')
const pub = resolve(root, 'public')
const blogDir = resolve(pub, 'content/blog')

let index = []
try {
  const files = readdirSync(blogDir).filter((f) => f.endsWith('.md') && f !== 'index.md')
  index = files.map((f) => {
    const slug = f.replace(/\.md$/, '')
    const text = readFileSync(resolve(blogDir, f), 'utf8')
    const get = frontmatterGetter(text)
    const title = get('title') || titleFromHeading(text, slug)
    let date = get('date')
    if (!date) {
      const m = slug.match(/^(\d{4}-\d{2}-\d{2})/)
      date = m ? m[1] : ''
    }
    return { slug, title, date, description: get('description') }
  })
  index.sort((a, b) => (b.date || '').localeCompare(a.date || ''))
} catch (err) {
  if (err.code !== 'ENOENT') throw err
  console.warn('blog: no content/blog/ directory, skipping')
}

const out = resolve(pub, 'content/blog/index.json')
writeFileSync(out, JSON.stringify(index, null, 2))
console.log(`blog index: wrote ${index.length} posts to content/blog/index.json`)
