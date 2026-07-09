# 22 — Split `/char/*` into its own GitHub Pages repo

## Why

fontist.org is a multi-site GitHub Pages setup (CLAUDE.md): each sibling
repo (`fontist/fontist`, `fontist/fontisan`, `fontist/formulas`) deploys
its own Pages site served from `fontist.org/<repo>/`. Each site gets its
own **1 GB published-site budget**. Today the main `fontist/fontist.org`
repo uses 969 MB of its 1 GB for 37,140 routes — pre-rendering all
159,866 assigned Unicode 17 codepoints would push it to ~3 GB, far over
the limit. Same problem blocks property-detail pages (`/unicode/scripts/:code`
etc., plan 21 follow-up).

The natural fix following the established multi-site pattern: spin up a
new sibling repo that owns the codepoint surface, gets its own 1 GB,
and has its own build + deploy pipeline.

## Target architecture

```
fontist/fontist.org (apex, 1 GB)         fontist/codepoints (1 GB)
├── /                                    ├── /codepoints/         (index)
├── /about, /blog, /guide, /licenses     ├── /codepoints/U+0041   ← ASCII
├── /compare                             ├── /codepoints/U+20AC   ← euro
├── /families, /fonts, /formulas         ├── /codepoints/U+1F600  ← emoji
├── /unicode                             └── ...159,866 char pages
│   ├── /block/{slug}   ← links out to /codepoints/U+{hex}
│   ├── /plane/{id}
│   ├── /scripts, /category, /combining, /bidiclass
│   └── (drops /char/:hex — moves to sibling repo)
└── (NO /codepoints/* routes — would shadow sibling site)
```

Sibling repos already in production:
- `fontist/fontist` → `fontist.org/fontist/`
- `fontist/fontisan` → `fontist.org/fontisan/`
- `fontist/formulas` → `fontist.org/formulas/`

New sibling (proposed):
- **Repo:** `fontist/codepoints`
- **URL:** `fontist.org/codepoints/U+{hex}`

URL choice rationale: matches the existing multi-site pattern exactly
(repo name → URL path prefix). The trailing `/U+{hex}` segment uses
canonical Unicode notation. `codepoints` matches the existing data
file convention (`codepoints/{hex}.json` in archive-public).

## Repo layout

```
fontist/codepoints/
├── .github/workflows/
│   ├── build.yml                 # repository_dispatch[rebuild] + push[main]
│   └── fetch.yml                 # scheduled refresh of codepoints/ data
├── bin/
│   └── fetch-data.sh             # mirror of main site's, scoped to codepoints
├── public/
│   ├── codepoints/               # 159,866 per-cp JSONs (gitignored, fetched)
│   ├── unicode/blocks/           # 340 block JSONs (for breadcrumb context)
│   ├── unicode/indexes/          # by-script, by-category (for classification)
│   ├── fonts/noto/               # fallback glyph rendering
│   └── ssg-routes.json           # generated
├── scripts/
│   ├── fetch-data.sh
│   ├── gen-ssg-routes.mjs        # enumerates /U+{hex} from codepoints/ dir
│   └── __tests__/
├── src/
│   ├── main.ts                   # ViteSSG factory
│   ├── App.vue
│   ├── router.ts                 # /U+:hex + a few static pages
│   ├── pages/
│   │   ├── CodepointPage.vue     # ← ported from UnicodeCharPage.vue
│   │   ├── CodepointIndexPage.vue  # /  (search + browse-by-block)
│   │   └── NotFound.vue
│   ├── lib/unicode/              # copied from main repo (see "shared code")
│   ├── composables/
│   │   └── useNotoGlyph.ts       # fallback rendering
│   └── styles/main.css
├── shared-fontist-org/           # SEE NOTE — files copied from main repo
│   └── SHARED.md                 # documents what was copied + when
├── vite.config.ts
├── package.json
└── README.md
```

## Shared code strategy

**Phase 1 (this plan): copy.** The codepoint site needs ~10 files from
the main repo. Copy them into `src/lib/unicode/` verbatim, with a
`SHARED.md` at the repo root listing every copied file + the source
commit hash. Bump a "last synced" line whenever main repo changes
propagate.

Files to copy:
- `src/lib/unicode/constants.ts` (SCRIPT_NAMES, hexCp, safeChar, displayChar,
  blockSlug, charRoute → retargeted, UnihanRenderMode, UNIHAN_CATEGORIES)
- `src/lib/unicode/types/index.ts` (CodepointDetail, UnicodeBlock, etc.)
- `src/lib/unicode/index.ts` (barrel)
- `src/lib/unicode/data/loader.ts` (loadCodepointDetail, loadAllBlocks,
  loadBlockCharacters)
- `src/lib/unicode/components/UnicodeBlockGrid.vue` (used by index page)
- `src/lib/unicode/components/UnihanCategorySection.vue`
- `src/lib/ssr-fetch.ts`
- `src/lib/loader-factory.ts`
- `src/composables/useFontFace.ts` (for noto fallback injection)
- `src/styles/main.css` (just the brand variables + dark mode)

**Phase 2 (when stable, separate plan):** extract to `@fontist/unicode`
npm package. Both repos depend on it. Removes the copy burden at the
cost of a version-bump discipline. Don't do this until the API is
stable (probably after 1-2 months of real use).

## URL design + link coordination

| Surface | Old URL | New URL | Owner |
|---|---|---|---|
| Char detail | `fontist.org/unicode/char/0041` | `fontist.org/codepoints/U+0041` | codepoints repo |
| Char hex form | `0041` (lowercase, 4-digit pad) | `0041` (unchanged) | both |
| Char U+ form | n/a | `U+0041` (path segment after prefix) | codepoints repo |

`charRoute(cp)` in `src/lib/unicode/constants.ts` currently returns
`/unicode/char/${hex}`. After the split:

```ts
// In MAIN repo:
export const CODEPOINTS_SITE_PATH = 'https://www.fontist.org/codepoints'
export function charRoute(cp: number): string {
  return `${CODEPOINTS_SITE_PATH}/U+${hexCp(cp)}`
}
// Returns absolute URL — cross-site link

// In CODEPOINTS repo:
export function charRoute(cp: number): string {
  return `/U+${hexCp(cp)}`  // relative — same-site nav (vite base path handles /codepoints prefix)
}
```

**Cross-site nav points:**
- Main repo → codepoints site: every "view this character" link from
  `/unicode/block/{slug}` lists, `/families/{slug}/unicode` coverage
  browsers, `/fonts/{slug}/unicode` coverage browsers, and the
  UnicodeBlockGrid component.
- Codepoints site → main repo: the breadcrumb (`Unicode › Plane ›
  Block › Char` — plane + block links go back to main site) and the
  "fonts that cover this character" section (links to `/fonts/{slug}`).

## Build pipeline

```
ucode publishes unicode-codepoints artifact (full set)
   ↓ workflow_run
archive-public sync-ucode.yml commits to unicode/codepoints/
   ↓ repository_dispatch[rebuild]      ← also goes to fontist.org main
fontist/codepoints build.yml
   ↓ fetch-data.sh (clone archive-public shallow, copy codepoints/)
   ↓ gen-ssg-routes.mjs (enumerate /U+{hex} from codepoints/ dir)
   ↓ vite-ssg build (pre-render all 159,866 pages)
   ↓ deploy to gh-pages branch
github.com/fontist/codepoints Pages site updates
```

The dispatch chain extends plan 15's wiring. archive-public's
`bin/trigger-fontist-org-rebuild` either:
- Stays as-is (one target), and a parallel `bin/trigger-codepoints-rebuild`
  is added, OR
- Generalizes to a list of targets via env var.

Recommendation: **generalize**. Pass `REBUILD_TARGETS=fontist/fontist.org,fontist/codepoints`
as a comma-separated env var. Each target gets a `[rebuild]` dispatch.
Same PAT (`FONTIST_CI_PAT_TOKEN`) works for both since it has dispatch
scope on the fontist org.

## Capacity planning

Per-char SSG page budget: target 3-5 KB per HTML file.

| Component | Size per page | Notes |
|---|---|---|
| HTML shell + nav + footer | 1.5 KB | Shared layout, minified |
| Char name + hex + classification | 0.5 KB | Core data, always rendered |
| Block breadcrumb + plane info | 0.5 KB | Cross-site links |
| Glyph SVG (inlined for unassigned fallback) | 0.5 KB | Optional |
| Display props + segmentation | **deferred to client** | Fetched from `codepoints/{hex}.json` post-mount |
| Unihan section | **deferred to client** | Only fetched for CJK chars |
| **SSG total** | **~3 KB** | |
| Codepoint JSON (fetched client-side, cached) | 500 B | 1 fetch per page view |

**Totals:**
- 159,866 pages × 3 KB = **480 MB HTML**
- `public/codepoints/` data set: 159,866 × 500 B = **80 MB**
- Noto fallback woff2: 8 files, ~5 MB total
- Other assets (CSS, JS bundle, favicon): ~2 MB
- **Grand total: ~570 MB** — well under 1 GB ✅

If real pages come in larger than 3 KB (Unihan-rich CJK chars might),
worst case is ~2 KB extra per page × ~80K CJK chars = **160 MB extra**.
Still fits in 1 GB.

## SSG output shape

Lean pre-rendered HTML (server-side):

```html
<main class="cp">
  <nav class="cp-crumbs">
    <a href="https://www.fontist.org/unicode">Unicode</a> ›
    <a href="https://www.fontist.org/unicode/plane/bmp">BMP</a> ›
    <a href="https://www.fontist.org/unicode/block/basic-latin">Basic Latin</a> ›
    <span>U+0041</span>
  </nav>
  <div class="cp-glyph">A</div>
  <h1>LATIN CAPITAL LETTER A</h1>
  <code>U+0041</code>
  <dl class="cp-classification">
    <dt>Block</dt><dd>Basic Latin</dd>
    <dt>Script</dt><dd>Latin</dd>
    <dt>Category</dt><dd>Uppercase Letter (Lu)</dd>
  </dl>
  <!-- Rich detail mounts here client-side after fetchCodepointDetail() resolves -->
  <div class="cp-detail-mount" data-hex="0041"></div>
</main>
```

Client-side, `useCodepointDetail(hex)` fetches `/codepoints/{hex}.json`
via `loader-factory.createKeyedJsonLoader`, then renders display props,
segmentation, Indic/Hangul/Emoji bundles, Unihan sections into the mount
point. If the JSON 404s (rare — only happens if archive-public hasn't
synced yet), the page degrades gracefully to just the SSG-rendered
classification block.

## SEO + sitemap

- **Canonical URL** per page: `https://www.fontist.org/U+{hex}`
- **OG tags:** title `"U+0041 LATIN CAPITAL LETTER A — Unicode Codepoint"`,
  og:type `website`, og:image shared social card
- **Sitemap:** `fontist.org/codepoints/sitemap.xml` listing all 159,866
  routes. ~3.5 MB uncompressed; serve pre-gzipped (~700 KB).
- **robots.txt:** allow all
- Submit both sitemaps (main + codepoints) to Google Search Console as
  separate properties.

## Path-prefix layout confirmed

Following the existing multi-site pattern exactly. Each sibling repo
serves at `fontist.org/<repo-name>/`. The codepoints repo will serve
at `fontist.org/codepoints/` with `/U+{hex}` as the per-page segment.

**Critical:** the main repo must NOT have any `/codepoints/*` routes,
or it will shadow the sibling site (CLAUDE.md warns about this for
the existing `fontist/fontist`, `fontist/fontisan`, `fontist/formulas`
subpaths). Easy to comply with — just don't add them.

**Vite config in the codepoints repo:**

```ts
// vite.config.ts
export default defineConfig({
  plugins: [vue()],
  base: '/codepoints/',  // ← critical for asset paths under the subpath
  ssgOptions: {
    dirStyle: 'nested',
    includedRoutes: () => readSsgRoutes(),
  },
})
```

The `base: '/codepoints/'` setting ensures all asset URLs (`<script src>`,
`<link href>`, `@font-face url()`) are prefixed correctly. Vite-ssg
handles this automatically when `base` is set.

## Files touched in main repo (fontist/fontist.org)

| File | Change |
|---|---|
| `src/router.ts` | drop `/unicode/char/:hex` route |
| `scripts/gen-ssg-routes.mjs` | stop emitting any `/unicode/char/*` (already does — TODO 18.2) |
| `src/lib/unicode/constants.ts` `charRoute()` | return absolute URL `https://www.fontist.org/U+{hex}` |
| `src/pages/UnicodeCharPage.vue` | delete (moves to codepoints repo) |
| `src/pages/UnicodeBlockPage.vue` | update char links to use absolute URL via `charRoute()` |
| `src/components/UnicodeBlockGrid.vue` | same — char grid links become absolute |
| `src/components/FontUnicodeBrowser.vue` | same — clicking a covered char opens new tab |
| `coverage-architecture.md` | add codepoints-site section + multi-site diagram |

## New repo setup checklist (fontist/codepoints)

1. Create repo. Set GitHub Pages to deploy from `gh-pages` branch.
2. Configure custom domain path: GitHub Pages serves at
   `fontist.github.io/codepoints/` by default. To serve at
   `fontist.org/U+*` (apex path), need DNS + Pages config:
   - Add CNAME record (already exists for `fontist.org` apex)
   - In `fontist/codepoints` repo Settings → Pages → Custom domain:
     set to `char.fontist.org` (SUBDOMAIN) OR
     use the path-prefix approach (`fontist.org/codepoints/`).
   - **Subdomain is cleaner** — `char.fontist.org/U+0041` avoids path
     conflicts entirely. But the user wrote "separate github pages
     repo" suggesting the path-prefix pattern (matching
     `fontist.org/formulas/` etc.).
3. Provision `FONTIST_CI_PAT_TOKEN` secret on the new repo (only
   needed if it dispatches anything downstream — probably not).
4. Wire `repository_dispatch[rebuild]` receiver in
   `fontist/codepoints/.github/workflows/build.yml`.
5. Add `fontist/codepoints` to the `REBUILD_TARGETS` env in
   `archive-public/bin/trigger-fontist-org-rebuild`.

## Path-prefix vs subdomain — RESOLVED (path-prefix)

**Decision:** path-prefix at `fontist.org/codepoints/U+{hex}`.

This follows the existing multi-site pattern exactly:
- `fontist/fontist` → `fontist.org/fontist/`
- `fontist/fontisan` → `fontist.org/fontisan/`
- `fontist/formulas` → `fontist.org/formulas/`
- `fontist/codepoints` → `fontist.org/codepoints/` ← NEW

GitHub Pages serves each repo's Pages site at `fontist.org/<repo-name>/`
automatically once the apex repo (`fontist/fontist.org`) owns the
domain. No additional DNS or reverse-proxy needed — the apex repo
already publishes its CNAME, and sibling repos inherit the path-prefix
routing via GitHub's Pages path-based serving.

**Implication for the main repo:** must not publish any `/codepoints/*`
URL, or it shadows the sibling site. Currently safe — no `/codepoints/`
routes in `src/router.ts`. Add a guard comment in router.ts and a
smoke-test assertion.

## Migration plan (if approved)

1. **Stand up the codepoints repo** (skeleton + build pipeline + deploy
   to staging at `staging-codepoints.fontist.org` or hidden URL).
2. **Port UnicodeCharPage** to CodepointPage, retarget internal links
   (block/plane nav → absolute URLs back to main site).
3. **Verify capacity** — build against a sample (e.g., Basic Latin +
   CJK Unified Ideographs = ~21K pages), confirm under 1 GB.
4. **Cut over main repo** — drop `/unicode/char/:hex` route,
   `charRoute()` returns absolute URL.
5. **Production deploy** — configure DNS for `char.fontist.org`,
   submit sitemap, monitor 404s.
6. **Backfill** — port property-detail pages (`/unicode/scripts/:code`
   etc., TODO 21 follow-up) into either this same repo or a sibling.

Estimated effort: **1-2 days** for a working staging deploy, plus
**half a day** for production cutover.

## Open questions for user

1. **Repo name?** `fontist/codepoints` (my recommendation, matches
   data file convention + URL will be `fontist.org/codepoints/`) vs
   `fontist/char` (matches user-facing term, URL would be
   `fontist.org/char/`).
2. **One repo for all unicode-rich pages, or split further?** Property
   detail pages (`/scripts/Arab`, `/category/Lu`, etc.) could share
   the codepoints repo (at `/codepoints/scripts/Arab`) or get their
   own. My take: share for now, split if hits 1 GB.
3. **Phase 2 extraction timing?** When to extract `@fontist/unicode`
   npm package. My take: after 1 month of stable use.

## Acceptance (would be checked during actual implementation)

- [ ] User confirms repo name (`fontist/codepoints` vs `fontist/char`)
- [ ] `fontist/codepoints` repo created
- [ ] Vite `base: '/codepoints/'` configured
- [ ] Build pipeline produces <1 GB dist for 159,866 routes
- [ ] Main repo's `/unicode/block/*` pages link to absolute char URLs
      (`https://www.fontist.org/codepoints/U+{hex}`)
- [ ] Main repo has no `/codepoints/*` routes (shadow guard)
- [ ] `npm test` green on both repos
- [ ] Codepoints sitemap submitted to Google Search Console as separate
      property

## Out of scope

- Extracting `@fontist/unicode` npm package (Phase 2).
- Splitting property-detail pages into a third repo (decide after
  codepoints repo is stable).
- Cloudflare Worker reverse-proxy (not needed — path-prefix works
  out of the box with GitHub Pages multi-site model).
