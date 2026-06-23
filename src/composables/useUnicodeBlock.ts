// Composable: fetches and caches per-block Unicode character data.
// Data comes from unicode.org via vendor/unicode-blocks.json → per-block JSON files.

const cache = new Map()

function blockSlug(blockName) {
  return blockName.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '')
}

export function useUnicodeBlock() {
  const basePath = import.meta.env.BASE_URL || '/'

  async function fetchBlock(blockName) {
    const slug = blockSlug(blockName)
    if (cache.has(slug)) return cache.get(slug)
    try {
      const res = await globalThis.fetch(`${basePath}unicode/blocks/${slug}.json`)
      if (!res.ok) return null
      const data = await res.json()
      cache.set(slug, data)
      return data
    } catch {
      return null
    }
  }

  return { fetchBlock }
}
