# 08 — fontist.org consumer alignment

## Why

fontist.org's `scripts/fetch-data.sh` + `src/lib/types/domain.ts` are wired
for the OLD `fontist/fontist-archive` pipeline. They need to align with the
new archive-public shapes from plans 01/03/04/05.

## Changes

### 8.1 — `scripts/fetch-data.sh`

**Current:** clones `fontist/fontist-archive` (old repo) and copies flat
coverage + .woff2 + .json registries.

**New:** clone `fontist/fontist-archive-public` (new repo) and copy nested
coverage + .woff specimens + registries + details.

```diff
- ARCHIVE_REPO="https://github.com/fontist/fontist-archive.git"
+ ARCHIVE_REPO="https://github.com/fontist/fontist-archive-public.git"
```

Coverage copy block — preserve directory structure:

```bash
log "copying coverage/ (nested per-face)"
mkdir -p "$PUBLIC/coverage"
if [[ -d "$TMP/archive/coverage" ]]; then
  cp -r "$TMP/archive/coverage/." "$PUBLIC/coverage/"
fi
```

Details copy block (new):

```bash
log "copying details/ (formula detail JSONs)"
mkdir -p "$PUBLIC/details"
if [[ -d "$TMP/archive/details" ]]; then
  cp -r "$TMP/archive/details/." "$PUBLIC/details/"
fi
```

Woff copy block — change `.woff2` → `.woff`:

```diff
- find "$TMP/archive/fonts" -maxdepth 1 -name '*.woff2' -exec cp {} "$PUBLIC/fonts/" \;
+ if [[ -d "$TMP/archive/woff" ]]; then
+   mkdir -p "$PUBLIC/fonts"
+   # Flatten woff/{slug}/{PSName}.woff → fonts/{slug}-{PSName}.woff for
+   # backwards compatibility with current consumer path expectations.
+   # OR: keep nested and update useFontFace to handle nested paths.
+   find "$TMP/archive/woff" -name '*.woff' -exec cp {} "$PUBLIC/fonts/" \;
+ fi
```

**Decision needed:** keep nested `woff/{slug}/{PSName}.woff` or flatten to
`fonts/{slug}-{PSName}.woff`? The current fontist.org consumer's
`compare-context.ts:44` does `fonts/${slug}.woff2` — flat per slug. The
archive produces nested per slug + PSName. There's a many-faces-per-slug
mismatch.

**Choice:** flatten to `fonts/{slug}-{PSName}.woff` so each face is
uniquely addressable. Update consumer accordingly.

### 8.2 — `src/lib/types/domain.ts`

Rename field per plan 01:

```diff
  export interface FontMetadataEntry {
    slug: string
    formula_path: string
    redistributable: boolean
    primary_family: string | null
    coverage_file: string
-   woff2_file: string
+   woff_file: string
  }
```

### 8.3 — Consumer path updates

Files that reference `.woff2` extension as canonical:

- `src/lib/fonts/compare-context.ts:44` — change fallback to `.woff`
- `src/lib/fonts/format.ts:6` — change default to `.woff`
- Any `useFontFace` or composable that builds font URLs from slug

Search/replace audit:

```bash
grep -rn "woff2_file\|\.woff2\b" src/ | grep -v "\.woff2?\|\.woff2$"
```

NOTO fallbacks in `public/fonts/noto/*.woff2` are KEPT (per global rule —
never delete source). Consumer code that loads noto fallbacks continues to
read .woff2; only the archive-sourced specimens change to .woff.

### 8.4 — Coverage shape validation

`useCoverage` composable + `FontBlockPage` must read the new rich shape
from `coverage/{slug}/{PSName}.json`. Verify field paths align with
`domain.ts` Coverage/CoverageBlock types — they already do (types are the
source of truth).

## Files touched

- `scripts/fetch-data.sh` — change upstream repo + path expectations
- `src/lib/types/domain.ts` — rename `woff2_file` → `woff_file`
- `src/lib/fonts/compare-context.ts` — fallback ext → `.woff`
- `src/lib/fonts/format.ts` — default ext → `.woff`
- (Audit) any other consumer of `woff2_file` field

## Acceptance

- [ ] `npm run build:no-fetch` succeeds after fetch from new archive
- [ ] Font specimen page renders a woff from new archive path
- [ ] Font metadata registry loads (with renamed `woff_file` field)
- [ ] Coverage page renders rich per-block stats from new archive
- [ ] Formula page renders `details/{slug}.json` content

## Out of scope

- Cutover of prod fontist.org to new archive (post plan 10 validation)
- Migration of the legacy noto/*.woff2 fallbacks (kept as-is)
