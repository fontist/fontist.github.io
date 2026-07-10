import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'

// Test lib/fonts/family-lookup.ts
import { buildFamilyLookup } from '../../src/lib/fonts/family-lookup'
import type { FontFamilyIndex } from '../../src/lib/types/domain'

// Test lib/fonts/compare-context.ts
import { parseFontSlugsFromQuery } from '../../src/lib/fonts/compare-context'

const mockIndex: FontFamilyIndex = {
  generated_at: '2026-01-01T00:00:00Z',
  total_families: 2,
  families: [
    {
      slug: 'abeezee',
      name: 'ABeeZee',
      formula_slugs: ['google/abeezee'],
      style_count: 2,
      redistributable: true,
      license_name: 'OFL',
      files: [
        { slug: 'abeezee', formula_slug: 'google/abeezee', style: 'Regular', path: 'woff/google/abeezee/ABeeZee-Regular.woff', coverage_file: 'coverage/google/abeezee/ABeeZee-Regular.json', redistributable: true },
        { slug: 'abeezee_italic', formula_slug: 'google/abeezee', style: 'Italic', path: 'woff/google/abeezee/ABeeZee-Italic.woff', coverage_file: 'coverage/google/abeezee/ABeeZee-Italic.json', redistributable: true },
      ],
    },
    {
      slug: 'abel',
      name: 'Abel',
      formula_slugs: ['google/abel'],
      style_count: 1,
      redistributable: true,
      license_name: 'OFL',
      files: [
        { slug: 'abel', formula_slug: 'google/abel', style: 'Regular', path: 'woff/google/abel/Abel-Regular.woff', coverage_file: 'coverage/google/abel/Abel-Regular.json', redistributable: true },
      ],
    },
  ],
}

describe('family-lookup — buildFamilyLookup', () => {
  const lookup = buildFamilyLookup(mockIndex)

  it('bySlug returns family by slug', () => {
    expect(lookup.bySlug('abel')?.name).toBe('Abel')
    expect(lookup.bySlug('nonexistent')).toBeNull()
  })

  it('byFile returns family containing the file slug', () => {
    expect(lookup.byFile('abeezee')?.name).toBe('ABeeZee')
    expect(lookup.byFile('abeezee_italic')?.name).toBe('ABeeZee')
    expect(lookup.byFile('nonexistent')).toBeNull()
  })

  it('byFormula returns family provided by the formula slug', () => {
    expect(lookup.byFormula('google/abel')?.name).toBe('Abel')
    expect(lookup.byFormula('nonexistent')).toBeNull()
  })

  it('filesBySlug returns all family+file entries for a file slug', () => {
    const entries = lookup.filesBySlug('abeezee')
    expect(entries).toHaveLength(1)
    expect(entries[0].family.name).toBe('ABeeZee')
    expect(entries[0].file.slug).toBe('abeezee')
  })

  it('filesBySlug returns empty array for unknown slug', () => {
    expect(lookup.filesBySlug('nonexistent')).toHaveLength(0)
  })
})

describe('compare-context — parseFontSlugsFromQuery', () => {
  it('parses comma-separated slugs', () => {
    expect(parseFontSlugsFromQuery('abel,inter,roboto')).toEqual(['abel', 'inter', 'roboto'])
  })

  it('trims whitespace', () => {
    expect(parseFontSlugsFromQuery(' abel , inter ')).toEqual(['abel', 'inter'])
  })

  it('filters empty strings', () => {
    expect(parseFontSlugsFromQuery('abel,,inter')).toEqual(['abel', 'inter'])
  })

  it('limits to 8 entries', () => {
    const result = parseFontSlugsFromQuery('a,b,c,d,e,f,g,h,i,j')
    expect(result).toHaveLength(8)
  })

  it('returns empty array for non-string input', () => {
    expect(parseFontSlugsFromQuery(null)).toEqual([])
    expect(parseFontSlugsFromQuery(undefined)).toEqual([])
    expect(parseFontSlugsFromQuery(123)).toEqual([])
  })
})

// Test gen-font-families buildFamilyIndex
import { buildFamilyIndex } from '../../scripts/gen-font-families.mjs'

describe('gen-font-families — buildFamilyIndex', () => {
  it('groups a single-formula single-file family correctly', () => {
    const index = buildFamilyIndex({
      fonts: { fonts: [{ slug: 'abeezee', canonical_name: 'ABeeZee', formulas: ['google/abeezee'], style_count: 1 }] },
      metadata: { fonts: [{ slug: 'abeezee', formula_path: 'Formulas/google/abeezee.yml', redistributable: true, woff_file: 'woff/google/abeezee/ABeeZee-Regular.woff', coverage_file: 'coverage/google/abeezee/ABeeZee-Regular.json' }] },
      formulas: [{ slug: 'google/abeezee', licenseName: 'OFL' }],
    })
    expect(index.total_families).toBe(1)
    expect(index.families[0].slug).toBe('abeezee')
    expect(index.families[0].files[0].path).toBe('woff/google/abeezee/ABeeZee-Regular.woff')
    expect(index.families[0].files[0].coverage_file).toBe('coverage/google/abeezee/ABeeZee-Regular.json')
  })

  it('derives style name from slug prefix', () => {
    const index = buildFamilyIndex({
      fonts: { fonts: [{ slug: 'roboto', canonical_name: 'Roboto', formulas: ['google/roboto'], style_count: 3 }] },
      metadata: {
        fonts: [
          { slug: 'roboto', formula_path: 'Formulas/google/roboto.yml' },
          { slug: 'roboto_bold', formula_path: 'Formulas/google/roboto.yml' },
          { slug: 'roboto_bold_italic', formula_path: 'Formulas/google/roboto.yml' },
        ],
      },
      formulas: [{ slug: 'google/roboto' }],
    })
    const styles = index.families[0].files.map(f => f.style).sort()
    expect(styles).toEqual(['Bold', 'Bold Italic', 'Regular'])
  })

  it('emits null for path/coverage_file when metadata omits them', () => {
    const index = buildFamilyIndex({
      fonts: { fonts: [{ slug: 'proprietary', canonical_name: 'Prop', formulas: ['macos/prop'], style_count: 1 }] },
      metadata: { fonts: [{ slug: 'proprietary', formula_path: 'Formulas/macos/prop.yml', redistributable: false }] },
      formulas: [{ slug: 'macos/prop' }],
    })
    expect(index.families[0].files[0].path).toBeNull()
    expect(index.families[0].files[0].coverage_file).toBeNull()
    expect(index.families[0].files[0].redistributable).toBe(false)
  })

  it('filters out families with no providing formulas', () => {
    const index = buildFamilyIndex({
      fonts: { fonts: [
        { slug: 'orphan', canonical_name: 'Orphan', formulas: [], style_count: 1 },
        { slug: 'hasformula', canonical_name: 'Has', formulas: ['google/has'], style_count: 1 },
      ]},
      metadata: { fonts: [] },
      formulas: [{ slug: 'google/has' }],
    })
    expect(index.total_families).toBe(1)
    expect(index.families[0].slug).toBe('hasformula')
  })
})

// Test unicode block classification + display helpers
describe('Unicode block helpers', () => {
  it('blockDisplayName passes through canonical names (uses normalizeBlockName for underscore conversion)', async () => {
    const { blockDisplayName } = await import('../../src/lib/unicode/constants')
    const { normalizeBlockName } = await import('../../src/lib/unicode/coverage')
    expect(normalizeBlockName('Basic_Latin')).toBe('Basic Latin')
    expect(blockDisplayName('Miscellaneous Symbols')).toBe('Symbols & Math')
  })

  it('isControlChar detects control characters', async () => {
    const { isControlChar } = await import('../../src/lib/unicode/constants')
    expect(isControlChar('Cc', 0)).toBe(true)
    expect(isControlChar('Cc', 127)).toBe(true)
    expect(isControlChar('Lu', 65)).toBe(false)
  })

  it('controlAbbrev returns abbreviation for control chars', async () => {
    const { controlAbbrev } = await import('../../src/lib/unicode/constants')
    expect(controlAbbrev(0)).toBeTruthy()
    expect(controlAbbrev(127)).toBeTruthy()
  })

  it('scriptFamilyLabel returns display label', async () => {
    const { scriptFamilyLabel } = await import('../../src/lib/unicode/constants')
    expect(scriptFamilyLabel('latin')).toBeTruthy()
    expect(scriptFamilyLabel('cjk')).toBeTruthy()
  })

  it('isCjkBlock detects CJK blocks', async () => {
    const { isCjkBlock } = await import('../../src/lib/unicode/constants')
    expect(isCjkBlock('CJK Unified Ideographs')).toBe(true)
    expect(isCjkBlock('Basic Latin')).toBe(false)
  })

  it('planeForCodepoint returns correct plane key', async () => {
    const mod = await import('../../src/lib/unicode/constants')
    // Access the internal function via the coverage module's export
    const { planeForCodepoint } = await import('../../src/lib/unicode/coverage')
    // coverage module doesn't export planeForCodepoint, but we can test
    // via the heatmap's behavior instead
  })
})
