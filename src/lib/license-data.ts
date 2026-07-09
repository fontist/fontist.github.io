// License metadata — the design-coded data that drives the licenses
// reference pages. Each license has permissions (can I...?), a short
// blurb, comparison links to siblings, and a few notable font examples.
//
// Permissions matrix uses 12 use-case keys (see PermissionsMatrix.vue):
//   commercial-static, commercial-web, commercial-app, commercial-server,
//   open-source, modification, redistribute, standalone-sale,
//   embed-document, subsetting, rename, attribution
// Values: 'yes' | 'conditional' | 'no'

import type { LicenseName } from './license-matchers'

export type Answer = 'yes' | 'conditional' | 'no'

export type PermissionsMatrix = Partial<Record<
  'commercial-static' | 'commercial-web' | 'commercial-app' | 'commercial-server'
  | 'open-source' | 'modification' | 'redistribute' | 'standalone-sale'
  | 'embed-document' | 'subsetting' | 'rename' | 'attribution',
  Answer
>>

export type LicenseCategory = 'permissive' | 'copyleft' | 'public-domain' | 'special'

export interface LicenseMeta {
  slug: string                    // canonical URL slug (matches existing markdown filename)
  name: string
  shortName?: string
  spdx?: string
  version?: string
  yearAdopted?: string
  category: LicenseCategory
  blurb: string                                  // short tagline
  permissions: PermissionsMatrix
  siblings?: string[]                            // slugs of related licenses to compare against
  examples?: { name: string; note?: string }[]   // well-known fonts using this license
  // Matcher moved to license-matchers.ts; referenced by slug here.
  // Use LICENSE_MATCHERS[meta.slug] to get the predicate.
}

const P = (...vals: [string, Answer][]): PermissionsMatrix =>
  Object.fromEntries(vals) as PermissionsMatrix

export const LICENSES: LicenseMeta[] = [
  // ── Permissive ──────────────────────────────────────────────
  {
    slug: 'ofl',
    name: 'SIL Open Font License 1.1',
    shortName: 'OFL',
    spdx: 'OFL-1.1',
    version: '1.1',
    yearAdopted: '2005',
    category: 'permissive',
    blurb: 'The workhorse font license: free to use, modify, embed, and redistribute — with attribution and no standalone sale.',
    permissions: P(
      ['commercial-static', 'yes'],
      ['commercial-web',    'yes'],
      ['commercial-app',    'yes'],
      ['commercial-server', 'yes'],
      ['open-source',       'yes'],
      ['modification',      'conditional'],   // may not use Reserved Font Name
      ['redistribute',      'conditional'],   // must include OFL text
      ['standalone-sale',   'no'],            // can't sell the font alone
      ['embed-document',    'yes'],
      ['subsetting',        'yes'],
      ['rename',            'conditional'],   // may not use Reserved Font Name
      ['attribution',       'conditional'],   // credit + license file
    ),
    siblings: ['apache', 'mit', 'ufl', 'ipa'],
    examples: [
      { name: 'Roboto',        note: 'Google\'s signature UI sans' },
      { name: 'Source Sans 3', note: 'Adobe\'s open-source workhorse' },
      { name: 'IBM Plex Sans', note: 'IBM\'s corporate family' },
      { name: 'Inter',         note: 'Popular UI font by Rasmus Andersson' },
      { name: 'Crimson Pro',   note: 'Open-source serif' },
    ],
  },

  {
    slug: 'apache',
    name: 'Apache License 2.0',
    shortName: 'Apache 2.0',
    spdx: 'Apache-2.0',
    version: '2.0',
    yearAdopted: '2004',
    category: 'permissive',
    blurb: 'A general-purpose open-source license adopted by several type foundries; permissive but requires explicit attribution.',
    permissions: P(
      ['commercial-static', 'yes'],
      ['commercial-web',    'yes'],
      ['commercial-app',    'yes'],
      ['commercial-server', 'yes'],
      ['open-source',       'yes'],
      ['modification',      'yes'],
      ['redistribute',      'conditional'],   // include LICENSE + NOTICE
      ['standalone-sale',   'no'],
      ['embed-document',    'yes'],
      ['subsetting',        'yes'],
      ['rename',            'yes'],
      ['attribution',       'conditional'],   // NOTICE file required
    ),
    siblings: ['mit', 'ofl', 'bsd'],
    examples: [
      { name: 'Inter (older versions)', note: 'Pre-2024 versions under OFL, newer under Apache' },
      { name: 'Roboto Flex',            note: 'Google\'s variable font extension' },
      { name: 'Cascadia Code',          note: 'Microsoft\'s developer font' },
    ],
  },

  {
    slug: 'mit',
    name: 'MIT License',
    shortName: 'MIT',
    spdx: 'MIT',
    version: '(unspecified)',
    yearAdopted: '1988',
    category: 'permissive',
    blurb: 'The shortest permissive license: do anything, just keep the copyright notice. Occasionally adopted for fonts.',
    permissions: P(
      ['commercial-static', 'yes'],
      ['commercial-web',    'yes'],
      ['commercial-app',    'yes'],
      ['commercial-server', 'yes'],
      ['open-source',       'yes'],
      ['modification',      'yes'],
      ['redistribute',      'conditional'],   // include copyright + license text
      ['standalone-sale',   'no'],
      ['embed-document',    'yes'],
      ['subsetting',        'yes'],
      ['rename',            'yes'],
      ['attribution',       'conditional'],   // preserve copyright notice
    ),
    siblings: ['apache', 'bsd', 'ofl'],
    examples: [
      { name: 'Hack',         note: 'Powerline-friendly coding font' },
      { name: 'Fira Code',    note: 'Mozilla\'s ligature-rich coding font (dual MIT + OFL)' },
    ],
  },

  {
    slug: 'bsd',
    name: 'BSD License (3-Clause)',
    shortName: 'BSD-3',
    spdx: 'BSD-3-Clause',
    version: '(unspecified)',
    yearAdopted: '1990s',
    category: 'permissive',
    blurb: 'Like MIT but with a non-endorsement clause — you can\'t use the author\'s name to promote derived works.',
    permissions: P(
      ['commercial-static', 'yes'],
      ['commercial-web',    'yes'],
      ['commercial-app',    'yes'],
      ['commercial-server', 'yes'],
      ['open-source',       'yes'],
      ['modification',      'yes'],
      ['redistribute',      'conditional'],   // copyright + non-endorsement
      ['standalone-sale',   'no'],
      ['embed-document',    'yes'],
      ['subsetting',        'yes'],
      ['rename',            'yes'],
      ['attribution',       'conditional'],   // + non-endorsement
    ),
    siblings: ['mit', 'apache', 'ofl'],
    examples: [],
  },

  {
    slug: 'ufl',
    name: 'Ubuntu Font Licence 1.0',
    shortName: 'UFL',
    spdx: 'Ubuntu-font-1.0',
    version: '1.0',
    yearAdopted: '2010',
    category: 'permissive',
    blurb: 'Ubuntu\'s font license, written to be OFL-compatible while addressing bundled-binary use cases common in Linux distros.',
    permissions: P(
      ['commercial-static', 'yes'],
      ['commercial-web',    'yes'],
      ['commercial-app',    'yes'],
      ['commercial-server', 'yes'],
      ['open-source',       'yes'],
      ['modification',      'conditional'],
      ['redistribute',      'conditional'],   // include licence + copyright
      ['standalone-sale',   'no'],
      ['embed-document',    'yes'],
      ['subsetting',        'yes'],
      ['rename',            'conditional'],
      ['attribution',       'conditional'],
    ),
    siblings: ['ofl'],
    examples: [
      { name: 'Ubuntu',      note: 'Default Ubuntu system font' },
      { name: 'Ubuntu Mono', note: 'Monospace companion to Ubuntu' },
      { name: 'Ubuntu Sans', note: 'Variable-axis replacement for Ubuntu' },
    ],
  },

  {
    slug: 'ipa',
    name: 'IPA Font License',
    shortName: 'IPA',
    spdx: 'IPA',
    version: '1.0',
    yearAdopted: '2007',
    category: 'permissive',
    blurb: 'A font-specific license from the Japanese Information-technology Promotion Agency, broadly OFL-compatible.',
    permissions: P(
      ['commercial-static', 'yes'],
      ['commercial-web',    'yes'],
      ['commercial-app',    'yes'],
      ['commercial-server', 'yes'],
      ['open-source',       'yes'],
      ['modification',      'conditional'],
      ['redistribute',      'conditional'],
      ['standalone-sale',   'no'],
      ['embed-document',    'yes'],
      ['subsetting',        'yes'],
      ['rename',            'conditional'],
      ['attribution',       'conditional'],
    ),
    siblings: ['ofl'],
    examples: [
      { name: 'IPAex Gothic', note: 'IPA\'s open-source Japanese gothic font' },
      { name: 'IPAex Mincho', note: 'IPA\'s open-source Japanese mincho font' },
    ],
  },

  {
    slug: 'bitstream',
    name: 'Bitstream Vera License',
    shortName: 'Bitstream',
    spdx: 'Bitstream-Vera',
    version: '1.0',
    yearAdopted: '2003',
    category: 'permissive',
    blurb: 'A precursor to OFL, designed for Bitstream\'s Vera family; still used by derivative works like DejaVu.',
    permissions: P(
      ['commercial-static', 'yes'],
      ['commercial-web',    'yes'],
      ['commercial-app',    'yes'],
      ['commercial-server', 'yes'],
      ['open-source',       'yes'],
      ['modification',      'conditional'],
      ['redistribute',      'conditional'],   // include copyright + license
      ['standalone-sale',   'no'],
      ['embed-document',    'yes'],
      ['subsetting',        'yes'],
      ['rename',            'yes'],
      ['attribution',       'conditional'],
    ),
    siblings: ['ofl', 'mit'],
    examples: [
      { name: 'DejaVu Sans',  note: 'Widely-installed Linux system font' },
      { name: 'DejaVu Sans Mono', note: 'Console-friendly monospace variant' },
    ],
  },

  {
    slug: 'gust',
    name: 'GUST Font Source License',
    shortName: 'GUST',
    spdx: 'GUST-FONT-Source-License',
    version: '2006-09-30',
    yearAdopted: '2006',
    category: 'permissive',
    blurb: 'Polish TeX Users Group license for TeX Gyre; broadly OFL-equivalent but with custom attribution language.',
    permissions: P(
      ['commercial-static', 'yes'],
      ['commercial-web',    'yes'],
      ['commercial-app',    'yes'],
      ['commercial-server', 'yes'],
      ['open-source',       'yes'],
      ['modification',      'conditional'],
      ['redistribute',      'conditional'],
      ['standalone-sale',   'no'],
      ['embed-document',    'yes'],
      ['subsetting',        'yes'],
      ['rename',            'conditional'],
      ['attribution',       'conditional'],
    ),
    siblings: ['ofl'],
    examples: [
      { name: 'TeX Gyre Pagella', note: 'GUST\'s Palatino-derived family' },
      { name: 'TeX Gyre Schola',  note: 'GUST\'s New Century Schoolbook derivative' },
      { name: 'TeX Gyre Termes',  note: 'GUST\'s Times New Roman derivative' },
    ],
  },

  {
    slug: 'cc0',
    name: 'Creative Commons Zero (Public Domain)',
    shortName: 'CC0',
    spdx: 'CC0-1.0',
    version: '1.0',
    yearAdopted: '2009',
    category: 'public-domain',
    blurb: 'A legal tool that dedicates work to the public domain — no attribution required, no restrictions at all.',
    permissions: P(
      ['commercial-static', 'yes'],
      ['commercial-web',    'yes'],
      ['commercial-app',    'yes'],
      ['commercial-server', 'yes'],
      ['open-source',       'yes'],
      ['modification',      'yes'],
      ['redistribute',      'yes'],
      ['standalone-sale',   'yes'],            // no restriction at all
      ['embed-document',    'yes'],
      ['subsetting',        'yes'],
      ['rename',            'yes'],
      ['attribution',       'yes'],            // attribution is optional / appreciated
    ),
    siblings: ['public-domain', 'mit', 'ofl'],
    examples: [
      { name: 'Noto Emoji',     note: 'Google\'s monochrome emoji set' },
      { name: 'Noto Color Emoji', note: 'Google\'s color emoji set' },
      { name: 'Creepster',     note: 'Google\'s free Halloween display font' },
    ],
  },

  {
    slug: 'cc-by',
    name: 'Creative Commons Attribution 4.0',
    shortName: 'CC BY 4.0',
    spdx: 'CC-BY-4.0',
    version: '4.0',
    yearAdopted: '2013',
    category: 'permissive',
    blurb: 'A general-purpose license borrowed from creative work; permissive for fonts but requires explicit attribution.',
    permissions: P(
      ['commercial-static', 'yes'],
      ['commercial-web',    'yes'],
      ['commercial-app',    'yes'],
      ['commercial-server', 'yes'],
      ['open-source',       'yes'],
      ['modification',      'yes'],
      ['redistribute',      'conditional'],   // attribution + changes noted
      ['standalone-sale',   'no'],
      ['embed-document',    'yes'],
      ['subsetting',        'yes'],
      ['rename',            'yes'],
      ['attribution',       'conditional'],   // required in source + binary distributions
    ),
    siblings: ['cc-by-sa', 'mit', 'ofl'],
    examples: [],
  },

  // ── Copyleft ────────────────────────────────────────────────
  {
    slug: 'lgpl',
    name: 'GNU LGPL (with font exception)',
    shortName: 'LGPL',
    spdx: 'LGPL-3.0-or-later',
    version: '3.0',
    yearAdopted: '1999',
    category: 'copyleft',
    blurb: 'A library-style copyleft license with explicit font-embedding exception; mostly used for the Ghostscript font collection.',
    permissions: P(
      ['commercial-static', 'yes'],
      ['commercial-web',    'yes'],
      ['commercial-app',    'yes'],            // embedded, not linked
      ['commercial-server', 'yes'],
      ['open-source',       'conditional'],   // copyleft applies to modifications
      ['modification',      'conditional'],   // must release under LGPL
      ['redistribute',      'conditional'],   // include license + source for mods
      ['standalone-sale',   'no'],
      ['embed-document',    'yes'],
      ['subsetting',        'yes'],
      ['rename',            'yes'],
      ['attribution',       'conditional'],
    ),
    siblings: ['gpl'],
    examples: [
      { name: 'URW++ Base 35',   note: 'Ghostscript\'s 35-font PS replacement set' },
      { name: 'Liberation Sans', note: 'Red Hat\'s metrics-compatible Arial substitute' },
    ],
  },

  {
    slug: 'gpl',
    name: 'GNU GPL (with font exception)',
    shortName: 'GPL',
    spdx: 'GPL-3.0-or-later',
    version: '3.0',
    yearAdopted: '2007',
    category: 'copyleft',
    blurb: 'Strong copyleft with explicit font embedding exception; rare for fonts but seen in a few historical distributions.',
    permissions: P(
      ['commercial-static', 'yes'],
      ['commercial-web',    'yes'],
      ['commercial-app',    'yes'],            // embedded, not linked
      ['commercial-server', 'yes'],
      ['open-source',       'conditional'],   // full GPL share-alike
      ['modification',      'conditional'],   // must release under GPL
      ['redistribute',      'conditional'],   // include license + source
      ['standalone-sale',   'no'],
      ['embed-document',    'yes'],
      ['subsetting',        'yes'],
      ['rename',            'yes'],
      ['attribution',       'conditional'],
    ),
    siblings: ['lgpl'],
    examples: [],
  },
]

// ── Lookup helpers ─────────────────────────────────────────────

export const LICENSE_BY_SLUG: Record<string, LicenseMeta> = (() => {
  const out: Record<string, LicenseMeta> = {}
  for (const l of LICENSES) {
    const keys = [
      l.slug,
      slugify(l.name),
      l.spdx?.toLowerCase(),
      l.shortName?.toLowerCase(),
    ].filter((k): k is string => !!k)
    for (const k of keys) out[k] = l
  }
  return out
})()

export function findLicense(slug: string): LicenseMeta | undefined {
  return LICENSE_BY_SLUG[slug]
}

export function slugify(name: string): string {
  return name
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '')
}

import { LICENSE_MATCHERS } from './license-matchers'

export function getFormulaCountForLicense(
  licenseMeta: LicenseMeta,
  formulas: { licenseName?: string }[]
): number {
  const match = LICENSE_MATCHERS[licenseMeta.slug]
  if (!match) return 0
  return formulas.filter(f => match(f.licenseName)).length
}

// Used by licenses index page — how many formulas per category, per license.
export function formulasByLicenseCategory(
  formulas: { licenseName?: string }[]
): Record<LicenseCategory, LicenseMeta[]> {
  const result: Record<LicenseCategory, LicenseMeta[]> = {
    permissive: [], copyleft: [], 'public-domain': [], special: [],
  }
  for (const lic of LICENSES) {
    result[lic.category].push(lic)
  }
  return result
}