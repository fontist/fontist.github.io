import type { FontsRegistry, FontMetadataFile } from '../types/domain.ts'
import { createLazyJsonLoader } from '../loader-factory.ts'

const fontsRegistryLoader = createLazyJsonLoader<FontsRegistry>('fonts.json')
const fontMetadataLoader = createLazyJsonLoader<FontMetadataFile>('font-metadata.json')

export function loadFontsRegistry(): Promise<FontsRegistry> {
  return fontsRegistryLoader.load()
}

export function loadFontMetadata(): Promise<FontMetadataFile> {
  return fontMetadataLoader.load()
}
