// Coverage access — the single seam for "what does this font cover?".
//
// Resolves three concerns that were previously inlined across 6 callers:
//   1. Path resolution: face slug OR archive-relative path OR FontFamilyFile.
//   2. Block-name normalization: ucode emits "Basic_Latin"; the Unicode
//      registry uses "Basic Latin". One normalization rule, one place.
//   3. Per-block completeness math: covered/total/pct.
//
// Owns the coverage cache. Two callers (useCoverage, compare-context)
// previously maintained their own; both now defer to this module.
//
// See TODO.archives/19 (the original coverage_file plumbing) and the
// architecture review (candidate 02) for context.

import type { Coverage, FontFamilyFile } from '../types/domain.ts'
import { createKeyedJsonLoader, type JsonFetcher } from '../loader-factory.ts'

// ─── Block-name normalization ──────────────────────────────────
// ucode emits block names with underscores (Basic_Latin); the canonical
// Unicode registry (public/unicode-blocks.json) uses spaces (Basic Latin).
// Normalize both directions to spaces so lookups match regardless of source.

export function normalizeBlockName(name: string): string {
  return name.replace(/_/g, ' ')
}

// ─── Path resolution ───────────────────────────────────────────
// Accepts any of:
//   - a face slug ('abel')                     → coverage/abel.json (legacy flat)
//   - a full archive path ('coverage/google/abel/Abel-Regular.json')
//   - a FontFamilyFile (uses coverage_file when present, falls back to slug)
//
// Returns the path to fetch, suitable for fetchJson.

export type CoverageSpec = string | FontFamilyFile

export function coveragePath(spec: CoverageSpec): string {
  if (typeof spec !== 'string') {
    const file = spec as FontFamilyFile
    if (file.coverage_file) return file.coverage_file.replace(/^\/+/, '')
    if (file.slug) return coveragePath(file.slug)
    throw new Error('FontFamilyFile has no coverage_file or slug')
  }
  return spec.includes('/')
    ? spec.replace(/^\/+/, '')
    : `coverage/${spec}.json`
}

// ─── Loader (with shared cache) ────────────────────────────────
// One cache. Two callers used to maintain their own with identical shape;
// both now go through this. Null-on-miss so a missing file doesn't
// trigger a refetch on every page render.

const coverageLoader = createKeyedJsonLoader<Coverage>(coveragePath)

export async function loadCoverage(
  spec: CoverageSpec,
  fetcher?: JsonFetcher<Coverage>,
): Promise<Coverage | null> {
  // The keyed loader takes a string key; for FontFamilyFile we use the
  // resolved path as the key so the cache is keyed consistently.
  const key = typeof spec === 'string' ? spec : coveragePath(spec)
  return coverageLoader.load(key, fetcher)
}

export function clearCoverageCache(): void {
  coverageLoader.clear()
}

// ─── Per-block access ──────────────────────────────────────────
// Find the coverage entry for a block by name (either form). Returns
// null if the font has no data for the block.

export interface BlockCoverage {
  name: string          // canonical (space-separated) name
  range?: string
  start?: number
  end?: number
  codepoints: number[]  // covered codepoints
  covered: number
}

export function coverageForBlock(
  coverage: Coverage | null | undefined,
  blockName: string,
): BlockCoverage | null {
  if (!coverage?.blocks) return null
  const wanted = normalizeBlockName(blockName)
  const entry = coverage.blocks.find(b => normalizeBlockName(b.name) === wanted)
  if (!entry) return null
  const codepoints = entry.codepoints ?? []
  return {
    name: wanted,
    range: entry.range,
    start: entry.start,
    end: entry.end,
    codepoints,
    covered: codepoints.length,
  }
}

// ─── Completeness math ─────────────────────────────────────────
// Pure functions over a block range. No I/O. Trivially testable.

export interface BlockCompleteness {
  total: number
  covered: number
  missing: number
  pct: number            // 0..1
}

export function blockCompleteness(
  coverage: Coverage | null | undefined,
  block: { start: number; end: number; name: string },
): BlockCompleteness {
  const total = block.end - block.start + 1
  const blk = coverageForBlock(coverage, block.name)
  const covered = blk?.covered ?? 0
  return {
    total,
    covered,
    missing: Math.max(0, total - covered),
    pct: total > 0 ? covered / total : 0,
  }
}

// Bucket a 0..1 ratio into the heatmap's 5-step pastel scale.
// Kept here so any future heatmap consumer uses the same thresholds.
export type CoverageBucket = '0' | 'low' | '25' | '50' | '75' | '100' | 'unknown'

export function coverageBucket(pct: number, hasData: boolean): CoverageBucket {
  if (!hasData) return 'unknown'
  if (pct >= 0.995) return '100'
  if (pct >= 0.75)  return '75'
  if (pct >= 0.50)  return '50'
  if (pct >= 0.25)  return '25'
  if (pct > 0)      return 'low'
  return '0'
}
