#!/usr/bin/env node
// Builds public/font-families.json — the reverse index from FontFamily to
// every Formula that provides it. Implements Phase 2 of
// TODO.unify/13-font-formula-page-architecture.md.
//
// Reads (all produced upstream by scripts/fetch-data.sh):
//   public/fonts.json            — family-level registry (canonical_name → formulas[])
//   vendor/metadata/**/*.json    — per-style, version-aware face metadata
//                                  (metadata/{formula_slug}/{PSName}.json), one
//                                  file per face; carries formula_slug, style,
//                                  version, coverage_file, woff_file, …
//   vendor/archive-manifest.txt  — repo-relative paths actually PUBLISHED to
//                                  archive-public (coverage/ + woff/); used to
//                                  verify a face's assets exist on the CDN
//   public/formulas-data.json    — per-formula records (license info etc.)
//
// Writes:
//   public/font-families.json    — see FontFamilyIndex in src/lib/types/domain.ts
//
// Per-style files are the source of truth (Ronald's "font style version aware"
// design): each face is its own file with an exact formula_slug, so matching is
// exact (no provider-namespace guessing) and coverage_file/woff_file are
// verified against the published manifest by EXACT path — a face only keeps an
// asset the CDN actually serves. Reads are batched (BATCH open FDs at a time) so
// the ~16k-file read never exhausts descriptors during the build.
//
// Run via `npm run gen-font-families` or as part of `scripts/fetch-data.sh`.

import { readFileSync, writeFileSync } from 'node:fs'
import { readdir, readFile } from 'node:fs/promises'
import { resolve, dirname, basename } from 'node:path'
import { fileURLToPath } from 'node:url'

// Cap simultaneously-open file descriptors. 16k unbounded reads (Promise.all
// over every file) is what exhausted the descriptor table (EMFILE); batching
// keeps at most this many open at once.
const READ_BATCH = 256

// publishedPaths: a Set of repo-relative paths present in archive-public, or
// null to skip verification (paths pass through — used by unit tests).
export function buildFamilyIndex({ fonts, metadata, formulas, publishedPaths = null }) {
  const formulaBySlug = new Map()
  for (const f of formulas || []) {
    if (f.slug) formulaBySlug.set(f.slug, f)
  }

  const metaFonts = metadata?.fonts || []
  const titleCase = (s) =>
    s.split('_').map((w) => w.charAt(0).toUpperCase() + w.slice(1)).join(' ')

  // Keep an asset path only if it is actually published to archive-public (the
  // CDN source). macOS woff, for one, is built privately but never published,
  // so its per-style woff_file must resolve to null rather than a 404.
  const publish = (p) => (p && (!publishedPaths || publishedPaths.has(p)) ? p : null)

  function filesForFamilyEntry(entry) {
    const out = []
    // A face's true identity within a family is (formula_slug, PostScript name)
    // — the per-style file's own key. Deduping on (slug, formula_slug) instead
    // would wrongly collapse DISTINCT faces that slugify identically (e.g.
    // Hasklig's six regular-weight PS faces all slugify to `hasklig`). ps falls
    // back to slug for the aggregate-shape unit-test fixtures.
    const seen = new Set()
    const familySlugPrefix = entry.slug + '_'
    for (const formulaSlug of entry.formulas) {
      let matched = false
      for (const m of metaFonts) {
        // Family membership: the face slug is the family slug (Regular) or
        // begins with it (styled). styleSuffix is the fallback style label.
        const styleSuffix =
          m.slug === entry.slug
            ? ''
            : m.slug.startsWith(familySlugPrefix)
              ? m.slug.slice(familySlugPrefix.length)
              : null
        if (styleSuffix === null) continue

        // Formula membership: per-style files carry an EXACT formula_slug;
        // fall back to deriving it from formula_path if a face lacks one.
        const mFormulaSlug =
          m.formula_slug ??
          (m.formula_path || '').replace(/^Formulas\//, '').replace(/\.yml$/, '')
        if (mFormulaSlug !== formulaSlug) continue

        const ps = m.ps ?? m.slug
        const fileKey = formulaSlug + '|' + ps
        if (seen.has(fileKey)) { matched = true; continue }
        seen.add(fileKey)

        out.push({
          slug: m.slug,
          ps,
          formula_slug: formulaSlug,
          style: m.style || (styleSuffix === '' ? 'Regular' : titleCase(styleSuffix)),
          path: publish(m.woff_file),
          coverage_file: publish(m.coverage_file),
          redistributable: !!m.redistributable,
          version: m.version || null,
          font_revision: m.font_revision ?? null,
        })
        matched = true
      }
      if (!matched) {
        out.push({
          slug: entry.slug,
          ps: entry.slug,
          formula_slug: formulaSlug,
          style: 'Regular',
          path: null,
          coverage_file: null,
          redistributable: false,
          version: null,
          font_revision: null,
        })
      }
    }
    return out
  }

  function buildFamily(entry) {
    const files = filesForFamilyEntry(entry)
    const firstFormula = formulaBySlug.get(entry.formulas[0])
    const licenseName = firstFormula?.licenseName || 'Unknown'
    const redistributable = files.some(f => f.redistributable)
    return {
      slug: entry.slug,
      name: entry.canonical_name,
      formula_slugs: entry.formulas,
      style_count: entry.style_count,
      redistributable,
      license_name: licenseName,
      files,
    }
  }

  const families = (fonts?.fonts || [])
    .map(buildFamily)
    .filter(f => f.formula_slugs.length > 0)

  return {
    generated_at: new Date().toISOString(),
    total_families: families.length,
    families,
  }
}

// Recursively list every *.json under dir (metadata/{formula_slug}/{PS}.json,
// where formula_slug itself contains a "/"). Missing dir → [].
async function listJsonFiles(dir) {
  const out = []
  async function walk(d) {
    let entries
    try {
      entries = await readdir(d, { withFileTypes: true })
    } catch {
      return
    }
    for (const e of entries) {
      const p = resolve(d, e.name)
      if (e.isDirectory()) await walk(p)
      else if (e.name.endsWith('.json')) out.push(p)
    }
  }
  await walk(dir)
  return out
}

// Read every per-style file with bounded concurrency. A malformed file is
// skipped (null), not fatal — one bad face must not sink the whole index.
async function readPerStyleMetadata(dir) {
  const files = await listJsonFiles(dir)
  const faces = []
  for (let i = 0; i < files.length; i += READ_BATCH) {
    const batch = files.slice(i, i + READ_BATCH)
    const parsed = await Promise.all(
      batch.map(f =>
        readFile(f, 'utf8')
          .then(txt => {
            const face = JSON.parse(txt)
            // The file's own PostScript name (metadata/{formula_slug}/{PS}.json)
            // is the face's unique key within its formula.
            face.ps = basename(f, '.json')
            return face
          })
          .catch(() => null),
      ),
    )
    for (const p of parsed) if (p) faces.push(p)
  }
  return faces
}

function readManifestSet(path) {
  try {
    return new Set(
      readFileSync(path, 'utf8').split('\n').map(l => l.trim()).filter(Boolean),
    )
  } catch {
    return null
  }
}

const isMain = import.meta.url === `file://${process.argv[1]}`
if (isMain) {
  const root = resolve(dirname(fileURLToPath(import.meta.url)), '..')
  const pub = resolve(root, 'public')
  const vendor = resolve(root, 'vendor')

  function readJson(path, fallback) {
    try {
      return JSON.parse(readFileSync(path, 'utf8'))
    } catch {
      return fallback
    }
  }

  const fontsRegistry = readJson(resolve(pub, 'fonts.json'), { fonts: [] })
  const formulasData = readJson(resolve(pub, 'formulas-data.json'), [])
  const faces = await readPerStyleMetadata(resolve(vendor, 'metadata'))
  // Fail loud rather than fail open: without a real manifest we cannot tell
  // which assets the CDN actually serves, so we would either ship 404-bound
  // paths (missing manifest → verify skipped) or null every asset (empty
  // manifest). Both are silent corruption of the family index.
  const publishedPaths = readManifestSet(resolve(vendor, 'archive-manifest.txt'))
  if (!publishedPaths || publishedPaths.size === 0) {
    console.error('error: vendor/archive-manifest.txt is missing or empty — run scripts/fetch-data.sh first')
    process.exit(1)
  }
  console.log(`per-style metadata: ${faces.length} faces (${publishedPaths.size} published paths)`)

  const index = buildFamilyIndex({
    fonts: fontsRegistry,
    metadata: { fonts: faces },
    formulas: formulasData,
    publishedPaths,
  })

  const outPath = resolve(pub, 'font-families.json')
  writeFileSync(outPath, JSON.stringify(index, null, 2))
  console.log(`font-families: wrote ${index.families.length} families to ${outPath}`)

  const multiFormula = index.families.filter(f => f.formula_slugs.length > 1).length
  const redistributable = index.families.filter(f => f.redistributable).length
  console.log(`  ${multiFormula} families with multiple providing formulas`)
  console.log(`  ${redistributable} families with at least one redistributable file`)
}
