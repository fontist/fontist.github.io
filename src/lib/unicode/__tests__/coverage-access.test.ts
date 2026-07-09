import { describe, it } from 'node:test'
import assert from 'node:assert/strict'
import {
  normalizeBlockName,
  coveragePath,
  coverageForBlock,
  blockCompleteness,
  coverageBucket,
} from '../coverage.ts'
import type { FontFamilyFile } from '../../../types/domain.ts'

describe('normalizeBlockName', () => {
  it('replaces underscores with spaces', () => {
    assert.equal(normalizeBlockName('Basic_Latin'), 'Basic Latin')
    assert.equal(normalizeBlockName('Combining_Diacritical_Marks'), 'Combining Diacritical Marks')
  })

  it('leaves already-canonical names alone', () => {
    assert.equal(normalizeBlockName('Basic Latin'), 'Basic Latin')
  })

  it('handles names with no separators', () => {
    assert.equal(normalizeBlockName('Tamil'), 'Tamil')
  })
})

describe('coveragePath', () => {
  it('resolves a bare face slug to the legacy flat path', () => {
    assert.equal(coveragePath('abel'), 'coverage/abel.json')
  })

  it('passes a full archive path through (stripping leading slash)', () => {
    assert.equal(
      coveragePath('coverage/google/abel/Abel-Regular.json'),
      'coverage/google/abel/Abel-Regular.json',
    )
    assert.equal(
      coveragePath('/coverage/google/abel/Abel-Regular.json'),
      'coverage/google/abel/Abel-Regular.json',
    )
  })

  it('prefers coverage_file when given a FontFamilyFile', () => {
    const file: FontFamilyFile = {
      slug: 'abel',
      formula_slug: 'google/abel',
      style: 'Regular',
      path: 'woff/google/abel/Abel-Regular.woff',
      coverage_file: 'coverage/google/abel/Abel-Regular.json',
      redistributable: true,
    }
    assert.equal(
      coveragePath(file),
      'coverage/google/abel/Abel-Regular.json',
    )
  })

  it('falls back to slug when FontFamilyFile has no coverage_file', () => {
    const file: FontFamilyFile = {
      slug: 'abel',
      formula_slug: 'google/abel',
      style: 'Regular',
      path: null,
      coverage_file: null,
      redistributable: true,
    }
    assert.equal(coveragePath(file), 'coverage/abel.json')
  })

  it('throws when FontFamilyFile has neither coverage_file nor slug', () => {
    const file: FontFamilyFile = {
      slug: '',
      formula_slug: '',
      style: '',
      path: null,
      coverage_file: null,
      redistributable: false,
    }
    assert.throws(() => coveragePath(file))
  })
})

describe('coverageForBlock', () => {
  const coverage = {
    slug: 'google/abel',
    redistributable: true,
    total_codepoints: 248,
    supported_blocks: 11,
    total_blocks: 11,
    planes: { bmp: true, smp: false, sip: false },
    codepoints: [65],
    blocks: [
      { name: 'Basic_Latin', range: 'U+0000–U+007F', start: 0, end: 127, codepoints: [65, 66] },
      { name: 'Currency_Symbols', range: 'U+20A0–U+20CF', start: 8352, end: 8399, codepoints: [8364] },
    ],
    variable_axes: [],
    opentype_features: [],
  }

  it('finds a block by its underscore form', () => {
    const blk = coverageForBlock(coverage, 'Basic_Latin')
    assert.equal(blk?.name, 'Basic Latin')
    assert.equal(blk?.covered, 2)
  })

  it('finds the same block by its space form', () => {
    const blk = coverageForBlock(coverage, 'Basic Latin')
    assert.equal(blk?.name, 'Basic Latin')
    assert.equal(blk?.covered, 2)
  })

  it('returns null when the block is not in the coverage data', () => {
    assert.equal(coverageForBlock(coverage, 'CJK Unified Ideographs'), null)
  })

  it('returns null when coverage is null', () => {
    assert.equal(coverageForBlock(null, 'Basic Latin'), null)
  })
})

describe('blockCompleteness', () => {
  const coverage = {
    slug: 'google/abel',
    redistributable: true,
    total_codepoints: 1,
    supported_blocks: 1,
    total_blocks: 1,
    planes: { bmp: true, smp: false, sip: false },
    codepoints: [65],
    blocks: [
      { name: 'Basic_Latin', range: 'U+0000–U+007F', start: 0, end: 127, codepoints: [65, 66] },
    ],
    variable_axes: [],
    opentype_features: [],
  }

  it('computes total / covered / missing / pct', () => {
    const c = blockCompleteness(coverage, { start: 0, end: 127, name: 'Basic Latin' })
    assert.equal(c.total, 128)
    assert.equal(c.covered, 2)
    assert.equal(c.missing, 126)
    assert.equal(c.pct, 2 / 128)
  })

  it('reports zero coverage when the font has no entry for the block', () => {
    const c = blockCompleteness(coverage, { start: 0, end: 127, name: 'Nonexistent Block' })
    assert.equal(c.total, 128)
    assert.equal(c.covered, 0)
    assert.equal(c.missing, 128)
    assert.equal(c.pct, 0)
  })
})

describe('coverageBucket', () => {
  it('returns "unknown" when hasData is false', () => {
    assert.equal(coverageBucket(0.5, false), 'unknown')
    assert.equal(coverageBucket(1.0, false), 'unknown')
  })

  it('returns "0" for zero coverage', () => {
    assert.equal(coverageBucket(0, true), '0')
  })

  it('returns "low" for sparse coverage (1-25%)', () => {
    assert.equal(coverageBucket(0.001, true), 'low')
    assert.equal(coverageBucket(0.249, true), 'low')
  })

  it('returns "25" / "50" / "75" / "100" at thresholds', () => {
    assert.equal(coverageBucket(0.25, true), '25')
    assert.equal(coverageBucket(0.50, true), '50')
    assert.equal(coverageBucket(0.75, true), '75')
    assert.equal(coverageBucket(1.00, true), '100')
    assert.equal(coverageBucket(0.995, true), '100')
  })
})
