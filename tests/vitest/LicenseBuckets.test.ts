import { describe, it, expect, vi, beforeEach } from 'vitest'

// Mock the license index loader so the classifier has deterministic data.
const mockIndex = [
  { slug: 'ofl', name: 'SIL Open Font License 1.1', category: 'permissive' as const, blurb: '', matchers: ['sil open font', 'ofl'] },
  { slug: 'apache', name: 'Apache License 2.0', category: 'permissive' as const, blurb: '', matchers: ['apache'] },
  { slug: 'ipa', name: 'IPA Font License', category: 'permissive' as const, blurb: '', matchers: ['ipa font'] },
  { slug: 'cc0', name: 'Creative Commons Zero', category: 'public-domain' as const, blurb: '', matchers: ['cc0', 'creative commons zero', 'public domain'] },
  { slug: 'ufl', name: 'Ubuntu Font Licence 1.0', category: 'permissive' as const, blurb: '', matchers: ['ubuntu font', 'ufl'] },
  { slug: 'gpl', name: 'GNU GPL', category: 'copyleft' as const, blurb: '', matchers: ['gpl'], exclude_matchers: ['lgpl'] },
]

vi.mock('@/lib/ssr-fetch', () => ({
  fetchJson: vi.fn(async () => mockIndex),
}))

import {
  classifyFormula,
  bucketFormulas,
  formulaMatchesLicenseSync,
  loadLicenseIndex,
  clearLicenseIndexCache,
} from '@/lib/licenses/classifier'

type Formula = { licenseName?: string; licenseCategory: string }

describe('license classifier — YAML matchers', () => {
  beforeEach(() => clearLicenseIndexCache())

  it('SIL OFL variants all collapse into one bucket', async () => {
    const names = [
      'SIL Open Font License 1.1',
      'SIL Open Font License 1.1 (with RFN)',
      'OFL-1.1',
      'OFL-1.0-RFN',
      'ofl',
    ]
    for (const n of names) {
      const r = await classifyFormula({ licenseName: n, licenseCategory: 'open_source' } as Formula)
      expect(r.bucket).toBe('SIL Open Font License 1.1')
      expect(r.category).toBe('open')
      expect(r.slug).toBe('ofl')
    }
  })

  it('uses canonical YAML name even when fallback would also match', async () => {
    // "Apache License 2.0" matches both the YAML matcher and the fallback matcher.
    // The YAML entry wins; bucket should be the YAML name.
    const r = await classifyFormula({ licenseName: 'Apache License 2.0', licenseCategory: 'open_source' } as Formula)
    expect(r.bucket).toBe('Apache License 2.0')
    expect(r.slug).toBe('apache')
  })

  it('routes well-known open licenses to their YAML buckets', async () => {
    expect((await classifyFormula({ licenseName: 'IPA Font License', licenseCategory: 'open_source' } as Formula)).bucket).toBe('IPA Font License')
    expect((await classifyFormula({ licenseName: 'Creative Commons Zero (Public Domain)', licenseCategory: 'open_source' } as Formula)).bucket).toBe('Creative Commons Zero')
    expect((await classifyFormula({ licenseName: 'Ubuntu Font Licence 1.0', licenseCategory: 'open_source' } as Formula)).bucket).toBe('Ubuntu Font Licence 1.0')
  })

  it('exclude_matchers narrow the match — GNU GPL excludes LGPL', async () => {
    const gpl = await classifyFormula({ licenseName: 'GNU GPL (with Font Exception)', licenseCategory: 'open_source' } as Formula)
    expect(gpl.bucket).toBe('GNU GPL')
    const lgpl = await classifyFormula({ licenseName: 'GNU LGPL', licenseCategory: 'open_source' } as Formula)
    // Should NOT match the GPL entry (exclude_matchers: lgpl); falls through to fallback
    expect(lgpl.bucket).not.toBe('GNU GPL')
  })
})

describe('license classifier — fallback matchers', () => {
  beforeEach(() => clearLicenseIndexCache())

  it('Microsoft licenses consolidate into one bucket', async () => {
    const ms = [
      'LICENSEREF-MICROSOFT-FONTPACK-19980728',
      'LICENSEREF-MICROSOFT-OFFICE2013-1',
      'LICENSEREF-MICROSOFT-EASTASIANCLEARTYPE',
      'LICENSEREF-MICROSOFT-EASTASIAN-PACK',
      'LICENSEREF-MICROSOFT-WEBCORE-BUNDLE',
    ]
    for (const n of ms) {
      const r = await classifyFormula({ licenseName: n, licenseCategory: 'bundled_software' } as Formula)
      expect(r.bucket).toBe('Microsoft')
      expect(r.category).toBe('proprietary')
      expect(r.slug).toBeNull()
    }
  })

  it('routes Apple-only and Adobe to their proprietary buckets', async () => {
    expect((await classifyFormula({ licenseName: 'Apple-only License', licenseCategory: 'platform_restricted' } as Formula)).bucket).toBe('Apple-only')
    expect((await classifyFormula({ licenseName: 'LICENSEREF-ADOBE-EULA', licenseCategory: 'platform_restricted' } as Formula)).bucket).toBe('Adobe')
  })

  it('unknown open-source licenses land in "Other open source"', async () => {
    const r = await classifyFormula({ licenseName: 'LICENSEREF-FONTOPO-FREE', licenseCategory: 'open_source' } as Formula)
    expect(r.bucket).toBe('Other open source')
    expect(r.category).toBe('open')
  })

  it('non-open categories never produce an open bucket', async () => {
    const r = await classifyFormula({ licenseName: 'Apache License 2.0', licenseCategory: 'platform_restricted' } as Formula)
    expect(r.category).toBe('proprietary')
  })

  it('does not throw on undefined licenseName', async () => {
    expect(classifyFormula({ licenseCategory: 'open_source' } as Formula)).resolves.toBeDefined()
    const r = await classifyFormula({ licenseCategory: 'open_source' } as Formula)
    expect(r.bucket).toBe('Other open source')
  })
})

describe('license classifier — bulk bucketing', () => {
  beforeEach(() => clearLicenseIndexCache())

  it('groups formulas and sorts by count descending', async () => {
    const formulas: Formula[] = [
      { licenseName: 'SIL Open Font License 1.1', licenseCategory: 'open_source' },
      { licenseName: 'SIL Open Font License 1.1', licenseCategory: 'open_source' },
      { licenseName: 'Apache License 2.0', licenseCategory: 'open_source' },
      { licenseName: 'Apple-only License', licenseCategory: 'platform_restricted' },
      { licenseName: 'LICENSEREF-MICROSOFT-OFFICE2013-1', licenseCategory: 'bundled_software' },
    ]
    const { open, proprietary } = await bucketFormulas(formulas as any)
    expect(open[0]).toEqual({ bucket: 'SIL Open Font License 1.1', count: 2, slug: 'ofl' })
    expect(open[1].bucket).toBe('Apache License 2.0')
    expect(proprietary.find(b => b.bucket === 'Apple-only')?.count).toBe(1)
    expect(proprietary.find(b => b.bucket === 'Microsoft')?.count).toBe(1)
  })
})

describe('license classifier — formulaMatchesLicenseSync', () => {
  it('returns true when name matches a matcher', () => {
    const f = { licenseName: 'SIL Open Font License 1.1', licenseCategory: 'open_source' } as Formula
    const lic = mockIndex[0]
    expect(formulaMatchesLicenseSync(f as any, lic)).toBe(true)
  })

  it('returns false on exclude_matchers hit', () => {
    const f = { licenseName: 'GNU LGPL', licenseCategory: 'open_source' } as Formula
    const gpl = mockIndex[5] // has exclude_matchers: ['lgpl']
    expect(formulaMatchesLicenseSync(f as any, gpl)).toBe(false)
  })

  it('returns false when matchers array is empty', () => {
    const f = { licenseName: 'Anything', licenseCategory: 'open_source' } as Formula
    expect(formulaMatchesLicenseSync(f as any, { slug: 'x', name: 'X', category: 'permissive', blurb: '', matchers: [] })).toBe(false)
  })
})
