# TODO.formulas — Formula Detail Page Pipeline

Status: **active execution**. Date: 2026-06-24. Branch: `feat/vite-ssg-migration`.

## Context

The `/formulas/:slug` page renders a thin summary from `formulas-data.json` (name, family count, style count, license name). It drops everything that makes a formula useful to a human reader: the description, the homepage, the copyright, the per-style metadata (full name, PostScript name, version, per-style copyright), the resource URLs, and the SPDX license identifier.

The data is already in the formulas repo YAML. It needs to flow through the existing archive pipeline so the website can consume it without parsing YAML at request time.

## Domain reminder

Per [coverage-architecture.md Domain Model](../coverage-architecture.md#domain-model):

- The **formula YAML** is the authoritative source of truth for font family and font style identity.
- The **font binary's `name` table** is authoritative for descriptive metadata only (copyright string, vendor URL, trademark, original description).
- Coverage and details files MIRROR the formula's structure; they never derive identity from the binary.

This pipeline preserves that invariant: details files copy identity fields verbatim from the formula YAML.

## Target pipeline

```
formulas YAML ──▶ archive-private/bin/build ──▶ archive-public/bin/sync-from-private ──▶ fontist.org fetch-data.sh ──▶ FormulaPage.vue
                       (write_details)             (copy details/)                         (rsync details/)            (render)
```

Same shape as the existing coverage pipeline. `write_details` runs alongside `write_coverage` in step 6–7 of the build. `details/` is synced as public metadata (same category as `coverage/`). fontist.org fetches it via `fetch-data.sh` and renders it in `FormulaPage.vue`.

## Phases

1. **[01-details-schema.md](01-details-schema.md)** — define `details/{slug}.json` shape. Mirrors formula YAML top-level + per-style fields, drops heavy license text.
2. **[02-archive-private-write-details.md](02-archive-private-write-details.md)** — add `write_details` + helpers to `fontist-archive-private/bin/build` (Ruby).
3. **[03-archive-public-sync.md](03-archive-public-sync.md)** — add `details/` directory copy to `fontist-archive-public/bin/sync-from-private`.
4. **[04-fontist-fetch-and-types.md](04-fontist-fetch-and-types.md)** — `fetch-data.sh` rsync; new `FormulaDetails` types in `src/lib/types/domain.ts`; new `src/lib/formulas/details-loader.ts` with `findFormulaDetails(slug)`.
5. **[05-formula-page-rewrite.md](05-formula-page-rewrite.md)** — rewrite `src/pages/FormulaPage.vue` to render description, homepage, copyright, resources list, styles table, license block. Falls back to current minimal summary when `details/<slug>.json` is missing.
6. **[06-mock-and-verify.md](06-mock-and-verify.md)** — hand-author `public/details/google/aclonica.json` and `public/details/google/abeezee.json` for local testing; verify build + tests + dev server smoke.

## Non-goals

- Per-version detail pages (e.g., `/formulas/<slug>/<version>`). Versioning is implicit in the formula slug.
- Detecting licenses from binary `name` table entries. The formula YAML already declares `spdx_license` and `license_url`.
- Porting `formulas/docs/generate.js` (it doesn't exist; the reference was wrong).
- Rendering full license text on the page. Link to `license_url` instead.
- Showing copyright/author extraction from the binary's NameID 7 (Trademark) or NameID 11 (Vendor URL). These are nice-to-have follow-ups once the basics render.

## Success criteria

- `npm test` passes (existing 147 + new FormulaDetails loader tests).
- `npm run build:no-fetch` succeeds.
- Visiting `/formulas/google/aclonica` locally renders: description, homepage link, copyright, resources list, styles table with full_name / post_script_name / version, license block with SPDX + URL, install command, family cross-link.
- Visiting `/formulas/<unknown-slug-with-no-details>` falls back to the current minimal rendering (no crash, no missing-detail artifact).
- archive-private `bin/build --limit 1 --source google/aclonica.yml` produces `details/google/aclonica.json`.
- archive-public `bin/sync-from-private` copies `details/` alongside `coverage/` and `woff/`.

## Repo touched

- `fontist/fontist.org` — types, loader, FormulaPage, fetch-data.sh, mock data, plan docs. Branches off `feat/vite-ssg-migration`.
- `fontist/fontist-archive-private` — `bin/build` (Ruby). Separate PR.
- `fontist/fontist-archive-public` — `bin/sync-from-private` (bash). Separate PR.

fontist.org can ship independently using mock data while the archive PRs land.
