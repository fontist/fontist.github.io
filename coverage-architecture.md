# Font Archive Architecture & Specification

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
├── coverage/{formula_slug}/                Fontisan AuditCommand YAML reports
│   ├── google/abeezee/
│   │   ├── ABeeZee-Regular.yaml            One YAML per font face
│   │   └── ABeeZee-Italic.yaml
│   ├── manual/inter/
│   │   ├── Inter-Bold.yaml                 One per TTC face
│   │   ├── Inter-BoldItalic.yaml
│   │   ├── Inter-Italic.yaml
│   │   └── Inter-Regular.yaml
│   └── macos/font8/akaya/
│       └── AkayaKannada.yaml
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
├── fonts.json
├── bin/build                               Uses Fontisan AuditCommand + ConvertCommand
├── Gemfile                                 fontisan + excavate
└── .github/workflows/build.yml             Matrix: ubuntu (google/sil/manual) + macOS (macos)
```

### fontist-archive-public (PUBLIC — Filtered Consumer)

```
fontist-archive-public/
├── coverage/{formula_slug}/                ALL audit YAML (metadata is public)
│   ├── google/abeezee/ABeeZee-Regular.yaml
│   └── macos/font8/akaya/AkayaKannada.yaml (coverage IS public)
│
├── woff/{formula_slug}/                    Open-license WOFF only
│   ├── google/abeezee/ABeeZee-Regular.woff
│   (NO macos/ — proprietary)
│
├── fonts.json
├── bin/sync-from-private                   Consumer script
└── .github/workflows/sync.yml              Periodic sync from private
```

---

## Audit YAML Schema (Fontisan AuditCommand output)

One YAML file per font face. Named `{PostScriptName}.yaml`.

```yaml
---
generated_at: '2026-06-24T15:46:19Z'
fontisan_version: 0.2.20
source_file: "/path/to/font.ttf"
source_sha256: ab1d1e352a...
source_format: ttf
font_index: 0                              # null for standalone, N for TTC face
num_fonts_in_source: 1                     # 1 for standalone, N for collection

# Identity (from name table)
family_name: ABeeZee
subfamily_name: Regular
full_name: ABeeZee Regular
postscript_name: ABeeZee-Regular
version: Version 1.003; ttfautohint (v1.8.3)
font_revision: 1.0030059814453125

# Style (from OS/2 + head + fvar)
weight_class: 400
width_class: 5
italic: false
bold: false
panose: 0 0 0 0 0 0 0 0 0 0
is_variable: false
axes: []

# Coverage (from cmap)
total_codepoints: 250
total_glyphs: 266
cmap_subtables: [4]
codepoints:
  - U+000D
  - U+0020
  - U+0021
  # ... full sorted list

# Aggregations (require UCD — auto-downloaded by Fontisan)
ucd_version: "17.0.0"
blocks:
  - name: Basic Latin
    range: U+0000–U+007F
    covered: 128
    total: 128
    fill_ratio: 1.0
    complete: true
unicode_scripts: [Latin]
opentype_scripts: [latn]
features: [kern, liga, mark, ccmp]
```

### TTC collections

For TTC files, AuditCommand iterates ALL faces automatically.
Each face gets its own YAML, named by PostScript name:

```
coverage/manual/inter/
  Inter-Bold.yaml           (font_index: 0)
  Inter-BoldItalic.yaml     (font_index: 1)
  Inter-Italic.yaml         (font_index: 2)
  Inter-Regular.yaml        (font_index: 3)
```

Each YAML carries `font_index` and `num_fonts_in_source` so consumers
know the collection structure.

---

## Build Pipeline

### Processing per formula (fontist-archive-private/bin/build)

1. **Read formula YAML** → build font manifest from `fonts[].styles[]` and
   `font_collections[].fonts[].styles[]`
2. **Download resources** (Google CDN files or archive URLs via excavate)
3. **Store raw files** → `raw/{formula_slug}/`
4. **Match downloaded files** to YAML manifest using `font:` field
5. **For each matched font face**:
   - `Fontisan::Commands::AuditCommand.new(font_path).run` → audit YAML
   - Write to `coverage/{formula_slug}/{PostScriptName}.yaml`
   - If redistributable: `Fontisan::Commands::ConvertCommand.new(font_path, to: "woff")` → WOFF
   - Write to `woff/{formula_slug}/{PostScriptName}.woff`

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
| Audit YAML (coverage) | ✅ ALL | ✅ ALL | Metadata only |
| WOFF specimens | ✅ ALL | ✅ Open-only | WOFF is a usable font |
| Build code | ✅ | ❌ | Public is consumer only |

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
