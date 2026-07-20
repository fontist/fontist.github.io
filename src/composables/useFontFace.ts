import { fontFormatForPath } from '../lib/fonts/format'
import { archiveUrl, isArchivePath } from '../lib/archive-url'

const injectedFonts = new Set<string>()

const isSSR = import.meta.env.SSR

// Three kinds of font path reach this composable:
//   - an already-absolute URL (a caller that resolved the CDN itself)
//   - an archive-relative path ("woff/google/abel/Abel-Regular.woff") which
//     lives in fontist-archive-public and must go to the CDN, not to Pages
//   - a site-local path (the committed Noto fallbacks under public/fonts/)
// Prefixing BASE_URL onto an absolute URL would corrupt it, so check first.
export function resolveFontSrc(fontPath: string, basePath: string): string {
  if (/^(https?:)?\/\//.test(fontPath)) return fontPath
  if (isArchivePath(fontPath)) return archiveUrl(fontPath)
  return `${basePath}${fontPath}`
}

export function injectFontFace(slug: string, fontPath: string, redistributable: boolean) {
  const fontId = `ff-${slug.replace(/[^a-z0-9]/gi, '-')}`
  const styleId = `ff-style-${fontId}`
  const basePath = import.meta.env.BASE_URL || '/'

  function ensureInjected(): boolean {
    if (!redistributable || !fontPath) return false
    if (isSSR) return true
    if (injectedFonts.has(slug)) return true
    if (document.getElementById(styleId)) {
      injectedFonts.add(slug)
      return true
    }
    const format = fontFormatForPath(fontPath)
    const style = document.createElement('style')
    style.id = styleId
    style.textContent =
      `@font-face{font-family:'${fontId}';` +
      `src:url('${resolveFontSrc(fontPath, basePath)}') format('${format}');` +
      `font-weight:100 900;font-display:swap;}`
    document.head.appendChild(style)
    injectedFonts.add(slug)
    return true
  }

  return { fontId, ensureInjected }
}
