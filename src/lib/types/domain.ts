/**
 * Canonical home for domain entity types.
 *
 * Loaders re-export these for back-compat. New code imports from here.
 * See TODO.unify/08-domain-model.md for the target entity model.
 */

// ---------- Formula (current shape; will split per 08-domain-model.md) ----------

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

// ---------- Font ----------

export interface FontEntry {
  canonical_name: string
  slug: string
  formulas: string[]
  style_count: number
}

export interface FontMetadataEntry {
  slug: string
  formula_path: string
  redistributable: boolean
  primary_family: string | null
  coverage_file: string
  woff2_file: string
}

export interface FontsRegistry {
  generated_at: string
  total_fonts: number
  total_formulas: number
  fonts: FontEntry[]
}

export interface FontMetadataFile {
  generated_at: string
  total_fonts: number
  redistributable: number
  fonts: FontMetadataEntry[]
}

// ---------- Markdown ----------

export interface Frontmatter {
  title?: string
  description?: string
  date?: string
  authors?: string[]
}

export interface ParsedMarkdown {
  raw: string
  frontmatter: Frontmatter
  body: string
}

// ---------- Coverage (was `any` in useCoverage.ts — AUDIT C.3) ----------

export interface CoverageVariableAxis {
  tag: string
  min: number
  max: number
  default: number
}

export interface Coverage {
  codepoints: number[]
  blocks: Array<{ name: string; supported: number; total: number }>
  variable_axes: CoverageVariableAxis[]
  opentype_features: string[]
  total_codepoints: number
  supported_blocks: string[]
}
