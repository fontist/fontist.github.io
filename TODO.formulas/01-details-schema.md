# 01 — Details Schema

Phase A of [README.md](README.md).

## File location

`details/{formula_slug}.json` — one file per formula. Same slug structure as `coverage/{formula_slug}.json`.

## Shape

Mirrors formula YAML top-level + per-style fields. Drops heavy license text (`license`, `open_license` — too large, link via `license_url` instead). Drops internal directives (`extract`, `import_source`, `sha256`, `file_size`).

```json
{
  "slug": "google/aclonica",
  "name": "aclonica",
  "description": "Aclonica is a strong and modern sans serif typeface...",
  "homepage": "https://fonts.google.com/specimen/Aclonica",
  "copyright": "Copyright (c) 2010 by Brian J. Bonislawsky DBA Astigmatic (AOETI)...",
  "spdx_license": "Apache-2.0",
  "license_url": "http://www.apache.org/licenses/LICENSE-2.0",
  "redistributable": true,
  "source_format": "ttf",
  "resources": {
    "ttf_static": {
      "source": "google",
      "family": "Aclonica",
      "urls": ["https://fonts.gstatic.com/s/aclonica/v25/K2FyfZJVlfNNSEBXGb7TCI6oBjLz.ttf"],
      "format": "ttf"
    }
  },
  "fonts": [
    {
      "name": "Aclonica",
      "styles": [
        {
          "family_name": "Aclonica",
          "type": "Regular",
          "full_name": "Aclonica Regular",
          "post_script_name": "Aclonica-Regular",
          "version": "1.001",
          "copyright": "Copyright (c) 2010 by Brian J. Bonislawsky DBA Astigmatic (AOETI)...",
          "description": "Licensed under the Apache License, Version 2.0",
          "variable_font": false,
          "font": "K2FyfZJVlfNNSEBXGb7TCI6oBjLz.ttf",
          "formats": ["ttf", "woff2"]
        }
      ]
    }
  ],
  "font_collections": []
}
```

## Field rules

| Field | Required | Source |
|-------|----------|--------|
| `slug` | always | formula path |
| `name` | always | formula YAML `name` |
| `description` | optional | formula YAML `description` |
| `homepage` | optional | formula YAML `homepage` |
| `copyright` | optional | formula YAML top-level `copyright` |
| `spdx_license` | optional | formula YAML `spdx_license` |
| `license_url` | optional | formula YAML `license_url` |
| `redistributable` | always | derived from `spdx_license` (matches archive-private's `REDISTRIBUTABLE_PREFIXES`) |
| `source_format` | always | detected from downloaded file extension |
| `resources` | optional | formula YAML `resources`, with `sha256`/`file_size` stripped |
| `fonts[].name` | always (standalone formulas) | formula YAML `fonts[].name` |
| `fonts[].styles[].family_name` | always | formula YAML |
| `fonts[].styles[].type` | always | formula YAML |
| `fonts[].styles[].font` | optional | formula YAML (filename) |
| `fonts[].styles[].full_name` | optional | formula YAML |
| `fonts[].styles[].post_script_name` | optional | formula YAML |
| `fonts[].styles[].version` | optional | formula YAML |
| `fonts[].styles[].copyright` | optional | formula YAML per-style |
| `fonts[].styles[].description` | optional | formula YAML per-style |
| `fonts[].styles[].variable_font` | optional | formula YAML |
| `fonts[].styles[].formats` | optional | formula YAML |
| `fonts[].styles[].font_index` | TTC only | assigned by build script (0-based face index in TTC) |
| `font_collections[].filename` | TTC formulas only | formula YAML |
| `font_collections[].fonts[]` | TTC formulas only | same shape as `fonts[]` |

## What's deliberately NOT here

- **Full license text** (`license`, `open_license`). These can be 10KB+ of legalese. Link to `license_url` instead.
- **`extract` / `import_source` directives**. Internal to the formula build process.
- **`sha256` / `file_size` from resources**. Integrity-check data, not user-facing.
- **Codepoint arrays**. Those live in `coverage/`.

## TTC formula shape

```json
{
  "slug": "manual/inter",
  "name": "Inter",
  "description": "...",
  ...
  "fonts": [],
  "font_collections": [
    {
      "filename": "Inter.ttc",
      "fonts": [
        {
          "name": "Inter",
          "styles": [
            {
              "family_name": "Inter",
              "type": "Bold",
              "full_name": "Inter Bold",
              "post_script_name": "Inter-Bold",
              "version": "4.000;git-a52131595",
              "font_index": 0,
              "formats": ["ttc"]
            },
            ...
          ]
        }
      ]
    }
  ]
}
```

## Filename / slug rules

- Slug preserves the formula's relative path: `google/aclonica`, `sil/charis_sil`, `macos/font8/akaya`.
- File path: `details/{slug}.json` (slug can contain `/` — nested directories).
- Same path shape as `coverage/{slug}.json`.
