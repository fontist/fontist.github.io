#!/usr/bin/env node
// Builds public/font-families.json — the reverse index from FontFamily to
// every Formula that provides it. Implements Phase 2 of
// TODO.unify/13-font-formula-page-architecture.md.
//
// Reads (all produced upstream by scripts/fetch-data.sh):
//   public/fonts.json           — family-level registry (canonical_name → formulas[])
//   public/font-metadata.json   — per-face registry, the version-enriched
//                                 aggregate (each face carries version /
//                                 font_revision, added by RegistryBuilder in
//                                 fontist-archive-private)
//   public/formulas-data.json   — per-formula records (license info etc.)
//
// Writes:
//   public/font-families.json   — see FontFamilyIndex in src/lib/types/domain.ts
//
// The site consumes the aggregate, not the ~16k per-style files that
// archive-private keeps as its build cache: reading that many files at build
// time exhausted file descriptors (EMFILE). buildFamilyIndex matches faces to
// formulas by provider namespace (formula_path) and carries `version` through
// to the family index.
//
// Run via `npm run gen-font-families` or as part of `scripts/fetch-data.sh`.

import { readFileSync, writeFileSync } from 'node:fs'
import { resolve, dirname } from 'node:path'
import { fileURLToPath } from 'node:url'

export function buildFamilyIndex({ fonts, metadata, formulas }) {
  const formulaBySlug = new Map()
  for (const f of formulas || []) {
    if (f.slug) formulaBySlug.set(f.slug, f)
  }

  const metaFonts = metadata?.fonts || []
  const titleCase = (s) =>
    s.split('_').map((w) => w.charAt(0).toUpperCase() + w.slice(1)).join(' ')

  function filesForFamilyEntry(entry) {
    const out = []
    // (slug, formula_slug) is a file's identity in the family. The aggregate can
    // carry duplicate face entries for one formula; collapse them so the index
    // (and the UI keying off it) never sees two identical files.
    const seen = new Set()
    const familySlugPrefix = entry.slug + '_'
    for (const formulaSlug of entry.formulas) {
      let matched = false
      for (const m of metaFonts) {
        // Family membership: the face slug is the family slug (Regular) or
        // begins with it (styled). styleSuffix drives the style label.
        const styleSuffix =
          m.slug === entry.slug
            ? ''
            : m.slug.startsWith(familySlugPrefix)
              ? m.slug.slice(familySlugPrefix.length)
              : null
        if (styleSuffix === null) continue

        // Formula membership: derive the face's formula slug from its
        // formula_path ("Formulas/sil/padauk_6.000.yml" → "sil/padauk_6.000")
        // and match it EXACTLY. Matching only the provider namespace
        // misattributes faces between same-provider formulas — e.g. Padauk
        // lists both sil/padauk and sil/padauk_6.000, and a face from either
        // would otherwise be emitted under both.
        const metaFormulaSlug = (m.formula_path || '')
          .replace(/^Formulas\//, '')
          .replace(/\.yml$/, '')
        if (metaFormulaSlug !== formulaSlug) continue

        const fileId = m.slug + '|' + formulaSlug
        if (seen.has(fileId)) { matched = true; continue }
        seen.add(fileId)

        out.push({
          slug: m.slug,
          formula_slug: formulaSlug,
          style: styleSuffix === '' ? 'Regular' : titleCase(styleSuffix),
          path: m.woff_file || null,
          coverage_file: m.coverage_file || null,
          redistributable: !!m.redistributable,
          version: m.version || null,
          font_revision: m.font_revision ?? null,
        })
        matched = true
      }
      if (!matched) {
        out.push({
          slug: entry.slug,
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

const isMain = import.meta.url === `file://${process.argv[1]}`
if (isMain) {
  const root = resolve(dirname(fileURLToPath(import.meta.url)), '..')
  const pub = resolve(root, 'public')

  function readJson(path, fallback) {
    try {
      return JSON.parse(readFileSync(path, 'utf8'))
    } catch {
      return fallback
    }
  }

  const fontsRegistry = readJson(resolve(pub, 'fonts.json'), { fonts: [] })
  const formulasData = readJson(resolve(pub, 'formulas-data.json'), [])
  // font-metadata.json is the aggregate (derived from the per-style cache in
  // archive-private); it now carries `version`/`font_revision` per face.
  const metaData = readJson(resolve(pub, 'font-metadata.json'), { fonts: [] })
  console.log(`font-metadata: ${(metaData.fonts || []).length} faces`)

  const index = buildFamilyIndex({
    fonts: fontsRegistry,
    metadata: metaData,
    formulas: formulasData,
  })

  const outPath = resolve(pub, 'font-families.json')
  writeFileSync(outPath, JSON.stringify(index, null, 2))
  console.log(`font-families: wrote ${index.families.length} families to ${outPath}`)

  const multiFormula = index.families.filter(f => f.formula_slugs.length > 1).length
  const redistributable = index.families.filter(f => f.redistributable).length
  console.log(`  ${multiFormula} families with multiple providing formulas`)
  console.log(`  ${redistributable} families with at least one redistributable file`)
}
