import { fetchJson } from '../ssr-fetch'
import type {
  FontEntry,
  FontMetadataEntry,
  FontsRegistry,
  FontMetadataFile,
} from '../types/domain'

export type { FontEntry, FontMetadataEntry, FontsRegistry, FontMetadataFile }

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
