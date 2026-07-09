# Font Archive Architecture & Specification

## Role Summary (who does what)

| Layer | Owner | Responsibility |
|---|---|---|
| **Unicode data** (per-codepoint properties, per-block metadata, universal glyph set) | **ucode** | Authoritative source. Runs its own build, publishes Unicode-only artifacts. |
| **Font parsing** (cmap, glyf, name table access) | **fontisan** | Low-level font-file parser. Used by ucode for audits; used by archive for WOFF conversion. |
| **Font discovery** (which formula provides which font, install paths) | **fontist** | Resolves font names → file paths. Used by ucode and archive to locate fonts. |
| **Per-font audit data** (cmap coverage per font, identity, style) | **ucode audit** (runs in archive CI) | Per-face JSON directory + aggregated flat JSON. Triggered by archive's GHA matrix, not ucode's own build. |
| **WOFF specimen generation** | **fontisan ConvertCommand** (runs in archive CI) | Open-license WOFF only. |
| **Audit artifact storage** | **fontist-archive-private** → **fontist-archive-public** | Source-of-truth raw fonts (private) → filtered public artifacts. |
| **Site consumption** | **fontist.org** | Pulls from fontist-archive-public AND from ucode's published Unicode artifacts. |

**Critical**: ucode is the BRAIN. fontisan is the PARSER. fontist is the DISCOVERY LAYER. The archive is STORAGE. fontist.org CONSUMES.

Per-font audit data is produced by ucode but **runs inside fontist-archive-private's CI matrix** — not in ucode's own build. ucode's own build produces Unicode-only data (per-codepoint JSONs, block-feed, universal glyph set). ucode emits **JSON** (a directory of per-face JSON files: `index.json` + `blocks/*.json` + `planes/` + `scripts/`); fontist-archive-private's `CoverageAggregator` collapses that into a single flat JSON per face.

## Domain Model

### Entities

**Formula** — A YAML file describing how to download, extract, and install fonts.
- Identified by slug: `google/abeezee`, `manual/inter`, `sil/charis`, `macos/font8/akaya`
- Declares `resources` (download URLs or Google CDN file lists)
- Declares `fonts[]` (standalone font files) and/or `font_collections[]` (TTC files)
- Manually curated and verified by humans — the SOURCE OF TRUTH for font identity

**Font Family** — A typographic family, e.g., "Inter", "ABeeZee".
- Declared in formula YAML as `fonts[].name` or `font_collections[].fonts[].name`
- The SAME font family can be provided by MULTIPLE formulas

**Font Style** — A specific weight/style within a family.
- Declared as `fonts[].styles[]` or `font_collections[].fonts[].styles[]`
- Has: `family_name`, `type`, `full_name`, `post_script_name`, `version`

**Font File** — A binary file containing glyph data.
- Standalone: `.ttf`, `.otf`, `.woff`, `.woff2`
- Collection: `.ttc` containing multiple faces

---

## Repository Architecture

### fontist-archive-private (PRIVATE — Source of Truth)

**Purpose**: Download all fonts, audit them, generate WOFF specimens.
Contains ALL fonts including proprietary (Apple, Microsoft).

```
fontist-archive-private/
├── raw/{formula_slug}/                     Raw font files (ALL formulas)
│   ├── google/abeezee/esDR31xSG.ttf
│   ├── manual/inter/Inter.ttc
│   └── macos/font8/akaya/AkayaKannada.ttf
│
├── coverage/{formula_slug}/                ucode audit output (RICH JSON)
│   ├── google/abeezee/
│   │   ├── ABeeZee-Regular.json            Aggregated flat JSON (CoverageAggregator)
│   │   └── ABeeZee-Regular/                ucode native per-face directory
│   │       ├── index.json                  Identity + cmap + counts + ranges
│   │       ├── blocks/*.json               Per-block coverage detail
│   │       ├── planes/                     BMP/SMP/SIP coverage
│   │       └── scripts/                    Per-script coverage
│   ├── manual/inter/
│   │   ├── Inter-Bold.json                 One per TTC face
│   │   ├── Inter-Bold/index.json
│   │   └── ... (one dir + one JSON per face)
│   └── macos/font8/akaya/
│       └── AkayaKannada.json
│
├── details/{formula_slug}.json             Formula details (FormulaDetails shape)
│
├── woff/{formula_slug}/                    WOFF specimens (open-license ONLY)
│   ├── google/abeezee/
│   │   ├── ABeeZee-Regular.woff
│   │   └── ABeeZee-Italic.woff
│   └── manual/inter/
│       ├── Inter-Bold.woff
│       └── Inter-Regular.woff
│   (NO macos/ — proprietary)
│
├── fonts.json                              FontsRegistry (canonical name → formula slugs)
├── font-metadata.json                      FontMetadataFile (per-face path registry)
├── lib/fontist_archive_private/            Ruby autoload structure
│   ├── fontist_archive_private.rb          Namespace + autoload entries + shared constants
│   ├── builder.rb                          Orchestrates per-formula pipeline
│   ├── coverage_aggregator.rb              ucode directory → flat JSON
│   ├── registry_builder.rb                 fonts.json + font-metadata.json
│   └── details_builder.rb                  details/{slug}.json
├── bin/build                               9-line entry: loads lib/, calls Builder.new(ARGV).call
├── Gemfile                                 ucode + fontisan + excavate
└── .github/workflows/build.yml             Matrix: ubuntu (google/sil/manual) + macOS (macos)
```

### fontist-archive-public (PUBLIC — Filtered Consumer)

```
fontist-archive-public/
├── coverage/{formula_slug}/                ALL ucode audit JSON (metadata is public)
│   ├── google/abeezee/ABeeZee-Regular.json
│   ├── google/abeezee/ABeeZee-Regular/     (full ucode directory output)
│   └── macos/font8/akaya/AkayaKannada.json (coverage IS public)
│
├── details/{formula_slug}.json             ALL formula details (incl. macos)
│
├── unicode/                                ucode Unicode-only artifacts
│   ├── block-feed/                         Compact per-block feed
│   │   ├── unicode-blocks.json
│   │   ├── unicode-version.json
│   │   └── blocks/<slug>.json
│   ├── universal-glyph-set/                One SVG per codepoint
│   │   ├── manifest.json
│   │   ├── entries/U+XXXX.json
│   │   └── glyphs/U+XXXX.svg
│   └── codepoints/                         Per-codepoint detailed JSONs (sampled for prod, full for local dev)
│
├── woff/{formula_slug}/                    Open-license WOFF only
│   ├── google/abeezee/ABeeZee-Regular.woff
│   (NO macos/ — proprietary)
│
├── fonts.json                              FontsRegistry (copied from private)
├── font-metadata.json                      FontMetadataFile (copied from private)
├── bin/sync-from-private                   Canonical sync script (called by sync.yml + sync-private.yml)
└── .github/workflows/sync.yml              Periodic sync from private + from ucode releases
```

---

## Audit Schema (ucode audit font output)

ucode emits a **DIRECTORY** of JSON files per face, named by label (typically the PostScript name):

```
coverage/{formula_slug}/{PSName}/
├── index.json        Identity + cmap + counts + codepoint_ranges
├── blocks/*.json     Per-block coverage (per codepoint_ranges expanded)
├── planes/           BMP/SMP/SIP coverage breakdown
└── scripts/          Per-script coverage
```

`fontist_archive_private/coverage_aggregator.rb` reads the directory,
expands `codepoint_ranges` → flat `codepoints[]`, computes plane flags,
and writes **one flat JSON per face** at `coverage/{formula_slug}/{PSName}.json`
alongside the directory:

```json
{
  "slug": "google/abel",
  "redistributable": true,
  "total_codepoints": 248,
  "supported_blocks": 11,
  "total_blocks": 11,
  "planes": { "bmp": true, "smp": false, "sip": false },
  "codepoints": [32, 33, 34, ...],
  "blocks": [
    {
      "name": "Basic_Latin",
      "range": "U+0000–U+007F",
      "start": 0,
      "end": 127,
      "codepoints": [32, 33, ...]
    }
  ],
  "variable_axes": [],
  "opentype_features": []
}
```

This is the shape pinned in `src/lib/types/domain.ts` (`Coverage`) and what
`useCoverage.ts` consumes. The ucode-native directory is preserved for
richer clients that want per-script or per-plane detail.

### TTC collections

The builder iterates `font_collections[].fonts[].styles[]` and invokes
`ucode audit collection PATH --font-index N --label <PSName>` once per
face. Each face produces its own directory + aggregated JSON:

```
coverage/manual/inter/
  Inter-Bold/                 (font_index 0)
  Inter-Bold.json
  Inter-BoldItalic/           (font_index 1)
  Inter-BoldItalic.json
  ...
```

`font_index` is assigned per-TTC, either from the YAML's
`font_collections[].fonts[].styles[].font_index` field (when declared)
or sequentially in declaration order. `audit collection` validates the
source is actually a TTC/OTC/dfong and delegates to the same per-face
tree emitter as `audit font`. See plan 13.

For standalone fonts (`fonts[].styles[]`), the builder uses
`ucode audit font PATH` (no `--font-index`).

---

## Build Pipeline

### Processing per formula (fontist_archive_private/lib/fontist_archive_private/builder.rb)

1. **Read formula YAML** → build font manifest from `fonts[].styles[]` and
   `font_collections[].fonts[].styles[]`
2. **Download resources** (Google CDN files or archive URLs via excavate)
3. **Store raw files** → `raw/{formula_slug}/`
4. **Match downloaded files** to YAML manifest using `font:` field
5. **For each matched font face**:
   - Standalone: `ucode audit font <path> --output <tmp>/ucode-<PSName>`.
   - Collection (TTC/OTC): `ucode audit collection <path> --font-index N
     --label <PSName> --output <tmp>/ucode-<PSName>`.
   - Both emit a directory of JSON files. Builder copies that directory to
     `coverage/{formula_slug}/{PSName}/` and invokes `CoverageAggregator`
     to produce `coverage/{formula_slug}/{PSName}.json` (flat shape).
   - If redistributable: `fontisan ConvertCommand.new(font_path, to: "woff")`
     → WOFF written to `woff/{formula_slug}/{PSName}.woff`.
6. **Per formula**: `DetailsBuilder` writes `details/{formula_slug}.json`
   (formula identity without heavy license text).
7. **At end of batch**: `RegistryBuilder` walks all formulas and emits
   `fonts.json` + `font-metadata.json` at the archive root.

ucode is invoked as a CLI via `bundle exec` (`audit font` for standalone,
`audit collection` for TTC/OTC).
fontisan is invoked via `Fontisan::Commands::ConvertCommand` for WOFF.

### CI Matrix (4 parallel runners)

| Runner | Source | Formulas | Why |
|--------|--------|----------|-----|
| ubuntu-latest | google/ | ~1,935 | Fast CDN download |
| ubuntu-latest | sil/ | ~74 | Archive download + extract |
| ubuntu-latest | (top-level) | ~170 | Mixed archive formats |
| macos-latest | macos/ | ~2,107 | Apple CDN access |

---

## Data Separation

| Data | Private | Public | Reason |
|------|---------|--------|--------|
| Raw font files | ✅ ALL | ❌ NEVER | Contains proprietary fonts |
| Coverage JSON (audit) | ✅ ALL | ✅ ALL | Metadata only |
| Formula details JSON | ✅ ALL | ✅ ALL | Metadata only |
| WOFF specimens | ✅ ALL | ✅ Open-only | WOFF is a usable font |
| Build code (lib/) | ✅ | ❌ | Public is consumer only |

---

## WOFF Naming

WOFF files are named from the formula YAML's `post_script_name` field:

| Formula | PostScript Name | WOFF Path |
|---------|----------------|-----------|
| google/abeezee | `ABeeZee-Regular` | `woff/google/abeezee/ABeeZee-Regular.woff` |
| manual/inter (TTC) | `Inter-Bold` | `woff/manual/inter/Inter-Bold.woff` |
| sil/charis | `CharisSIL-Regular` | `woff/sil/charis/CharisSIL-Regular.woff` |

Formula YAML is manually curated and verified. The font FILE's internal
metadata is NOT used for naming — only the YAML is.

## WOFF vs WOFF2

Specimens are WOFF (not WOFF2). WOFF2 requires Brotli support, which some
embedded and older browsers lack. WOFF is universally supported and
sufficient for specimen rendering at the size the site uses.

This decision is reflected in:
- `fontisan ConvertCommand` invoked with `to: "woff"` (archive-private builder)
- `FontMetadataEntry.woff_file` field name (was `woff2_file`)
- `fontFormatForPath()` default fallback `'woff'` (fontist.org)

## Registry Shapes

### fonts.json — FontsRegistry

Family-level index: one entry per canonical family name, listing every
formula that provides it. Pinned in `src/lib/types/domain.ts`.

```json
{
  "generated_at": "2026-06-29T15:28:36Z",
  "total_fonts": 6656,
  "total_formulas": 4283,
  "fonts": [
    {
      "canonical_name": "ABeeZee",
      "slug": "abeezee",
      "formulas": ["google/abeezee"],
      "style_count": 2
    }
  ]
}
```

### font-metadata.json — FontMetadataFile

One entry per face. The `slug` is the FACE slug
(`slugify(family) + style_suffix`) so consumers can match metadata back to
family entries via prefix logic. The `formula_path` is relativized to
`Formulas/...`. `coverage_file` and `woff_file` are paths relative to the
archive root (and what fontist.org serves verbatim under `public/`).

```json
{
  "slug": "abeezee",
  "formula_path": "Formulas/google/abeezee.yml",
  "redistributable": true,
  "primary_family": "ABeeZee",
  "coverage_file": "coverage/google/abeezee/ABeeZee-Regular.json",
  "woff_file": "woff/google/abeezee/ABeeZee-Regular.woff"
}
```

`coverage_file` / `woff_file` are omitted (via `.compact`) when the
artifact doesn't exist on disk — non-redistributable formulas never have
WOFF, and unprocessed formulas have neither.

### font-families.json — FontFamilyIndex (derived, fontist.org-side)

Reverse index from family → all providing formulas + per-file metadata.
Generated by `scripts/gen-font-families.mjs` from the two registries
above. Pinned in `src/lib/types/domain.ts` as `FontFamilyIndex`.
