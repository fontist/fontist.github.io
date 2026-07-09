#!/usr/bin/env node
// Builds public/font-families.json — the reverse index from FontFamily to
// every Formula that provides it. Implements Phase 2 of
// TODO.unify/13-font-formula-page-architecture.md.
//
// Reads (all produced upstream by scripts/fetch-data.sh):
//   public/fonts.json           — family-level registry (canonical_name → formulas[])
//   public/font-metadata.json   — per-file metadata (slug, formula_path, woff_file, ...)
//   public/formulas-data.json   — per-formula records (license info etc.)
//
// Writes:
//   public/font-families.json   — see FontFamilyIndex in src/lib/types/domain.ts
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
  const metaData = { fonts: metadata?.fonts || [] }

  function filesForFamilyEntry(entry) {
    const out = []
    for (const formulaSlug of entry.formulas) {
      const familySlugPrefix = entry.slug + '_'
      let matched = false
      for (const m of metaData.fonts) {
        const styleSuffix = m.slug === entry.slug
          ? ''
          : m.slug.startsWith(familySlugPrefix)
            ? m.slug.slice(familySlugPrefix.length)
            : null
        if (styleSuffix === null) continue
        const metaNamespace = (m.formula_path || '').split('/')[1]
        const familyNamespace = formulaSlug.split('/')[0]
        if (metaNamespace !== familyNamespace) continue

        out.push({
          slug: m.slug,
          formula_slug: formulaSlug,
          style:
            styleSuffix === ''
              ? 'Regular'
              : styleSuffix
                  .split('_')
                  .map(word => word.charAt(0).toUpperCase() + word.slice(1))
                  .join(' '),
          path: m.woff_file || null,
          coverage_file: m.coverage_file || null,
          redistributable: !!m.redistributable,
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
  const metaData = readJson(resolve(pub, 'font-metadata.json'), { fonts: [] })
  const formulasData = readJson(resolve(pub, 'formulas-data.json'), [])

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
