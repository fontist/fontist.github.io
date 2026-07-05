---
title: "UFO compilation pipeline in pure Ruby"
description: "Fontisan offers a pure-Ruby alternative for building fonts from UFO sources — complementing existing Python and AFDKO toolchains with a simple, unified API."
authors:
  - Ronald Tse
date: 2026-07-05
---

# UFO compilation pipeline in pure Ruby

<BlogByline />

Building fonts from [UFO (Unified Font Object)](https://unifiedfontobject.org)
sources is a core part of any type-foundry workflow. The established tools —
Python's `fontTools`, `ufoLib2`, and `ufo2ft`, plus Adobe's AFDKO — are powerful
and well-loved by the type community.

Fontisan now offers a complementary option: the same UFO compile pipeline,
written entirely in Ruby, with a single-gem install and a unified API. If you're
already in a Ruby toolchain, or want one simple CLI for everything from UFO to
WOFF2 to Type 1, fontisan brings it all together.

## What shipped

Fontisan's UFO subsystem (`Fontisan::Ufo::*`) now covers every layer the
Python stack provides, as a Ruby-native alternative:

**Model layer** — 16 typed classes (`Font`, `Glyph`, `Contour`, `Point`,
`Component`, `Anchor`, `Guideline`, `Layer`, `Info`, `Kerning`, `Features`,
`Lib`, `DataSet`, `ImageSet`, `Reader`, `Writer`). Read and write UFO v2/v3
directories.

**Compile pipeline** — `TtfCompiler`, `OtfCompiler` (CFF1), `Otf2Compiler`
(CFF2), `VariableTtf`, `VariableOtf`. Each compiler builds the full table set
(head, hhea, maxp, OS/2, name, post, hmtx, cmap) plus the format-specific
outline table (glyf/loca or CFF/CFF2).

**Glyph filters** (8) — `cubic_to_quadratic`, `reverse_contour_direction`,
`decompose_components`, `flatten_components`, `transformations` (affine matrix),
`sort_contours` (TrueType hinting compat), `propagate_anchors` (composite→base
anchor inheritance), `remove_overlaps`.

**Feature writers** (6) — `Kern` (GPOS PairPos), `Kern2` (extended with device
tables), `Gdef` (glyph classification), `Mark` (mark-to-base), `Mkmk`
(mark-to-mark), `Curs` (cursive joining). Each returns structured data for the
table builders to encode.

**Conversion wrappers** (10 formats) — a single `Ufo::Convert.convert(ufo, to:,
output_path:)` dispatcher routes to the right pipeline:

| Format | Chain |
|---|---|
| TTF, OTF, OTF2 | Direct compile |
| WOFF, WOFF2 | Compile → encode with Brotli/zlib |
| dfont, TTC, OTC | Compile → wrap in collection container |
| PFB, PFA | Compile → Type 1 conversion |

**CLI** — four commands:

```bash
fontisan ufo build MyFont.ufo --output MyFont.ttf
fontisan ufo convert MyFont.ufo MyFont.woff2
fontisan ufo validate MyFont.ufo
fontisan ufo extract MyFont.ufo A A.svg
```

## Why a Ruby option?

Fontisan doesn't replace fontTools or AFDKO — those are mature, battle-tested
tools with deep community support. Fontisan complements them by offering:

- **Ruby-native integration** — if your build system, CI pipeline, or web
  framework is already in Ruby, fontisan brings font compilation into the same
  language. No Python subprocess, no shell-out to AFDKO.
- **One gem, every format** — TTF, OTF, CFF2, WOFF, WOFF2, dfont, TTC, OTC,
  PFB, PFA, UFO, TTX, YAML, JSON. A single `gem install fontisan` covers the
  full read/write/convert/validate/subset surface.
- **Simple CLI** — `fontisan info`, `fontisan convert`, `fontisan ufo build`.
  No flags handbook required.
- **Model-driven Ruby API** — every CLI command has a Ruby equivalent. Script
  font workflows the way you'd script any other Ruby project.

## Interoperability

Fontisan's TTX output is byte-compatible with fontTools `ttx` for typed tables.
UFO directories round-trip between fontisan and ufoLib2. WOFF2 output matches
the Google `woff2_compress` format. If you're mixing fontisan with Python tools
in the same pipeline, the formats are interchangeable.

## Architecture: OCP all the way down

Every layer is open for extension, closed for modification:

- **Adding a filter** = one file + one `REGISTRY` entry. No edits to existing
  filters.
- **Adding a feature writer** = one class extending `Base` + one
  `DEFAULT_WRITERS` entry.
- **Adding a conversion format** = one wrapper module + one `WRAPPER_FOR_FORMAT`
  entry.
- **Adding a partitioner** (for the Stitcher) = one file + one autoload.

No switch statements anywhere in the hot path. The compiler runs all default
writers and filters; each returns `nil` when the UFO has no data for it, so it's
always safe to run the full set.

## Try it

```bash
gem install fontisan

# Compile a UFO
fontisan ufo build MyFont.ufo --output MyFont.ttf

# Convert to WOFF2
fontisan ufo convert MyFont.ufo MyFont.woff2

# Extract one glyph as SVG
fontisan ufo extract MyFont.ufo A A.svg
```

Full documentation: [UFO Compilation Guide](https://github.com/fontist/fontisan/blob/main/docs/UFO_COMPILATION.adoc)
and [Feature Parity](https://github.com/fontist/fontisan/blob/main/docs/FEATURE_PARITY.adoc).
