# 03 — Coverage pipeline (ucode directory → aggregated JSON)

## Why

`bin/build` currently invokes ucode as if it writes a single `.yaml` file:

```ruby
audit_path = File.join("coverage", slug, audit_filename(m))  # ".../ coverage/google/abeezee/ABeeZee-Regular.yaml"
args = ["bundle", "exec", "ucode", "audit", "font", face_path,
        "--font-index", font_index.to_s,
        "--output", audit_path]
```

But ucode's `--output` is a **directory** and ucode writes **JSON**.
Verified by running `ucode audit font --output /tmp/test`:

```
/tmp/test/font_audit/{Label}/
├── index.json              # face summary: identity + codepoint_ranges + totals
├── blocks/{Block}.json     # per-block coverage stats + missing_codepoints
├── planes/                 # per-plane summary
└── scripts/                # per-script summary
```

The current call either fails silently or writes a directory tree at the
`.yaml` path (which then gets committed as a malformed artifact).

## Decision

Two output paths per face:

1. **Directory form** (ucode native) → `coverage/{slug}/{PSName}/` — kept
   verbatim. Future consumers can lazy-load per-block.
2. **Aggregated flat JSON** → `coverage/{slug}/{PSName}.json` — single file
   for the current fontist.org consumer that fetches one URL per face.

Both produced from a single ucode invocation.

## Target shape of the aggregated JSON

See [plan 01 locked shape](01-lock-canonical-shapes.md#coverage-per-face).
Source fields from ucode's `index.json` + `blocks/*.json`:

| Consumer field | ucode source |
|---|---|
| `total_codepoints` | `index.json → font.total_codepoints` |
| `codepoints` (flat array) | expand `index.json → font.codepoint_ranges` |
| `blocks[].name` | filename of each `blocks/*.json` |
| `blocks[].start`, `blocks[].end` | `first_cp`, `last_cp` |
| `blocks[].range` | `range` (e.g. "U+0400–U+04FF") |
| `blocks[].codepoints` | expand ranges minus `missing_codepoints` |
| `planes` | read `planes/*.json` |
| `variable_axes`, `opentype_features` | ucode doesn't emit these yet — empty arrays for now (TODO) |

## CoverageAggregator responsibility

Pure-Ruby class. Takes a ucode output directory, writes the aggregated JSON.
No network, no font parsing. Easily testable.

```ruby
module FontistArchivePrivate
  class CoverageAggregator
    def initialize(slug:, redistributable:, ucode_output_dir:)
      @slug = slug
      @redistributable = redistributable
      @ucode_output_dir = ucode_output_dir
    end

    def write_to(path)
      # Reads index.json + blocks/*.json, expands ranges, writes aggregated
      # Coverage-shape JSON to `path`.
    end
  end
end
```

## Builder changes

Replace the current ucode invocation block in `builder.rb`:

```ruby
# OLD (broken)
audit_path = File.join("coverage", slug, audit_filename(m))  # PSName.yaml
system("bundle", "exec", "ucode", "audit", "font", face_path,
       "--font-index", font_index.to_s, "--output", audit_path)
```

```ruby
# NEW
audit_dir = File.join("coverage", slug, ps_name(m))           # directory
ucode_out = File.join(Dir.mktmpdir, "ucode")                  # scratch
system("bundle", "exec", "ucode", "audit", "font", face_path,
       "--font-index", font_index.to_s, "--output", ucode_out)

# Preserve ucode's directory output as-is (copy into coverage/{slug}/{PSName}/)
FileUtils.cp_r(ucode_out + "/font_audit/#{label}/.", audit_dir)

# Aggregate into the consumer-facing flat JSON
CoverageAggregator.new(slug: slug, redistributable: redistributable,
                       ucode_output_dir: audit_dir)
                  .write_to(File.join("coverage", slug, "#{ps_name}.json"))
```

`audit_filename` helper deleted (was producing `.yaml`); replaced by `ps_name`
helper that returns the safe PostScript name with no extension.

## Specs

`spec/fontist_archive_private/coverage_aggregator_spec.rb` — uses real ucode
output fixtures (check in a small sample like Ayuthaya's output). Tests:

- Expands codepoint_ranges into flat codepoints array
- Reads each block file and includes per-block codepoints
- Emits the exact JSON shape from plan 01
- Handles fonts with zero covered blocks (edge case)

NO doubles — real ucode output fixtures.

## Files touched

- `lib/fontist_archive_private/builder.rb` — ucode invocation + aggregator wiring
- `lib/fontist_archive_private/coverage_aggregator.rb` — NEW
- `spec/fontist_archive_private/coverage_aggregator_spec.rb` — NEW
- `spec/fixtures/ucode/ayuthaya/` — fixture (committed)

## Acceptance

- [ ] `ruby bin/build --source google --limit 1` produces BOTH:
      - `coverage/google/{slug}/{PSName}/index.json` (ucode native)
      - `coverage/google/{slug}/{PSName}.json` (aggregated)
- [ ] Aggregated JSON validates against `domain.ts` Coverage shape
- [ ] Aggregator spec passes
- [ ] No `.yaml` files produced anywhere

## Out of scope

- `variable_axes` / `opentype_features` data — ucode doesn't emit yet; empty arrays
- Codepoints file (`codepoints/{hex}.json`) — plan 07
