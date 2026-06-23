import { fetchJson } from '../lib/ssr-fetch'

const cache = new Map<string, unknown>()

export async function fetchCoverage(slug: string) {
  if (cache.has(slug)) return cache.get(slug)
  try {
    const data = await fetchJson<unknown>(`coverage/${slug}.json`)
    cache.set(slug, data)
    return data
  } catch {
    return null
  }
}
