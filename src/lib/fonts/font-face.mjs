// Generate @font-face CSS rules from font metadata at SSG time.
// Used by .astro page wrappers so fonts load immediately on page render.
// The useFontFace composable detects the existing <style> element and
// skips re-injection on the client.

import { fontFormatForPath } from './format.ts'

export function generateFontFaceCSS(slug, fontPath, redistributable, options = {}) {
  if (!redistributable || !fontPath) return null
  const fontId = `ff-${slug.replace(/[^a-z0-9]/gi, '-')}`
  const basePath = options.basePath || '/'
  const format = fontFormatForPath(fontPath)
  return (
    `@font-face{font-family:'${fontId}';` +
    `src:url('${basePath}${fontPath}') format('${format}');` +
    `font-weight:100 900;font-display:swap;}`
  )
}

export function generateFamilyFontFaces(files, options = {}) {
  const rules = []
  for (const file of files) {
    if (!file.redistributable || !file.path) continue
    const css = generateFontFaceCSS(file.slug, file.path, true, options)
    if (css) rules.push(css)
  }
  return rules.join('\n')
}
