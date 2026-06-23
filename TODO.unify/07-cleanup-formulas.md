# 07 — Clean Up formulas: Make It Data-Only

## Goal
Remove all website code from `formulas/` after migration to fontist.org is complete.
The formulas repo should contain ONLY formula data and build scripts.

## What to Remove

### Delete `docs/` directory entirely
After verifying fontist.org works end-to-end:
```bash
rm -rf docs/
```

### What stays in formulas/
```
formulas/
  Formulas/           ← YAML data (4,283 files) — THE product
  process/            ← Ruby scripts (data generation)
    generate_font_metadata.rb
    generate_font_registry.rb
    fix_name_to_match_key.rb
  test/               ← CI tests
  vendor/             ← Unicode source data
    unicode/
      UnicodeData.txt
      Blocks.txt
      Scripts.txt
      DerivedAge.txt
    unicode-blocks.json
  .github/            ← CI workflows (updated)
  .gitignore
  Gemfile
  Gemfile.lock
  CLAUDE.md
  README.md
```

## Update formulas CI

### `formulas/.github/workflows/test.yml`
- Remove `docs/` related steps
- Remove docs build/deploy job
- Keep: schema validation, URL checking, installation testing
- Add: trigger fontist-archive rebuild on success (see TODO 06)

### `formulas/.github/workflows/formula-health.yml`
- Keep: scheduled health checks
- Update: trigger fontist-archive rebuild when URLs are fixed

## Update `formulas/.gitignore`
Remove docs-related ignores:
```diff
- # docs build artifacts
- docs/.vitepress/cache/
- docs/.vitepress/dist/
- docs/.vitepress/node_modules/
```

## Update `formulas/README.md`
- Remove docs site references
- Add link to fontist.org as the website
- Document the data generation pipeline

## Timing
**Do NOT execute this step until:**
1. fontist.org is fully migrated to vite-ssg (TODO 01-05)
2. All Unicode browser + font specimen pages work on fontist.org
3. CI pipeline is wired (TODO 06)
4. User confirms fontist.org is the canonical website

## Verification
- `formulas/` contains zero `.vue`, `.ts` (except maybe scripts), `.css` files
- `formulas/` contains zero `docs/` directory
- `formulas/process/` scripts still work standalone
- CI still validates formulas correctly
- fontist.org fetches data from formulas successfully
