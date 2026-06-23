import type { UnicodeBlock, UnicodeCharacter, CoverageStatus, GridMode } from '../types.ts'
import type { FontContext } from '../../types/domain.ts'
import { hexCp, safeChar } from '../constants.ts'

export function computeCoverage(block: UnicodeBlock, fontCoverage: Set<number>): {
  status: CoverageStatus
  supportedCount: number
  totalCount: number
  percentage: number
  missing: number[]
} {
  const total = block.characters.length || (block.end - block.start + 1)
  if (total === 0) return { status: 'none', supportedCount: 0, totalCount: 0, percentage: 0, missing: [] }

  const supported: number[] = []
  const missing: number[] = []
  for (const c of block.characters) {
    if (fontCoverage.has(c.cp)) supported.push(c.cp)
    else missing.push(c.cp)
  }
  const pct = Math.round((supported.length / total) * 100)

  return {
    status: pct === 100 ? 'full' : pct > 0 ? 'partial' : 'none',
    supportedCount: supported.length,
    totalCount: total,
    percentage: pct,
    missing,
  }
}

export function buildCharacterGrid(
  block: UnicodeBlock,
  fonts: FontContext[],
): { char: UnicodeCharacter; renders: { font: FontContext; supported: boolean }[] }[] {
  return block.characters.map(c => ({
    char: c,
    renders: fonts.map(f => ({ font: f, supported: f.coverage.has(c.cp) })),
  }))
}

export function findGaps(
  block: UnicodeBlock,
  fonts: FontContext[],
): { char: UnicodeCharacter; disagreement: boolean }[] {
  return block.characters
    .map(c => ({
      char: c,
      disagreement: fonts.some(f => f.coverage.has(c.cp)) && fonts.some(f => !f.coverage.has(c.cp)),
    }))
    .filter(x => x.disagreement)
}

export function coverageSummary(blocks: UnicodeBlock[], fontCoverage: Set<number>): {
  full: number; partial: number; none: number; totalCodepoints: number
} {
  let full = 0, partial = 0, none = 0, totalCp = 0
  for (const b of blocks) {
    const cov = computeCoverage(b, fontCoverage)
    if (cov.status === 'full') full++
    else if (cov.status === 'partial') partial++
    else none++
    totalCp += cov.supportedCount
  }
  return { full, partial, none, totalCodepoints: totalCp }
}
