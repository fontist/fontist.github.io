import { describe, it, expect, vi, beforeEach } from 'vitest'

// Pure logic — format, frontmatter parser
import { fontFormatForPath } from '../../src/lib/fonts/format'
import { parseFrontmatter } from '../../src/lib/markdown/frontmatter.mjs'

// Loader factory with injected fetchers (no disk I/O)
import {
  createLazyJsonLoader,
  createKeyedJsonLoader,
} from '../../src/lib/loader-factory'

// Domain loaders — tested via factory injection
import { findFormula } from '../../src/lib/formulas/loader'
import {
  findFormulaDetails,
  clearDetailsCache,
} from '../../src/lib/formulas/details-loader'

describe('fonts/format — fontFormatForPath', () => {
  it('detects woff2', () => {
    expect(fontFormatForPath('x.woff2')).toBe('woff2')
  })
  it('detects woff', () => {
    expect(fontFormatForPath('x.woff')).toBe('woff')
  })
  it('detects truetype (ttf)', () => {
    expect(fontFormatForPath('x.ttf')).toBe('truetype')
  })
  it('detects opentype (otf)', () => {
    expect(fontFormatForPath('x.otf')).toBe('opentype')
  })
  it('defaults to woff for unknown extensions', () => {
    expect(fontFormatForPath('x.bin')).toBe('woff')
    expect(fontFormatForPath('noext')).toBe('woff')
  })
})

describe('markdown/frontmatter — parseFrontmatter', () => {
  it('parses title + body', () => {
    const text = '---\ntitle: "Hello"\n---\n# Body'
    const result = parseFrontmatter(text)
    expect(result.frontmatter.title).toBe('Hello')
    expect(result.body).toBe('# Body')
  })

  it('returns whole text as body when no frontmatter', () => {
    const text = '# Just a heading'
    const result = parseFrontmatter(text)
    expect(result.frontmatter).toEqual({})
    expect(result.body).toBe('# Just a heading')
    expect(result.raw).toBe(text)
  })

  it('returns whole text when closing --- missing', () => {
    const text = '---\ntitle: Orphan'
    const result = parseFrontmatter(text)
    expect(result.frontmatter).toEqual({})
    expect(result.body).toBe(text)
  })

  it('parses date and description', () => {
    const text = '---\ndate: 2026-01-01\ndescription: A post\n---\nbody'
    const result = parseFrontmatter(text)
    expect(result.frontmatter.date).toBe('2026-01-01')
    expect(result.frontmatter.description).toBe('A post')
  })

  it('parses authors list', () => {
    const text = '---\nauthors:\n  - Alice\n  - Bob\n---\nbody'
    const result = parseFrontmatter(text)
    expect(result.frontmatter.authors).toEqual(['Alice', 'Bob'])
  })

  it('strips quotes from values', () => {
    const text = '---\ntitle: "Quoted Title"\n---\nbody'
    const result = parseFrontmatter(text)
    expect(result.frontmatter.title).toBe('Quoted Title')
  })

  it('ignores malformed lines', () => {
    const text = '---\nno-colon-here\ntitle: OK\n---\nbody'
    const result = parseFrontmatter(text)
    expect(result.frontmatter.title).toBe('OK')
  })
})

describe('loader-factory — createLazyJsonLoader with inject', () => {
  it('caches the first fetch', async () => {
    let calls = 0
    const l = createLazyJsonLoader('p.json', async () => ({ n: ++calls }))
    const a = await l.load()
    const b = await l.load()
    expect(a).toEqual({ n: 1 })
    expect(b).toEqual({ n: 1 })
    expect(calls).toBe(1)
  })

  it('clear() forces reload', async () => {
    let n = 0
    const l = createLazyJsonLoader('p.json', async () => ({ n: ++n }))
    await l.load()
    l.clear()
    const r = await l.load()
    expect(r).toEqual({ n: 2 })
  })
})

describe('loader-factory — createKeyedJsonLoader with inject', () => {
  it('caches per key', async () => {
    const fetched: string[] = []
    const l = createKeyedJsonLoader<{ k: string }>(
      k => `p/${k}`,
      async p => { fetched.push(p); return { k: p } },
    )
    await l.load('a')
    await l.load('a')
    await l.load('b')
    expect(fetched).toEqual(['p/a', 'p/b'])
  })

  it('caches null on miss', async () => {
    let calls = 0
    const l = createKeyedJsonLoader(
      () => 'miss',
      async () => { calls++; throw new Error('404') },
    )
    const a = await l.load('x')
    const b = await l.load('x')
    expect(a).toBeNull()
    expect(b).toBeNull()
    expect(calls).toBe(1)
  })
})

describe('fonts/loader — singleton shape', () => {
  // After deleting the clear*Cache wrappers (zero production callers),
  // the singleton loader is no longer testable via its clear seam.
  // The factory's caching behavior is already covered by the
  // createLazyJsonLoader / createKeyedJsonLoader tests above.
  it('loadFontsRegistry and loadFontMetadata are exported functions', async () => {
    const { loadFontsRegistry, loadFontMetadata } = await import('../../src/lib/fonts/loader')
    expect(typeof loadFontsRegistry).toBe('function')
    expect(typeof loadFontMetadata).toBe('function')
  })
})

describe('formulas/loader — findFormula', () => {
  it('exposes findFormula and loadAllFormulas', async () => {
    const { findFormula: ff, loadAllFormulas } = await import('../../src/lib/formulas/loader')
    expect(typeof ff).toBe('function')
    expect(typeof loadAllFormulas).toBe('function')
  })
})

describe('formulas/details-loader — findFormulaDetails with injected fetcher', () => {
  beforeEach(() => clearDetailsCache())

  it('returns parsed details on hit', async () => {
    const fakeDetails = {
      slug: 'google/abeezee',
      description: 'Test description',
      copyright: 'Copyright 2026',
      license_url: 'https://example.com/license',
      command: 'fontist install abeezee',
      font_files: [],
    }
    const result = await findFormulaDetails('google/abeezee', async () => fakeDetails)
    expect(result).toEqual(fakeDetails)
  })

  it('caches per slug', async () => {
    let calls = 0
    await findFormulaDetails('a', async () => ({ slug: 'a', calls: ++calls } as any))
    await findFormulaDetails('a', async () => ({ slug: 'a', calls: ++calls } as any))
    expect(calls).toBe(1)
  })

  it('returns null on fetch failure', async () => {
    const result = await findFormulaDetails('missing', async () => { throw new Error('404') })
    expect(result).toBeNull()
  })

  it('returns null on second call to same key after failure (cached null)', async () => {
    let calls = 0
    const fetcher = async () => { calls++; throw new Error('404') }
    const a = await findFormulaDetails('miss', fetcher)
    const b = await findFormulaDetails('miss', fetcher)
    expect(a).toBeNull()
    expect(b).toBeNull()
    expect(calls).toBe(1)
  })
})
