import type { FontContext, Coverage } from '../types/domain.ts'
import { findFamilyByFile } from './families-loader.ts'
import { loadCoverage } from '../unicode/coverage.ts'

const COMPARE_PALETTE = [
  '#bf4e6a',
  '#3b82f6',
  '#10b981',
  '#f59e0b',
  '#8b5cf6',
  '#06b6c4',
  '#ec4899',
  '#84cc16',
]

export async function resolveFontContexts(fileSlugs: string[]): Promise<FontContext[]> {
  const out: FontContext[] = []
  for (let i = 0; i < fileSlugs.length; i++) {
    const slug = fileSlugs[i]
    if (!slug) continue
    const family = await findFamilyByFile(slug)
    const file = family?.files.find(f => f.slug === slug)

    // Prefer the registry's coverage_file; fall back to deriving from the
    // woff path (woff/google/abel/Abel-Regular.woff → coverage/google/abel/Abel-Regular.json).
    // Last resort: the slug alone (legacy flat path).
    const coverageSpec =
      file?.coverage_file ??
      file?.path?.replace(/^woff\//, 'coverage/').replace(/\.woff$/, '.json') ??
      slug
    const coverage: Coverage | null = await loadCoverage(coverageSpec)
    if (!coverage) continue

    out.push({
      slug,
      familyName: family?.name || slug,
      fontId: `ub-${slug.replace(/[^a-z0-9]/gi, '-')}`,
      fontPath: file?.path || null,
      redistributable: file?.redistributable ?? false,
      coverage: new Set(coverage.codepoints || []),
      color: COMPARE_PALETTE[i % COMPARE_PALETTE.length],
    })
  }
  return out
}

export function parseFontSlugsFromQuery(value: unknown): string[] {
  if (typeof value !== 'string') return []
  return value
    .split(',')
    .map(s => s.trim())
    .filter(s => s.length > 0)
    .slice(0, COMPARE_PALETTE.length)
}
