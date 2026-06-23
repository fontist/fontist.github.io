const injectedFonts = new Set<string>()

export function injectFontFace(slug: string, woff2Path: string, redistributable: boolean) {
  const fontId = `ff-${slug.replace(/[^a-z0-9]/gi, '-')}`
  const styleId = `ff-style-${fontId}`
  const basePath = import.meta.env.BASE_URL || '/'

  function ensureInjected(): boolean {
    if (!redistributable || !woff2Path) return false
    if (injectedFonts.has(slug)) return true
    if (document.getElementById(styleId)) {
      injectedFonts.add(slug)
      return true
    }
    const style = document.createElement('style')
    style.id = styleId
    style.textContent =
      `@font-face{font-family:'${fontId}';` +
      `src:url('${basePath}${woff2Path}') format('woff2');` +
      `font-weight:100 900;font-display:swap;}`
    document.head.appendChild(style)
    injectedFonts.add(slug)
    return true
  }

  return { fontId, ensureInjected }
}
