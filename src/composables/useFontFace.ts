const injectedFonts = new Set<string>()

const isSSR = import.meta.env.SSR

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
    const style = document.createElement('style')
    style.id = styleId
    style.textContent =
      `@font-face{font-family:'${fontId}';` +
      `src:url('${basePath}${fontPath}') format('woff');` +
      `font-weight:100 900;font-display:swap;}`
    document.head.appendChild(style)
    injectedFonts.add(slug)
    return true
  }

  return { fontId, ensureInjected }
}
