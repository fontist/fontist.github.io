# 08 — Domain model

Spec date: 2026-06-23. Status: **P0 design** (not yet implemented). Implements AUDIT §A
and §G.

## Problem this solves

Today the codebase has two domain entities (`FormulaData`, `FontMetadataEntry`)
for a world that has five. Consequences:

- `/font/yu` renders the formula named "Yu" — which bundles 10 families (Yu
  Mincho, Yu Gothic, ...). The family has no page of its own.
- `FontMetadataEntry` is a font **file** (one binary on disk) but its slug is
  treated as a family slug. Two formulas that ship "Roboto" race for the slug;
  the loser disappears.
- There is no inverse index. "Which fonts cover Latin Extended-A?" requires
  scanning every coverage file.
- "Style" is a string in `familyNames[]`. A variable font's named instances
  (Thin / Light / Regular / Black) cannot be addressed, deep-linked, or
  compared.

## Five entities, MECE

```
Formula ──provides──→ FontFamily ──has──→ Style ──renders──→ FontFile
                       │                                      │
                       └──────── covered_by ────────── Coverage
```

| Entity       | What it is                                   | Cardinality | Current model            |
|---|---|---|---|
| **Formula**  | Recipe that fetches/installs a set of fonts  | 1           | `FormulaData`            |
| **FontFamily** | A named typographic family (e.g., Roboto)  | N per Formula | (conflated with Formula) |
| **Style**    | A single weight/width/slope within a family  | N per Family | `string` in `familyNames[]` |
| **FontFile** | One binary font file on disk (one .ttf/.otf/.woff2) | 1 per Style per Format | `FontMetadataEntry` |
| **Coverage** | Unicode block + feature coverage of a file   | 1 per FontFile | loose JSON in `public/coverage/` |

MECE check: each cell is mutually exclusive (a Formula is never a Family; a Style
is never a File) and collectively exhaustive (every URL the site renders maps to
exactly one of these entities).

## Entity: Formula

```ts
export interface Formula {
  readonly slug: string               // unique, kebab-case
  readonly name: string               // display name ("Yu", "Roboto")
  readonly description?: string
  readonly sourceType: 'github' | 'url' | 'archive' | 'package'
  readonly platforms: readonly Platform[]
  readonly license: LicenseRef        // { spdxId, name, url }
  readonly provides: readonly FamilyRef[]   // families this formula ships
  readonly attributes: Readonly<Record<string, string | number>>
}

export interface FamilyRef {
  readonly slug: string               // family slug, unique within Formula
  readonly displayName: string        // "Roboto", "Yu Mincho"
}
```

**Invariants:**
- A formula's `slug` is globally unique.
- `provides` is non-empty (an empty formula installs nothing).
- `license` is a single SPDX identifier; multi-license formulas are split at
  ingestion or modeled as a `LicenseSet`.

## Entity: FontFamily

```ts
export interface FontFamily {
  readonly slug: string               // globally unique across all formulas
  readonly displayName: string
  readonly styles: readonly StyleRef[]
  readonly availableFrom: readonly FormulaRef[]   // inverse of Formula.provides
  readonly defaultCoverage?: CoverageSummary
}

export interface StyleRef {
  readonly slug: string               // "regular", "bold", "thin"
  readonly displayName: string
  readonly isVariable: boolean
  readonly axes?: readonly AxisRef[]  // present iff isVariable
  readonly namedInstances?: readonly NamedInstanceRef[]
}

export interface FormulaRef {
  readonly slug: string               // formula slug
  readonly displayName: string
}
```

**Invariants:**
- `slug` is globally unique. When two formulas ship "Roboto", the family slug
  is `roboto`; each formula appears in `availableFrom`. (Today the slug race
  makes one invisible.)
- `styles` is non-empty.

## Entity: Style

```ts
export interface Style {
  readonly familySlug: string
  readonly slug: string                // unique within family
  readonly displayName: string         // "Regular", "Bold Italic"
  readonly weight?: number             // 100..900
  readonly italic?: boolean
  readonly width?: number              // per-axis value when variable
  readonly files: readonly FontFileRef[]   // per format (.ttf, .woff2, ...)
  readonly namedInstances?: readonly NamedInstance[]   // iff variable
}

export interface FontFileRef {
  readonly format: 'ttf' | 'otf' | 'woff2'
  readonly path: string                // resolved at fetch time
}
```

## Entity: FontFile

```ts
export interface FontFile {
  readonly id: string                  // hash of path + mtime
  readonly format: 'ttf' | 'otf' | 'woff2'
  readonly path: string                // canonical path
  readonly sizeBytes: number
  readonly sha256?: string
  readonly familySlug: string          // inverse link
  readonly styleSlug: string           // inverse link
  readonly coverage: CoverageSummary   // 1-to-1
}
```

## Entity: Coverage

```ts
export interface CoverageSummary {
  readonly totalCodepoints: number
  readonly supportedBlocks: readonly string[]     // block slugs
  readonly opentypeFeatures: readonly string[]    // 'liga', 'kern', ...
  readonly variableAxes?: readonly AxisSummary[]  // iff variable
}

export interface AxisSummary {
  readonly tag: string                 // 'wght', 'wdth', ...
  readonly min: number
  readonly max: number
  readonly default: number
}
```

## Cross-links (the matrix)

For every pair of entities, the site must answer both directions in O(1):

| From → To          | Field                            | Index file                          |
|---|---|---|
| Formula → Family   | `Formula.provides[]`             | `formulas-data.json` (existing)     |
| Family → Formula   | `FontFamily.availableFrom[]`     | `families-index.json` (new)         |
| Family → Style     | `FontFamily.styles[]`            | `families-index.json`               |
| Style → File       | `Style.files[]`                  | `families/<slug>.json`              |
| File → Coverage    | `FontFile.coverage`              | `coverage/<slug>.json` (existing)   |
| **Block → Family** | `block-coverage/<block>.json`    | **new** — highest-value gap (G.3)   |
| **Block → File**   | (subset of Block → Family)       | same file                           |

**`block-coverage/<blockSlug>.json`** is the single most useful missing index.
Today `/unicode/block/basic-latin` shows characters but never answers "which
fonts cover this?". With the reverse index, the page renders a sidebar of
families by descending codepoint count in that block.

Build cost: O(N×M) where N = 4,283 files, M ≈ 100 blocks each. Trivial at SSG
time. Stale only when upstream coverage changes (rebuild from
`scripts/fetch-data.sh`).

## Slug conventions

- **Formula slug:** kebab-case of formula name. `Yu` → `yu`.
- **Family slug:** kebab-case of family name. **Globally unique** (today it is
  not). Collisions resolved by `FontFamily.availableFrom[]` carrying every
  contributing formula.
- **Style slug:** kebab-case of style name within family. `Bold Italic` →
  `bold-italic`. Variable instances: `thin`, `light`, `regular`, `medium`,
  `semibold`, `bold`, `black`.
- **Format suffix:** not in the URL. Format is a query param or a header
  negotiation (`?format=woff2`).

## URL structure

| URL                                             | Entity rendered        |
|---|---|
| `/formula/:formulaSlug`                         | Formula                |
| `/fonts`                                        | FontFamily index       |
| `/fonts/:familySlug`                            | FontFamily             |
| `/fonts/:familySlug/styles/:styleSlug`          | Style (deep-link)      |
| `/fonts/:familySlug/from/:formulaSlug`          | FontFamily scoped to one formula |
| `/fonts/:familySlug/unicode`                    | Coverage for family    |
| `/fonts/:familySlug/unicode/:blockSlug`         | Coverage scoped to block |
| `/unicode/block/:blockSlug`                     | Unicode block + **sidebar of covering families** |
| `/browse`                                       | Formula index (alias of `/formulas`, see G.2) |

### Migration

Today's `/font/:slug` route serves `findFormula(s)`. Two-phase migration:

**Phase 1 (no rename):** Add `/fonts/:familySlug` and `/fonts/:familySlug/from/:formulaSlug`
alongside `/font/:slug`. Internally, `/font/:slug` becomes an alias that:

1. Looks up the family by slug.
2. If only one formula provides it, redirects (302) to `/fonts/:familySlug`.
3. If multiple, redirects to `/fonts/:familySlug/from/:formulaSlug` for the
   first formula (deterministic sort).

**Phase 2 (rename):** Once analytics confirm no traffic to `/font/:slug`, the
route is removed. Per AUDIT G.1, singular `/font` reads wrong for a family
collection.

**Phase 3 (block cross-link):** `/unicode/block/:blockSlug` gets the
sidebar. No URL change; pure additive.

## Source-of-truth files

All files live in `public/`. Generated by `scripts/fetch-data.sh` (upstream
data) and `scripts/gen-indexes.mjs` (derived indexes).

| File                                | Source        | Purpose                          |
|---|---|---|
| `formulas-data.json`                | upstream      | Formula records                  |
| `families-index.json`               | derived       | Family → Formulas inverse, style list |
| `families/<familySlug>.json`        | derived       | Full family record (styles, files) |
| `coverage/<familySlug>.json`        | upstream      | Per-file coverage                |
| `block-coverage/<blockSlug>.json`   | derived       | Reverse index: block → families  |
| `font-metadata.json`                | upstream      | Raw font file metadata (cache only) |

`font-metadata.json` is a build cache, not a query target. The derived
`families/` and `families-index.json` are the canonical sources.

## TypeScript home

All five entity interfaces live in `src/lib/types/domain.ts` (AUDIT C.1). Loaders
re-export the types for back-compat:

```ts
// src/lib/types/domain.ts — canonical
export interface Formula { ... }
export interface FontFamily { ... }
export interface Style { ... }
export interface FontFile { ... }
export interface CoverageSummary { ... }

// src/lib/formulas/loader.ts
import type { Formula } from '../types/domain'
export type { Formula }
```

This resolves the type fragmentation in AUDIT C.1, C.2, C.3 in one move.

## What this unblocks

- **AUDIT A.1, A.2, A.3, A.4** — entity separation, no conflation, inverse
  indexes.
- **AUDIT G.1, G.2, G.3, G.4** — plural URLs, `/browse` → `/formulas` clarity,
  Unicode → Fonts cross-link, variable-font style deep-links.
- **AUDIT C.1** — domain types in one file.
- **Compare feature** — `/compare/:familyA,:familyB/:blockSlug` becomes a
  trivial sidebar-swap.
- **Search** — family slug is the stable key across formulas.

## What this does NOT do

- Does not change the upstream `formulas-data.json` schema. All derivation
  happens in our build.
- Does not require a database. Everything is static JSON; the build cost is
  linear.
- Does not touch the `fontist/fontist` or `fontist/formulas` repos.

## Open questions for user

1. **Collision policy.** When two formulas ship "Roboto" with different files
   (different upstreams, different versions), is `roboto` a single family with
   multiple `availableFrom` entries, or `roboto` + `roboto-google` + `roboto-alt`?
   The spec above assumes the former.

2. **Variable instance URLs.** `/fonts/inter/styles/black` or
   `/fonts/inter/styles/wght-900`? The former is human-friendly; the latter is
   mechanically derivable from the axis.

3. **`/browse` rename.** Confirm the transition plan: add `/formulas` as the
   primary, keep `/browse` as 302 alias for 90 days, then remove.
