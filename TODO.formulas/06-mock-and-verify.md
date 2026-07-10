# 06 — Mock data + verification

Phase F of [README.md](README.md). Lets us verify the FormulaPage rewrite locally before the upstream archive-private/public pipeline lands.

## Mock files

Hand-author two JSON files under `public/details/`:

### `public/details/google/aclonica.json`

Single-style standalone formula. The simplest case — covers the user's reported issue at `/formulas/google/aclonica`.

Derived from `formulas/Formulas/google/aclonica.yml`. Heavy license text omitted; `license_url` carries the link.

### `public/details/google/abeezee.json`

Two-style standalone formula (Regular + Italic). Verifies the styles-table rendering for multiple rows in one family.

Derived from `formulas/Formulas/google/abeezee.yml`.

### Future mocks (out of scope)

- TTC formula mock — `sil/charis_sil` or `manual/inter`. The standalone case (aclonica) and multi-style case (abeezee) cover the rendering paths; TTC adds the `font_collections` block but the per-style table is the same shape. Defer until archive-private can produce real TTC details.

## Committing mock files

Mock files live under `public/details/` and are committed to the repo. They will be OVERWRITTEN by `fetch-data.sh --force` once the upstream archive has real `details/` data. This is intentional:

- Committing mocks lets the dev server render rich detail without a network fetch.
- The fetch script overrides them when real data is available.
- Once the archive pipeline lands and CI runs, the mocks become real data automatically.

Mark the files clearly with a `_mock: true` field so they can be told apart from real data:

```json
{
  "_mock": true,
  "slug": "google/aclonica",
  ...
}
```

The `_mock` field is not in the schema (01-details-schema.md) — it's a temporary marker. FormulaPage.vue ignores unknown fields.

## Verification

### Tests

```bash
npm test
```

Expected: 147 existing + 3 new details-loader tests = 150 total.

### Build

```bash
npm run build:no-fetch
```

Expected:
- SSG build finishes cleanly.
- `/formulas/google/aclonica` pre-renders with description, resources, styles table.
- `/formulas/google/abeezee` pre-renders with two style rows.
- `/formulas/yu` pre-renders with fallback summary view (no mock, no real details file).

### Dev server smoke test

```bash
npm run dev
```

Spot-check:
- `http://localhost:5173/formulas/google/aclonica` — full detail renders.
- `http://localhost:5173/formulas/google/abeezee` — two style rows.
- `http://localhost:5173/formulas/yu` — fallback summary.
- `http://localhost:5173/formulas/<random-slug>` — 404.

### Mock removal (future)

Once the upstream archive has real `details/` and CI has run `fetch-data.sh --force`, the mock files will be overwritten. At that point, remove the `_mock: true` field from any committed files (or simply let them be replaced by the fetch).

## Commits

Suggested logical groups. All commits on `feat/vite-ssg-migration` branch in `fontist/fontist.org`.

### Commit 1: architecture + plan docs
```
docs(architecture): strengthen domain model; spec details/ pipeline

- Domain Model: split Font Collection as its own entity; add "Why the
  formula is authoritative for identity" section explaining why the
  font binary's name table is NOT authoritative.
- Spec: add details/ to archive-private and archive-public layouts;
  add Details Schema section; add step 7 (write_details) to build
  pipeline; add details/ to data separation table.
- Plan: TODO.formulas/{README,01..06}.md covering the formula detail
  pipeline end-to-end (schema, archive-private write_details,
  archive-public sync, fontist fetch+types+loader, FormulaPage
  rewrite, mock+verify).
```

### Commit 2: fontist.org types + loader + tests
```
feat(formulas): add FormulaDetails types + details-loader

New pipeline for formula detail rendering. The existing FormulaData
summary (from formulas-data.json) only carries name/family/style
counts + license name. The new FormulaDetails type carries the
formula YAML's full identity: description, homepage, copyright,
spdx_license, license_url, resources, per-style metadata.

Loader findFormulaDetails(slug) reads details/<slug>.json with a
per-slug cache; returns null on miss so the page can fall back to
the summary view during incremental rollout.

Types live in lib/types/domain.ts alongside FormulaData so both
shapes are visible in one place.
```

### Commit 3: mock data
```
feat(formulas): mock details/ for aclonica + abeezee

Hand-authored examples derived from the formula YAMLs so the
FormulaPage rewrite can be verified locally before the upstream
archive-private/bin/build write_details step lands.

Marked with `_mock: true`; will be overwritten by fetch-data.sh
--force once the upstream archive pipeline produces real data.
```

### Commit 4: FormulaPage rewrite
```
feat(formula-page): render rich detail with summary fallback

Render description, homepage link, license block with SPDX badge +
URL, copyright block, resources list (URLs + format), per-style
table (full_name, post_script_name, version, variable_font), TTC
collections table, install command, family cross-link.

Falls back to the existing minimal summary when details/<slug>.json
is missing (incremental rollout: ~4,283 formulas get detail pages
as archive-private/bin/build is updated and CI runs).
```

### Commit 5: fetch-data.sh
```
feat(fetch-data): copy details/ from upstream archive

Adds the details/ copy block to scripts/fetch-data.sh, alongside
the existing coverage/ and woff2 blocks. Missing details/ degrades
the formula page to the summary view (no crash).
```

### archive-private (separate PR)
```
feat(bin/build): write details/{slug}.json alongside coverage

Add write_details + build_details helpers. Mirrors the formula
YAML's identity fields (name, description, homepage, copyright,
spdx_license, license_url, resources, fonts, font_collections)
into details/{slug}.json, dropping heavy license text and internal
directives (extract, import_source, sha256, file_size).

Called from process_formula immediately after write_coverage.
```

### archive-public (separate PR)
```
feat(bin/sync-from-private): copy details/ alongside coverage

details/ carries only metadata (no font binaries), same as
coverage/. Add a copy block matching the existing coverage/
pattern.
```
