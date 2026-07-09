import { describe, it, beforeEach } from 'node:test'
import assert from 'node:assert/strict'
import type { CodepointDetail } from '../../../types/domain.ts'
import {
  loadCodepointDetail,
  clearCodepointDetailCache,
  type CodepointDetailFetcher,
} from '../data/loader.ts'
import { canonicalCodepointHex } from '../constants.ts'

// Build a fetcher from a path → payload map. The cast happens here at the
// test boundary so individual test cases can use minimal payloads — the
// shape is enforced by the production-side type, not by the fake.
function fakeFetcher(files: Record<string, Partial<CodepointDetail>>): CodepointDetailFetcher & { calls: string[] } {
  const calls: string[] = []
  const fn = (async (path: string) => {
    calls.push(path)
    if (!(path in files)) throw new Error(`404: ${path}`)
    return files[path] as CodepointDetail
  }) as CodepointDetailFetcher & { calls: string[] }
  fn.calls = calls
  return fn
}

const euroSign: Partial<CodepointDetail> = {
  codepoint: 0x20AC,
  id: 'U+20AC',
  name: 'EURO SIGN',
  block_id: 'currency-symbols',
}

describe('canonicalCodepointHex', () => {
  it('lowercases and zero-pads bare hex to 4 digits', () => {
    assert.equal(canonicalCodepointHex('20ac'), '20ac')
    assert.equal(canonicalCodepointHex('20AC'), '20ac')
    assert.equal(canonicalCodepointHex('20'), '0020')
    assert.equal(canonicalCodepointHex('1f600'), '1f600')
  })

  it('strips the U+ prefix', () => {
    assert.equal(canonicalCodepointHex('U+20AC'), '20ac')
    assert.equal(canonicalCodepointHex('u+20ac'), '20ac')
    assert.equal(canonicalCodepointHex('U+41'), '0041')
  })

  it('accepts a numeric codepoint', () => {
    assert.equal(canonicalCodepointHex(0x20), '0020')
    assert.equal(canonicalCodepointHex(0x1F600), '1f600')
  })
})

describe('loadCodepointDetail', () => {
  beforeEach(() => clearCodepointDetailCache())

  it('returns the parsed payload for a canonical lowercase hex', async () => {
    const fetcher = fakeFetcher({ 'codepoints/20ac.json': euroSign })
    const detail = await loadCodepointDetail('20ac', fetcher)
    assert.equal(detail?.name, 'EURO SIGN')
    assert.equal(detail?.codepoint, 0x20AC)
  })

  it('accepts the U+XXXX display form', async () => {
    const fetcher = fakeFetcher({ 'codepoints/20ac.json': euroSign })
    const detail = await loadCodepointDetail('U+20AC', fetcher)
    assert.equal(detail?.name, 'EURO SIGN')
  })

  it('normalizes uppercase input to a lowercase path before lookup', async () => {
    const fetcher = fakeFetcher({ 'codepoints/20ac.json': euroSign })
    await loadCodepointDetail('20AC', fetcher)
    assert.deepEqual(fetcher.calls, ['codepoints/20ac.json'])
  })

  it('zero-pads short hex to 4 digits in the path', async () => {
    const fetcher = fakeFetcher({
      'codepoints/0020.json': { codepoint: 0x20, name: 'SPACE' },
    })
    const detail = await loadCodepointDetail('20', fetcher)
    assert.equal(detail?.name, 'SPACE')
    assert.deepEqual(fetcher.calls, ['codepoints/0020.json'])
  })

  it('returns null when the codepoint file is missing', async () => {
    const fetcher = fakeFetcher({})
    const detail = await loadCodepointDetail('99999', fetcher)
    assert.equal(detail, null)
  })

  it('caches null results so a missing codepoint is fetched only once', async () => {
    const fetcher = fakeFetcher({})
    const first = await loadCodepointDetail('99999', fetcher)
    const second = await loadCodepointDetail('99999', fetcher)
    assert.equal(first, null)
    assert.equal(second, null)
    assert.equal(fetcher.calls.length, 1, 'second call must hit the cache')
  })

  it('caches successful results so subsequent calls skip the fetcher', async () => {
    const fetcher = fakeFetcher({ 'codepoints/20ac.json': euroSign })
    const first = await loadCodepointDetail('20ac', fetcher)
    const second = await loadCodepointDetail('20ac', fetcher)
    assert.equal(first?.name, 'EURO SIGN')
    assert.equal(second?.name, 'EURO SIGN')
    assert.equal(fetcher.calls.length, 1)
  })

  it('treats equivalent input forms as the same cache key', async () => {
    const fetcher = fakeFetcher({ 'codepoints/20ac.json': euroSign })
    await loadCodepointDetail('20AC', fetcher)
    await loadCodepointDetail('U+20ac', fetcher)
    await loadCodepointDetail(0x20AC, fetcher)
    assert.equal(fetcher.calls.length, 1)
  })
})
