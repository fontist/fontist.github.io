# 18 — Remaining minor gaps (documented, not blocking)

## Why

End-to-end validation passes: `npm test` is green (230 tests), `npm run
build:no-fetch` succeeds (37,138 pages), all four archive-public sync
workflows dispatch fontist.org, archive-private build.yml uses the right
token. This plan captures the smaller items survey turned up so they
aren't lost. None block the build; each is a "would be nice" cleanup.

## 18.1 — `TODO.ucode-clean/*` references in source code

**State:** Six source files reference `TODO.ucode-clean/{02,03,06,07}`
documents that don't exist anywhere in the repo:

```
src/lib/types/domain.ts:221        → TODO.ucode-clean/03-codepoint-filename-contract.md
src/lib/unicode/constants.ts:152   → TODO.ucode-clean/03
src/lib/unicode/constants.ts:173   → TODO.ucode-clean/03
src/lib/unicode/constants.ts:257   → TODO.ucode-clean/06
src/lib/unicode/data/loader.ts:133 → TODO.ucode-clean/03
src/pages/UnicodeCharPage.vue:82   → TODO.ucode-clean/02
src/pages/UnicodeCharPage.vue:331  → TODO.ucode-clean/06
scripts/fetch-data.sh:148          → TODO.ucode-clean/07
```

**Why this matters:** future readers will chase a broken reference.

**Options:**
1. Create the `TODO.ucode-clean/` directory with stub plans for 02, 03,
   06, 07 capturing the contracts the code already implements.
2. Repoint the references at `TODO.archives/` (most of these are now
   covered by plans 07 + 11).
3. Remove the references entirely (the code is the source of truth).

**Recommendation:** option 2 — the existing `TODO.archives/07-archive-public-unicode-pipeline.md`
already covers the codepoint filename contract and the unicode pipeline.
A single sweep to repoint the references is a 5-minute change.

## 18.2 — Unicode char SSG routes not generated

**State:** `src/router.ts:20` declares `/unicode/char/:hex`, but
`scripts/gen-ssg-routes.mjs` emits zero `/unicode/char/*` routes. The
current build's 37,138 pages contain no per-codepoint pages.

**Why this matters:** visiting `https://www.fontist.org/unicode/char/0041`
in production 404s on GitHub Pages. The SPA fallback might render it
client-side, but SEO/OG tags suffer and first-paint is slow.

**Scope concern:** Unicode 17.0.0 has 159,866 assigned codepoints.
Pre-rendering all of them would expand the build from ~37K to ~197K
routes — roughly 5× the current build time and dist/ size.

**Options:**
1. **Full pre-render.** Add codepoint enumeration to `gen-ssg-routes.mjs`
   from `public/unicode/indexes/by-*.json`. Pay the build-time cost.
2. **Curated subset.** Pre-render only "notable" codepoints (Han
   radicals, emoji, ASCII letters as samples). Document the rest as
   runtime-only.
3. **On-demand via redirect.** Don't SSG; have GitHub Pages 404 → SPA
   fallback render the page client-side. Acceptable but loses SEO.

**Recommendation:** option 1, but only after the user confirms they
want the build-time hit. This is a deployment-scale decision, not a
code-correctness one.

**Not implemented** — flagged for user decision.

## 18.3 — archive-private `Gemfile.lock` local path leakage

**State:** `fontist-archive-private/Gemfile.lock` in the working tree
contains two `PATH` sections pointing at `/Users/mulgogi/src/fontist/{fontisan,ucode}`.
The committed HEAD version uses `https://rubygems.org/` (clean).

**Why this matters:** if the local lockfile is committed by accident,
CI's `bundle install --deployment` will fail because the local paths
don't exist on the runner.

**Why this isn't a fix:** the local lockfile is intentional — the user
is developing ucode/fontisan locally with `UCODE_PATH` + `FONTISAN_PATH`
env vars. The `M Gemfile.lock` in `git status` is expected local state,
not a bug.

**Mitigation:** add a git pre-commit hook that rejects Gemfile.lock
commits containing `/Users/`. Out of scope here — noted for the user.

## 18.4 — Source-code TODOs that reference missing docs

Quick inventory of `TODO.*` references in src/ that don't resolve to
files in this repo:

| Reference | Count | Notes |
|---|---|---|
| `TODO.ucode-clean/*` | 8 | see 18.1 |
| `TODO.unify/*` | few | directory exists, references valid |
| `TODO.archives/*` | few | directory exists, references valid |

Only `TODO.ucode-clean/*` is broken.

## Files touched

| File | Change |
|---|---|
| `coverage-architecture.md` | TTC section + audit pipeline section updated to reflect `audit collection` wiring (plan 13) |

No code changes in this plan — documentation only.

## Acceptance

- [x] Survey complete; gaps catalogued
- [ ] (Follow-up) Repoint `TODO.ucode-clean/*` references → `TODO.archives/`
- [ ] (User decision) Enable Unicode char SSG routes (option 1/2/3 above)
- [ ] (User action) Add pre-commit hook for Gemfile.lock local-path check

## Out of scope

- Authoring stub `TODO.ucode-clean/*` files. The references should be
  repointed, not the docs created — the work is already documented in
  `TODO.archives/07` and `TODO.archives/11`.
