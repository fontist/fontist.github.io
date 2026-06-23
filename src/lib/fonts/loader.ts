import { fetchJson } from '../ssr-fetch'

export interface FontEntry {
  canonical_name: string
  slug: string
  formulas: string[]
  style_count: number
}

export interface FontMetadataEntry {
  slug: string
  formula_path: string
  redistributable: boolean
  primary_family: string | null
  coverage_file: string
  woff2_file: string
}

export interface FontsRegistry {
  generated_at: string
  total_fonts: number
  total_formulas: number
  fonts: FontEntry[]
}

export interface FontMetadataFile {
  generated_at: string
  total_fonts: number
  redistributable: number
  fonts: FontMetadataEntry[]
}

let fontsCache: FontsRegistry | null = null
let metadataCache: FontMetadataFile | null = null

export async function loadFontsRegistry(): Promise<FontsRegistry> {
  if (fontsCache) return fontsCache
  fontsCache = await fetchJson<FontsRegistry>('fonts.json')
  return fontsCache
}

export async function loadFontMetadata(): Promise<FontMetadataFile> {
  if (metadataCache) return metadataCache
  metadataCache = await fetchJson<FontMetadataFile>('font-metadata.json')
  return metadataCache
}
