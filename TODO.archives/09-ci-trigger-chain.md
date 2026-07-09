# 09 — CI trigger chain

## Why

Per coverage-architecture.md, the intended pipeline is:

```
formulas PR merged
   ↓ repository_dispatch
fontist-archive-private build (matrix)
   ↓ on success
fontist-archive-public sync (repository_dispatch)
   ↓ on success
fontist.org rebuild (repository_dispatch)
```

## Current state (verified 2026-06-29)

| Link | Status | Where |
|------|--------|-------|
| formulas → archive-private | NOT wired | formulas repo has no dispatch sender; archive-private relies on weekly cron (Mon 06:00 UTC) + `repository_dispatch[rebuild]` (manual) |
| archive-private matrix | OK | `build.yml` matrix: google / sil / top-level / macos. Batches of 200 formulas per round, up to 50 rounds per source. |
| archive-private → archive-public | OK | `build.yml:100-106` curls `repository_dispatch[sync]` against `fontist/fontist-archive-public` at end of each matrix run. |
| archive-public sync (canonical) | OK | `sync.yml` triggers on `schedule(0 */6 * * *)`, `workflow_dispatch`, `repository_dispatch[sync]`. Calls `bin/sync-from-private`. |
| archive-public sync (legacy) | OK | `sync-private.yml` triggers on `repository_dispatch[archive-private-updated]`. Calls same `bin/sync-from-private`. Kept to honor old senders; new senders should target `sync.yml`'s `[sync]` event. |
| archive-public → fontist.org | **MISSING** | archive-public's `sync.yml` commits changes but does NOT dispatch fontist.org. fontist.org only rebuilds on push-to-main + `repository_dispatch[rebuild]` (manual) + workflow_dispatch. |
| fontist.org build | OK | `build.yml` triggers on `push[main]`, `repository_dispatch[rebuild]`, `workflow_dispatch`. |

## The gap

`fontist-archive-public/.github/workflows/sync.yml` does not send
`repository_dispatch[rebuild]` to `fontist/fontist.org` after a successful
sync commit. As a result, archive-public updates can sit for hours/days
before fontist.org rebuilds.

## Target chain

### 9.1 — formulas → archive-private (out of scope to author here)

Add to `formulas/.github/workflows/notify-archive.yml`:

```yaml
on:
  push:
    branches: [main]
    paths: ['Formulas/**']
  workflow_dispatch:

jobs:
  notify:
    runs-on: ubuntu-latest
    steps:
      - run: |
          curl -X POST \
            -H "Authorization: token ${{ secrets.PAT_ARCHIVE_DISPATCH }}" \
            -H "Accept: application/vnd.github.v3+json" \
            https://api.github.com/repos/fontist/fontist-archive-private/dispatches \
            -d '{"event_type":"rebuild"}'
```

This lives in the formulas repo. Authoring it here is out of scope —
documented for whoever owns that repo.

### 9.2 — archive-private build matrix (already wired)

`fontist-archive-private/.github/workflows/build.yml`:
- Triggers: `workflow_dispatch`, `repository_dispatch[rebuild]`, weekly cron.
- Matrix: 4 sources in parallel.
- End-of-build dispatch curl at `build.yml:100-106` fires `repository_dispatch[sync]` against archive-public.

No changes needed.

### 9.3 — archive-public sync (already wired)

`fontist-archive-public/.github/workflows/sync.yml`:
- Triggers: `schedule(0 */6 * * *)`, `workflow_dispatch`, `repository_dispatch[sync]`.
- Calls `bin/sync-from-private`, commits if changed.

`sync-private.yml` listens for the legacy `[archive-private-updated]`
event type and routes to the same script. Both can coexist; new senders
should prefer `[sync]`.

### 9.4 — archive-public → fontist.org (RECOMMENDED, NOT YET IMPLEMENTED)

Add a dispatch step to `fontist-archive-public/.github/workflows/sync.yml`
after the commit step:

```yaml
      - name: Trigger fontist.org rebuild
        if: steps.commit.outcome == 'success'
        run: |
          curl -s -X POST \
            -H "Authorization: token ${{ secrets.FONTIST_CI_PAT_TOKEN }}" \
            -H "Accept: application/vnd.github.v3+json" \
            https://api.github.com/repos/fontist/fontist.org/dispatches \
            -d '{"event_type":"rebuild"}' || true
```

This requires:
- The existing repo secret `FONTIST_CI_PAT_TOKEN` on archive-public (same
  name used across the Fontist org, e.g. `formulas/.github/workflows/trigger-archive.yml`).
  Its PAT must have dispatch scope on `fontist/fontist.org`.
- Capturing the commit step's success via an `id:` on the commit step
  (`if: steps.commit.outputs.committed == 'true'` is cleaner but requires
  the commit step to set an output).

Out of scope to author here — touches a workflow in another repo and
needs a PAT secret provisioned by the user.

## Files touched in this repo (fontist.org)

- This document only. No workflow changes.

## Acceptance

- [x] Workflow YAML files surveyed and described accurately.
- [x] Dispatch event types align across existing senders + receivers.
- [x] Gap (archive-public → fontist.org) documented for user follow-up.
- [ ] (Out of scope) archive-public's sync.yml sends `[rebuild]` to fontist.org.
- [ ] (Out of scope) formulas repo notifies archive-private on Formulas/** pushes.

## Out of scope

- Authoring workflow changes in archive-private / archive-public / formulas
  repos (user merges via PR).
- Sub-batch granularity (each formula triggers its own build) — current
  per-source matrix batching is sufficient for the data volumes involved.
