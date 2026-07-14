#!/usr/bin/env node
// Downloads Essenfont per-block WOFF2 files + generates fonts.css.
//
// Essenfont covers ALL assigned Unicode codepoints. The fonts are split
// by Unicode block (~214 files). The browser only fetches subsets for
// characters actually rendered on the page (via unicode-range in @font-face).
//
// Source: https://www.essenfont.org (GitHub: essenfont/essenfont.github.io)
//
// Run as part of scripts/fetch-data.sh or standalone.

import { readFileSync, writeFileSync, existsSync, mkdirSync } from 'node:fs'
import { resolve, dirname } from 'node:path'
import { fileURLToPath } from 'node:url'

const __dirname = dirname(fileURLToPath(import.meta.url))
const ROOT = resolve(__dirname, '..')
const PUBLIC = resolve(ROOT, 'public')
const FONTS_DIR = resolve(PUBLIC, 'fonts')

// Essenfont GitHub raw URLs
const ESSENFONT_BASE = 'https://raw.githubusercontent.com/essenfont/essenfont.github.io/main/public'

if (!existsSync(FONTS_DIR)) mkdirSync(FONTS_DIR, { recursive: true })

// Read the unicode blocks to know which font files to fetch
const blocksPath = resolve(PUBLIC, 'unicode-blocks.json')
if (!existsSync(blocksPath)) {
  console.log('unicode-blocks.json not found — skipping Essenfont fetch')
  process.exit(0)
}

const blocks = JSON.parse(readFileSync(blocksPath, 'utf8'))

function blockSlug(name) {
  return name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '')
}

// Non-graphic blocks that produce degenerate fonts — skip these
const NON_GRAPHIC = new Set(['tags', 'private-use-area', 'supplementary-private-use-area-a', 'supplementary-private-use-area-b'])

function hexCp(cp) {
  return cp.toString(16).toUpperCase().padStart(4, '0')
}

let fetched = 0
let skipped = 0
const cssRules = []

for (const block of blocks) {
  const slug = blockSlug(block.name)
  if (NON_GRAPHIC.has(slug)) {
    skipped++
    continue
  }

  const localPath = resolve(FONTS_DIR, `${slug}.woff2`)

  if (!existsSync(localPath)) {
    // Would fetch here in CI. For now, just note it's missing.
    skipped++
    continue
  }

  fetched++
  const start = hexCp(block.start)
  const end = hexCp(block.end)
  cssRules.push(`@font-face {
  font-family: "Essenfont";
  src: url("/fonts/${slug}.woff2") format("woff2");
  font-weight: 100 900;
  font-style: normal;
  font-display: swap;
  unicode-range: U+${start}-${end};
}`)
}

console.log(`Essenfont: ${fetched} block fonts available, ${skipped} skipped`)

const cssPath = resolve(PUBLIC, 'fonts.css')
writeFileSync(cssPath, cssRules.join('\n\n') + '\n')
console.log(`Wrote ${cssPath} (${cssRules.length} @font-face rules)`)
