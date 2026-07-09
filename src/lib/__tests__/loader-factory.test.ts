import { describe, it, beforeEach } from 'node:test'
import assert from 'node:assert/strict'
import {
  createLazyJsonLoader,
  createKeyedJsonLoader,
  type JsonFetcher,
} from '../loader-factory.ts'

// Factory tests use only injected fetchers — no disk I/O, no ssr-fetch
// import triggered. Each fetcher records what it was called with so we
// can assert cache behavior on hits and misses.

function makeRecorder<T>(files: Record<string, T>): JsonFetcher<T> & { calls: string[] } {
  const calls: string[] = []
  const fn = (async (path: string) => {
    calls.push(path)
    if (!(path in files)) throw new Error(`404: ${path}`)
    return files[path]
  }) as JsonFetcher<T> & { calls: string[] }
  fn.calls = calls
  return fn
}

describe('createLazyJsonLoader', () => {
  it('loads the payload via the fetcher on the first call', async () => {
    const fetcher = makeRecorder({ 'data.json': { value: 42 } })
    const loader = createLazyJsonLoader<{ value: number }>('data.json', fetcher)
    const result = await loader.load()
    assert.equal(result.value, 42)
    assert.deepEqual(fetcher.calls, ['data.json'])
  })

  it('returns the cached payload on subsequent calls without re-fetching', async () => {
    const fetcher = makeRecorder({ 'data.json': { value: 42 } })
    const loader = createLazyJsonLoader<{ value: number }>('data.json', fetcher)
    await loader.load()
    await loader.load()
    await loader.load()
    assert.equal(fetcher.calls.length, 1)
  })

  it('clear() forces the next load to re-fetch', async () => {
    const fetcher = makeRecorder({ 'data.json': { value: 42 } })
    const loader = createLazyJsonLoader<{ value: number }>('data.json', fetcher)
    await loader.load()
    loader.clear()
    await loader.load()
    assert.equal(fetcher.calls.length, 2)
  })

  it('propagates fetch errors (does not memoize failures)', async () => {
    let calls = 0
    const fetcher: JsonFetcher<unknown> = async () => {
      calls++
      throw new Error('upstream down')
    }
    const loader = createLazyJsonLoader('any.json', fetcher)
    await assert.rejects(() => loader.load(), /upstream down/)
    await assert.rejects(() => loader.load(), /upstream down/)
    assert.equal(calls, 2, 'failed loads must not be cached')
  })

  it('returns the same object reference across calls (no copy)', async () => {
    const payload = { items: [1, 2, 3] }
    const loader = createLazyJsonLoader('p.json', async () => payload)
    const first = await loader.load()
    const second = await loader.load()
    assert.equal(first, second)
  })
})

describe('createKeyedJsonLoader', () => {
  let originalWarn: typeof console.warn

  beforeEach(() => {
    originalWarn = console.warn
  })

  it('returns the payload for the key the fetcher resolved', async () => {
    const fetcher = makeRecorder({ 'codepoints/20ac.json': { id: 'U+20AC' } })
    const loader = createKeyedJsonLoader<{ id: string }>(
      (key) => `codepoints/${key}.json`,
      fetcher,
    )
    const result = await loader.load('20ac')
    assert.equal(result?.id, 'U+20AC')
    assert.deepEqual(fetcher.calls, ['codepoints/20ac.json'])
  })

  it('caches each key independently', async () => {
    const fetcher = makeRecorder({
      'a.json': { v: 'a' },
      'b.json': { v: 'b' },
    })
    const loader = createKeyedJsonLoader<{ v: string }>((k) => `${k}.json`, fetcher)
    await loader.load('a')
    await loader.load('b')
    await loader.load('a')
    await loader.load('b')
    assert.equal(fetcher.calls.length, 2)
  })

  it('caches null on fetch failure so missing keys do not refetch', async () => {
    let calls = 0
    const fetcher: JsonFetcher<unknown> = async () => {
      calls++
      throw new Error('404')
    }
    const loader = createKeyedJsonLoader((k) => `${k}.json`, fetcher)
    const first = await loader.load('missing')
    const second = await loader.load('missing')
    assert.equal(first, null)
    assert.equal(second, null)
    assert.equal(calls, 1, 'second call must hit the null cache')
  })

  it('a null-cached key does not poison a different key', async () => {
    const fetcher = makeRecorder<{ v: string }>({ 'good.json': { v: 'g' } })
    const loader = createKeyedJsonLoader<{ v: string }>((k) => `${k}.json`, fetcher)
    await loader.load('missing')
    const result = await loader.load('good')
    assert.equal(result?.v, 'g')
  })

  it('clear() empties both value and null caches', async () => {
    const fetcher = makeRecorder<{ v: string }>({ 'good.json': { v: 'g' } })
    const loader = createKeyedJsonLoader<{ v: string }>((k) => `${k}.json`, fetcher)
    await loader.load('missing')
    await loader.load('good')
    assert.equal(fetcher.calls.length, 2)

    loader.clear()
    await loader.load('good')
    assert.equal(fetcher.calls.length, 3, 'good must re-fetch after clear')
  })

  it('per-call fetcher override only fires on a cache miss', async () => {
    const prodFetcher = makeRecorder<{ v: string }>({ 'a.json': { v: 'prod' } })
    const testFetcher = makeRecorder<{ v: string }>({ 'a.json': { v: 'test' } })
    const loader = createKeyedJsonLoader<{ v: string }>((k) => `${k}.json`, prodFetcher)

    const first = await loader.load('a', testFetcher)
    const second = await loader.load('a', prodFetcher)
    assert.equal(first?.v, 'test')
    assert.equal(second?.v, 'test', 'cache hit ignores the override — tests must clear()')

    // Restore console.warn in case assert diagnostics print
    console.warn = originalWarn
  })
})
