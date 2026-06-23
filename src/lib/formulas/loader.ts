import { fetchJson } from '../ssr-fetch'
import type { FormulaData } from '../types/domain'

export type { FormulaData }

let cache: FormulaData[] | null = null

export async function loadAllFormulas(): Promise<FormulaData[]> {
  if (cache) return cache
  cache = await fetchJson<FormulaData[]>('formulas-data.json')
  return cache
}

export async function findFormula(slug: string): Promise<FormulaData | null> {
  const all = await loadAllFormulas()
  return all.find((f) => f.slug === slug) || null
}
