import { describe, it, expect, vi, beforeEach } from 'vitest'
import { ref, nextTick } from 'vue'

// Test the coverage module directly
import {
  normalizeBlockName,
  coveragePath,
  coverageForBlock,
  blockCompleteness,
  coverageBucket,
} from '../../src/lib/unicode/coverage'

// Test the loader factory
import { createLazyJsonLoader, createKeyedJsonLoader } from '../../src/lib/loader-factory'

// Test the license matching logic (data-driven from YAML)
import { readFileSync } from 'node:fs'
import { createRequire } from 'node:module'
const require = createRequire(import.meta.url)
const yaml = require('js-yaml')

describe('Coverage module — normalizeBlockName', () => {
  it('converts underscores to spaces', () => {
    expect(normalizeBlockName('Basic_Latin')).toBe('Basic Latin')
    expect(normalizeBlockName('CJK_Unified_Ideographs')).toBe('CJK Unified Ideographs')
  })

  it('handles already-canonical names', () => {
    expect(normalizeBlockName('Basic Latin')).toBe('Basic Latin')
  })

  it('handles names with no separators', () => {
    expect(normalizeBlockName('Tamil')).toBe('Tamil')
  })
})

describe('Coverage module — coveragePath', () => {
  it('resolves face slug to flat path', () => {
    expect(coveragePath('abel')).toBe('coverage/abel.json')
  })

  it('passes through full paths', () => {
    expect(coveragePath('coverage/google/abel/Abel-Regular.json'))
      .toBe('coverage/google/abel/Abel-Regular.json')
  })

  it('strips leading slash from full paths', () => {
    expect(coveragePath('/coverage/google/abel/Abel-Regular.json'))
      .toBe('coverage/google/abel/Abel-Regular.json')
  })
})

describe('Coverage module — coverageBucket', () => {
  it('returns "unknown" when hasData is false', () => {
    expect(coverageBucket(0.5, false)).toBe('unknown')
  })

  it('returns "0" for zero coverage', () => {
    expect(coverageBucket(0, true)).toBe('0')
  })

  it('returns "low" for sparse coverage', () => {
    expect(coverageBucket(0.01, true)).toBe('low')
    expect(coverageBucket(0.24, true)).toBe('low')
  })

  it('returns "100" at 99.5%+', () => {
    expect(coverageBucket(0.995, true)).toBe('100')
    expect(coverageBucket(1.0, true)).toBe('100')
  })
})

describe('Loader factory — createLazyJsonLoader', () => {
  it('caches the loaded value', async () => {
    let calls = 0
    const loader = createLazyJsonLoader('test.json', async () => {
      calls++
      return { value: calls } as any
    })
    const r1 = await loader.load()
    const r2 = await loader.load()
    expect(calls).toBe(1)
    expect(r1).toEqual({ value: 1 })
    expect(r2).toEqual({ value: 1 })
  })

  it('reloads after clear()', async () => {
    let calls = 0
    const loader = createLazyJsonLoader('test.json', async () => {
      calls++
      return { n: calls } as any
    })
    await loader.load()
    expect(calls).toBe(1)
    loader.clear()
    await loader.load()
    expect(calls).toBe(2)
  })
})

describe('Loader factory — createKeyedJsonLoader', () => {
  it('caches per key', async () => {
    const fetched: string[] = []
    const loader = createKeyedJsonLoader<{ key: string }>(
      (k) => `path/${k}`,
      async (p) => { fetched.push(p); return { key: p } },
    )
    await loader.load('a')
    await loader.load('a')
    await loader.load('b')
    expect(fetched).toEqual(['path/a', 'path/b'])
  })

  it('caches null on miss', async () => {
    const loader = createKeyedJsonLoader(
      (_k: string) => 'missing',
      async () => { throw new Error('not found') },
    )
    const r1 = await loader.load('x')
    const r2 = await loader.load('x')
    expect(r1).toBeNull()
    expect(r2).toBeNull()
  })
})

describe('License YAML data — shape integrity', () => {
  const licenses = ['ofl', 'apache', 'mit', 'bsd', 'ufl', 'ipa', 'bitstream', 'gust', 'cc0', 'cc-by', 'lgpl', 'gpl']

  for (const slug of licenses) {
    it(`${slug}.yml has required fields`, () => {
      const raw = readFileSync(`public/content/licenses/${slug}.yml`, 'utf8')
      const data = yaml.load(raw) as Record<string, unknown>
      expect(data.slug).toBe(slug)
      expect(data.name).toBeTruthy()
      expect(data.category).toMatch(/^(permissive|copyleft|public-domain|special)$/)
      expect(data.blurb).toBeTruthy()
      expect(data.permissions).toBeTruthy()
      expect(data.matchers).toBeTruthy()
      expect(Array.isArray(data.matchers)).toBe(true)
    })
  }

  it('all license YAML files have valid permissions values', () => {
    for (const slug of licenses) {
      const raw = readFileSync(`public/content/licenses/${slug}.yml`, 'utf8')
      const data = yaml.load(raw) as Record<string, any>
      const perms = data.permissions as Record<string, string>
      for (const [key, val] of Object.entries(perms)) {
        expect(['yes', 'conditional', 'no']).toContain(val)
      }
    }
  })
})

describe('License matching — data-driven', () => {
  function loadLicense(slug: string): Record<string, any> {
    return yaml.load(readFileSync(`public/content/licenses/${slug}.yml`, 'utf8')) as Record<string, any>
  }

  function matches(lic: Record<string, any>, name: string | undefined): boolean {
    if (!name || !lic.matchers) return false
    const ln = name.toLowerCase()
    const matched = lic.matchers.some((m: string) => ln.includes(m.toLowerCase()))
    if (!matched) return false
    if (lic.exclude_matchers) {
      return !lic.exclude_matchers.some((m: string) => ln.includes(m.toLowerCase()))
    }
    return true
  }

  it('OFL matches "SIL Open Font License 1.1 (with RFN)"', () => {
    const ofl = loadLicense('ofl')
    expect(matches(ofl, 'SIL Open Font License 1.1 (with RFN)')).toBe(true)
  })

  it('OFL matches "OFL-1.1"', () => {
    const ofl = loadLicense('ofl')
    expect(matches(ofl, 'OFL-1.1')).toBe(true)
  })

  it('Apache matches "Apache License 2.0"', () => {
    const apache = loadLicense('apache')
    expect(matches(apache, 'Apache License 2.0')).toBe(true)
  })

  it('GPL matches "GNU GPL" but not "GNU LGPL"', () => {
    const gpl = loadLicense('gpl')
    expect(matches(gpl, 'GNU GPL (with Font Exception)')).toBe(true)
    expect(matches(gpl, 'GNU LGPL')).toBe(false)
  })

  it('CC0 matches "Creative Commons Zero"', () => {
    const cc0 = loadLicense('cc0')
    expect(matches(cc0, 'Creative Commons Zero (Public Domain)')).toBe(true)
  })
})

describe('Theme state', () => {
  it('detectTheme returns stored value when present', async () => {
    const { detectTheme } = await import('../../src/lib/theme-state')
    const result = detectTheme({
      localStorage: { getItem: () => 'dark' } as any,
      matchMedia: null,
    })
    expect(result).toBe('dark')
  })

  it('detectTheme falls back to light when no stored value and no matchMedia', async () => {
    const { detectTheme } = await import('../../src/lib/theme-state')
    const result = detectTheme({
      localStorage: { getItem: () => null } as any,
      matchMedia: null,
    })
    expect(result).toBe('light')
  })

  it('toggleTheme flips dark to light', async () => {
    const { toggleTheme } = await import('../../src/lib/theme-state')
    expect(toggleTheme('dark')).toBe('light')
    expect(toggleTheme('light')).toBe('dark')
  })
})

describe('Frontmatter parser', () => {
  it('parses title from frontmatter', async () => {
    const { parseFrontmatter } = await import('../../src/lib/markdown/frontmatter')
    const result = parseFrontmatter('---\ntitle: "Test Title"\n---\n# Body')
    expect(result.frontmatter.title).toBe('Test Title')
    expect(result.body).toContain('# Body')
  })

  it('handles markdown without frontmatter', async () => {
    const { parseFrontmatter } = await import('../../src/lib/markdown/frontmatter')
    const result = parseFrontmatter('# Just a heading')
    expect(result.frontmatter).toEqual({})
    expect(result.body).toContain('# Just a heading')
  })
})

describe('Unicode constants', () => {
  it('hexCp formats codepoint as U+XXXX', async () => {
    const { hexCp } = await import('../../src/lib/unicode/constants')
    expect(hexCp(65)).toBe('U+0041')
    expect(hexCp(8364)).toBe('U+20AC')
    expect(hexCp(128512)).toBe('U+1F600')
  })

  it('safeChar returns printable character for normal codepoints', async () => {
    const { safeChar } = await import('../../src/lib/unicode/constants')
    expect(safeChar(65)).toBe('A')
    expect(safeChar(8364)).toBe('€')
  })

  it('blockSlug converts block names to kebab-case', async () => {
    const { blockSlug } = await import('../../src/lib/unicode/constants')
    expect(blockSlug('Basic Latin')).toBe('basic-latin')
    expect(blockSlug('CJK Unified Ideographs Extension B')).toBe('cjk-unified-ideographs-extension-b')
  })
})
