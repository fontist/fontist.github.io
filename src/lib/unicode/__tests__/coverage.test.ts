import { describe, it } from 'node:test'
import assert from 'node:assert/strict'
import {
  computeCoverage,
  buildCharacterGrid,
  findGaps,
  coverageSummary,
} from '../data/coverage.ts'
import type { UnicodeBlock, UnicodeCharacter, FontContext } from '../../../types/domain.ts'
import type { PlaneKey } from '../types.ts'

function mkChar(cp: number): UnicodeCharacter {
  return {
    cp,
    hex: 'U+' + cp.toString(16).toUpperCase().padStart(4, '0'),
    name: `CHAR ${cp}`,
    category: 'L',
    script: 'Latn',
    char: String.fromCodePoint(cp),
  }
}

function mkBlock(name: string, cps: number[]): UnicodeBlock {
  const start = cps[0] ?? 0
  const end = cps[cps.length - 1] ?? 0
  return {
    name,
    start,
    end,
    range: `U+${start.toString(16)}-U+${end.toString(16)}`,
    plane: 'bmp' as PlaneKey,
    displayName: name,
    scriptGroup: 'Latin',
    characters: cps.map(mkChar),
    assignedCount: cps.length,
  }
}

function mkFont(slug: string, cps: number[], color = '#bf4e6a'): FontContext {
  return {
    slug,
    familyName: slug,
    fontId: `ff-${slug}`,
    fontPath: null,
    redistributable: true,
    coverage: new Set(cps),
    color,
  }
}

describe('computeCoverage', () => {
  it('returns status "none" with totalCount derived from range when characters list is empty', () => {
    const block = mkBlock('Empty', [])
    const result = computeCoverage(block, new Set([0x41]))
    assert.equal(result.status, 'none')
    assert.equal(result.supportedCount, 0)
    assert.equal(result.totalCount, 1)
    assert.equal(result.percentage, 0)
    assert.deepEqual(result.missing, [])
  })

  it('returns "full" when every character is covered', () => {
    const block = mkBlock('All', [0x41, 0x42, 0x43])
    const result = computeCoverage(block, new Set([0x41, 0x42, 0x43, 0x99]))
    assert.equal(result.status, 'full')
    assert.equal(result.supportedCount, 3)
    assert.equal(result.totalCount, 3)
    assert.equal(result.percentage, 100)
    assert.deepEqual(result.missing, [])
  })

  it('returns "partial" with missing list when some characters are absent', () => {
    const block = mkBlock('Some', [0x41, 0x42, 0x43, 0x44])
    const result = computeCoverage(block, new Set([0x41, 0x43]))
    assert.equal(result.status, 'partial')
    assert.equal(result.supportedCount, 2)
    assert.equal(result.totalCount, 4)
    assert.equal(result.percentage, 50)
    assert.deepEqual(result.missing, [0x42, 0x44])
  })

  it('returns "none" when font covers nothing', () => {
    const block = mkBlock('None', [0x41, 0x42])
    const result = computeCoverage(block, new Set([0x99]))
    assert.equal(result.status, 'none')
    assert.equal(result.supportedCount, 0)
    assert.equal(result.percentage, 0)
    assert.deepEqual(result.missing, [0x41, 0x42])
  })

  it('rounds percentage to nearest integer', () => {
    const block = mkBlock('Third', [0x41, 0x42, 0x43])
    const result = computeCoverage(block, new Set([0x41]))
    assert.equal(result.percentage, 33)
  })
})

describe('buildCharacterGrid', () => {
  it('returns one row per character with one render entry per font', () => {
    const block = mkBlock('AB', [0x41, 0x42])
    const fontA = mkFont('a', [0x41])
    const grid = buildCharacterGrid(block, [fontA])
    assert.equal(grid.length, 2)
    assert.equal(grid[0].char.cp, 0x41)
    assert.equal(grid[0].renders.length, 1)
    assert.equal(grid[0].renders[0].supported, true)
    assert.equal(grid[1].renders[0].supported, false)
  })

  it('handles empty font list', () => {
    const block = mkBlock('AB', [0x41, 0x42])
    const grid = buildCharacterGrid(block, [])
    assert.equal(grid.length, 2)
    assert.equal(grid[0].renders.length, 0)
  })

  it('reports per-font support when fonts disagree', () => {
    const block = mkBlock('AB', [0x41, 0x42])
    const fontA = mkFont('a', [0x41])
    const fontB = mkFont('b', [0x42])
    const grid = buildCharacterGrid(block, [fontA, fontB])
    assert.deepEqual(
      grid.map(r => r.renders.map(r => r.supported)),
      [[true, false], [false, true]],
    )
  })
})

describe('findGaps', () => {
  it('returns only characters where fonts disagree', () => {
    const block = mkBlock('ABC', [0x41, 0x42, 0x43])
    const fontA = mkFont('a', [0x41, 0x42])
    const fontB = mkFont('b', [0x42, 0x43])
    const gaps = findGaps(block, [fontA, fontB])
    assert.deepEqual(gaps.map(g => g.char.cp), [0x41, 0x43])
  })

  it('returns empty when all fonts agree on support', () => {
    const block = mkBlock('AB', [0x41, 0x42])
    const fontA = mkFont('a', [0x41, 0x42])
    const fontB = mkFont('b', [0x41, 0x42])
    const gaps = findGaps(block, [fontA, fontB])
    assert.equal(gaps.length, 0)
  })

  it('returns empty when all fonts agree on absence', () => {
    const block = mkBlock('AB', [0x41, 0x42])
    const fontA = mkFont('a', [])
    const fontB = mkFont('b', [])
    const gaps = findGaps(block, [fontA, fontB])
    assert.equal(gaps.length, 0)
  })

  it('returns empty for single-font list (no comparison possible)', () => {
    const block = mkBlock('AB', [0x41, 0x42])
    const fontA = mkFont('a', [0x41])
    const gaps = findGaps(block, [fontA])
    assert.equal(gaps.length, 0)
  })
})

describe('coverageSummary', () => {
  it('classifies blocks into full/partial/none buckets', () => {
    const full = mkBlock('Full', [0x41, 0x42])
    const partial = mkBlock('Partial', [0x41, 0x42, 0x43, 0x44])
    const none = mkBlock('None', [0x50])
    const coverage = new Set([0x41, 0x42, 0x43])
    const summary = coverageSummary([full, partial, none], coverage)
    assert.equal(summary.full, 1)
    assert.equal(summary.partial, 1)
    assert.equal(summary.none, 1)
    assert.equal(summary.totalCodepoints, 5)
  })

  it('returns zero counts for empty block list', () => {
    const summary = coverageSummary([], new Set())
    assert.deepEqual(summary, { full: 0, partial: 0, none: 0, totalCodepoints: 0 })
  })

  it('totalCodepoints sums supportedCount across blocks (with duplicates if a cp appears in multiple blocks)', () => {
    const blockA = mkBlock('A', [0x41, 0x42])
    const blockB = mkBlock('B', [0x41, 0x43])
    const coverage = new Set([0x41, 0x42, 0x43])
    const summary = coverageSummary([blockA, blockB], coverage)
    assert.equal(summary.totalCodepoints, 4)
  })
})
