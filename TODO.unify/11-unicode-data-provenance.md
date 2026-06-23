# 11 — Unicode data provenance

Analysis date: 2026-06-23. Investigates AUDIT §L.

## What's in `public/unicode/` today

Committed static files, total ~8 MB:

| Path                                  | Files | Purpose                              |
|---|---|---|
| `public/unicode-blocks.json`          | 1     | Block list: `{start, end, name, unicode_version}` |
| `public/unicode/blocks/*.json`        | 344   | Per-block character data             |
| `public/unicode/indexes/by-script.json` | 1   | Script → codepoint count             |
| `public/unicode/indexes/by-category.json` | 1 | General category → count            |
| `public/unicode/indexes/by-bidi.json` | 1     | Bidi class → count                   |
| `public/unicode/indexes/by-combining.json` | 1 | Combining class → count             |
| `public/unicode/indexes/{scripts,category,combining,bidiclass}/` | 4 dirs | Per-property detail indexes |

## What `scripts/fetch-data.sh` actually fetches

| Source                    | Fetched                                  | Not fetched |
|---|---|---|
| `fontist/fontist-archive` | `coverage/`, `fonts/*.woff2`, `fonts.json`, `font-metadata.json` | — |
| `fontist/formulas` (raw)  | `formulas-data.json`, `stats.json`       | — |
| `unicode.org`             | (nothing)                                | **all Unicode data** |

The `npm run build` pipeline never touches Unicode data. The 344+8 files are
baked in, presumably extracted from UCD XML by a long-lost script.

## Evidence the data originated from UCD XML

Per-block JSON record shape:

```json
{
  "cp": 65,
  "n": "LATIN CAPITAL LETTER A",
  "c": "Lu",
  "s": "Latin",
  "bc": "L",
  "up": "0041",
  "lo": "0061",
  "ti": "0041",
  "mir": true
}
```

Field-for-field match with UCD XML `<char>` element:

| Our field | UCD XML attribute | Meaning                |
|---|---|---|
| `cp`  | `cp`  | Codepoint (hex string in XML, decimal in ours) |
| `n`   | `na` / `name` | Character name |
| `c`   | `gc`  | General category       |
| `s`   | `sc`  | Script                 |
| `bc`  | `bc`  | Bidi class             |
| `up`  | `suc` / `uc` | Simple uppercase mapping |
| `lo`  | `slc` / `lc` | Simple lowercase mapping |
| `ti`  | `stc` / `tc` | Simple titlecase mapping |
| `mir` | `mir` | Bidi mirrored          |

This is not a coincidence — no other Unicode data source ships these
attributes in this combination. The abbreviations (`n`, `c`, `s`, `bc`)
reduce JSON size ~30% vs. full UCD names, which is a deliberate
space optimization.

## What we don't know

1. **Which Unicode version.** The `unicode_version` field in
   `unicode-blocks.json` records when each BLOCK was introduced (e.g.,
   "Basic Latin" → "1.1", "Emoji 15.0" → "15.0"). It does NOT record when
   each CHARACTER was added or which UCD build the data was extracted from.

2. **What was filtered.** UCD XML contains ~150 attributes per character
   (decomposition type, numeric value, joining type, etc.). Our JSON has 9.
   The selection criteria is undocumented.

3. **When it was extracted.** No timestamp, no commit message that says
   "regenerate Unicode data."

4. **Whether it's reproducible.** Without the script, no.

## Why this matters

### Stale data ships invisibly

Unicode 15.1 (2023) added CJK Extension H, Unicode 16.0 (2024) added new
scripts. If our data is from 14.0 (2021), the site is silent about characters
that have existed for years. The block list shows them as "not in Unicode,"
which is false.

### Updates require manual work

To update today, a developer would need to:
1. Download `ucd.all.flat.zip` from unicode.org
2. Write a one-off script to parse it
3. Group by block
4. Write JSON in our exact format
5. Hope they got the field mapping right

This is a 1–2 day task done ad-hoc, with no review. High risk of subtle
breakage.

### The site claims Unicode coverage it can't verify

`coverage/<slug>.json` reports codepoints per font. If a codepoint isn't in
our Unicode data, the coverage check silently undercounts. Fonts that ship
new characters appear to have gaps they don't have.

## The fix

`scripts/gen-unicode-data.mjs` (spec: `12-ucd-xml-pipeline.md`).

Pipeline:
1. Download `ucd.all.flat.zip` from `unicode.org/Public/<version>/ucdxml/`
2. Extract `ucd.all.flat.xml`
3. Parse XML (streaming, ~30 MB uncompressed)
4. Group `<char>` records by block (from `Blocks.txt`)
5. Write per-block JSON files matching current shape (back-compat)
6. Write `unicode-version.json` recording `{ version, generatedAt, charCount }`

Idempotent: re-running with same Unicode version produces identical output.

Caching: zip is downloaded to `vendor/ucd/` (gitignored). Re-running with
matching version + file hash skips the download.

## Migration

**Phase 1 (this session):** Implement `gen-unicode-data.mjs`. Verify output
matches current committed files byte-for-byte for a known Unicode version
(probably 15.0 or 15.1 — needs investigation).

**Phase 2:** Wire into `scripts/fetch-data.sh` and `package.json`. Update
documentation. Bump Unicode version to latest (17.0.0).

**Phase 3:** Add reverse indexes (block → fonts) per `08-domain-model.md`.

## Open questions for user

1. **Confirm Unicode version.** The latest is 17.0.0 (released 2025). Should
   we regenerate at 17.0.0 immediately, or first prove the script produces
   byte-identical output at whatever version the current data is from?

2. **Schema changes.** The current JSON uses cryptic abbreviations (`n`, `c`,
   `s`). Do we keep them for back-compat, or migrate to readable names
   (`name`, `category`, `script`) now that we control the pipeline?

3. **Compression.** JSON is ~8 MB. JSONL or MessagePack would be ~50%
   smaller. Worth it for SSG (one read at build), probably not (browser
   downloads one block file at a time, ~30 KB each).
