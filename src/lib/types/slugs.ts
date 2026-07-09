// Branded slug types — prevents cross-assignment of semantically
// different slug strings (formula slug vs. font slug vs. license slug).
//
// Branded types are structurally identical to `string` at runtime but
// the compiler treats them as incompatible, catching bugs where e.g.
// a license slug is passed where a formula slug is expected.
//
// Use the constructor functions (fontSlug(), formulaSlug(), etc.) to
// create branded slugs from raw strings. Use `.toString()` or just pass
// to string params at I/O edges (router, URLs).
//
// See architecture review candidate 05.

export type FontSlug = string & { readonly __brand: 'FontSlug' }
export type FamilySlug = string & { readonly __brand: 'FamilySlug' }
export type FormulaSlug = string & { readonly __brand: 'FormulaSlug' }
export type LicenseSlug = string & { readonly __brand: 'LicenseSlug' }
export type GuideTopicSlug = string & { readonly __brand: 'GuideTopicSlug' }
export type BlockSlug = string & { readonly __brand: 'BlockSlug' }

export function fontSlug(s: string): FontSlug {
  return s as FontSlug
}

export function familySlug(s: string): FamilySlug {
  return s as FamilySlug
}

export function formulaSlug(s: string): FormulaSlug {
  return s as FormulaSlug
}

export function licenseSlug(s: string): LicenseSlug {
  return s as LicenseSlug
}

export function guideTopicSlug(s: string): GuideTopicSlug {
  return s as GuideTopicSlug
}

export function blockSlug(s: string): BlockSlug {
  return s as BlockSlug
}

// Type guard: is this string a valid slug shape? (lowercase, no spaces)
export function isValidSlugShape(s: string): boolean {
  return /^[a-z0-9][a-z0-9_./-]*$/i.test(s)
}
