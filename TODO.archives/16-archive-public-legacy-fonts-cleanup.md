# 16 — archive-public: legacy `fonts/` directory cleanup

## State observed (2026-06-30)

`fontist-archive-public` carries TWO parallel woff trees:

| Path | Files | Structure | Git-tracked? | Used by fontist.org? |
|---|---|---|---|---|
| `fonts/{namespace}/{family_slug}.woff` | 2,165 | flat (one woff per family) | yes (committed) | **NO** (fetch-data.sh doesn't read it) |
| `woff/{namespace}/{family_slug}/{PSName}.woff` | 1,386 | per-face (mirrors `coverage/`) | no (sync output) | YES (fetch-data.sh preserves `woff/` structure) |

`font-metadata.json`'s `woff_file` field references the per-face path
(`woff/google/abel/Abel-Regular.woff`), so fontist.org fetches `woff/`
exclusively. The committed `fonts/` directory is **dead weight**.

## Why it exists

Commit `57e0806e` (2026-06-22) added the original `fonts/` flat structure
with the initial archive-public sync. Commit `16d0ceef` (later) added more
woff specimens under the same flat layout. The per-face `woff/` structure
was introduced later (plan 02/04 era) but `sync-from-private` does not
remove the legacy `fonts/` directory — it only deletes `coverage/`,
`details/`, and `woff/` before re-creating them.

## Why this is a problem

1. **Repo bloat.** 2,165 stale binary files (~30-50 MB) shipped on every
   clone of archive-public.
2. **Confusing for consumers.** Anyone reading archive-public's tree
   sees two competing woff layouts. fontist.org fetch-data.sh knows to
   read `woff/`, but a future consumer might pick the wrong one.
3. **Misleading `fonts.json` / `font-metadata.json` cross-check.** Anyone
   correlating the registries against the `fonts/` directory will see
   "missing" files that are actually in `woff/`.

## Recommended fix (NOT YET IMPLEMENTED)

Add one line to `archive-public/bin/sync-from-private`, in the "Syncing
woff" section:

```bash
echo "Syncing woff (OPEN LICENSES ONLY — skip macos/)..."
rm -rf woff fonts          # ← also remove legacy flat fonts/ tree
mkdir -p woff
```

Then push. The next sync.yml run will commit the deletion, removing
2,165 stale files in a single commit.

## Why this is documented, not implemented

Per global rule:
> NEVER use `rm -f` or `rm -rf` on files you didn't create.
> ASK before any destructive action.

The legacy `fonts/` directory is **committed** (not just untracked). Adding
`rm -rf fonts` to the sync script effectively deletes 2,165 committed
files on the next CI run. The user owns this repo and should explicitly
confirm before such a destructive operation.

## Suggested rollout

1. **Confirm intent** with user (one-line question).
2. Add `rm -rf fonts` to `bin/sync-from-private`.
3. Run sync.yml via `workflow_dispatch` to flush the deletion.
4. Verify fontist.org still builds (it should — fetch-data.sh reads
   `woff/`, not `fonts/`).
5. Update `coverage-architecture.md` data-separation table to drop
   `fonts/` from the inventory.

## Acceptance

- [ ] User confirms intent to retire the legacy `fonts/` flat structure.
- [ ] `bin/sync-from-private` extended with `rm -rf fonts`.
- [ ] sync.yml run commits the deletion (single PR or direct commit
      by archive-bot).
- [ ] fontist.org `npm run build` still succeeds against the slimmed
      archive-public.

## Out of scope

- Renaming `woff/` → `fonts/` (would require coordinated changes across
  archive-public, fetch-data.sh, and the Vue components that read
  woff paths). The current `woff/` name is fine.
