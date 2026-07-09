# TODO.archives — make `fontist-archive-public` + `fontist-archive-private` feed fontist.org

## Context

The current `fontist.org` consumer (`scripts/fetch-data.sh`) pulls from the legacy
`fontist/fontist-archive` repo (no suffix). That pipeline produces a flat
minimal shape:

```
coverage/{slug}.json       { total_codepoints, codepoints: [...] }
fonts/{slug}.woff          (despite README claim of woff2)
fonts.json, font-metadata.json
```

The replacement pipeline is the **`-private` → `-public` → fontist.org** chain.
Both new repos exist but are not yet producing what fontist.org needs. This
TODO set closes that gap.

## Locked canonical decisions

After investigation + user direction (2026-06-29):

| Decision | Value | Why |
|---|---|---|
| Coverage format | **Rich JSON** (ucode native output) | ucode emits per-face directory: `index.json` + `blocks/*.json` + `planes/` + `scripts/`. JSON is what ucode actually writes; consumer (TS) prefers JSON. |
| Coverage path | **`coverage/{slug}/{PSName}/`** | ucode's natural directory shape; preserves per-block lazy-load option. Plus a flat aggregated sibling `coverage/{slug}/{PSName}.json` for the current consumer. |
| WOFF format | **`.woff`** (NOT `.woff2`) | User-directive: some browsers can't use woff2 due to brotli dep. |
| WOFF path | **`woff/{slug}/{PSName}.woff`** | Nested per formula + face. |
| Registry field name | **`woff_file`** (NOT `woff2_file`) | Field name should match actual extension. |
| Registry formats | `fonts.json` (FontsRegistry), `font-metadata.json` (FontMetadataFile) | Match `src/lib/types/domain.ts` shapes. |
| Details format | `details/{slug}.json` (FormulaDetails) | Match `domain.ts:63`. |
| Sync source of truth | **`bin/sync-from-private`** (bash script) | Both `sync.yml` and `sync-private.yml` call it. One workflow deactivated (NOT deleted — global rule). |
| macOS handling | Copy `coverage/` + `details/` (all public); skip `woff/macos/` only | Per coverage-architecture.md data-separation table. |

## Phase list

| # | Plan | Repo | Status |
|---|---|---|---|
| 01 | [Lock canonical shapes](01-lock-canonical-shapes.md) | spec | pending |
| 02 | [Refactor archive-private to lib/ autoload structure](02-archive-private-lib-structure.md) | private | pending |
| 03 | [Coverage pipeline (ucode → aggregated JSON)](03-archive-private-coverage-pipeline.md) | private | pending |
| 04 | [RegistryBuilder: fonts.json + font-metadata.json](04-archive-private-registry-builder.md) | private | pending |
| 05 | [DetailsBuilder: details/{slug}.json](05-archive-private-details-builder.md) | private | pending |
| 06 | [Unify archive-public sync](06-archive-public-sync-unification.md) | public | pending |
| 07 | [archive-public unicode/ pipeline](07-archive-public-unicode-pipeline.md) | public + ucode | pending |
| 08 | [fontist.org consumer alignment](08-fontist-org-consumer-alignment.md) | fontist.org | pending |
| 09 | [CI trigger chain](09-ci-trigger-chain.md) | all | done (this repo) |
| 10 | [End-to-end local validation](10-end-to-end-validation.md) | all | done |
| 11 | [Update coverage-architecture.md](11-update-coverage-architecture.md) | spec | done |
| 12 | [Pre-existing test + data failures](12-pre-existing-test-and-data-failures.md) | fontist.org | done |
| 13 | [TTC: wire ucode audit collection per face](13-ttc-ucode-collection.md) | private | done |
| 14 | [CI dispatch: archive-public → fontist.org](14-ci-dispatch-link-archive-public-to-org.md) | public | done (PAT provisioning: user) |
| 15 | [Multi-repo CI dispatch unification](15-dispatch-link-missing-sync-workflows.md) | private + public | done (PAT provisioning: user) |
| 16 | [archive-public: legacy `fonts/` cleanup](16-archive-public-legacy-fonts-cleanup.md) | public | pending (user confirmation) |
| 17 | [gen-font-families.mjs legacy fallback](17-gen-font-families-legacy-fallback.md) | fontist.org | done (folded into plan 19) |
| 18 | [Remaining gaps survey](18-remaining-gaps-survey.md) | all | doc-only, follow-ups catalogued |
| 19 | [Font pages ship empty in SSG — fix](19-font-pages-ship-empty-ssg-fix.md) | fontist.org | done |
| 20 | [SSG regression coverage + dist size](20-ssg-regression-coverage-and-dist-size.md) | fontist.org | tests added, follow-ups catalogued |
| 21 | [More silent SSG gaps: /licenses, /guide, ComparePage](21-more-ssg-gaps-licenses-guide-compare.md) | fontist.org | done (property-detail deferral captured) |
| 22 | [Split /U+{hex} into its own Pages repo](22-char-site-split.md) | new repo: fontist/codepoints | scoped, awaiting user decision |
| 23 | [Block coverage heatmap](23-block-coverage-heatmap.md) | fontist.org | done |

## Out of scope (deferred)

- Per-codepoint JSONs (`codepoints/{hex}.json`) — needs ucode publisher; tracked in plan 07.
- Universal glyph set SVG publishing — needs ucode TODO 20 per `ucode audit font --help`.
- Cutting over fontist.org's prod `fetch-data.sh` from old `fontist/fontist-archive` to new `-public` — happens after plan 10 validates.
- Deleting legacy flat-json coverage files in archive-public — never (global rule). They coexist; consumer ignores them.
