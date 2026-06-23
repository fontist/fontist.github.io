#!/usr/bin/env node
// Regenerate every Unicode data file under public/unicode/ and
// public/unicode-blocks.json from the UCD XML upstream.
//
// Usage:
//   node scripts/gen-unicode-data.mjs                     # Unicode 17.0.0
//   node scripts/gen-unicode-data.mjs --unicode-version=16.0.0
//   node scripts/gen-unicode-data.mjs --force              # re-download
//
// See TODO.unify/12-ucd-xml-pipeline.md for the spec.

import { spawnSync } from 'node:child_process'
import { createWriteStream, existsSync, mkdirSync, readdirSync, readFileSync, renameSync, rmSync, writeFileSync } from 'node:fs'
import { dirname, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'
import { Readable } from 'node:stream'
import { pipeline } from 'node:stream/promises'

import {
  parseUcdXml,
  mapChar,
  groupCharsByBlock,
  buildIndexes,
  stableStringify,
} from './lib/ucd-xml.ts'

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..')
const pub = resolve(root, 'public')
const vendor = resolve(root, 'vendor/ucd')

const DEFAULT_VERSION = '17.0.0'

function parseArgs(argv) {
  const opts = { version: DEFAULT_VERSION, force: false, clean: true }
  for (const arg of argv.slice(2)) {
    if (arg.startsWith('--unicode-version=')) {
      opts.version = arg.slice('--unicode-version='.length)
    } else if (arg === '--force') {
      opts.force = true
    } else if (arg === '--no-clean') {
      opts.clean = false
    } else if (arg === '-h' || arg === '--help') {
      console.log(`Usage: gen-unicode-data.mjs [--unicode-version=X.Y.Z] [--force] [--no-clean]
Default version: ${DEFAULT_VERSION}
Default behavior: removes stale block files not in the new output set.`)
      process.exit(0)
    } else {
      console.error(`Unknown option: ${arg}`)
      process.exit(1)
    }
  }
  return opts
}

function log(msg) {
  process.stdout.write(`[1;34municode:[0m ${msg}\n`)
}

function blockSlug(name) {
  return name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '')
}

// Filename for property detail files must match what the runtime fetches.
// PropertyListPage links `/unicode/scripts/${value}` and PropertyDetailPage
// fetches `unicode/indexes/scripts/${valueParam}.json` — so the filename
// is the property value verbatim when it's filename-safe; otherwise slugged.
function propertyFileName(key) {
  return /^[A-Za-z0-9_-]+$/.test(key) ? key : blockSlug(key) || 'empty'
}

async function downloadZip(url, destPath) {
  log(`downloading ${url}`)
  const res = await fetch(url)
  if (!res.ok) throw new Error(`HTTP ${res.status} ${res.statusText} fetching ${url}`)
  const total = Number(res.headers.get('content-length') ?? 0)
  let seen = 0
  let lastReport = 0
  mkdirSync(dirname(destPath), { recursive: true })
  const tmp = `${destPath}.tmp`
  await pipeline(
    Readable.fromWeb(res.body),
    async function* (source) {
      for await (const chunk of source) {
        seen += chunk.length
        if (total && seen - lastReport >= 5 * 1048576) {
          const pct = Math.floor((seen / total) * 100)
          process.stdout.write(`\r\x1b[1;34municode:\x1b[0m ${pct}% (${(seen / 1048576).toFixed(1)} MB)`)
          lastReport = seen
        }
        yield chunk
      }
      if (lastReport > 0) process.stdout.write('\n')
    },
    createWriteStream(tmp),
  )
  renameSync(tmp, destPath)
}

function extractXml(zipPath, xmlPath) {
  log(`extracting ${zipPath} → ${xmlPath}`)
  mkdirSync(dirname(xmlPath), { recursive: true })
  // ucd.all.flat.zip contains a single entry: ucd.all.flat.xml.
  // `unzip` is universally available on macOS and Linux CI runners; for
  // other platforms, install Info-ZIP or use `python -m zipfile`.
  const result = spawnSync('unzip', ['-o', zipPath, '-d', dirname(xmlPath)], {
    stdio: ['ignore', 'pipe', 'pipe'],
  })
  if (result.status !== 0) {
    const err = result.stderr?.toString() ?? ''
    throw new Error(`unzip failed (status ${result.status}): ${err}. Install Info-ZIP or run manually.`)
  }
  // The member is named ucd.all.flat.xml; the caller named our xmlPath after
  // the version. Rename to match the expected target.
  const extractedMember = resolve(dirname(xmlPath), 'ucd.all.flat.xml')
  if (extractedMember !== xmlPath) {
    renameSync(extractedMember, xmlPath)
  }
}

function writeJsonAtomic(path, value) {
  const tmp = `${path}.tmp`
  writeFileSync(tmp, stableStringify(value))
  renameSync(tmp, path)
}

// Preserve existing per-block `unicode_version` field when the block was
// already known. New blocks get the global UCD version being processed.
function buildBlocksFile(blocks, existingByName, currentVersion) {
  return blocks.map((b) => ({
    start: b.start,
    end: b.end,
    name: b.name,
    unicode_version: existingByName.get(b.name) ?? currentVersion,
  }))
}

function writeBlockFiles(blockFiles, blocksDir) {
  const writtenSlugs = new Set()
  for (const bf of blockFiles) {
    const slug = blockSlug(bf.name)
    const path = resolve(blocksDir, `${slug}.json`)
    writeJsonAtomic(path, bf)
    writtenSlugs.add(slug)
  }
  return writtenSlugs
}

// Remove block files that no longer correspond to any block in the new
// output. Logs each removed file. Idempotent: re-running with the same
// Unicode version produces no removals.
function cleanStaleBlockFiles(blocksDir, keepSlugs) {
  let removed = 0
  for (const fn of readdirSync(blocksDir)) {
    if (!fn.endsWith('.json')) continue
    const slug = fn.slice(0, -5)
    if (!keepSlugs.has(slug)) {
      rmSync(resolve(blocksDir, fn))
      removed++
      log(`removed stale block file: ${fn}`)
    }
  }
  if (removed > 0) log(`removed ${removed} stale block files`)
}

function writePropertyIndexes(indexes, indexesDir) {
  writeJsonAtomic(resolve(indexesDir, 'by-script.json'), indexes.byScript)
  writeJsonAtomic(resolve(indexesDir, 'by-category.json'), indexes.byCategory)
  writeJsonAtomic(resolve(indexesDir, 'by-bidi.json'), indexes.byBidi)
  writeJsonAtomic(resolve(indexesDir, 'by-combining.json'), indexes.byCombining)

  const groups = [
    ['scripts', indexes.perScript],
    ['category', indexes.perCategory],
    ['bidiclass', indexes.perBidi],
    ['combining', indexes.perCombining],
  ]
  const writtenKeysByDir = new Map()
  for (const [dirName, map] of groups) {
    const dir = resolve(indexesDir, dirName)
    mkdirSync(dir, { recursive: true })
    const written = new Set()
    for (const [key, detail] of map.entries()) {
      const fn = `${propertyFileName(key)}.json`
      const path = resolve(dir, fn)
      writeJsonAtomic(path, detail)
      written.add(fn)
    }
    writtenKeysByDir.set(dirName, written)
  }
  return writtenKeysByDir
}

function cleanStaleIndexFiles(indexesDir, writtenKeysByDir) {
  let removed = 0
  for (const [dirName, keepNames] of writtenKeysByDir) {
    const dir = resolve(indexesDir, dirName)
    if (!existsSync(dir)) continue
    for (const fn of readdirSync(dir)) {
      if (!fn.endsWith('.json')) continue
      if (!keepNames.has(fn)) {
        rmSync(resolve(dir, fn))
        removed++
      }
    }
  }
  if (removed > 0) log(`removed ${removed} stale property-index files`)
}

function writeVersionManifest(path, version, charCount, blockCount) {
  writeJsonAtomic(path, {
    version,
    generatedAt: new Date().toISOString(),
    charCount,
    blockCount,
  })
}

async function main() {
  const opts = parseArgs(process.argv)
  const { version } = opts

  const zipUrl = `https://www.unicode.org/Public/${version}/ucdxml/ucd.all.flat.zip`
  const zipPath = resolve(vendor, `ucd-${version}.flat.zip`)
  const xmlPath = resolve(vendor, `ucd-${version}.flat.xml`)

  mkdirSync(vendor, { recursive: true })

  if (!existsSync(zipPath) || opts.force) {
    await downloadZip(zipUrl, zipPath)
  } else {
    log(`using cached ${zipPath}`)
  }
  if (!existsSync(xmlPath) || opts.force) {
    await extractXml(zipPath, xmlPath)
  } else {
    log(`using cached ${xmlPath}`)
  }

  log('parsing XML')
  const xmlText = readFileSync(xmlPath, 'utf8')
  const { blocks, chars } = parseUcdXml(xmlText)
  log(`parsed ${blocks.length} blocks, ${chars.length} raw char records`)

  const records = chars.map(mapChar).filter((c) => c !== null)
  log(`mapped to ${records.length} output records (excluded Cn/Cs/Co)`)

  const blockFiles = groupCharsByBlock(records, blocks)
  log(`grouped into ${blockFiles.length} non-empty block files`)

  const indexes = buildIndexes(chars, blocks)
  log(`built property indexes`)

  // Read existing unicode-blocks.json to preserve per-block introduction versions.
  const existingPath = resolve(pub, 'unicode-blocks.json')
  let existingByName = new Map()
  if (existsSync(existingPath)) {
    const existing = JSON.parse(readFileSync(existingPath, 'utf8'))
    existingByName = new Map(existing.map((b) => [b.name, b.unicode_version]))
  }

  const blocksOut = buildBlocksFile(blocks, existingByName, version)
  const blocksDir = resolve(pub, 'unicode/blocks')
  const indexesDir = resolve(pub, 'unicode/indexes')
  mkdirSync(blocksDir, { recursive: true })
  mkdirSync(indexesDir, { recursive: true })

  log(`writing ${blocksOut.length} entries → unicode-blocks.json`)
  writeJsonAtomic(existingPath, blocksOut)

  log(`writing ${blockFiles.length} block files → unicode/blocks/`)
  const writtenSlugs = writeBlockFiles(blockFiles, blocksDir)
  if (opts.clean) cleanStaleBlockFiles(blocksDir, writtenSlugs)

  log('writing property indexes')
  const writtenKeysByDir = writePropertyIndexes(indexes, indexesDir)
  if (opts.clean) cleanStaleIndexFiles(indexesDir, writtenKeysByDir)

  const versionPath = resolve(pub, 'unicode-version.json')
  writeVersionManifest(versionPath, version, records.length, blocksOut.length)
  log(`wrote manifest → unicode-version.json (version ${version}, ${records.length} chars)`)
}

main().catch((err) => {
  console.error(err)
  process.exit(1)
})
