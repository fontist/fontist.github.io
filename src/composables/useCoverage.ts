const cache = new Map<string, unknown>()

export async function fetchCoverage(slug: string) {
  if (cache.has(slug)) return cache.get(slug)
  const basePath = import.meta.env.BASE_URL || '/'
  try {
    const res = await globalThis.fetch(`${basePath}coverage/${slug}.json`)
    if (!res.ok) return null
    const data = await res.json()
    cache.set(slug, data)
    return data
  } catch {
    return null
  }
}
