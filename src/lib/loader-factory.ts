// Cached JSON loader factories.
//
// Two cache shapes recur across the codebase:
//   - lazy singleton: one payload per path, returned on every call
//   - keyed cache with null-on-miss: many payloads keyed by string,
//     where a fetch failure is remembered as `null` so a missing file
//     doesn't trigger a refetch on every page render
//
// Both shapes were hand-rolled in every domain (unicode, formulas,
// fonts). This module is the single source of truth for the cache
// policy. New loaders declare which shape they need and pass a path
// (or path-for-key function); the factory owns the cache state.
//
// The default fetcher is the production `fetchJson` from ssr-fetch.
// Tests inject their own fetcher to skip disk I/O — see
// `codepoint-detail-loader.test.ts` for the pattern.

import { fetchJson } from './ssr-fetch.ts'

export type JsonFetcher<T> = (path: string) => Promise<T>

export interface LazyJsonLoader<T> {
  load(): Promise<T>
  clear(): void
}

export interface KeyedJsonLoader<T> {
  load(key: string, fetcher?: JsonFetcher<T>): Promise<T | null>
  clear(): void
}

function defaultFetcher<T>(path: string): Promise<T> {
  return fetchJson<T>(path)
}

export function createLazyJsonLoader<T>(
  path: string,
  fetcher: JsonFetcher<T> = defaultFetcher<T>,
): LazyJsonLoader<T> {
  let cached: T | undefined
  let loaded = false
  return {
    async load() {
      if (loaded) return cached as T
      cached = await fetcher(path)
      loaded = true
      return cached
    },
    clear() {
      cached = undefined
      loaded = false
    },
  }
}

export function createKeyedJsonLoader<T>(
  pathFor: (key: string) => string,
  fetcher: JsonFetcher<T> = defaultFetcher<T>,
): KeyedJsonLoader<T> {
  const cache = new Map<string, T | null>()
  return {
    async load(key, f = fetcher) {
      if (cache.has(key)) return cache.get(key) ?? null
      try {
        const value = await f(pathFor(key))
        cache.set(key, value)
        return value
      } catch {
        cache.set(key, null)
        return null
      }
    },
    clear() {
      cache.clear()
    },
  }
}
