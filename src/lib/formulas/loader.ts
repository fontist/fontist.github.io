import type { FormulaData } from '../types/domain'
import { createLazyJsonLoader } from '../loader-factory.ts'

export type { FormulaData }

const allFormulasLoader = createLazyJsonLoader<FormulaData[]>('formulas-data.json')

export function loadAllFormulas(): Promise<FormulaData[]> {
  return allFormulasLoader.load()
}

export async function findFormula(slug: string): Promise<FormulaData | null> {
  const all = await loadAllFormulas()
  return all.find((f) => f.slug === slug) || null
}
