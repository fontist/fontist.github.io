import { fetchJson } from '../ssr-fetch.ts'
import type { FontFamily, FontFamilyFile, FontFamilyIndex } from '../types/domain'
import { buildFamilyLookup, type FamilyFileEntry, type FamilyLookup } from './family-lookup.ts'
import { createLazyJsonLoader } from '../loader-factory.ts'

export type { FontFamily, FontFamilyFile, FontFamilyIndex, FamilyFileEntry, FamilyLookup }
export { buildFamilyLookup }

// Single cached load of font-families.json + the derived lookup tables.
// Previously hand-rolled with `let cache: FontFamilyIndex | null = null`;
// now goes through createLazyJsonLoader (see loader-factory.ts).

const indexLoader = createLazyJsonLoader<FontFamilyIndex>('font-families.json')
let lookup: FamilyLookup | null = null

export async function loadFontFamilies(): Promise<FontFamilyIndex> {
  const idx = await indexLoader.load()
  if (!lookup) lookup = buildFamilyLookup(idx)
  return idx
}

export async function loadFontFamily(slug: string): Promise<FontFamily | null> {
  await loadFontFamilies()
  return lookup!.bySlug(slug)
}

export async function findFamilyByFile(fileSlug: string): Promise<FontFamily | null> {
  await loadFontFamilies()
  return lookup!.byFile(fileSlug)
}

export async function findFamilyByFormula(formulaSlug: string): Promise<FontFamily | null> {
  await loadFontFamilies()
  return lookup!.byFormula(formulaSlug)
}

export async function findFilesBySlug(fileSlug: string): Promise<FamilyFileEntry[]> {
  await loadFontFamilies()
  return lookup!.filesBySlug(fileSlug)
}

export function clearFontFamiliesCache(): void {
  indexLoader.clear()
  lookup = null
}
