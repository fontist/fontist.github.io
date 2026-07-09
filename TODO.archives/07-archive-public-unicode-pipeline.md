# 07 — archive-public unicode/ pipeline (from ucode)

## Why

fontist.org's `fetch-data.sh --with-unicode` (lines 144-185) expects:

```
archive-public/unicode/
├── block-feed/
│   ├── unicode-blocks.json
│   ├── unicode-version.json
│   └── blocks/{slug}.json
├── universal-glyph-set/
│   ├── manifest.json
│   ├── entries/U+XXXX.json
│   └── glyphs/U+XXXX.svg
└── codepoints/{hex}.json            (per-codepoint detailed JSONs)
```

Current state of archive-public/unicode/:

```
unicode/
├── block-feed/
│   └── unicode/blocks/             # only blocks subdir; missing root files
└── universal-glyph-set/             # EMPTY
```

No `codepoints/` at all. README mentions `codepoints-{version}.tar.zst`
release asset — doesn't exist on disk either.

## Source of truth

`fontist/ucode` repo owns Unicode data. Per coverage-architecture.md
role-summary table:

> ucode is the BRAIN... ucode's own build produces Unicode-only data
> (per-codepoint JSONs, block-feed, universal glyph set).

The ucode repo must have its own publish workflow that syncs to
archive-public. Today there's `archive-public/.github/workflows/sync-ucode.yml`
but the ucode side either doesn't trigger it or doesn't exist.

## Decision

This plan **scopes the consumer-side expectation** and **creates directory
placeholders + README in archive-public**. The actual ucode-side publish
workflow is ucode's responsibility (out of scope here, but documented).

## archive-public/unicode/ structure after this plan

```
unicode/
├── README.md                                # NEW — explains each subdir
├── block-feed/
│   ├── README.md                            # NEW — points to ucode source
│   └── unicode/blocks/                      # existing partial
├── universal-glyph-set/
│   └── README.md                            # NEW — explains empty state
└── codepoints/
    └── README.md                            # NEW — explains tarball vs flat
```

Each README documents:
- What the subdir contains
- Who publishes it (ucode's CI)
- What format consumers should expect
- Current state (empty / partial / complete)

## Consumer fallback (fontist.org)

Until archive-public unicode/ is populated, fontist.org continues using
`npm run gen-unicode` locally. fetch-data.sh `--with-unicode` flag stays
optional.

No fontist.org change needed in this plan.

## ucode-side publish workflow (DOCUMENTATION ONLY)

Document the expected ucode workflow in archive-public/unicode/block-feed/README:

```yaml
# ucode repo: .github/workflows/publish-unicode.yml
# Triggers on ucode release tags + manual dispatch
# Syncs to fontist/fontist-archive-public via repository_dispatch + PR
```

The actual workflow lives in `fontist/ucode` repo (out of scope to author here).

## Files touched

- `unicode/README.md` — NEW
- `unicode/block-feed/README.md` — NEW
- `unicode/universal-glyph-set/README.md` — NEW
- `unicode/codepoints/README.md` — NEW

## Acceptance

- [ ] Each subdir has a README explaining its contents + publisher
- [ ] No empty directories without READMEs
- [ ] fontist.org fetch-data.sh `--with-unicode` still skips gracefully
      when subdirs are empty

## Out of scope

- Authoring the ucode publish workflow (lives in ucode repo)
- Populating the actual unicode data (requires ucode CI run)
- Decision: per-codepoint flat files vs tarball (deferred until first
  ucode publish — pick then based on repo-size constraints)
