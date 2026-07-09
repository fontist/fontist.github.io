# 15 — Multi-repo CI dispatch unification

## Why

Plan 14 added the missing `fontist-archive-public → fontist.org` dispatch link
to `sync.yml`. Survey revealed **four more gaps** in the same dispatch chain,
all variations of the same bug:

| Workflow | Bug |
|---|---|
| `archive-private/.github/workflows/build.yml` | Uses `${{ secrets.GITHUB_TOKEN }}` for cross-repo dispatch to archive-public. **`GITHUB_TOKEN` is repo-scoped and CANNOT trigger `repository_dispatch` on a different repo.** This breaks the link. |
| `archive-public/.github/workflows/sync-private.yml` | No fontist.org dispatch step. (Deprecated workflow, but still active for legacy senders.) |
| `archive-public/.github/workflows/sync-ucode.yml` | No fontist.org dispatch step. (Dead code until `fontist/ucode#publish-unicode-archive` ships, but should be ready.) |
| `archive-public/.github/workflows/sync-panglyph.yml` | No fontist.org dispatch step. (Will fire on first panglyph release.) |

## Fix

### 15.1 — Shared dispatch script

Created `fontist-archive-public/bin/trigger-fontist-org-rebuild` — a single
source of truth for "send `repository_dispatch[rebuild]` to fontist.org".
Soft-fails when `FONTIST_CI_PAT_TOKEN` is unset (covers rollout window
where the PAT hasn't been provisioned yet on a given repo).

```bash
#!/usr/bin/env bash
set -euo pipefail

if [ -z "${FONTIST_CI_PAT_TOKEN:-}" ]; then
  echo "FONTIST_CI_PAT_TOKEN not set — skipping fontist.org dispatch"
  exit 0
fi

curl -s -X POST \
  -H "Authorization: token $FONTIST_CI_PAT_TOKEN" \
  -H "Accept: application/vnd.github.v3+json" \
  https://api.github.com/repos/fontist/fontist.org/dispatches \
  -d '{"event_type":"rebuild"}' \
  -w "fontist.org dispatch HTTP %{http_code}\n"
```

Why a script, not a composite action: simpler, no YAML overhead, and the
existing workflows already use shell scripts in `bin/`. MECE: dispatch
logic lives in exactly one place; "did we commit?" detection stays
per-workflow.

### 15.2 — `archive-private/build.yml`: GITHUB_TOKEN → FONTIST_CI_PAT_TOKEN

The Trigger public sync step now reads `FONTIST_CI_PAT_TOKEN` and uses
the same soft-fail pattern. `secrets.GITHUB_TOKEN` is fine for same-repo
operations but is rejected by GitHub's API for cross-repo dispatch —
the previous curl was silently 403'ing.

```yaml
      - name: Trigger public sync
        env:
          FONTIST_CI_PAT_TOKEN: ${{ secrets.FONTIST_CI_PAT_TOKEN }}
        run: |
          if [ -z "$FONTIST_CI_PAT_TOKEN" ]; then
            echo "FONTIST_CI_PAT_TOKEN secret not set — skipping archive-public dispatch"
            exit 0
          fi
          curl -s -X POST \
            -H "Authorization: token $FONTIST_CI_PAT_TOKEN" \
            ...
```

### 15.3 — All four archive-public sync workflows dispatch fontist.org

Each workflow's commit step gained `id: commit` with `committed=true|false`
output. A new dispatch step is gated on `committed == 'true'` and invokes
the shared script:

```yaml
      - name: Trigger fontist.org rebuild
        if: steps.commit.outputs.committed == 'true'
        env:
          FONTIST_CI_PAT_TOKEN: ${{ secrets.FONTIST_CI_PAT_TOKEN }}
        run: bin/trigger-fontist-org-rebuild
```

Workflows updated:
- `sync.yml` (refactored from inline curl to script call)
- `sync-private.yml`
- `sync-ucode.yml`
- `sync-panglyph.yml`

## Resulting chain

```
formulas PR merged
   ↓ (out of scope — formulas repo owner)
fontist-archive-private build
   ↓ repository_dispatch[sync]      ← FIXED (was using GITHUB_TOKEN)
fontist-archive-public sync.yml / sync-private.yml
   ↓ repository_dispatch[rebuild]   ← FIXED (was missing)
fontist.org build

fontist/ucode publish-unicode-archive
   ↓ workflow_run
fontist-archive-public sync-ucode.yml
   ↓ repository_dispatch[rebuild]   ← FIXED (was missing)
fontist.org build

fontist/panglyph v* tag
   ↓ repository_dispatch[panglyph-released]
fontist-archive-public sync-panglyph.yml
   ↓ repository_dispatch[rebuild]   ← FIXED (was missing)
fontist.org build
```

## Files touched

| File | Change |
|---|---|
| `fontist-archive-public/bin/trigger-fontist-org-rebuild` | new shared script |
| `fontist-archive-public/.github/workflows/sync.yml` | refactor dispatch to script |
| `fontist-archive-public/.github/workflows/sync-private.yml` | +id commit, +dispatch step |
| `fontist-archive-public/.github/workflows/sync-ucode.yml` | +id commit, +dispatch step |
| `fontist-archive-public/.github/workflows/sync-panglyph.yml` | +id commit, +dispatch step |
| `fontist-archive-private/.github/workflows/build.yml` | GITHUB_TOKEN → FONTIST_CI_PAT_TOKEN |

## Acceptance

- [x] Shared dispatch script exists and is executable
- [x] All four archive-public sync workflows gate dispatch on `committed == 'true'`
- [x] archive-private build.yml uses FONTIST_CI_PAT_TOKEN (no GITHUB_TOKEN for cross-repo)
- [x] All workflows soft-fail when secret is unset
- [x] No remaining `secrets.GITHUB_TOKEN` cross-repo usage
- [ ] (User) Verify `FONTIST_CI_PAT_TOKEN` is provisioned on `fontist-archive-private`
- [ ] (User) Verify `FONTIST_CI_PAT_TOKEN` is provisioned on `fontist-archive-public`
      (PAT must have dispatch scope on both fontist/fontist.org and
      fontist/fontist-archive-public)

## Out of scope

- Provisioning the actual PATs (user action via GitHub settings).
- Refactoring matrix runners in archive-private build.yml to dispatch only
  once at the end (currently fires once per matrix source — 4 dispatches
  per build, but archive-public sync.yml is idempotent so this is just
  noise).
