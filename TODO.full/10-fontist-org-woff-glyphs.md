# 10 — fontist.org WOFF + glyph rendering

Per-font WOFF specimen loading + per-codepoint SVG glyph rendering with
provenance badges. REQ R2.

## Deliverable

- `@font-face` injection for any active font's WOFF
- `/unicode/glyphs/{hex}.svg` rendering as inline SVG when the universal
  glyph set has a glyph for the codepoint
- `GlyphSourceBadge.vue` showing provenance from
  `/unicode/manifest.json`

## Status

Stub — full plan to follow. Referenced by `REQ-unicode-browser-and-archive-integration.md` R2.

## Dependencies

- TODO.full/09 (archive-public structure)
