#!/usr/bin/env node
// Enriches public/font-metadata.json by scanning public/woff/ for actual
// woff files and populating the woff_file + coverage_file fields for each
// redistributable font that has one.
//
// The upstream fontist-archive-public metadata only has woff_file for ~6
// of 16,432 fonts. This script fills the gap by matching font slugs to
// the actual woff files that exist in public/woff/.
//
// Run after fetch-data.sh, before gen-font-families.mjs.

import { readFileSync, writeFileSync, readdirSync, existsSync, statSync } from 'node:fs'
import { resolve, dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'

const __dirname = dirname(fileURLToPath(import.meta.url))
const ROOT = resolve(__dirname, '..')
const PUBLIC = resolve(ROOT, 'public')

const metaPath = resolve(PUBLIC, 'font-metadata.json')
const woffDir = resolve(PUBLIC, 'woff')
const coverageDir = resolve(PUBLIC, 'coverage')

if (!existsSync(metaPath)) {
  console.log('font-metadata.json not found — skipping enrichment')
  process.exit(0)
}

const meta = JSON.parse(readFileSync(metaPath, 'utf8'))
const fonts = meta.fonts || []
console.log(`font-metadata: ${fonts.length} entries`)

// Build woff index: { slug → woff_path }
// Scans both flat (woff/{source}/{slug}.woff) and nested
// (woff/{source}/{slug}/{PSName}.woff) patterns.
const woffIndex = new Map()

if (existsSync(woffDir)) {
  for (const source of readdirSync(woffDir)) {
    const sourceDir = join(woffDir, source)
    if (!statSync(sourceDir).isDirectory()) continue

    for (const entry of readdirSync(sourceDir)) {
      const fullPath = join(sourceDir, entry)
      if (entry.endsWith('.woff') && statSync(fullPath).isFile()) {
        // Flat: woff/{source}/{slug}.woff
        const slug = entry.replace(/\.woff$/, '')
        woffIndex.set(slug, `woff/${source}/${entry}`)
      } else if (statSync(fullPath).isDirectory()) {
        // Nested: woff/{source}/{slug}/{PSName}.woff
        const slug = entry
        for (const file of readdirSync(fullPath)) {
          if (file.endsWith('.woff')) {
            const psName = file.replace(/\.woff$/, '')
            // Prefer the first woff found for the slug
            if (!woffIndex.has(slug)) {
              woffIndex.set(slug, `woff/${source}/${slug}/${file}`)
            }
          }
        }
      }
    }
  }
}

console.log(`woff index: ${woffIndex.size} files found`)

// Build coverage index: { slug → coverage_path }
const coverageIndex = new Map()
if (existsSync(coverageDir)) {
  // Flat coverage files: coverage/{slug}.json
  for (const entry of readdirSync(coverageDir)) {
    if (entry.endsWith('.json')) {
      const slug = entry.replace(/\.json$/, '')
      coverageIndex.set(slug, `coverage/${entry}`)
    }
  }
  // Nested: coverage/{source}/{slug}/...
  for (const source of readdirSync(coverageDir)) {
    const sourceDir = join(coverageDir, source)
    if (!statSync(sourceDir).isDirectory()) continue
    for (const slugDir of readdirSync(sourceDir)) {
      const slugPath = join(sourceDir, slugDir)
      if (!statSync(slugPath).isDirectory()) continue
      if (!coverageIndex.has(slugDir)) {
        coverageIndex.set(slugDir, `coverage/${source}/${slugDir}`)
      }
    }
  }
}

console.log(`coverage index: ${coverageIndex.size} entries`)

// Enrich metadata
let woffAdded = 0
let coverageAdded = 0
for (const font of fonts) {
  if (!font.woff_file && woffIndex.has(font.slug)) {
    font.woff_file = woffIndex.get(font.slug)
    woffAdded++
  }
  if (!font.coverage_file && coverageIndex.has(font.slug)) {
    font.coverage_file = coverageIndex.get(font.slug)
    coverageAdded++
  }
}

console.log(`Enriched: ${woffAdded} woff_file, ${coverageAdded} coverage_file`)
console.log(`Total with woff_file: ${fonts.filter(f => f.woff_file).length} / ${fonts.length}`)

writeFileSync(metaPath, JSON.stringify(meta, null, 2) + '\n')
console.log(`Updated ${metaPath}`)
