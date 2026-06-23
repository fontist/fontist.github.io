import type { FontFamily, FontFamilyIndex } from '../types/domain.ts'

export type { FontFamily, FontFamilyIndex }

export interface FamilyLookup {
  bySlug(slug: string): FontFamily | null
  byFile(fileSlug: string): FontFamily | null
}

export function buildFamilyLookup(index: FontFamilyIndex): FamilyLookup {
  const bySlug = new Map<string, FontFamily>()
  const byFileSlug = new Map<string, FontFamily>()
  for (const f of index.families) {
    bySlug.set(f.slug, f)
    for (const file of f.files) {
      if (!byFileSlug.has(file.slug)) byFileSlug.set(file.slug, f)
    }
  }
  return {
    bySlug: slug => bySlug.get(slug) ?? null,
    byFile: fileSlug => byFileSlug.get(fileSlug) ?? null,
  }
}
