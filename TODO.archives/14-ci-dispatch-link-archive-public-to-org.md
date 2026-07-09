# 14 — CI dispatch link: archive-public → fontist.org

## Why

Per `09-ci-trigger-chain.md`, the intended dispatch chain is:

```
formulas PR merged
   ↓ repository_dispatch
fontist-archive-private build
   ↓ repository_dispatch[sync]      (already wired)
fontist-archive-public sync
   ↓ repository_dispatch[rebuild]   ← was MISSING
fontist.org build
```

Without the last link, archive-public sync commits land but fontist.org doesn't
rebuild until its own push-to-main or a manual `workflow_dispatch`. Stale data
for hours or days.

## Fix

Added a `Trigger fontist.org rebuild` step to
`fontist-archive-public/.github/workflows/sync.yml`. The commit step gained an
`id: commit` and emits `committed=true|false` via `$GITHUB_OUTPUT`. The
dispatch step is gated on `committed == 'true'` so no-op syncs don't trigger
downstream churn.

```yaml
      - name: Commit and push
        id: commit
        run: |
          git config user.name "Fontist Bot"
          git config user.email "bot@fontist.org"
          git add -A
          if ! git diff --cached --quiet; then
            git commit -m "Sync from fontist-archive-private $(date -u +%Y-%m-%dT%H:%M)"
            git push
            echo "committed=true" >> "$GITHUB_OUTPUT"
          else
            echo "No changes"
            echo "committed=false" >> "$GITHUB_OUTPUT"
          fi

      - name: Trigger fontist.org rebuild
        if: steps.commit.outputs.committed == 'true'
        env:
          FONTIST_CI_PAT_TOKEN: ${{ secrets.FONTIST_CI_PAT_TOKEN }}
        run: |
          if [ -z "$FONTIST_CI_PAT_TOKEN" ]; then
            echo "FONTIST_CI_PAT_TOKEN secret not set — skipping fontist.org dispatch"
            exit 0
          fi
          curl -s -X POST \
            -H "Authorization: token $FONTIST_CI_PAT_TOKEN" \
            -H "Accept: application/vnd.github.v3+json" \
            https://api.github.com/repos/fontist/fontist.org/dispatches \
            -d '{"event_type":"rebuild"}' \
            -w "HTTP %{http_code}\n"
```

## Secret used

`FONTIST_CI_PAT_TOKEN` on `fontist/fontist-archive-public`. This is the
**same secret name already used across the Fontist org** — see
`formulas/.github/workflows/trigger-archive.yml` and
`formulas/.github/workflows/metanorma.yml`. The PAT is provisioned with
enough scope to dispatch repository_dispatch on the target repos
(`fontist/fontist.org` here).

No new secret needs provisioning if `FONTIST_CI_PAT_TOKEN` is already on
archive-public with org-wide dispatch scope. If it's missing, mirror the
existing secret from `fontist/formulas`.

## Defensive design choices

1. **Soft-fail when secret is missing.** If `FONTIST_CI_PAT_TOKEN` isn't
   set on archive-public, the step logs and exits 0 rather than failing the
   workflow. This keeps archive-public sync healthy during any rollout window.

2. **`-w "HTTP %{http_code}\n"`** surfaces the GitHub API response code in
   the workflow log without interpreting it as failure. A 422 (e.g. temporary
   upstream issue) shouldn't fail sync — the data is already committed and
   the next scheduled fontist.org rebuild will pick it up.

3. **`-s` silent flag** keeps the curl output to just the HTTP status line.
   No progress bar noise in workflow logs.

## Files touched

| File | Change |
|---|---|
| `fontist-archive-public/.github/workflows/sync.yml` | +19 lines: id commit step, dispatch step |

## Acceptance

- [x] sync.yml has `id: commit` on commit step with `committed` output
- [x] Dispatch step gated on `committed == 'true'`
- [x] Soft-fails when `FONTIST_CI_PAT_TOKEN` is unset
- [x] Targets `fontist/fontist.org` with `event_type: rebuild`
- [ ] (Out of scope — user action) Verify `FONTIST_CI_PAT_TOKEN` is provisioned
      on archive-public (mirror from `fontist/formulas` if missing)
- [ ] (Out of scope — formulas repo owner) Wire formulas → archive-private
      dispatch per `09-ci-trigger-chain.md` §9.1

## Out of scope

- **formulas → archive-private link** (plan 09 §9.1). Lives in the formulas
  repo, needs its own PAT. Tracked but not actionable from fontist.org.

- **Sub-batch granularity.** The dispatch fires once per archive-public sync
  commit, not once per upstream formula merge. Daily/6-hourly sync cadence
  is fine for the data volumes involved.
