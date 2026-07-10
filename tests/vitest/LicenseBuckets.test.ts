import { describe, it, expect } from 'vitest'

// Mirror of the HomePage matchers — kept in sync via this test.
// If the page-side matchers change, update both copies together.
const OPEN_MATCHERS = [
  { label: 'SIL Open Font License',         test: (n: string) => n.includes('open font license') || n === 'ofl' || n.startsWith('ofl-1') },
  { label: 'Apache License 2.0',            test: (n: string) => n.includes('apache') },
  { label: 'IPA Font License',              test: (n: string) => n.includes('ipa font') },
  { label: 'CC0 / Public Domain',           test: (n: string) => n.includes('creative commons zero') || n.includes('cc0') || n.includes('public domain') || n.includes('publicdomain') },
  { label: 'Ubuntu Font Licence',           test: (n: string) => n.includes('ubuntu font') },
  { label: 'GNU GPL (with Font Exception)', test: (n: string) => n.includes('gnu gpl') || n.includes('lppl') },
]
const PROP_MATCHERS = [
  { label: 'Apple-only', test: (n: string) => n.includes('apple') },
  { label: 'Microsoft',  test: (n: string) => n.includes('microsoft') },
  { label: 'Adobe',      test: (n: string) => n.includes('adobe') },
]

function norm(raw: string | undefined): string {
  return (raw || 'Unknown').replace(/^LICENSEREF-/i, '').toLowerCase()
}

function bucketFormula(f: { licenseName?: string; licenseCategory: string }) {
  const name = norm(f.licenseName)
  const isOpen = f.licenseCategory === 'open_source'
  if (isOpen) {
    const hit = OPEN_MATCHERS.find(m => m.test(name))
    return hit ? { kind: 'open' as const, label: hit.label } : { kind: 'open' as const, label: 'Other open source' }
  }
  const hit = PROP_MATCHERS.find(m => m.test(name))
  return hit ? { kind: 'prop' as const, label: hit.label } : { kind: 'prop' as const, label: 'Other proprietary' }
}

describe('homepage license-bucket logic', () => {
  it('SIL OFL variants all collapse into one bucket', () => {
    const names = [
      'SIL Open Font License 1.1',
      'SIL Open Font License 1.1 (with RFN)',
      'OFL-1.1',
      'OFL-1.0-RFN',
      'ofl',
    ]
    for (const n of names) {
      const r = bucketFormula({ licenseName: n, licenseCategory: 'open_source' })
      expect(r.label).toBe('SIL Open Font License')
      expect(r.kind).toBe('open')
    }
  })

  it('Microsoft licenses consolidate into one bucket', () => {
    const ms = [
      'LICENSEREF-MICROSOFT-FONTPACK-19980728',
      'LICENSEREF-MICROSOFT-OFFICE2013-1',
      'LICENSEREF-MICROSOFT-EASTASIANCLEARTYPE',
      'LICENSEREF-MICROSOFT-EASTASIAN-PACK',
      'LICENSEREF-MICROSOFT-WEBCORE-BUNDLE',
    ]
    for (const n of ms) {
      const r = bucketFormula({ licenseName: n, licenseCategory: 'bundled_software' })
      expect(r.label).toBe('Microsoft')
      expect(r.kind).toBe('prop')
    }
  })

  it('routes well-known open licenses to their canonical buckets', () => {
    expect(bucketFormula({ licenseName: 'Apache License 2.0', licenseCategory: 'open_source' }).label).toBe('Apache License 2.0')
    expect(bucketFormula({ licenseName: 'IPA Font License', licenseCategory: 'open_source' }).label).toBe('IPA Font License')
    expect(bucketFormula({ licenseName: 'Creative Commons Zero (Public Domain)', licenseCategory: 'open_source' }).label).toBe('CC0 / Public Domain')
    expect(bucketFormula({ licenseName: 'Ubuntu Font Licence 1.0', licenseCategory: 'open_source' }).label).toBe('Ubuntu Font Licence')
    expect(bucketFormula({ licenseName: 'GNU GPL (with Font Exception)', licenseCategory: 'open_source' }).label).toBe('GNU GPL (with Font Exception)')
  })

  it('routes Apple-only and Adobe to their proprietary buckets', () => {
    expect(bucketFormula({ licenseName: 'Apple-only License', licenseCategory: 'platform_restricted' }).label).toBe('Apple-only')
    expect(bucketFormula({ licenseName: 'LICENSEREF-ADOBE-EULA', licenseCategory: 'platform_restricted' }).label).toBe('Adobe')
  })

  it('unknown open-source licenses land in "Other open source"', () => {
    const r = bucketFormula({ licenseName: 'LICENSEREF-FONTOPO-FREE', licenseCategory: 'open_source' })
    expect(r.label).toBe('Other open source')
    expect(r.kind).toBe('open')
  })

  it('non-open categories never produce an open bucket, even with open-ish name', () => {
    // An "Apache" name on a platform_restricted formula is misclassified upstream,
    // but the homepage must trust licenseCategory and route it to proprietary.
    const r = bucketFormula({ licenseName: 'Apache License 2.0', licenseCategory: 'platform_restricted' })
    expect(r.kind).toBe('prop')
  })

  it('does not throw on undefined licenseName', () => {
    expect(() => bucketFormula({ licenseCategory: 'open_source' })).not.toThrow()
    const r = bucketFormula({ licenseCategory: 'open_source' })
    expect(r.label).toBe('Other open source')
  })
})
