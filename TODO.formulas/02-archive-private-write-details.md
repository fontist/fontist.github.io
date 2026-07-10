# 02 — archive-private `write_details`

Phase B of [README.md](README.md). Adds the `write_details` step to `fontist-archive-private/bin/build`.

## What changes

Add one new private method `write_details(slug, yaml, matched, redistributable, source_format)` to `FontistArchivePrivate::Builder`, plus a small `build_details` helper that extracts the schema-defined fields from the formula YAML.

Call `write_details` from `process_formula` immediately after `write_coverage` (lines ~83 of `bin/build`).

## Why here

The formula YAML is parsed in this script already (step 1: `build_font_manifest`). Identity fields (`name`, `description`, `homepage`, `copyright`, `spdx_license`, `license_url`, `resources`, `fonts`, `font_collections`) are all in scope. Extracting details here avoids re-parsing the YAML in fontist.org and keeps the authority chain (formula → archive → website) linear.

## Implementation

### `build_details(yaml, matched, redistributable, source_format)`

Returns the Hash matching the [01-details-schema.md](01-details-schema.md) shape.

```ruby
def build_details(yaml, matched, redistributable, source_format)
  resources = (yaml["resources"] || {}).transform_values do |res|
    next res unless res.is_a?(Hash)
    res.reject { |k, _| %w[sha256 file_size].include?(k) }
  end

  {
    slug: derive_slug_from_yaml(yaml), # or pass slug in
    name: yaml["name"],
    description: yaml["description"],
    homepage: yaml["homepage"],
    copyright: yaml["copyright"],
    spdx_license: yaml["spdx_license"],
    license_url: yaml["license_url"],
    redistributable: redistributable,
    source_format: source_format,
    resources: resources,
    fonts: build_fonts_details(yaml["fonts"]),
    font_collections: build_collections_details(yaml["font_collections"]),
  }.compact
end

def build_fonts_details(fonts)
  return [] unless fonts
  fonts.map do |family|
    {
      name: family["name"],
      styles: (family["styles"] || []).map { |s| build_style_details(s) },
    }
  end
end

def build_collections_details(collections)
  return [] unless collections
  collections.map do |col|
    {
      filename: col["filename"],
      fonts: (col["fonts"] || []).map do |family|
        {
          name: family["name"],
          styles: (family["styles"] || []).map { |s| build_style_details(s) },
        }
      end,
    }
  end
end

def build_style_details(style)
  {
    family_name: style["family_name"],
    type: style["type"],
    full_name: style["full_name"],
    post_script_name: style["post_script_name"],
    version: style["version"],
    copyright: style["copyright"],
    description: style["description"],
    variable_font: style["variable_font"],
    font: style["font"],
    formats: style["formats"],
    font_index: style["font_index"],
  }.compact
end
```

### `write_details(slug, details)`

```ruby
def write_details(slug, details)
  path = File.join("details", "#{slug}.json")
  FileUtils.mkdir_p(File.dirname(path))
  File.write(path, JSON.pretty_generate(details))
end
```

### Hook into `process_formula`

Insert after the existing `write_coverage` line (around line 83):

```ruby
def process_formula(path, slug)
  # ...existing code through write_coverage...
  write_coverage(slug, coverage_data) unless coverage_data[:fonts].empty?

  details = build_details(yaml, matched, redistributable, detect_source_format(downloaded))
  write_details(slug, details)

  # ...existing woff generation...
end
```

### Source format detection

The existing pipeline tracks `source_format` on each downloaded item (`downloaded[i][:source_format]`). For the details file, use the most common source format across downloads:

```ruby
def detect_source_format(downloaded)
  formats = downloaded.map { |d| d[:source_format] }.compact
  return "ttf" if formats.empty?
  formats.tally.max_by { |_, c| c }.first
end
```

For TTC formulas, the formula YAML's `font_collections[].filename` extension gives `ttc` directly; the per-file format from downloads will still be `ttf`/`otf` because that's what was extracted. Override to `ttc` when the formula has `font_collections`:

```ruby
def detect_source_format(downloaded, yaml)
  return "ttc" if yaml["font_collections"]&.any?
  formats = downloaded.map { |d| d[:source_format] }.compact
  return "ttf" if formats.empty?
  formats.tally.max_by { |_, c| c }.first
end
```

## Verification

- `cd fontist-archive-private && ruby bin/build --limit 1 --source google/aclonica.yml --verbose`
- Should produce both `coverage/google/aclonica.json` and `details/google/aclonica.json`.
- Spot-check the details file matches the schema in [01-details-schema.md](01-details-schema.md).
- For TTC: `ruby bin/build --limit 1 --source sil/charis_sil.yml --verbose` (standalone fonts, 4 styles in one family). For real TTC, test against `macos/al_bayan.yml`.

## Out of scope

- Extracting NameID 0/7/11/13 from the font binary's `name` table. The formula YAML already carries the copyright; vendor URL and trademark are nice-to-have follow-ups.
- Re-running the full archive. CI will pick this up on the next build.
- Changing the coverage format. Coverage stays as JSON.
