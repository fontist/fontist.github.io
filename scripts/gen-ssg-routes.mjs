#!/usr/bin/env node
import { readFileSync, readdirSync, writeFileSync } from 'node:fs'
import { resolve, dirname } from 'node:path'
import { fileURLToPath } from 'node:url'

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..')
const pub = resolve(root, 'public')

const STATIC_ROUTES = ['/', '/about', '/blog', '/compare', '/families', '/formulas', '/unicode', '/licenses', '/guide']

const blockToSlug = (name) =>
  name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '')

function readJson(path, fallback) {
  try {
    return JSON.parse(readFileSync(path, 'utf8'))
  } catch {
    return fallback
  }
}

// Extract frontmatter as a key→value getter. Values have surrounding double
// quotes stripped. Returns get('')→'' for files without frontmatter.
// Mirrors src/lib/markdown/frontmatter.ts but stays in .mjs so this script
// can run without a TypeScript loader.
function parseFrontmatterGetters(text) {
  const fm = text.startsWith('---\n')
    ? text.slice(4, text.indexOf('\n---\n', 4))
    : ''
  return (key) => {
    const m = fm.match(new RegExp(`^${key}:\\s*(.+)$`, 'm'))
    if (!m) return ''
    let v = m[1].trim()
    if (v.startsWith('"') && v.endsWith('"')) v = v.slice(1, -1)
    return v
  }
}

function titleFromHeading(text, fallback) {
  const m = text.match(/^#\s+(.+)$/m)
  return m ? m[1].trim() : fallback
}


const formulas = readJson(resolve(pub, 'formulas-data.json'), [])
const familiesIndex = readJson(resolve(pub, 'font-families.json'), { families: [] })
const blocksFile = readJson(resolve(pub, 'unicode-blocks.json'), {})
const blockSlugs = Object.values(blocksFile).map((b) => blockToSlug(b.name)).filter(Boolean)

let blogSlugs = []
let blogIndex = []
try {
  const files = readdirSync(resolve(pub, 'content/blog')).filter((f) => f.endsWith('.md') && f !== 'index.md')
  blogSlugs = files.map((f) => f.replace(/\.md$/, ''))
  blogIndex = files.map((f) => {
    const slug = f.replace(/\.md$/, '')
    const text = readFileSync(resolve(pub, 'content/blog', f), 'utf8')
    const get = parseFrontmatterGetters(text)
    let title = get('title') || titleFromHeading(text, slug)
    let date = get('date')
    if (!date) {
      const m = slug.match(/^(\d{4}-\d{2}-\d{2})/)
      date = m ? m[1] : ''
    }
    return { slug, title, date, description: get('description') }
  })
  // Sort newest-first so consumers can `.slice(0, N)` for "latest" lists.
  blogIndex.sort((a, b) => (b.date || '').localeCompare(a.date || ''))
} catch {
  // blog dir optional
}

writeFileSync(
  resolve(pub, 'content/blog/index.json'),
  JSON.stringify(blogIndex, null, 2),
)
console.log(`blog index: wrote ${blogIndex.length} posts to content/blog/index.json`)

// ── Guide index ──────────────────────────────────────────────
// Walk content/guide/ recursively, collect every .md file with title.
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
        const get = parseFrontmatterGetters(text)
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

let guideIndex = []
try {
  guideIndex = collectGuides(resolve(pub, 'content/guide'))
} catch {}
writeFileSync(
  resolve(pub, 'content/guide/index.json'),
  JSON.stringify(guideIndex, null, 2),
)
console.log(`guide index: wrote ${guideIndex.length} guides to content/guide/index.json`)

const routes = new Set(STATIC_ROUTES)

for (const f of formulas) {
  if (!f.slug) continue
  routes.add(`/formulas/${f.slug}`)
}

for (const fam of familiesIndex.families || []) {
  if (!fam.slug) continue
  routes.add(`/families/${fam.slug}`)
  routes.add(`/families/${fam.slug}/unicode`)
}

const emittedFileSlugs = new Set()
for (const fam of familiesIndex.families || []) {
  for (const file of fam.files || []) {
    if (!file.slug || emittedFileSlugs.has(file.slug)) continue
    emittedFileSlugs.add(file.slug)
    routes.add(`/fonts/${file.slug}`)
    routes.add(`/fonts/${file.slug}/unicode`)
  }
}
console.log(`fonts: emitted ${emittedFileSlugs.size} unique file slugs`)

const PLANE_KEYS = ['bmp', 'smp', 'sip', 'tip', 'ssp', 'pua-a', 'pua-b']
for (const k of PLANE_KEYS) routes.add(`/unicode/plane/${k}`)

const PROPERTY_INDEXES = ['scripts', 'category', 'combining', 'bidiclass']
for (const p of PROPERTY_INDEXES) routes.add(`/unicode/${p}`)

let licenseSlugs = []
try {
  const ls = readdirSync(resolve(pub, 'content/licenses'), { withFileTypes: true })
  for (const ent of ls) {
    if (ent.isDirectory()) {
      licenseSlugs.push(ent.name)
    } else if (ent.name.endsWith('.md') && ent.name !== 'index.md') {
      const slug = ent.name.replace(/\.md$/, '')
      licenseSlugs.push(slug)
    }
  }
} catch {}
// Note: licenses/index.json is generated by scripts/gen-licenses-index.mjs
// from the YAML data files — not here. This script only enumerates routes.
for (const s of licenseSlugs) routes.add(`/licenses/${s}`)
for (const s of blockSlugs) routes.add(`/unicode/block/${s}`)
for (const s of blogSlugs) routes.add(`/blog/${s}`)
for (const g of guideIndex) routes.add(`/guide/${g.slug}`)

const out = resolve(pub, 'ssg-routes.json')
const routesArr = [...routes].sort()
writeFileSync(out, JSON.stringify(routesArr, null, 2))
console.log(`ssg-routes: wrote ${routesArr.length} routes to ${out}`)

const today = new Date().toISOString().slice(0, 10)
const urlset = routesArr
  .map((r) => {
    const loc = `https://www.fontist.org${r === '/' ? '' : r}`
    const priority = r === '/' ? '1.0'
      : r.startsWith('/families/') && !r.endsWith('/unicode') ? '0.9'
      : r.startsWith('/fonts/') && !r.endsWith('/unicode') ? '0.8'
      : r.startsWith('/formulas/') ? '0.7'
      : r.startsWith('/unicode/') ? '0.6'
      : '0.5'
    return `  <url><loc>${loc}</loc><lastmod>${today}</lastmod><priority>${priority}</priority></url>`
  })
  .join('\n')

const sitemapPath = resolve(pub, 'sitemap.xml')
writeFileSync(sitemapPath, `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${urlset}\n</urlset>\n`)
console.log(`sitemap: wrote ${routesArr.length} URLs to ${sitemapPath}`)
