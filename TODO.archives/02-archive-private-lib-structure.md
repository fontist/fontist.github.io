# 02 — Refactor archive-private to lib/ autoload structure

## Why

`bin/build` is currently a 309-line single file with one mega-class
(`FontistArchivePrivate::Builder`) that does: option parsing, formula
collection, change detection, download, audit, WOFF conversion, raw storage.

Per global rules (OCP, MECE, autoload-not-require_relative), adding
RegistryBuilder + DetailsBuilder + CoverageAggregator as siblings of Builder
requires a proper lib/ layout with autoload entries.

## Target structure

```
fontist-archive-private/
├── bin/
│   └── build                                  # Entry point — requires lib, dispatches
├── lib/
│   └── fontist_archive_private.rb             # Parent namespace w/ autoload entries
│       (no actual lib/fontist_archive_private/ dir — single file at lib/fontist_archive_private.rb
│        because each class is in its own file under lib/fontist_archive_private/)
├── lib/fontist_archive_private/
│   ├── builder.rb                             # Existing Builder (moved from bin/build)
│   ├── coverage_aggregator.rb                 # NEW (plan 03)
│   ├── registry_builder.rb                    # NEW (plan 04)
│   └── details_builder.rb                     # NEW (plan 05)
└── spec/
    └── fontist_archive_private/
        ├── builder_spec.rb
        ├── coverage_aggregator_spec.rb
        ├── registry_builder_spec.rb
        └── details_builder_spec.rb
```

The parent file `lib/fontist_archive_private.rb` defines autoloads:

```ruby
module FontistArchivePrivate
  autoload :Builder,            "fontist_archive_private/builder"
  autoload :CoverageAggregator, "fontist_archive_private/coverage_aggregator"
  autoload :RegistryBuilder,    "fontist_archive_private/registry_builder"
  autoload :DetailsBuilder,     "fontist_archive_private/details_builder"
end
```

## bin/build after refactor

```ruby
#!/usr/bin/env ruby
# frozen_string_literal: true

require_relative "../lib/fontist_archive_private"
FontistArchivePrivate::Builder.new(ARGV.dup).call
```

(Allowing `require_relative` here because `bin/` is an executable entry point,
not library code — the rule applies to lib/ internal requires.)

## Move semantics — what counts as "moved"

Existing `bin/build` body becomes `lib/fontist_archive_private/builder.rb`
with one change: drop `module FontistArchivePrivate` outer wrapper stays
the same; only the file location changes. No logic changes in this plan.

## Files touched

- `bin/build` — slim to 3-line entry point
- `lib/fontist_archive_private.rb` — NEW parent w/ autoloads
- `lib/fontist_archive_private/builder.rb` — moved from bin/build
- `fontist-archive-private.gemspec` (if exists) — add lib/ to require_paths
- `Gemfile` — no change

## Implementation

1. Create `lib/fontist_archive_private.rb` with autoload entries
2. Move `bin/build` body to `lib/fontist_archive_private/builder.rb`
   (preserve module wrapper; preserve all private methods)
3. Replace `bin/build` with 3-line entry point
4. Verify `ruby bin/build --help` still works
5. Add empty stubs for CoverageAggregator, RegistryBuilder, DetailsBuilder
   (subsequent plans fill them in)

## Acceptance

- [ ] `ruby bin/build --source google --limit 0 --verbose` exits cleanly
      (zero formulas processed, no exception)
- [ ] No `require_relative` in any `lib/fontist_archive_private/*.rb` file
      (autoload only)
- [ ] `bin/build` file is < 10 lines
- [ ] Existing audit/woff behavior unchanged (regression check via plan 10)

## Out of scope

- Actual logic for CoverageAggregator / RegistryBuilder / DetailsBuilder
  (plans 03/04/05)
