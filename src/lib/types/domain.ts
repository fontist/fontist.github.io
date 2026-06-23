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

// ---------- Font rendering context ----------
// Lives in the fonts domain (not lib/unicode/types) because it carries font
// identity + a coverage set. The unicode grid component accepts it as a prop
// (rendering concern), which is why the dependency direction is fonts → unicode,
// not the reverse.

export interface FontContext {
  slug: string
  familyName: string
  fontId: string
  fontPath: string | null
  redistributable: boolean
  coverage: Set<number>
  color: string
}

// ---------- Coverage (was `any` in useCoverage.ts — AUDIT C.3) ----------
// Shape pinned to actual fontist-archive output (scripts/fetch-data.sh).
// `blocks`, `variable_axes`, `opentype_features`, `total_blocks` are
// optional — non-variable fonts (the common case) omit them.

export interface CoverageBlock {
  name: string
  range: string
  start: number
  end: number
  codepoints: number[]
}

export interface CoverageVariableAxis {
  tag: string
  name: string
  min: number
  default: number
  max: number
}

export interface CoverageFeature {
  tag: string
  name: string
}

export interface CoveragePlanes {
  bmp: boolean
  smp: boolean
  sip: boolean
}

export interface Coverage {
  slug: string
  redistributable: boolean
  total_codepoints: number
  supported_blocks: number
  total_blocks?: number
  planes: CoveragePlanes
  codepoints: number[]
  blocks?: CoverageBlock[]
  variable_axes?: CoverageVariableAxis[]
  opentype_features?: CoverageFeature[]
}
