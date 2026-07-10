# 09 — fontist-archive-public structure

Defines the canonical directory layout of `fontist/fontist-archive-public`
as consumed by fontist.org's `scripts/fetch-data.sh`.

## Deliverable

Document and lock the public archive layout:

    fontist-archive-public/
    ├── coverage/{formula_slug}/
    ├── unicode/
    │   ├── block-feed/
    │   ├── universal-glyph-set/
    │   └── codepoints/
    ├── woff/{formula_slug}/
    ├── details/{formula_slug}.json
    ├── fonts.json
    └── font-metadata.json

## Status

Stub — full plan to follow. Referenced by:
- `REQ-unicode-browser-and-archive-integration.md` R1
- `TODO.ucode-clean/07-fetch-from-archive-public.md`

## Dependencies

- TODO.full/16 (sync workflows — also a stub until written)
