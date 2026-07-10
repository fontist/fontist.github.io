// License classifier — the single seam for "which license bucket does this
// formula belong to?"
//
// Backed by the YAML matchers in public/content/licenses/index.json (the
// authoritative source for open-source licenses) plus a small set of
// fallback matchers for proprietary licenses that don't have YAML entries
// (Apple-only, Microsoft, Adobe).
//
// Three callers cross this seam:
//   - HomePage (chart bucketing)
//   - FormulaBrowser (filter facet)
//   - LicensesPage (formula count per license)
//
// Adding a new license = add a YAML file + gen-licenses-index.mjs picks it
// up. Adding a new proprietary group = add to PROP_FALLBACK_ORDER below.

import { fetchJson } from '../ssr-fetch.ts'
import type { FormulaData } from '../types/domain.ts'

export type LicenseCategory = 'open' | 'proprietary'

export interface LicenseClassification {
  /** Canonical license name from the YAML entry, or fallback bucket label. */
  bucket: string
  /** Open (permissive / copyleft / public-domain) vs proprietary. */
  category: LicenseCategory
  /** YAML slug when matched via YAML matchers; null for fallback matches. */
  slug: string | null
}

export interface LicenseIndexEntry {
  slug: string
  name: string
  short_name?: string
  spdx?: string
  category: 'permissive' | 'copyleft' | 'public-domain' | 'special'
  blurb: string
  matchers?: string[]
  exclude_matchers?: string[]
}

let indexCache: LicenseIndexEntry[] | null = null
let indexLoading: Promise<LicenseIndexEntry[]> | null = null

export async function loadLicenseIndex(): Promise<LicenseIndexEntry[]> {
  if (indexCache) return indexCache
  if (indexLoading) return indexLoading
  indexLoading = (async () => {
    try {
      indexCache = await fetchJson<LicenseIndexEntry[]>('content/licenses/index.json')
    } catch {
      indexCache = []
    }
    return indexCache!
  })()
  return indexLoading
}

export function clearLicenseIndexCache(): void {
  indexCache = null
  indexLoading = null
}

// Fallback matchers used when no YAML entry matches. The YAML covers all
// open-source licenses we know about; the fallbacks exist primarily for
// proprietary licenses that have no YAML entry (Apple-only, Microsoft,
// Adobe LICENSEREF-* families) and for the rare open-source license we
// haven't yet written a YAML file for.
const OPEN_FALLBACK_ORDER: { bucket: string; test: (n: string) => boolean }[] = [
  { bucket: 'SIL Open Font License',         test: n => n.includes('open font license') || n === 'ofl' || n.startsWith('ofl-1') },
  { bucket: 'Apache License 2.0',            test: n => n.includes('apache') },
  { bucket: 'IPA Font License',              test: n => n.includes('ipa font') },
  { bucket: 'CC0 / Public Domain',           test: n => n.includes('creative commons zero') || n.includes('cc0') || n.includes('public domain') || n.includes('publicdomain') },
  { bucket: 'Ubuntu Font Licence',           test: n => n.includes('ubuntu font') },
  { bucket: 'GNU GPL (with Font Exception)', test: n => n.includes('gnu gpl') || n.includes('lppl') },
]

const PROP_FALLBACK_ORDER: { bucket: string; test: (n: string) => boolean }[] = [
  { bucket: 'Apple-only', test: n => n.includes('apple') },
  { bucket: 'Microsoft',  test: n => n.includes('microsoft') },
  { bucket: 'Adobe',      test: n => n.includes('adobe') },
]

function normalizeName(raw: string | undefined): string {
  return (raw || 'Unknown').replace(/^LICENSEREF-/i, '').toLowerCase()
}

export async function classifyFormula(f: FormulaData): Promise<LicenseClassification> {
  const name = normalizeName(f.licenseName)
  const isOpen = f.licenseCategory === 'open_source'

  // 1. Try YAML matchers — the authoritative source.
  const index = await loadLicenseIndex()
  for (const lic of index) {
    if (!lic.matchers || lic.matchers.length === 0) continue
    const matched = lic.matchers.some(m => name.includes(m.toLowerCase()))
    if (!matched) continue
    if (lic.exclude_matchers?.some(m => name.includes(m.toLowerCase()))) continue
    return { bucket: lic.name, category: isOpen ? 'open' : 'proprietary', slug: lic.slug }
  }

  // 2. Fall back to structural matchers.
  const fallbacks = isOpen ? OPEN_FALLBACK_ORDER : PROP_FALLBACK_ORDER
  for (const m of fallbacks) {
    if (m.test(name)) return { bucket: m.bucket, category: isOpen ? 'open' : 'proprietary', slug: null }
  }

  // 3. Final catch-all.
  return {
    bucket: isOpen ? 'Other open source' : 'Other proprietary',
    category: isOpen ? 'open' : 'proprietary',
    slug: null,
  }
}

export interface BucketResult {
  open: { bucket: string; count: number; slug: string | null }[]
  proprietary: { bucket: string; count: number; slug: string | null }[]
}

/** Classify every formula and group by bucket. Sorted by count descending. */
export async function bucketFormulas(formulas: FormulaData[]): Promise<BucketResult> {
  const open = new Map<string, { count: number; slug: string | null }>()
  const prop = new Map<string, { count: number; slug: string | null }>()

  for (const f of formulas) {
    const c = await classifyFormula(f)
    const m = c.category === 'open' ? open : prop
    const existing = m.get(c.bucket)
    if (existing) existing.count++
    else m.set(c.bucket, { count: 1, slug: c.slug })
  }

  const toList = (m: Map<string, { count: number; slug: string | null }>) =>
    [...m.entries()]
      .map(([bucket, v]) => ({ bucket, count: v.count, slug: v.slug }))
      .sort((a, b) => b.count - a.count)

  return { open: toList(open), proprietary: toList(prop) }
}

/**
 * Test whether a formula matches a specific license entry from the index.
 * Used by LicensesPage to count formulas per license.
 *
 * Async version — loads the index on first call. Use this when you don't
 * already have the LicenseIndexEntry in hand.
 */
export async function formulaMatchesLicense(f: FormulaData, lic: LicenseIndexEntry): Promise<boolean> {
  return formulaMatchesLicenseSync(f, lic)
}

/**
 * Sync version — call when the caller already has the LicenseIndexEntry
 * (e.g., iterating over an already-loaded list). Same matching semantics
 * as the async version.
 */
export function formulaMatchesLicenseSync(f: FormulaData, lic: LicenseIndexEntry): boolean {
  if (!lic.matchers || lic.matchers.length === 0) return false
  const name = normalizeName(f.licenseName)
  const matched = lic.matchers.some(m => name.includes(m.toLowerCase()))
  if (!matched) return false
  if (lic.exclude_matchers?.some(m => name.includes(m.toLowerCase()))) return false
  return true
}
