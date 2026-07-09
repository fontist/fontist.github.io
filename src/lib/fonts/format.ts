export function fontFormatForPath(fontPath: string): string {
  if (fontPath.endsWith('.woff2')) return 'woff2'
  if (fontPath.endsWith('.woff')) return 'woff'
  if (fontPath.endsWith('.ttf')) return 'truetype'
  if (fontPath.endsWith('.otf')) return 'opentype'
  return 'woff'
}
