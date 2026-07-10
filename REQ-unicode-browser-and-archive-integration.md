# REQ: fontist.org — consume ucode Unicode data + panglyph + per-font audit

This is the requirements document for fontist.org as a consumer of:

1. **ucode** — Unicode-only data (block-feed, per-codepoint JSONs,
   universal glyph set)
2. **panglyph** — the universal Unicode 17 font
3. **fontist-archive-public** — per-font audit data (from ucode) +
   WOFF specimens (from fontisan)

It enumerates every UI surface that needs updating + the data sources
each consumes. References the detailed TODO.full/ plans.

## Scope summary

fontist.org is the **consumer-facing site** for the Fontist ecosystem.
It does NOT own:

- Unicode data (ucode owns this)
- Font auditing (ucode owns this; runs in archive-private CI)
- Font assembly (panglyph owns this)
- Font storage (fontist-archive-public owns this)

fontist.org DOES own:

- HTML rendering + UX of all Unicode/font data
- The site build (ViteSSG)
- The fetch pipeline (`scripts/fetch-data.sh`) that pulls from
  fontist-archive-public at build time

## Current state (post recent work)

Already wired in this session:

- `UnicodeCharPage.vue` fetches `/codepoints/{hex}.json` (per-codepoint
  data) and renders: Display (EAW, LBC, VO), Segmentation (Grapheme/
  Word/Sentence), Indic, Hangul, Emoji, Binary Properties, Unihan
  (8 categorized sections including self-reference badge for variants)
- `UnicodeBlockPage.vue` shows per-block codepoint grid (uses
  block-feed)
- `scrollBehavior` resets scroll on page change
- Route param fix for combining/bidiclass
- Case-normalized codepoints fetch (URL hex was uppercased; file is lowercased)

Still needed:

## Requirements

### R1 — Fetch from fontist-archive-public (not raw.githubusercontent.com)

Today `scripts/fetch-data.sh --with-ucode` (PR #44) pulls ucode data
directly from `raw.githubusercontent.com/fontist/ucode/main/docs/public/`.
This couples fontist.org to ucode's repo layout.

**Deliverable**: extend `scripts/fetch-data.sh` to pull from
`fontist/fontist-archive-public/unicode/`:

```bash
log "copying unicode/block-feed/"
if [[ -d "$TMP/archive/unicode/block-feed" ]]; then
  mkdir -p "$PUBLIC/unicode"
  cp -r "$TMP/archive/unicode/block-feed/." "$PUBLIC/unicode/"
fi

log "copying unicode/universal-glyph-set/"
if [[ -d "$TMP/archive/unicode/universal-glyph-set" ]]; then
  mkdir -p "$PUBLIC/unicode/glyphs"
  cp -r "$TMP/archive/unicode/universal-glyph-set/glyphs/." "$PUBLIC/unicode/glyphs/"
  cp "$TMP/archive/unicode/universal-glyph-set/manifest.json" "$PUBLIC/unicode/manifest.json"
fi
```

Per-codepoint JSONs (1.2GB) ship via `--with-codepoints` flag (default
off). When on, downloads the Release tarball from fontist-archive-public.

**Reference**: TODO.full/09 (archive-public structure), TODO.full/16
(sync workflows)

### R2 — Glyph rendering from universal set

`UnicodeCharPage.vue` currently uses `displayChar(cp, category)` which
relies on the browser's font resolution. Rare scripts (Tai Yo, Sidetic,
Egyptian Hieroglyphs Extended-B) render as tofu.

**Deliverable**: when the universal-set SVG is available at
`/unicode/glyphs/{hex}.svg`, render it via inline `<svg><use>` instead
of `displayChar`:

```vue
<img v-if="universalGlyphExists(cp)" :src="`/unicode/glyphs/${hex}.svg`" />
<span v-else>{{ displayChar(cp, charData.c) }}</span>
```

Add a `GlyphSourceBadge.vue` component showing the provenance:
"Glyph from NotoSerifTaiYo (OFL)" — read from
`/unicode/manifest.json` entries.

**Reference**: TODO.full/38

### R3 — Per-block grid rendering via inline SVG `<symbol>` defs

The block grid shows ~thousands of cells. Loading an SVG per cell =
thousands of HTTP requests.

**Deliverable**: render the grid with inlined `<symbol>` defs:

```vue
<svg style="display:none">
  <defs>
    <symbol v-for="cp in chars" :id="`glyph-${cp.cp}`" viewBox="0 0 1000 1000">
      <path :d="cp.outline" />
    </symbol>
  </defs>
</svg>
<svg viewBox="0 0 1000 1000" class="ubg-cell">
  <use :href="`#glyph-${cp.cp}`" />
</svg>
```

For CJK-scale blocks (20k+ glyphs), partition by block-range subset +
lazy-load on scroll via `IntersectionObserver`.

**Reference**: TODO.full/37 (highlight reporter pattern)

### R4 — Font picker on `/unicode`

Today the standalone `/unicode` browser uses system fallback fonts.
Per-font rendering exists at `/fonts/{slug}/unicode` (FontUnicodePage)
but is not accessible from `/unicode`.

**Deliverable**:

1. Extract `injectFontFace` into a global composable that any page
   can call (currently in `FontUnicodePage`).
2. Add `<FontPicker>` to `/unicode` (sticky at top).
3. Persist active font via Pinia store + localStorage.
4. When active font is set:
   - Inject its WOFF via `@font-face`
   - Block list shows coverage bars next to each block name
   - Block detail shows covered/missing cells per font

**Reference**: TODO.full/17

### R5 — Per-block coverage bar

When a font is active, each block row on `/unicode` shows:

```
Basic Latin      [████████████████████] 128/128 (100%)
Greek            [█████████████░░░░░░░] 100/135 (74%)
CJK Unified Ideographs [████████████████████] 20992/20992 (100%)
```

Source: ucode audit YAMLs in `coverage/{slug}/{PSName}.yaml`.

**Deliverable**: parse the audit YAML (via `js-yaml` dependency), build
a per-block fill-ratio map, render as colored bars.

**Reference**: TODO.full/11

### R6 — Per-codepoint coverage indicator

On block detail with active font: each cell shows green (covered) /
gray (missing) overlay.

**Deliverable**: extend `UnicodeBlockGrid.vue` with a
`coverageCps: Set<number>` prop. Cells in the set render in WOFF +
green dot; others gray out + tooltip "Not in {font}".

**Reference**: TODO.full/10

### R7 — `/unicode/best-fonts/{block-slug}` view

Lists fonts sorted by fill ratio for a block. Top result is the
canonical Tier 1 font from ucode's universal-set manifest.

**Deliverable**: new route + page component. Consumes
`/unicode/manifest.json` (universal-set provenance) for canonical
Tier 1 + the per-font coverage YAMLs.

**Reference**: TODO.full/11 §Phase D

### R8 — `/unicode/glyph/{hex}` route

Dedicated glyph detail page: large SVG with zoom, full outline path
data (collapsible `<pre>`), provenance chain (font → cmap → GID →
glyf → SVG).

**Deliverable**: new route + page. Useful for font designers checking
extraction quality.

**Reference**: TODO.full/38 §Phase F

### R9 — panglyph fallback font

When the active font (or system fallback) doesn't cover a codepoint,
fall back to panglyph instead of tofu.

**Deliverable**: inject panglyph's WOFF2 as the lowest-priority
`@font-face` (loaded lazily from `/panglyph/panglyph-unicode17.woff2`).

**Reference**: TODO.full/01 (panglyph vision), TODO.full/38 §Phase A

## Data flow

```
fontist-archive-public
   ├── coverage/              ← ucode audit (per-font YAMLs)
   ├── woff/                  ← fontisan convert (open-license only)
   ├── unicode/block-feed/    ← ucode block-feed emitter
   ├── unicode/universal-glyph-set/   ← ucode universal-set build
   ├── unicode/codepoints-{ver}.tar.zst  ← per-cp JSONs (release asset)
   └── panglyph/              ← panglyph universal font releases
        ▼
   scripts/fetch-data.sh
        ▼
   public/{coverage,woff,unicode,glyphs,codepoints,panglyph}/
        ▼
   Vue components (UnicodeCharPage, UnicodeBlockPage, FontPicker, etc.)
```

## Acceptance

- [ ] R1: fetch-data.sh pulls from fontist-archive-public, not raw.githubusercontent.com
- [ ] R2: char page renders universal-set SVG with provenance badge
- [ ] R3: block grid uses inline `<symbol>` defs (no per-glyph HTTP)
- [ ] R4: font picker on /unicode persists via localStorage
- [ ] R5: per-block coverage bars render
- [ ] R6: per-codepoint covered/missing indicator
- [ ] R7: /unicode/best-fonts/{block} exists
- [ ] R8: /unicode/glyph/{hex} exists
- [ ] R9: panglyph fallback font injected

## References

- `TODO.full/09-archive-public-structure.md`
- `TODO.full/10-fontist-org-woff-glyphs.md`
- `TODO.full/11-fontist-org-audit-coverage.md`
- `TODO.full/17-fontist-org-font-picker.md`
- `TODO.full/38-fontist-org-glyph-consumer.md`
- Existing fontist.org PRs: #44 (per-cp data + char page), #45
  (UnicodeBlockPage dedup, nav theming)
- Existing infrastructure: `composables/useFontFace.ts`,
  `composables/useCoverage.ts`, `pages/FontUnicodePage.vue`
