# 11 — Update coverage-architecture.md

## Why

`coverage-architecture.md` is the cross-repo spec. After plans 01-10, it
has several stale references:

1. **Phase 09 SA3 (already merged)** changed the Audit Schema heading from
   YAML to JSON, but the user confirmed (2026-06-29) that coverage is rich
   JSON. SA3 was actually correct in spirit (ucode writes JSON) — but the
   rename needs to fully land: body examples still show `codepoints:` block
   in YAML-ish style under a `json` fence.

2. **WOFF specimens** — README still says woff2 in places. Lock to WOFF.

3. **Details builder** — not mentioned at all. Add.

4. **Registry field name** — `woff2_file` → `woff_file`.

5. **Plan 06 sync unification** — both sync workflows collapsed to one script.

## Changes

### Section: Audit Schema

Keep heading `## Audit Schema (ucode audit font output, JSON)` (SA3 was right).

Fix the body — currently has YAML-ish `key: value` lines under a ` ```json `
fence. Real ucode output is structured JSON. Replace the example with an
actual excerpt from `/tmp/ucode-test/font_audit/Ayuthaya/index.json`.

Document the **directory output** shape (ucode writes a directory, not a
single file):

```markdown
### ucode audit font output structure

ucode writes a directory per face:

    coverage/{slug}/{PSName}/
    ├── index.json              # face summary + codepoint_ranges
    ├── blocks/{Block}.json     # per-block coverage stats
    ├── planes/                 # per-plane summary
    └── scripts/                # per-script summary

archive-private additionally emits an aggregated flat file for the current
fontist.org consumer:

    coverage/{slug}/{PSName}.json   # Coverage shape per domain.ts
```

### Section: WOFF specimens

Add note about WOFF vs WOFF2:

```markdown
### WOFF vs WOFF2

This pipeline produces WOFF (not WOFF2). Reason: woff2 requires brotli
decompression support, which is missing in some embedded/legacy browsers.
WOFF has broader compatibility.

Field name in font-metadata.json: `woff_file` (NOT `woff2_file`).
```

### Section: Repository Architecture → fontist-archive-private

Add `lib/fontist_archive_private/{builder,coverage_aggregator,registry_builder,details_builder}.rb`
to the tree (plan 02).

### Section: Repository Architecture → fontist-archive-public

Add `details/{slug}.json` to the public tree.

### Section: Build pipeline

Document the post-ucode aggregation step:

```markdown
For each matched font face:
1. Download + extract raw (existing)
2. ucode audit font → per-face directory output
3. CoverageAggregator → flat coverage/{slug}/{PSName}.json (NEW)
4. If redistributable: fontisan ConvertCommand → woff (existing)
5. DetailsBuilder → details/{slug}.json (NEW)

After batch: RegistryBuilder → fonts.json + font-metadata.json (NEW)
```

### Section: Sync pipeline

Document that both workflows call bin/sync-from-private.

## Files touched

- `coverage-architecture.md` — comprehensive update per above

## Acceptance

- [ ] Audit Schema section shows actual ucode JSON shape
- [ ] WOFF (not woff2) documented explicitly
- [ ] `woff_file` field name documented
- [ ] `details/` mentioned in both private + public repo trees
- [ ] lib/ autoload structure documented
- [ ] Plan 06 single-sync-script flow documented

## Out of scope

- Cross-repo README updates (each repo's own README.adoc)
- Domain model changes (already correct in current spec)
