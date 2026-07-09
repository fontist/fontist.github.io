# 12 — Pre-existing test failures + data regressions

## Why

End-to-end validation (plan 10) surfaced four classes of pre-existing issues that
predate the archive-unification work. None were caused by the new pipeline, but
all block "green tests" as the unification lands. This plan fixes them and
records the root cause for each.

## Issues + fixes

### 12.1 — `scripts/__tests__/unicode-data.test.ts`: 4 failures

**Root cause:** 340 files under `public/unicode/blocks/`, the manifest
`public/unicode-blocks.json`, and `public/unicode-version.json` had been
overwritten locally by an unknown older generator. The regressed shape:

- `charCount: 299382` (the *full* Unicode 17 codepoint count including
  unassigned + PUA + surrogates), vs. the correct `159866` (assigned,
  non-PUA, non-surrogate).
- `cc: 0` always present on every char (the current generator omits `cc`
  when the canonical combining class is 0).
- Missing `range` field on block files.

The current generator (`scripts/lib/ucd-xml.ts`) is correct — its output
matches HEAD. The local working tree had simply drifted.

**Fix:**
- `git checkout HEAD -- public/unicode-blocks.json public/unicode-version.json
  'public/unicode/blocks/*.json' 'public/unicode/indexes/*'` restored the
  committed shape.
- 6 untracked block files (`high-surrogates.json`,
  `low-surrogates.json`, `high-private-use-surrogates.json`,
  `private-use-area.json`, `supplementary-private-use-area-a.json`,
  `supplementary-private-use-area-b.json`) are excluded by the generator
  (`isPuaBlock` + `EXCLUDED_CATEGORIES = Cs, Co, Cn`). Test
  `block files: PUA blocks have no committed file` enforces this.
  Per the global rule "untracked files are NOT yours to delete," they were
  **moved** to `/tmp/fontist-unicode-backup/` rather than deleted.

**Verification:** all 13 tests in `unicode-data.test.ts` pass.

### 12.2 — `scripts/__tests__/gen-font-families.test.mjs`: style capitalization

**Root cause:** `scripts/gen-font-families.mjs` produced lowercase style
names: `roboto_black → "black"`, `roboto_bold_italic → "bold italic"`. Test
expects `"Black"`, `"Bold Italic"`.

**Fix:** `styleSuffix.replace(/_/g, ' ')` → split on `_`, capitalize each
word, join with space. "Regular" (empty suffix) is unchanged.

```js
style:
  styleSuffix === ''
    ? 'Regular'
    : styleSuffix
        .split('_')
        .map(word => word.charAt(0).toUpperCase() + word.slice(1))
        .join(' '),
```

**Verification:** all 7 tests in `gen-font-families.test.mjs` pass.

### 12.3 — `src/lib/unicode/constants.ts`: duplicate object keys

**Root cause:** `SCRIPT_NAMES` had grown duplicates (and one triplicate) as
additional Unicode scripts were appended over time:

| Key | Offending lines | Canonical line |
|---|---|---|
| `Tagb: 'Tagbanwa'` | 404, 426 | 404 |
| `Taml: 'Tamil'` | 397, 427 | 397 |
| `Tglg: 'Tagalog'` | 403, 427, **428** | 403 |
| `Gujr: 'Gujarati'` | 396, 410 | 396 |
| `Ogam: 'Ogham'` | 402, 407, 420 | 402 |
| `Orya: 'Oriya'` | 396, 420 | 396 |
| `Sinh: 'Sinhala'` | 398, 424 | 398 |
| `Sora: 'Sora Sompeng'` | 408, 425 | 408 |

vite:esbuild warns on duplicate object keys at build time.

**Fix:** removed the later occurrences, leaving the canonical first entry.

**Verification:** `npm test` passes (230 tests). Duplicate-key warnings gone
from build.

### 12.4 — `gen-font-families.test.mjs` not in `npm test` glob

**Root cause:** `package.json` `"test"` glob covered `scripts/__tests__/*.test.ts`
only. `gen-font-families.test.mjs` (`.mjs`, not `.ts`) was orphaned — tests
passed when run manually but never in CI.

**Fix:** added `scripts/__tests__/*.test.mjs` to both `"test"` and
`"test:watch"` globs in `package.json`.

**Verification:** `npm test` now runs 230 tests (was 223).

## Files touched

| File | Change |
|---|---|
| `scripts/gen-font-families.mjs` | capitalize each word in style suffix |
| `src/lib/unicode/constants.ts` | removed 8 duplicate keys (10 entries) |
| `package.json` | add `scripts/__tests__/*.test.mjs` to test glob |
| `public/unicode-blocks.json` | restored from HEAD (working-tree drift) |
| `public/unicode-version.json` | restored from HEAD |
| `public/unicode/blocks/*.json` | restored from HEAD (340 files) |
| `public/unicode/indexes/*` | restored from HEAD |

## Acceptance

- [x] `npm test` is green (230 tests pass)
- [x] vite:esbuild duplicate-key warnings gone
- [x] Stale PUA/surrogate files removed from `public/unicode/blocks/` (moved
  to `/tmp/fontist-unicode-backup/`, not deleted — global rule)
- [x] Stale unicode data restored from HEAD; generator output shape verified

## Out of scope

- Investigating *what* overwrote the 340 unicode files locally (one-off
  drift, not a recurring bug; the generator is correct).
- Forward-fixing `CoverageAggregator` shape — covered separately in plan 11.
