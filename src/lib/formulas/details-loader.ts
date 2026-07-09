import type { FormulaDetails } from '../types/domain.ts'
import { createKeyedJsonLoader, type JsonFetcher } from '../loader-factory.ts'

export type { FormulaDetails }
export type DetailsFetcher = JsonFetcher<FormulaDetails>

const formulaDetailsLoader = createKeyedJsonLoader<FormulaDetails>(
  (slug) => `details/${slug}.json`,
)

export function findFormulaDetails(
  slug: string,
  fetcher?: DetailsFetcher,
): Promise<FormulaDetails | null> {
  return formulaDetailsLoader.load(slug, fetcher)
}

export function clearDetailsCache(): void {
  formulaDetailsLoader.clear()
}
