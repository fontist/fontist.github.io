# 12 — UCD XML pipeline

Spec for `scripts/gen-unicode-data.mjs`. Implements the fix for AUDIT §L.

## Goal

One command rebuilds every Unicode data file under `public/unicode/` and
`public/unicode-blocks.json` from a single canonical upstream source. Removes
the long-standing "data committed with no regeneration script" problem
documented in `11-unicode-data-provenance.md`.

## Canonical source

`https://www.unicode.org/Public/<VERSION>/ucdxml/ucd.all.flat.zip`

- `VERSION` defaults to `17.0.0` (latest at time of writing, released 2025).
- Override with `--unicode-version=<x.y.z>` for reproducible older builds.
- The zip contains a single `ucd.all.flat.xml` file (~30 MB uncompressed).

The `flat` variant expands character ranges to one `<char>` per codepoint when
needed and groups `<char>` records with identical attributes into `<char
first="..." last="...">` range elements when possible. The pipeline handles
both forms.

## Field mapping (UCD XML → our JSON)

Backward compatibility: the per-block JSON shape is unchanged.

| UCD XML attribute | Our JSON field | Transform                                            |
|---|---|---|
| `cp`              | `cp`   | hex string `"0041"` → decimal number `65`             |
| `na` (or `na1`)   | `n`    | string, fallback to `na1` when `na` is empty          |
| `gc`              | `c`    | string                                                |
| `sc`              | `s`    | string                                                |
| `bc`              | `bc`   | string                                                |
| `ccc`             | `cc`   | included only when non-zero (decimal string `"230"`)  |
| `mir`             | `mir`  | `"Y"` → `true`; `"N"` → omit field                    |
| `dm`              | `dm`   | string with `<tag>` prefix preserved (`"<noBreak> 0020"`) |
| `suc`             | `up`   | included only when non-empty AND ≠ `cp`               |
| `slc`             | `lo`   | included only when non-empty AND ≠ `cp`               |
| `stc`             | `ti`   | included only when non-empty AND ≠ `cp`               |

Why the omission rules:
- `cp` is always the codepoint. `suc="0041"` for an uppercase letter adds
  nothing — the consumer already knows the codepoint.
- `mir="N"` is the default. Storing it would 2× the field count for no signal.
- `ccc="0"` means "not reordered" — the default. Only non-zero combining
  classes matter for rendering.
- The `<tag>` prefix on `dm` distinguishes canonical (`<font>`, `<compat>`,
  `<super>`, etc.) from no-tag canonical decompositions. Consumers need it.

## Output files

| Path                                                | Shape                                                        |
|---|---|
| `public/unicode-blocks.json`                        | `Array<{start, end, name, unicode_version}>`                |
| `public/unicode/blocks/<slug>.json`                 | `{name, range, start, end, chars: CharRecord[]}`            |
| `public/unicode/indexes/by-script.json`             | `Record<string, number>` (script → char count)              |
| `public/unicode/indexes/by-category.json`           | `Record<string, number>` (gc → char count)                  |
| `public/unicode/indexes/by-bidi.json`               | `Record<string, number>` (bc → char count)                  |
| `public/unicode/indexes/by-combining.json`          | `Record<string, number>` (ccc → char count)                 |
| `public/unicode/indexes/scripts/<Script>.json`      | `{property, count, characters: [{cp,n,b}]}` (`b` = block name) |
| `public/unicode/indexes/category/<Gc>.json`         | same shape                                                  |
| `public/unicode/indexes/bidiclass/<Bc>.json`        | same shape                                                  |
| `public/unicode/indexes/combining/<Ccc>.json`       | same shape                                                  |
| `public/unicode-version.json`                       | `{version, generatedAt, charCount, blockCount}` (new file) |

Block slugs derive from `blockSlug(name)` in `src/lib/unicode/constants.ts` —
the same function the runtime loader uses. Single source of truth for slug
derivation.

The `unicode_version` field per block records "when this block was introduced
to Unicode" — NOT the version of the data. The current values come from the
existing committed file (preserved across regenerations). New blocks that
appear in UCD XML but aren't in the existing file get the global UCD version
being processed as their introduction version.

## Output shape details

### Per-block JSON

```jsonc
{
  "name": "Basic Latin",
  "range": "U+0000-U+007F",
  "start": 0,
  "end": 127,
  "chars": [
    { "cp": 0, "n": "<control>", "c": "Cc", "s": "Common", "bc": "BN" },
    // ...
    { "cp": 40, "n": "LEFT PARENTHESIS", "c": "Ps", "s": "Common", "bc": "ON", "mir": true },
    // ...
    { "cp": 65, "n": "LATIN CAPITAL LETTER A", "c": "Lu", "s": "Latin", "bc": "L", "lo": "0061" },
    // ...
    { "cp": 97, "n": "LATIN SMALL LETTER A", "c": "Ll", "s": "Latin", "bc": "L", "up": "0041", "ti": "0041" }
    // ...
  ]
}
```

### unicode-version.json (new file)

```jsonc
{
  "version": "17.0.0",
  "generatedAt": "2026-06-23T12:00:00.000Z",
  "charCount": 337241,
  "blockCount": 346
}
```

The runtime can read this file to display "Unicode 17.0" in the UI and to
detect data freshness without parsing XML.

## Char record emission rules

1. **Only assigned codepoints.** UCD XML marks unassigned as `gc="Cn"`. Skip.
   (Existing data already does this — see `gunjala-gondi.json` with 17 missing
   codepoints.)

2. **Skip Private Use Area blocks entirely.** No file emitted for
   `Basic Latin (PUA)`, `Supplementary PUA-A`, `Supplementary PUA-B`. These
   have no standardized assignments.

3. **Range elements expand.** `<char first="0000" last="001F" na="<control>" gc="Cc" ... />`
   produces 32 individual records. Shared attributes copy to each.

4. **Special-character names.** Control chars use `na="<control>"` directly.
   Noncharacters (`<Noncharacter_Format>`) and similar use UCD's name as-is.

## Architecture

Three layers, in `scripts/lib/ucd-xml.ts` (pure TypeScript, no I/O):

```ts
export interface UcdBlock { start: number; end: number; name: string }
export interface UcdChar {
  cp: number
  na: string
  na1?: string
  gc: string
  sc: string
  bc: string
  ccc: string
  mir: 'Y' | 'N'
  dm?: string
  suc?: string
  slc?: string
  stc?: string
}

export interface CharRecord {
  cp: number
  n: string
  c: string
  s: string
  bc: string
  cc?: string
  mir?: true
  dm?: string
  up?: string
  lo?: string
  ti?: string
}

// Tokenize UCD XML into structured records.
export function parseUcdXml(text: string): { blocks: UcdBlock[]; chars: UcdChar[] }

// Map one UCD char to our compact record. Applies omission rules.
export function mapChar(c: UcdChar): CharRecord

// Build reverse lookups: cp → block name, by-property aggregates, per-value detail files.
export function buildIndexes(
  chars: CharRecord[],
  blocks: UcdBlock[],
): {
  byScript: Record<string, number>
  byCategory: Record<string, number>
  byBidi: Record<string, number>
  byCombining: Record<string, number>
  perScript: Map<string, Array<{ cp: number; n: string; b: string }>>
  perCategory: Map<string, Array<{ cp: number; n: string; b: string }>>
  perBidi: Map<string, Array<{ cp: number; n: string; b: string }>>
  perCombining: Map<string, Array<{ cp: number; n: string; b: string }>>
}
```

The script (`scripts/gen-unicode-data.mjs`) handles:
- HTTP download (cached zip)
- Unzip (cached extracted file)
- Calls into `ucd-xml.ts`
- File writes (atomic: write to `.tmp`, rename)
- Manifest output

Pure logic in TS file → tested via `scripts/__tests__/ucd-xml.test.ts`.
I/O concerns in the script → smoke-tested via `npm run gen-unicode`.

## Caching

```
vendor/ucd/                              # gitignored
├── ucd-17.0.0.flat.zip                 # downloaded once
└── ucd-17.0.0.flat.xml                 # extracted once
```

Re-runs with the same version skip download + extraction entirely. A
`--force` flag re-fetches even if cached.

The script never writes outside `public/unicode/`, `public/unicode-blocks.json`,
`public/unicode-version.json`, and `vendor/ucd/`.

## Idempotency

Two runs with the same `--unicode-version` produce byte-identical output
(except `generatedAt` timestamp in `unicode-version.json`).

Achieved by:
- Deterministic JSON.stringify key ordering for objects
- Sorted arrays (chars sorted by cp; indexes sorted alphabetically)
- No randomness, no Map iteration order dependence

## Wiring

- `package.json`:
  ```json
  "gen-unicode": "node scripts/gen-unicode-data.mjs"
  ```
- `scripts/fetch-data.sh`: skip for now. UCD XML is ~30 MB and slow (~30 sec).
  Better as an explicit `npm run gen-unicode` step, not every build. CI runs
  it on a schedule or when `unicode-version.json` is bumped.

- `.gitignore`:
  ```
  /vendor/ucd/
  ```

- `public/unicode-version.json` IS committed. It records the data version for
  runtime queries.

## Migration

**Phase 1 (this session):** Implement. Smoke-test on Unicode 17.0.0. Verify
output shape against existing data (char counts within ±5% of existing; known
characteristics preserved: 128 Basic Latin, CJK char count, Adlam count of 88,
etc.).

**Phase 2 (user decision):** Replace committed files with Unicode 17.0.0
output. Bump `unicode-version.json`. Update CLAUDE.md and IA.md.

**Phase 3:** Add reverse index `unicode/indexes/by-block/<slug>.json` listing
all blocks with their char counts and sample chars — useful for the Unicode
landing page.

## Testing

`scripts/__tests__/ucd-xml.test.ts` — pure-logic tests:

- `parseUcdXml` extracts blocks and chars from a minimal XML sample
- Range elements (`first`/`last`) expand to per-cp records
- `mapChar` applies omission rules:
  - `suc` = `cp` → no `up` field
  - `mir` = "N" → no `mir` field
  - `ccc` = "0" → no `cc` field
  - `dm` empty → no `dm` field
- `mapChar` preserves `dm` with `<tag>` prefix
- `buildIndexes` produces correct counts from sample data
- `buildIndexes` produces per-property detail lists with block name in `b`

## Performance

- Single pass over the XML (streaming line reader, ~30 MB)
- One Map<cp, blockIndex> for char → block lookup (O(1))
- Total runtime: ~3 seconds on a 2025 laptop
- Memory: ~50 MB peak (one copy of XML text + parsed records)

Acceptable. No streaming XML parser needed at this scale.

## Open questions

1. **Replace `unicode-blocks.json` `unicode_version` field?** Currently it
   records block introduction version. With a real `unicode-version.json`,
   this field is redundant for "what version is the data." Keep for back-compat
   (the loader reads it).

2. **Index char records include `dm`, `cc` etc.?** Currently per-property
   detail indexes only carry `{cp, n, b}`. Keep minimal — consumers that need
   more fetch the per-block file.
