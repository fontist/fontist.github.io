#!/usr/bin/env node
// gen-sitemap — walks dist/ after astro build to produce dist/sitemap.xml.
// MUST run AFTER astro build (the pages must exist in dist/).

import { readdirSync, writeFileSync, existsSync } from 'node:fs'
import { resolve, join } from 'node:path'

const root = process.cwd()
const dist = resolve(root, 'dist')

if (!existsSync(dist)) {
  console.warn('sitemap: dist/ does not exist; run astro build first')
  process.exit(0)
}

function* walkHtml(dir, base = '') {
  let entries = []
  try { entries = readdirSync(dir, { withFileTypes: true }) } catch { return }
  for (const ent of entries) {
    if (ent.name.startsWith('.')) continue
    const abs = join(dir, ent.name)
    if (ent.isDirectory()) {
      yield* walkHtml(abs, base ? `${base}/${ent.name}` : ent.name)
    } else if (ent.name === 'index.html') {
      yield base ? `/${base}` : '/'
    }
  }
}

const today = new Date().toISOString().slice(0, 10)
function priorityFor(route) {
  if (route === '/') return '1.0'
  if (route.startsWith('/families/') && !route.endsWith('/unicode')) return '0.9'
  if (route.startsWith('/fonts/') && !route.endsWith('/unicode')) return '0.8'
  if (route.startsWith('/formulas/')) return '0.7'
  if (route.startsWith('/unicode/')) return '0.6'
  return '0.5'
}

const routes = [...walkHtml(dist)].sort()
const urlset = routes
  .map((r) => {
    const loc = `https://www.fontist.org${r}`
    return `  <url><loc>${loc}</loc><lastmod>${today}</lastmod><priority>${priorityFor(r)}</priority></url>`
  })
  .join('\n')

writeFileSync(
  resolve(dist, 'sitemap.xml'),
  `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${urlset}\n</urlset>\n`,
)
console.log(`sitemap: wrote ${routes.length} URLs to dist/sitemap.xml`)
