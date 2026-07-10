#!/usr/bin/env node
// gen-guide-index — walks public/content/guide/ recursively and writes
// public/content/guide/index.json with title/description for each guide page.

import { readFileSync, readdirSync, writeFileSync } from 'node:fs'
import { resolve, dirname } from 'node:path'
import { fileURLToPath } from 'node:url'
import { frontmatterGetter, titleFromHeading } from '../src/lib/markdown/frontmatter.mjs'

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..')
const pub = resolve(root, 'public')
const guideDir = resolve(pub, 'content/guide')

function collectGuides(dir, base = '') {
  const out = []
  let entries = []
  try { entries = readdirSync(dir, { withFileTypes: true }) } catch { return out }
  for (const ent of entries) {
    const rel = base ? `${base}/${ent.name}` : ent.name
    if (ent.isDirectory()) {
      out.push(...collectGuides(resolve(dir, ent.name), rel))
    } else if (ent.name.endsWith('.md') && ent.name !== 'index.md') {
      const slug = rel.replace(/\.md$/, '')
      let title = ''
      let description = ''
      try {
        const text = readFileSync(resolve(dir, ent.name), 'utf8')
        const get = frontmatterGetter(text)
        title = get('title') || titleFromHeading(text, slug.split('/').pop())
        description = get('description')
      } catch {
        title = slug.split('/').pop()
      }
      out.push({ slug, title, description })
    }
  }
  return out
}

let index = []
try {
  index = collectGuides(guideDir)
} catch (err) {
  if (err.code !== 'ENOENT') throw err
  console.warn('guide: no content/guide/ directory, skipping')
}

const out = resolve(pub, 'content/guide/index.json')
writeFileSync(out, JSON.stringify(index, null, 2))
console.log(`guide index: wrote ${index.length} guides to content/guide/index.json`)
