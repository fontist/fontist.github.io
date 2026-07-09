# 01 — Lock canonical shapes

## Why

Every downstream plan depends on knowing the exact JSON shapes, file paths,
and field names. Without a lock, the producer (archive-private) and consumer
(fontist.org) drift.

## Locked decisions

### Coverage (per-face)

**Path:** `coverage/{formula_slug}/{PostScriptName}/` (directory) +
       `coverage/{formula_slug}/{PostScriptName}.json` (aggregated flat file)

**Source:** ucode's directory output, aggregated by archive-private into a
single JSON for the current consumer. Future consumers can read the
directory form directly for lazy per-block loading.

**Shape** (must match `src/lib/types/domain.ts` Coverage family):

```json
{
  "slug": "google/abeezee",
  "redistributable": true,
  "total_codepoints": 250,
  "supported_blocks": 5,
  "total_blocks": 340,
  "planes": { "bmp": true, "smp": false, "sip": false },
  "codepoints": [13, 32, 33, ...],
  "blocks": [
    {
      "name": "Basic Latin",
      "range": "U+0000–U+007F",
      "start": 0,
      "end": 127,
      "codepoints": [13, 32, 33, ...]
    }
  ],
  "variable_axes": [],
  "opentype_features": [{ "tag": "kern", "name": "Kerning" }]
}
```

### WOFF specimens

**Path:** `woff/{formula_slug}/{PostScriptName}.woff`
**Format:** WOFF (NOT WOFF2)
**Reason:** User-directive 2026-06-29 — woff2 requires brotli, breaks some browsers.

### fonts.json (FontsRegistry)

**Path:** `fonts.json` at archive root
**Shape:** `domain.ts:96` FontsRegistry
```json
{
  "generated_at": "ISO8601",
  "total_fonts": 5963,
  "total_formulas": 4283,
  "fonts": [
    { "canonical_name": "ABeeZee", "slug": "abeezee", "formulas": ["google/abeezee"], "style_count": 2 }
  ]
}
```

### font-metadata.json (FontMetadataFile)

**Path:** `font-metadata.json` at archive root
**Shape:** `domain.ts:103` FontMetadataFile — **FIELD RENAME: `woff2_file` → `woff_file`**
```json
{
  "generated_at": "ISO8601",
  "total_fonts": 50,
  "redistributable": 50,
  "fonts": [
    {
      "slug": "abeezee",
      "formula_path": "Formulas/google/abeezee.yml",
      "redistributable": true,
      "primary_family": "ABeeZee",
      "coverage_file": "coverage/google/abeezee/ABeeZee-Regular.json",
      "woff_file": "woff/google/abeezee/ABeeZee-Regular.woff"
    }
  ]
}
```

### details/{slug}.json (FormulaDetails)

**Path:** `details/{formula_slug}.json`
**Shape:** `domain.ts:63` FormulaDetails
```json
{
  "slug": "google/abeezee",
  "name": "ABeeZee",
  "description": "...",
  "homepage": "https://...",
  "copyright": "...",
  "spdx_license": "OFL-1.1",
  "license_url": "...",
  "redistributable": true,
  "source_format": "ttf",
  "resources": { ... },
  "fonts": [ { "name": "ABeeZee", "styles": [...] } ],
  "font_collections": []
}
```

## Implementation

This plan is documentation-only — no code. Subsequent plans implement.

## Acceptance

- [ ] All subsequent plans reference these shapes verbatim
- [ ] `coverage-architecture.md` updated (plan 11) to match exactly
- [ ] `domain.ts` field rename `woff2_file` → `woff_file` (plan 08)

## Out of scope

- Per-codepoint JSON shape (see plan 07)
- panglyph universal-font pipeline (separate concern)
