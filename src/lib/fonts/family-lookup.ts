import type { FontFamily, FontFamilyFile, FontFamilyIndex } from '../types/domain.ts'

export type { FontFamily, FontFamilyFile, FontFamilyIndex }

export interface FamilyFileEntry {
  family: FontFamily
  file: FontFamilyFile
}

export interface FamilyLookup {
  bySlug(slug: string): FontFamily | null
  byFile(fileSlug: string): FontFamily | null
  byFormula(formulaSlug: string): FontFamily | null
  filesBySlug(fileSlug: string): FamilyFileEntry[]
}

export function buildFamilyLookup(index: FontFamilyIndex): FamilyLookup {
  const bySlug = new Map<string, FontFamily>()
  const byFileSlug = new Map<string, FontFamily>()
  const byFormulaSlug = new Map<string, FontFamily>()
  const byFileSlugMulti = new Map<string, FamilyFileEntry[]>()
  for (const f of index.families) {
    bySlug.set(f.slug, f)
    for (const file of f.files) {
      if (!byFileSlug.has(file.slug)) byFileSlug.set(file.slug, f)
      let entries = byFileSlugMulti.get(file.slug)
      if (!entries) {
        entries = []
        byFileSlugMulti.set(file.slug, entries)
      }
      entries.push({ family: f, file })
    }
    for (const fs of f.formula_slugs) {
      if (!byFormulaSlug.has(fs)) byFormulaSlug.set(fs, f)
    }
  }
  return {
    bySlug: slug => bySlug.get(slug) ?? null,
    byFile: fileSlug => byFileSlug.get(fileSlug) ?? null,
    byFormula: formulaSlug => byFormulaSlug.get(formulaSlug) ?? null,
    filesBySlug: fileSlug => byFileSlugMulti.get(fileSlug) ?? [],
  }
}
