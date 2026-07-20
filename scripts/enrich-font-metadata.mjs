#!/usr/bin/env node
// Enriches public/font-metadata.json with woff_file + coverage_file paths for
// each redistributable font that has one.
//
// The upstream fontist-archive-public metadata only has woff_file for ~6
// of 16,432 fonts. This script fills the gap by matching font slugs against
// the archive's file list.
//
// Source of truth is public/archive-manifest.txt (written by fetch-data.sh
// from `git ls-tree` against fontist-archive-public), NOT a scan of public/.
// coverage/ and woff/ are served from the CDN and are deliberately never
// copied into public/ — they exceed the 1 GB Pages limit. An earlier version
// scanned public/woff/, which silently yielded zero matches once the bulk
// assets moved to the CDN.
//
// Paths recorded here stay repo-relative (e.g. "woff/google/abel/Abel.woff");
// the site prefixes them with cdn_base from public/archive-ref.json.
//
// Run after fetch-data.sh, before gen-font-families.mjs.

import { readFileSync, writeFileSync, existsSync } from 'node:fs'
import { resolve, dirname } from 'node:path'
import { fileURLToPath } from 'node:url'

const __dirname = dirname(fileURLToPath(import.meta.url))
const ROOT = resolve(__dirname, '..')
const PUBLIC = resolve(ROOT, 'public')
const VENDOR = resolve(ROOT, 'vendor')

const metaPath = resolve(PUBLIC, 'font-metadata.json')
// Build-time input only — deliberately not under public/, so the 7 MB
// manifest is not published with the site.
const manifestPath = resolve(VENDOR, 'archive-manifest.txt')

if (!existsSync(metaPath)) {
  console.error('error: font-metadata.json not found — run scripts/fetch-data.sh first')
  process.exit(1)
}
if (!existsSync(manifestPath)) {
  console.error('error: archive-manifest.txt not found — run scripts/fetch-data.sh first')
  process.exit(1)
}

const meta = JSON.parse(readFileSync(metaPath, 'utf8'))
const fonts = meta.fonts || []
console.log(`font-metadata: ${fonts.length} entries`)

const manifest = readFileSync(manifestPath, 'utf8').split('\n').filter(Boolean)
console.log(`archive manifest: ${manifest.length} paths`)

// Build woff index: { slug → woff_path }
// Handles flat (woff/{source}/{slug}.woff) and nested
// (woff/{source}/{slug}/{PSName}.woff) layouts, preferring the first match.
const woffIndex = new Map()
// Build coverage index: { slug → coverage_path }
const coverageIndex = new Map()

for (const path of manifest) {
  const parts = path.split('/')

  if (path.startsWith('woff/') && path.endsWith('.woff')) {
    if (parts.length === 3) {
      // woff/{source}/{slug}.woff
      const slug = parts[2].replace(/\.woff$/, '')
      if (!woffIndex.has(slug)) woffIndex.set(slug, path)
    } else if (parts.length === 4) {
      // woff/{source}/{slug}/{PSName}.woff
      const slug = parts[2]
      if (!woffIndex.has(slug)) woffIndex.set(slug, path)
    }
    continue
  }

  // coverage_file must always point at a real .json — it is fetched directly.
  // Three layouts occur in the archive:
  //   coverage/{slug}.json                          (legacy flat)
  //   coverage/{source}/{slug}.json                 (per-family)
  //   coverage/{source}/{slug}/**/{Face}.json       (per-face, 2+ levels deep)
  // For the per-face layout any one face is a valid representative, so keep
  // the first seen. Recording the *directory* here (an earlier bug) produced
  // paths that fetchJson could never load.
  if (path.startsWith('coverage/') && path.endsWith('.json')) {
    let slug
    if (parts.length === 2) {
      slug = parts[1].replace(/\.json$/, '')
    } else if (parts.length === 3) {
      slug = parts[2].replace(/\.json$/, '')
    } else {
      slug = parts[2]
    }
    if (slug && !coverageIndex.has(slug)) coverageIndex.set(slug, path)
  }
}

console.log(`woff index: ${woffIndex.size} files found`)
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

const withWoff = fonts.filter((f) => f.woff_file).length
console.log(`Total with woff_file: ${withWoff} / ${fonts.length}`)

// An empty index means the archive published no specimens, or the manifest
// shape changed underneath us. Either way every specimen on the site would
// 404. Fail here rather than shipping a silently font-less build — this
// exact condition went unnoticed in production for a month.
if (woffIndex.size === 0) {
  console.error('error: archive manifest contains no woff files — refusing to ship a build with no specimens')
  process.exit(1)
}

writeFileSync(metaPath, JSON.stringify(meta, null, 2) + '\n')
console.log(`Updated ${metaPath}`)
