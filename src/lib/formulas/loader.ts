import { fetchJson } from '../ssr-fetch'

export interface FormulaData {
  name: string
  formulaName: string
  slug: string
  familyCount: number
  styleCount: number
  familyNames: string[]
  sourceType: string
  platforms: string[]
  licenseType: string
  licenseCategory: string
  licenseName: string
}

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
