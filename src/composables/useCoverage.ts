// Backwards-compatible shim. The real logic now lives in
// src/lib/unicode/coverage.ts. New callers should import from there
// directly; this composable is kept for the existing FontSpecimen /
// FontViewer / FontUnicodeBrowser call sites that import `fetchCoverage`.
//
// Prefer: `import { loadCoverage } from '../lib/unicode/coverage'`

import { loadCoverage, type CoverageSpec } from '../lib/unicode/coverage'
import type { Coverage } from '../lib/types/domain'

export async function fetchCoverage(spec: CoverageSpec): Promise<Coverage | null> {
  return loadCoverage(spec)
}

export function clearCoverageCache(): void {
  // Delegate; the cache lives in the coverage module now.
  import('../lib/unicode/coverage').then(m => m.clearCoverageCache())
}
