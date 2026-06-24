import { fetchJson } from '../ssr-fetch'
import type { FontFamily, FontFamilyIndex } from '../types/domain'
import { buildFamilyLookup, type FamilyLookup } from './family-lookup'

export type { FontFamily, FontFamilyIndex, FamilyLookup }
export { buildFamilyLookup }

let cache: FontFamilyIndex | null = null
let lookup: FamilyLookup | null = null

export async function loadFontFamilies(): Promise<FontFamilyIndex> {
  if (cache) return cache
  cache = await fetchJson<FontFamilyIndex>('font-families.json')
  lookup = buildFamilyLookup(cache)
  return cache
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
