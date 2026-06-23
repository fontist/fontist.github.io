import type { FontContext } from '../types/domain'
import { fetchJson } from '../ssr-fetch'
import type { Coverage } from '../types/domain'
import { findFamilyByFile } from './families-loader'

const COMPARE_PALETTE = [
  '#bf4e6a',
  '#3b82f6',
  '#10b981',
  '#f59e0b',
  '#8b5cf6',
  '#06b6d4',
  '#ec4899',
  '#84cc16',
]

const coverageCache = new Map<string, Coverage | null>()

async function fetchCoverageForSlug(slug: string): Promise<Coverage | null> {
  if (coverageCache.has(slug)) return coverageCache.get(slug) ?? null
  try {
    const cov = await fetchJson<Coverage>(`coverage/${slug}.json`)
    coverageCache.set(slug, cov)
    return cov
  } catch {
    coverageCache.set(slug, null)
    return null
  }
}

export async function resolveFontContexts(fileSlugs: string[]): Promise<FontContext[]> {
  const out: FontContext[] = []
  for (let i = 0; i < fileSlugs.length; i++) {
    const slug = fileSlugs[i]
    if (!slug) continue
    const family = await findFamilyByFile(slug)
    const file = family?.files.find(f => f.slug === slug)
    const coverage = await fetchCoverageForSlug(slug)
    if (!coverage) continue
    out.push({
      slug,
      familyName: family?.name || slug,
      fontId: `ub-${slug.replace(/[^a-z0-9]/gi, '-')}`,
      fontPath: file?.path || `fonts/${slug}.woff2`,
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
