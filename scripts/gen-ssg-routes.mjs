#!/usr/bin/env node
import { readFileSync, readdirSync, writeFileSync } from 'node:fs'
import { resolve, dirname } from 'node:path'
import { fileURLToPath } from 'node:url'

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..')
const pub = resolve(root, 'public')

const STATIC_ROUTES = ['/', '/about', '/blog', '/browse', '/compare', '/unicode']

const blockToSlug = (name) =>
  name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '')

function readJson(path, fallback) {
  try {
    return JSON.parse(readFileSync(path, 'utf8'))
  } catch {
    return fallback
  }
}

const formulas = readJson(resolve(pub, 'formulas-data.json'), [])
const blocksFile = readJson(resolve(pub, 'unicode-blocks.json'), {})
const blockSlugs = Object.values(blocksFile).map((b) => blockToSlug(b.name)).filter(Boolean)

let blogSlugs = []
try {
  blogSlugs = readdirSync(resolve(pub, 'content/blog'))
    .filter((f) => f.endsWith('.md'))
    .map((f) => f.replace(/\.md$/, ''))
} catch {
  // blog dir optional
}

const routes = new Set(STATIC_ROUTES)

for (const f of formulas) {
  if (!f.slug) continue
  routes.add(`/formula/${f.slug}`)
  routes.add(`/font/${f.slug}`)
  routes.add(`/font/${f.slug}/unicode`)
}

const PLANE_KEYS = ['bmp', 'smp', 'sip', 'tip', 'ssp', 'pua-a', 'pua-b']
for (const k of PLANE_KEYS) routes.add(`/unicode/plane/${k}`)

const PROPERTY_INDEXES = ['scripts', 'category', 'combining', 'bidiclass']
for (const p of PROPERTY_INDEXES) routes.add(`/unicode/${p}`)

let licenseSlugs = []
try {
  const ls = readdirSync(resolve(pub, 'content/licenses'), { withFileTypes: true })
  for (const ent of ls) {
    if (ent.isDirectory()) licenseSlugs.push(ent.name)
    else if (ent.name.endsWith('.md')) licenseSlugs.push(ent.name.replace(/\.md$/, ''))
  }
} catch {}
for (const s of licenseSlugs) routes.add(`/licenses/${s}`)
for (const s of blockSlugs) routes.add(`/unicode/block/${s}`)
for (const s of blogSlugs) routes.add(`/blog/${s}`)

const out = resolve(pub, 'ssg-routes.json')
const routesArr = [...routes].sort()
writeFileSync(out, JSON.stringify(routesArr, null, 2))
console.log(`ssg-routes: wrote ${routesArr.length} routes to ${out}`)

const today = new Date().toISOString().slice(0, 10)
const urlset = routesArr
  .map((r) => {
    const loc = `https://www.fontist.org${r === '/' ? '' : r}`
    const priority = r === '/' ? '1.0'
      : r.startsWith('/font/') && !r.includes('/unicode') ? '0.9'
      : r.startsWith('/formula/') ? '0.8'
      : r.startsWith('/unicode/') ? '0.7'
      : '0.5'
    return `  <url><loc>${loc}</loc><lastmod>${today}</lastmod><priority>${priority}</priority></url>`
  })
  .join('\n')

const sitemapPath = resolve(pub, 'sitemap.xml')
writeFileSync(sitemapPath, `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${urlset}\n</urlset>\n`)
console.log(`sitemap: wrote ${routesArr.length} URLs to ${sitemapPath}`)
