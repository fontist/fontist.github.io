#!/usr/bin/env node
// Downloads Essenfont per-block WOFF2 files from the essenfont.github.io
// repo and generates fonts.css with @font-face rules using unicode-range.
//
// Essenfont covers ALL assigned Unicode codepoints. The browser only fetches
// subsets for characters actually rendered (via unicode-range in @font-face).
//
// Run as part of the build pipeline (after fetch-data.sh, before astro build).

import { readFileSync, writeFileSync, existsSync, mkdirSync, readdirSync, copyFileSync, rmSync } from 'node:fs'
import { resolve, dirname } from 'node:path'
import { execSync } from 'node:child_process'
import { fileURLToPath } from 'node:url'

const __dirname = dirname(fileURLToPath(import.meta.url))
const ROOT = resolve(__dirname, '..')
const PUBLIC = resolve(ROOT, 'public')
const FONTS_DIR = resolve(PUBLIC, 'fonts')

const ESSENFONT_REPO = 'https://github.com/essenfont/essenfont.github.io.git'

if (!existsSync(FONTS_DIR)) mkdirSync(FONTS_DIR, { recursive: true })

// ── Step 1: Clone essenfont.github.io and copy font files ──

const hasFonts = existsSync(FONTS_DIR) && readdirSync(FONTS_DIR).some(f => f.endsWith('.woff2') && !f.startsWith('noto'))

if (!hasFonts) {
  console.log('Essenfont: cloning essenfont.github.io (shallow)...')
  try {
    const tmp = execSync('mktemp -d').toString().trim()
    execSync(`git clone --depth 1 ${ESSENFONT_REPO} ${tmp}/essenfont`, { stdio: 'pipe', timeout: 120000 })

    const srcFontsDir = `${tmp}/essenfont/public/fonts`
    if (existsSync(srcFontsDir)) {
      let copied = 0
      for (const file of readdirSync(srcFontsDir)) {
        if (file.endsWith('.woff2') && !file.startsWith('Essenfont-') && !file.startsWith('noto')) {
          copyFileSync(`${srcFontsDir}/${file}`, `${FONTS_DIR}/${file}`)
          copied++
        }
      }
      console.log(`Essenfont: copied ${copied} per-block woff2 files`)
    }

    rmSync(tmp, { recursive: true, force: true })
  } catch (e) {
    console.log('Essenfont: clone failed, skipping —', String(e).slice(0, 200))
  }
} else {
  console.log('Essenfont: woff2 files already present, skipping clone')
}

// ── Step 2: Generate missing per-block subsets via pyftsubset ──

const ESSENFONT_RELEASE = 'v0.6.2'
const ESSENFONT_RELEASE_REPO = 'essenfont/essenfont'

function planeForCp(cp) {
  if (cp <= 0xFFFF) return 'BMP'
  if (cp <= 0x1FFFF) return 'SMP'
  if (cp <= 0x2FFFF) return 'SIP'
  if (cp <= 0x3FFFF) return 'TIP'
  if (cp >= 0xE0000 && cp <= 0xEFFFF) return 'SSP'
  return null
}

function hexCp(cp) {
  return cp.toString(16).toUpperCase().padStart(4, '0')
}

function blockSlug(name) {
  return name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '')
}

const NON_GRAPHIC = new Set([
  'tags', 'private-use-area',
  'supplementary-private-use-area-a', 'supplementary-private-use-area-b',
])

const blocksPath = resolve(PUBLIC, 'unicode-blocks.json')
if (!existsSync(blocksPath)) {
  console.log('Essenfont: unicode-blocks.json not found, cannot generate fonts.css')
  process.exit(0)
}

const blocks = JSON.parse(readFileSync(blocksPath, 'utf8'))

// Check for missing blocks and generate subsets
const missingBlocks = blocks.filter(b => {
  const slug = blockSlug(b.name)
  return !NON_GRAPHIC.has(slug) && !existsSync(resolve(FONTS_DIR, `${slug}.woff2`))
})

if (missingBlocks.length > 0) {
  console.log(`Essenfont: ${missingBlocks.length} blocks missing per-block subsets, generating via pyftsubset...`)

  // Download per-plane TTFs from release if not cached
  const tmpDir = execSync('mktemp -d').toString().trim()
  const planes = [...new Set(missingBlocks.map(b => planeForCp(b.start)).filter(Boolean))]

  for (const plane of planes) {
    const ttfPath = `${tmpDir}/Essenfont-${plane}.ttf`
    if (!existsSync(ttfPath)) {
      console.log(`Essenfont: downloading Essenfont-${plane}.ttf from ${ESSENFONT_RELEASE}...`)
      try {
        execSync(`gh release download ${ESSENFONT_RELEASE} -R ${ESSENFONT_RELEASE_REPO} -p "Essenfont-${plane}.ttf" -D ${tmpDir} --skip-existing`, { stdio: 'pipe', timeout: 120000 })
      } catch (e) {
        console.log(`Essenfont: failed to download ${plane} TTF, skipping`)
      }
    }
  }

  let generated = 0, failed = 0
  for (const block of missingBlocks) {
    const slug = blockSlug(block.name)
    const plane = planeForCp(block.start)
    if (!plane) continue

    const ttfPath = `${tmpDir}/Essenfont-${plane}.ttf`
    if (!existsSync(ttfPath)) { failed++; continue }

    const woff2Path = resolve(FONTS_DIR, `${slug}.woff2`)
    const range = `${hexCp(block.start)}-${hexCp(block.end)}`

    try {
      execSync(`pyftsubset ${ttfPath} --unicodes=U+${range} --flavor=woff2 --output-file=${woff2Path} --no-hinting --desubroutinize`, { stdio: 'pipe', timeout: 60000 })
      generated++
    } catch (e) {
      failed++
    }
  }

  console.log(`Essenfont: generated ${generated} subsets, ${failed} failed`)
  rmSync(tmpDir, { recursive: true, force: true })
}

// ── Step 3: Generate fonts.css ──

const cssRules = []
let available = 0
let missing = 0

for (const block of blocks) {
  const slug = blockSlug(block.name)
  if (NON_GRAPHIC.has(slug)) continue

  const woff2Path = resolve(FONTS_DIR, `${slug}.woff2`)
  if (!existsSync(woff2Path)) { missing++; continue }

  available++
  cssRules.push(`@font-face {
  font-family: "Essenfont";
  src: url("/fonts/${slug}.woff2") format("woff2");
  font-weight: 100 900;
  font-style: normal;
  font-display: swap;
  unicode-range: U+${hexCp(block.start)}-${hexCp(block.end)};
}`)
}

console.log(`Essenfont: ${available} block fonts available, ${missing} missing`)

if (cssRules.length === 0) {
  console.log('Essenfont: no font files found, skipping fonts.css')
  process.exit(0)
}

const cssPath = resolve(PUBLIC, 'fonts.css')
writeFileSync(cssPath, cssRules.join('\n\n') + '\n')
console.log(`Essenfont: wrote fonts.css (${cssRules.length} @font-face rules)`)
