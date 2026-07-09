# 06 — Unify archive-public sync workflows

## Why

archive-public currently has TWO overlapping sync workflows that disagree:

| Workflow | Triggers | Source | Logic |
|---|---|---|---|
| `sync.yml` | cron 6h, repository_dispatch[sync], workflow_dispatch | calls `bin/sync-from-private` (bash) | bash script copies coverage + details + woff, **skips macos for ALL three** (WRONG per spec) |
| `sync-private.yml` | repository_dispatch[archive-private-updated], workflow_dispatch | inline `cp -r /tmp/private/coverage .` (copies macos too) + skips macos for woff only (RIGHT per spec) | Does NOT copy `details/` at all |

Two bugs:
1. `bin/sync-from-private` skips macos for coverage + details — wrong (those
   ARE public per coverage-architecture.md data-separation table).
2. `sync-private.yml` doesn't copy `details/` — gap.

And one redundancy: two workflows doing the same job differently.

## Decision

ONE canonical sync script: `bin/sync-from-private`. BOTH workflows call it.

Neither workflow is **deleted** (global rule: never delete source). The
redundant one (`sync-private.yml`) is **deactivated** by replacing its
inline logic with a call to `bin/sync-from-private` and a comment that
`sync.yml` is the canonical trigger.

## Canonical macos handling (per coverage-architecture.md)

| Data | Skip macos? | Reason |
|---|---|---|
| `coverage/` | NO — copy all | Metadata is public |
| `details/` | NO — copy all | Pure formula-YAML derivation |
| `woff/` | YES — skip macos/ | macOS fonts are proprietary |

## bin/sync-from-private (rewritten)

```bash
#!/usr/bin/env bash
set -euo pipefail

# ONE canonical sync script. Called by:
#   - .github/workflows/sync.yml       (cron + repository_dispatch[sync])
#   - .github/workflows/sync-private.yml (repository_dispatch[archive-private-updated])
#
# macos handling per coverage-architecture.md:
#   coverage + details: ALL public (copy macos/)
#   woff:               skip macos/ (proprietary)

SRC="${1:-/tmp/private}"   # path to cloned fontist-archive-private
DST="$(pwd)"

# Clone if not provided
if [ ! -d "$SRC/coverage" ]; then
  echo "Cloning private repo..."
  git clone --depth 1 "https://github.com/fontist/fontist-archive-private.git" /tmp/private
  SRC="/tmp/private"
fi

echo "Syncing coverage (ALL including macos/)..."
rm -rf coverage
mkdir -p coverage
cp -r "$SRC/coverage/." coverage/

echo "Syncing details (ALL including macos/)..."
rm -rf details
mkdir -p details
if [ -d "$SRC/details" ]; then
  cp -r "$SRC/details/." details/
else
  echo "  (no details/ on private — formula pages will degrade to summary)"
fi

echo "Syncing woff (OPEN LICENSES ONLY — skip macos/)..."
rm -rf woff
mkdir -p woff
if [ -d "$SRC/woff" ]; then
  for d in "$SRC/woff"/*; do
    [ -e "$d" ] || continue
    base=$(basename "$d")
    [ "$base" != "macos" ] && cp -r "$d" "woff/"
  done
fi

cp "$SRC/fonts.json" . 2>/dev/null || echo "  (no fonts.json)"
cp "$SRC/font-metadata.json" . 2>/dev/null || echo "  (no font-metadata.json)"

echo "Counts:"
echo "  coverage: $(find coverage -name '*.json' | wc -l) files"
echo "  details:  $(find details -name '*.json' | wc -l) files"
echo "  woff:     $(find woff -name '*.woff' | wc -l) files"
```

## sync.yml (no change — already calls bin/sync-from-private)

Stays as canonical trigger.

## sync-private.yml (deactivated — calls bin/sync-from-private)

```yaml
name: Sync from fontist-archive-private (DEPRECATED — use sync.yml)

# This workflow is kept for back-compat with repository_dispatch
# events from archive-private. sync.yml is the canonical trigger.
# Both call the same bin/sync-from-private script.

on:
  repository_dispatch:
    types: [archive-private-updated]
  workflow_dispatch:

jobs:
  sync:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - name: Clone private (read-only deploy key)
        env:
          SSH_KEY: ${{ secrets.ARCHIVE_PRIVATE_DEPLOY_KEY }}
        run: |
          mkdir -p ~/.ssh
          echo "$SSH_KEY" > ~/.ssh/id_ed25519
          chmod 600 ~/.ssh/id_ed25519
          ssh-keyscan github.com >> ~/.ssh/known_hosts
          git clone --depth 1 git@github.com:fontist/fontist-archive-private.git /tmp/private
      - name: Sync via canonical script
        run: |
          chmod +x bin/sync-from-private
          ./bin/sync-from-private /tmp/private
      - name: Commit + push
        run: |
          git config user.email "archive-bot@fontist.org"
          git config user.name "archive-bot"
          git add -A
          if ! git diff --quiet HEAD; then
            git commit -m "Sync from fontist-archive-private @ $(date -u +%Y-%m-%dT%H:%M:%SZ)"
            git push
          fi
```

## Files touched

- `bin/sync-from-private` — rewrite per spec
- `.github/workflows/sync.yml` — no change
- `.github/workflows/sync-private.yml` — deactivate, delegate to script

## Acceptance

- [ ] `bin/sync-from-private` copies `coverage/` including macos
- [ ] `bin/sync-from-private` copies `details/` including macos
- [ ] `bin/sync-from-private` copies `woff/` EXCLUDING macos
- [ ] Both workflows call `bin/sync-from-private`
- [ ] Local dry-run: `./bin/sync-from-private /tmp/private` succeeds

## Out of scope

- Auto-deletion of legacy flat-json coverage files in archive-public
  (they coexist; consumer ignores them via path filter)
- sync-ucode.yml workflow (plan 07)
- sync-panglyph.yml workflow (separate concern)
