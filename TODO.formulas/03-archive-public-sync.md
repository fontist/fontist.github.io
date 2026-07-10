# 03 — archive-public `sync-from-private`

Phase C of [README.md](README.md). One-block addition to `fontist-archive-public/bin/sync-from-private`.

## What changes

Add a `details/` copy block between the existing `coverage/` block (lines 7–16) and the `woff/` block (lines 18–27).

## Why

`details/` is metadata only — no font binaries, no redistribution concerns. It follows the same rule as `coverage/`: ALL files public, including `macos/`. See [coverage-architecture.md Data Separation Rules](../coverage-architecture.md#data-separation-rules).

## Implementation

Current `bin/sync-from-private`:

```bash
echo "Syncing coverage (excluding macos/)..."
rm -rf coverage
mkdir -p coverage
cd /tmp/private
for item in coverage/*; do
  [ -e "$item" ] || continue
  base=$(basename "$item")
  [ "$base" != "macos" ] && cp -r "$item" "../coverage/"
done
cd ..

echo "Syncing woff (excluding macos/)..."
rm -rf woff
mkdir -p woff
cd /tmp/private
for item in woff/*; do
  ...
```

Wait — the existing script EXCLUDES `macos/` from coverage too. That contradicts the spec ("coverage IS public even for macOS"). This is a pre-existing bug, not introduced by this work. Flagging it for a follow-up.

For this phase: copy `details/` with the same exclusion pattern as coverage (to match current behavior, not the spec — fixing the macos/coverage bug is a separate concern).

### New block (insert between coverage and woff)

```bash
echo "Syncing details (excluding macos/)..."
rm -rf details
mkdir -p details
cd /tmp/private
for item in details/*; do
  [ -e "$item" ] || continue
  base=$(basename "$item")
  [ "$base" != "macos" ] && cp -r "$item" "../details/"
done
cd ..
```

### Summary line update

```bash
echo "Coverage: $(find coverage -name '*.json' | wc -l)"
echo "Details: $(find details -name '*.json' | wc -l)"
echo "Woff: $(find woff -name '*.woff' | wc -l)"
```

## Verification

- After `archive-private/bin/build` produces `details/google/aclonica.json`, run `bin/sync-from-private`.
- Expect `details/google/aclonica.json` to appear in `fontist-archive-public/details/`.
- Summary line should print `Details: N` matching the count from private.

## Out of scope

- Fixing the existing `macos/` exclusion from `coverage/` sync. The spec says coverage IS public for macOS, but the current script excludes it. Separate concern — file an issue.
- Filtering `details/` by `redistributable`. The details file has NO binaries, just metadata. Even proprietary formulas' details are public.
