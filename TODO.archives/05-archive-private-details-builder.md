# 05 — DetailsBuilder: details/{slug}.json

## Why

fontist.org's `FormulaPage.vue` renders rich per-formula detail (description,
homepage, copyright, SPDX license, resources, fonts/styles table,
font_collections). The data comes from `details/{slug}.json` (fetch-data.sh:79).

Today, archive-public has no `details/` directory. FormulaPage degrades to
the summary view.

The data is pure derivation from the formula YAML — no font parsing needed.
This is the cheapest builder to implement.

## Shape (FormulaDetails — domain.ts:63)

```json
{
  "slug": "google/abeezee",
  "name": "ABeeZee",
  "description": "ABeeZee is a handwriting font family...",
  "homepage": "https://fonts.google.com/specimen/ABeeZee",
  "copyright": "Copyright (c) 2011, Anjali Angamally",
  "spdx_license": "OFL-1.1",
  "license_url": "https://scripts.sil.org/OFL",
  "redistributable": true,
  "source_format": "ttf",
  "resources": {
    "google": {
      "source": "google",
      "urls": ["https://fonts.gstatic.com/..."],
      "files": ["ABeeZee-Regular.ttf", "ABeeZee-Italic.ttf"]
    }
  },
  "fonts": [
    {
      "name": "ABeeZee",
      "styles": [
        {
          "family_name": "ABeeZee",
          "type": "Regular",
          "full_name": "ABeeZee Regular",
          "post_script_name": "ABeeZee-Regular",
          "version": "Version 1.003",
          "copyright": "Copyright ...",
          "description": "...",
          "variable_font": false,
          "font": "ABeeZee-Regular.ttf",
          "formats": ["ttf"]
        }
      ]
    }
  ],
  "font_collections": []
}
```

All fields lifted directly from the formula YAML.

## DetailsBuilder responsibility

```ruby
module FontistArchivePrivate
  class DetailsBuilder
    def initialize(formula_path:, archive_root:)
      @formula_path = formula_path
      @archive_root = archive_root
    end

    def write
      yaml = YAML.safe_load_file(@formula_path, permitted_classes: [Date])
      return unless yaml
      details = build_details(yaml)
      write_to(details_path, details)
    end

    private

    def build_details(yaml); end
    def details_path; end
    def write_to(path, data); end
  end
end
```

## Builder wiring

Inside the per-formula loop in `Builder#process_formula`:

```ruby
DetailsBuilder.new(formula_path: path, archive_root: Dir.pwd).write
```

So details are written per-formula, alongside coverage/woff.

## Specs

`spec/fontist_archive_private/details_builder_spec.rb`:

- Fixture formulas covering: standalone font, TTC collection, multi-resource
- Assert output JSON matches FormulaDetails shape
- Assert copyright / spdx_license / homepage / description round-trip correctly
- Test formula without description — `description` field omitted
- Test TTC formula — `font_collections[]` populated, `fonts[]` empty

No doubles.

## Files touched

- `lib/fontist_archive_private/details_builder.rb` — NEW
- `lib/fontist_archive_private/builder.rb` — invoke DetailsBuilder per formula
- `spec/fontist_archive_private/details_builder_spec.rb` — NEW
- `spec/fixtures/details/*.yml` — fixture formulas

## Acceptance

- [ ] `ruby bin/build --source google --limit 5` produces `details/google/*.json`
- [ ] Output validates against FormulaDetails type
- [ ] TTC formulas produce non-empty `font_collections[]`
- [ ] Standalone formulas produce non-empty `fonts[]`

## Out of scope

- Heavy license text (e.g., full OFL body) — `description` is enough
- Resource download URLs validation — keep raw from YAML
