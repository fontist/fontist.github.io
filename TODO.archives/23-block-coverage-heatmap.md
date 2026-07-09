# 23 — Block coverage heatmap (cartographer's atlas aesthetic)

## Why

User asked for a block-level visualization of Unicode coverage — answering
"How complete is Font X?" without the combinatorial blow-up of per-(font,
char) pages. The previous per-block char grid (one block at a time, click
pills to navigate) didn't communicate completeness at a glance. Need
something visually scannable that surfaces every block's coverage status
simultaneously.

## Design: cartographer's atlas

The visual metaphor is a map of uncharted territory. Each Unicode block
is a tile on the map; coverage % is the color. The whole 346-block
surface fits in one viewport so a designer can scan it in seconds.

### Aesthetic choices

- **Display typeface:** Spectral (variable serif already in the site's
  brand stack) for big numerals — gives a specimen-book feel.
- **Mono typeface:** IBM Plex Mono for labels, ranges, percent signs —
  technical reference look.
- **Pastel palette:** 5-step scale (rose → peach → sand → sage → deeper
  sage) with even luminance curve so it's scannable in grayscale and
  colorblind-friendly. Avoids the red-green dichotomy.
- **Strict 16-column grid** within each plane section. Compact, dense,
  but readable. Shrinks to 12 cols on mobile.
- **Tile fill animates from bottom** via `clip-path: inset(...)` —
  visually communicates "how much of the block is filled in."
- **Hover lifts the tile** (translateY -2px) with a soft shadow. The
  percentage label fades in on the tile face.

### Components + pages added

| File | Role |
|---|---|
| `src/components/BlockCoverageHeatmap.vue` | The heatmap. 346 tiles grouped by plane, plane filter pills, headline stats, legend. Click a tile → routes to per-block detail. |
| `src/pages/FontBlockCoveragePage.vue` | Per-block detail (SPA only — too many combinations to SSG). Renders block metadata + FontUnicodeBrowser for the selected block. |
| `src/styles/main.css` | Added `--coverage-0/25/50/75/100/none/unknown` CSS vars + dark mode equivalents. |

### Pages modified

| File | Change |
|---|---|
| `src/router.ts` | Added `/fonts/:fontSlug/unicode/block/:blockSlug` route → `FontBlockCoveragePage.vue`. |
| `src/pages/FontStyleUnicodePage.vue` | Replaced inline `FontUnicodeBrowser` with the heatmap. Coverage data + unicode-blocks.json fetched in parallel at top-level await. |
| `src/pages/FontFamilyUnicodePage.vue` | Same — heatmap replaces the per-block browser on the overview page. |
| `src/components/FontUnicodeBrowser.vue` | Added `initialBlockSlug` prop so the per-block detail page can deep-link to a specific block on mount. |

## Headline stat correctness

`coverage_file`'s `total_codepoints` and `total_blocks` fields are scoped
to blocks the font has any data for — not the global Unicode totals. The
old calc (`supportedCodepoints / coverage.total_codepoints`) reported
"100%" for every font that fully covers its own narrow scope.

The heatmap now uses `unicode-blocks.json` (the global block registry)
as the denominator. For abel:

- Headline: **3%** (11 of 346 blocks supported)
- Mini stats: 248 codepoints · 0% codepoint share
- Plane BMP: 7% blocks supported (11 of 164)
- All other planes: 0% blocks supported

Per-block tiles show the actual coverage %. Sample for abel:
- Basic Latin: 95/128 (74%) → tile color = `t-75`
- Latin-1 Supplement: 95/128 (74%) → `t-75`
- Latin Extended-A: 28/128 (22%) → `t-low`
- Spacing Modifier Letters: 8/80 (10%) → `t-low`
- General Punctuation: 16/112 (14%) → `t-low`
- 335 other blocks: 0% → `t-0` with subtle hatching

## Per-block detail page

`/fonts/{slug}/unicode/block/{blockSlug}` — SPA only. Not pre-rendered
(too many combinations). Vue-router lazy-loads it on demand when the user
clicks a heatmap tile.

Renders:
- Back link to coverage overview
- Big serif block name + Unicode range (mono)
- 4-stat completeness row: `% complete`, covered, missing, total
- Formula switcher (if multiple formulas)
- `FontUnicodeBrowser` for the selected block (with `initialBlockSlug`
  passed so it auto-selects the right block on mount)

## Data normalization

ucode emits block names with underscores (`Basic_Latin`); `unicode-blocks.json`
uses spaces (`Basic Latin`). The heatmap normalizes both directions when
matching — replaces `_` with space — so coverage data aligns with the
canonical Unicode block registry.

## Capacity

Heatmap adds ~15 KB per `/fonts/{slug}/unicode` page (tiles + labels +
inline styles). 5,220 redistributable fonts × 15 KB = ~78 MB additional
in main repo's dist.

After this change, dist went from 969 MB → ~1.04 GB. Tight against the
1 GB GitHub Pages limit but within budget for now. Future capacity
pressures (more fonts, more blocks per font, char page split per TODO 22)
will require either slimming elsewhere or moving to a sibling repo.

## Files touched

| File | Change |
|---|---|
| `src/styles/main.css` | +coverage CSS vars (light + dark) |
| `src/components/BlockCoverageHeatmap.vue` | new — the heatmap |
| `src/pages/FontBlockCoveragePage.vue` | new — per-block SPA detail |
| `src/router.ts` | +`/fonts/:fontSlug/unicode/block/:blockSlug` route |
| `src/pages/FontStyleUnicodePage.vue` | heatmap replaces FontUnicodeBrowser on overview |
| `src/pages/FontFamilyUnicodePage.vue` | heatmap replaces FontUnicodeBrowser on overview |
| `src/components/FontUnicodeBrowser.vue` | +`initialBlockSlug` prop for deep-linking |

## Acceptance

- [x] Heatmap renders 346 tiles on `/fonts/abel/unicode`
- [x] Per-plane grouping (BMP / SMP / SIP / TIP / SSP / PUA-A / PUA-B)
- [x] Pastel palette wired through CSS vars (light + dark)
- [x] Plane filter pills toggle visible tiles
- [x] Click tile → routes to per-block detail (SPA)
- [x] Per-block detail renders FontUnicodeBrowser deep-linked to the block
- [x] Headline stat uses global Unicode denominator (not scoped coverage_file data)
- [x] Plane header shows block support rate (not misleading codepoint %)
- [x] Block name normalization (`_` ↔ space) matches coverage data to Unicode registry
- [x] `npm test` green (234 tests)
- [x] `npm run build:no-fetch` succeeds
- [x] Responsive: tile size + grid cols shrink on mobile
- [x] Reduced motion: disables tile lift + clip-path transitions

## Out of scope

- Pre-rendering per-block detail pages (`/fonts/{slug}/unicode/block/{slug}`)
  — too many combinations. SPA-only is correct for now.
- Animating tile fill on initial page load (staggered reveal). Could add
  later via CSS `animation-delay` per tile index, but might be visually
  noisy for 346 tiles.
- A "covered by N open fonts" panel on each tile hover (cross-font info).
  Belongs on the codepoints-site pivot page (TODO 22), not the font page.
