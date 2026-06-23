import { fetchJson } from '../lib/ssr-fetch'
import type { Coverage } from '../lib/types/domain'

const cache = new Map<string, Coverage>()

export async function fetchCoverage(slug: string): Promise<Coverage | null> {
  if (cache.has(slug)) return cache.get(slug)!
  try {
    const data = await fetchJson<Coverage>(`coverage/${slug}.json`)
    cache.set(slug, data)
    return data
  } catch {
    return null
  }
}
