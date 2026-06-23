# Remaining Work — fontist.org → vite-ssg

Decision locked: **we are doing SSG** (vite-ssg, not plain vite). All work below
is scoped to that decision. Snapshot date: 2026-06-23. Branch: `feat/vite-ssg-migration`.

For routing/data-flow context, see `IA.md` in this directory.

## How to use this document

Sections are ordered by dependency, not by priority. Each item carries:
- **Why**: the reason it can't be skipped
- **How**: concrete change
- **Verify**: how to know it worked

Items marked **[blocker]** prevent the SSG build from being correct.
Items marked **[cleanup]** are safe to defer.
Items marked **[external]** require changes in other repos.

---

## 1. [blocker] Convert `src/main.ts` to vite-ssg's `ViteSSG` factory

**Why.** `package.json` runs `vite-ssg build` but `src/main.ts:7-15` uses plain
`createApp` + `createRouter`. The build will currently emit a SPA shell with
zero prerendered routes — every page is a fetch-on-client. SEO, social cards,
and first-paint all suffer.

**How.** Replace `main.ts` with the vite-ssg factory:

```ts
import { ViteSSG } from 'vite-ssg'
import { routes } from './router'
import App from './App.vue'
import './styles/main.css'

export const createApp = ViteSSG(
  App,
  {
    routes,
    base: '/',
  },
  (ctx) => {
    // head installation goes here (see item 3)
  },
)
```

`index.html` then references `main.ts` as the entry (it already does).

**Verify.** `npm run build` produces `dist/font/inter.html`,
`dist/unicode/block/basic-latin.html`, etc. — actual pre-rendered HTML, not
empty SPA shells. `grep -L 'id="app"' dist/**/*.html` should return nothing.

---

## 2. [blocker] Generate `includedRoutes` for the 4,283 dynamic slugs

**Why.** By default vite-ssg crawls the app's `<a>` tags to discover routes.
The browse page renders all 4,283 formula links client-side after fetching
`formulas-data.json`, which SSG doesn't execute. Without an explicit route
list, `/font/*`, `/formula/*`, `/font/*/unicode`, `/font/*/unicode/*` won't
prerender. (Same issue Unicode property pages have — they're discovered only
by clicking from `/unicode/char/:hex`.)

**How.** Build the route list at SSG config time from the JSON registries:

```ts
// vite.config.ts or src/main.ts (in the ViteSSG options)
import { readFileSync } from 'node:fs'

const formulas: { slug: string }[] = JSON.parse(
  readFileSync('public/formulas-data.json', 'utf8')
)
const fonts: { fonts: { slug: string }[] } = JSON.parse(
  readFileSync('public/fonts.json', 'utf8')
)
const blocks: { name: string }[] = JSON.parse(
  readFileSync('public/unicode-blocks.json', 'utf8')
)

const blockSlugs = (name: string) =>
  name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '')

const includedRoutes = [
  '/', '/about', '/blog', '/browse', '/compare', '/unicode',
  ...formulas.map(f => `/formula/${f.slug}`),
  ...fonts.fonts.map(f => `/font/${f.slug}`),
  ...fonts.fonts.map(f => `/font/${f.slug}/unicode`),
  ...fonts.fonts.flatMap(f =>
    blocks.map(b => `/font/${f.slug}/unicode/${blockSlugs(b.name)}`)
  ),
  // ...and the static unicode routes (planes, blocks, property indexes)
]

// pass to ViteSSG: { routes, includedRoutes }
```

This is a **build-time** read of the JSON; CI fetches the JSON before
`npm run build` (see `build.yml:43-58`), so the data is present.

**Verify.** `find dist -name '*.html' | wc -l` is at least
`~4,283 formulas + ~4,283 font pages + 4,283×346 font-block combos` for full
coverage. (Realistically the font-block matrix may be too big — see item 8.)

---

## 3. [blocker] Add `<head>` management (OG, Twitter, title, canonical, JSON-LD)

**Why.** The README's "conventions shared across all sites" lists per-page OG
tags, Twitter cards, and `BlogPosting` JSON-LD as required. Currently nothing
sets these — `index.html` has hardcoded placeholders and no per-page logic.

**How.** Install `@vueuse/head` (vite-ssg integrates it). In each page, call
`useHead({ title, meta: [...], link: [...] })`. Driver:

- **Static pages** (Home, About, Blog index): hardcode head per page.
- **Formula page**: `title = formula.name`, `og:title` same,
  `og:description` from formula metadata.
- **Font page**: `title = '${name} — Font specimen'`, plus JSON-LD for the
  font as a `Product`/`CreativeWork` (decision: pick one).
- **Blog post**: JSON-LD `BlogPosting` with author + datePublished from
  markdown frontmatter.
- **Unicode char page**: `title = 'U+${hex} ${name}'`.
- **Canonical URL**: derived from `route.path` + `https://www.fontist.org`.
- **OG image**: always `https://www.fontist.org/og-image.png`.

**Verify.** `curl https://fontist.org/font/inter` (post-deploy) returns HTML
with `<meta property="og:title" content="Inter">`. Run the
[Facebook Object Debugger](https://developers.facebook.com/tools/debug/) on
a sample URL.

---

## 4. [blocker] Generate `sitemap.xml`

**Why.** README says every site ships a sitemap. Without it, search engines
won't crawl the dynamic routes (especially given the SPA-rendered browse
page that's opaque to crawlers).

**How.** Two options:
- **(a)** `vite-ssg` has `onFinished` hook — generate sitemap from
  `includedRoutes` list at end of build.
- **(b)** Use `vite-plugin-sitemap` (works with the includedRoutes list).

Either way, write to `dist/sitemap.xml`. Public root already has
`robots.txt` pointing nowhere — update it to `Sitemap: https://www.fontist.org/sitemap.xml`.

**Verify.** `dist/sitemap.xml` exists and lists
`<loc>https://www.fontist.org/font/inter</loc>` etc.

---

## 5. [cleanup] De-duplicate blog/about content (single source of truth)

**Why.** `about.md`, `blog/*.md`, `index.md` exist at repo root **and** under
`public/content/` — identical content in two places. The page components
fetch from `public/content/`, so the root copies are dead weight, but
removing them changes the repo's surface (someone may link to raw
`/about.md` on GitHub).

**How.** Decide: keep `public/content/` (matches the loader pattern and
mirrors `guide/` + `licenses/`); delete the root duplicates. Update
`README.md` blog instructions to point at `public/content/blog/`.

`BlogPostPage.vue:19` also hardcodes `/content/blog/...` instead of using
`import.meta.env.BASE_URL` — fix to match the `GuidePage.vue` pattern.

**Verify.** `find . -name 'about.md'` returns exactly one path.

---

## 6. [cleanup] Remove stale VitePress references

The migration removed `.vitepress/` but left behind references that imply it
still exists. Files to update:

| File | What to change |
|---|---|
| `lychee.toml:13` | `include = [".vitepress/dist/**/*.html"]` → `dist/**/*.html` |
| `lychee.toml:28-31` | Blog-post URL exclusions reference old routes — verify and update or delete |
| `.github/workflows/links.yml:42-47,56-57` | Build artifact path is now `dist/`, not `.vitepress/dist/` |
| `.gitignore:1-2` | `**/.vitepress/cache` + `**/.vitepress/dist` lines — delete |
| `tests/nav-consistency.spec.ts` | Entire file targets `.VPNavBar*` selectors that no longer exist. Either delete or rewrite against `.nav-link` (see `layouts/DefaultLayout.vue:11-15`) |
| `tests/dirify.test.mjs` | Tests logic for `scripts/dirify-urls.mjs`, which was deleted. **Decision needed:** does vite-ssg natively produce `foo/index.html` for `foo` routes? If yes → delete test + script. If no → re-add script as `scripts/dirify-urls.mjs` and wire into `package.json` build. |
| `README.md` | Whole "Development" section describes VitePress; rewrite. |
| `CLAUDE.md` (project-local) | Already notes the stale state — update once cleanup done. |

**Verify.** `grep -rn "vitepress\|VPNavBar\|\.vitepress" . --include='*.{md,ts,mjs,json,toml,yml,vue,js}'` returns nothing.

---

## 7. [cleanup] Add `.gitignore` entries for build-fetched data

**Why.** TODO 04 prescribed this; never done. Currently `public/formulas-data.json`
(1.8 MB), `public/fonts.json` (1.0 MB), `public/coverage/` (53 files),
`public/fonts/*.woff2` (52 entries), and `public/font-metadata.json` are
committed. CI overwrites them on every build via `build.yml:43-58`. So the
committed copies are snapshots that drift from prod.

**How.** Append to `.gitignore`:

```gitignore
# Generated data — fetched at build time from fontist-archive / formulas
/public/coverage/
/public/fonts/*.woff2
!/public/fonts/noto/
/public/fonts.json
/public/font-metadata.json
/public/formulas-data.json
/public/stats.json
/public/search-index.json
```

Then `git rm --cached` the currently-tracked files (don't delete from disk).

**Verify.** `git status` shows the files as untracked after the change;
`npm run build` still works locally because the files are still on disk.

---

## 8. [blocker for full prerendering, cleanup for MVP] Decide the font×block matrix scope

**Why.** Full prerendering of `/font/:slug/unicode/:block` for every (font,
block) pair = 4,283 × 346 ≈ **1.48 million HTML files**. That's not viable
as static output — build time, repo size, deploy time all break.

**Options** (pick one):

- **(a) Lazy-render only.** Don't include `/font/:slug/unicode/:block` in
  `includedRoutes`. The route exists client-side; clicking through from
  `/font/:slug/unicode` SPA-navigates and renders on demand. Tradeoff: those
  deep links aren't SEO-visible, but they're niche anyway.
- **(b) On-demand SSG.** Build only the blocks where coverage > 0 for each
  font (read `coverage/{slug}.json` → `blocks[]`). Typical font covers
  ~50-150 blocks, so ~250k-650k HTML files. Still large but feasible.
- **(c) Hybrid.** Build the per-font-per-block pages for the top N most
  popular fonts (Analyze access logs or just take Google Fonts tier);
  lazy-render the rest.

**Recommendation:** start with **(a)**. The per-font-per-block page is a
power-user feature; SEO value is low. Revisit if analytics show otherwise.

**Verify.** `find dist -path '*/font/*/unicode/*' -name '*.html' | wc -l`
matches the chosen scope.

---

## 9. [cleanup] Fix the orphaned `src/components/UnicodeBlockGrid.vue`

**Why.** There are two files with this name:
- `src/lib/unicode/components/UnicodeBlockGrid.vue` — the live one, accepts
  `block`, `fonts`, `mode`, `showMissing`, `maxChars` props.
- `src/components/UnicodeBlockGrid.vue` — orphaned, accepts `characters`
  prop. Not imported by any page (`grep -r 'components/UnicodeBlockGrid' src/`
  returns nothing). Confused me during investigation; will confuse others.

**How.** Read the orphan file, confirm no importer, then delete it.

**Verify.** `find src -name 'UnicodeBlockGrid.vue'` returns one file.

---

## 10. [cleanup] Fix missing `public/sources/` directory

**Why.** `FormulaBrowser.vue:76-95` references `/sources/{all,google,sil,apple,fontist}.svg`
and `/sources/{ofl,apache,mit,...}.svg`. The directory does not exist — every
formula card on `/browse` shows broken license/source icons.

Confirmed by headless render of `/browse`: all 5 distinct source icon paths
return 404.

**How.** Either:
- **(a)** Port the SVGs from `formulas/docs/public/sources/` (where they
  originally lived) into `public/sources/` here, OR
- **(b)** Replace the `<img>` badges with text/inline SVG.

Either way, also confirm `/sources/microsoft.svg`, `/sources/cc0.svg`,
`/sources/all.svg`, `/sources/fontist.svg` exist or are removed.

**Verify.** Headless `/browse` shows icons instead of broken-image squares.
`curl -o /dev/null -w '%{http_code}\n' http://localhost:5175/sources/google.svg`
returns 200.

---

## 11. [cleanup] Move direct `fetch()` calls behind a loader abstraction

**Why.** `lib/unicode/data/loader.ts` is supposed to be the only module that
calls `fetch()` (per `00-architecture.md` "Dependency Inversion"). Today:
- `FormulaPage.vue:31` fetches `formulas-data.json` directly.
- `FormulaBrowser.vue:147` fetches `formulas-data.json` directly.
- `ComparePage.vue:49,58` fetches `fonts.json` + `font-metadata.json` directly.
- `BlogPostPage.vue:19` fetches `/content/blog/...md` directly.
- `GuidePage.vue:39-48` fetches `/content/guide/...md` directly.

Each re-implements basePath, error handling, and caching independently.

**How.** Add `src/lib/formulas/loader.ts` and `src/lib/fonts/loader.ts`
mirroring `lib/unicode/data/loader.ts`:

```ts
// src/lib/formulas/loader.ts
let cache: FormulaData[] | null = null
export async function loadAllFormulas(): Promise<FormulaData[]> {
  if (cache) return cache
  const base = import.meta.env.BASE_URL || '/'
  const res = await fetch(`${base}formulas-data.json`)
  cache = await res.json()
  return cache
}
export async function findFormula(slug: string) {
  return (await loadAllFormulas()).find(f => f.slug === slug) || null
}
```

Then update the four call sites.

**Verify.** `grep -rn 'fetch(' src/pages src/components src/composables`
returns only `src/lib/*/loader.ts` files.

---

## 12. [cleanup] Remove `goToFormula()` SPA-router bypass

**Why.** `FormulaBrowser.vue:208-218` uses `window.location.href` instead of
`<RouterLink>` to navigate from `/browse` to `/font/:slug`. The comment says
this was a workaround for VitePress's batched build manifest. With vite-ssg
and a complete `includedRoutes` list (item 2), every formula route will be
in the SPA manifest and `<RouterLink>` works.

**How.** Replace the `<a :href="..." @click.prevent="goToFormula">` with
`<RouterLink :to="`/font/${f.slug}`">`. Delete `goToFormula()`.

**Verify.** Click a formula card in `/browse`; the URL changes via
`history.pushState` (no full page reload).

---

## 13. [external] Cross-repo triggers (formulas → archive → here)

**Why.** This repo's `build.yml` accepts `repository_dispatch: [rebuild]`
(`build.yml:14-15`) so it's ready to receive auto-rebuild triggers. But:
- `formulas/.github/workflows/trigger-archive.yml` does not exist
- `fontist-archive` repo may not exist yet

So today, data only updates when this repo's `main` is pushed. Formula
additions don't propagate automatically.

**How.** Coordinate with the formulas repo owner. The workflow files are
specified in TODO 06 — they were never created.

**Verify.** Push a test formula to `formulas/main`; within minutes,
`fontist.org/browse` shows the new entry.

---

## 14. [external, much later] Clean up formulas repo

**Why.** TODO 07 says remove `docs/` from formulas entirely once the website
migration is done. This makes formulas pure data, simplifying its CI.

**Preconditions** (all must be true):
- Items 1–12 here are merged and deployed.
- `fontist-archive` repo exists and the cross-repo triggers work.
- User confirms `fontist.org` is canonical and formulas `docs/` can be deleted.

**How.** See TODO 07. Out of scope for this repo.

---

## Suggested merge order

1. **Item 1** (vite-ssg factory) — unblocks everything.
2. **Item 8** (font×block scope decision) — determines item 2's shape.
3. **Item 2** (`includedRoutes`) — makes dynamic routes SSG-render.
4. **Item 3 + 4** (head + sitemap) — together, one PR.
5. **Items 5, 7, 9, 10, 12** (cleanup bundle) — one PR, no behavior change.
6. **Item 6** (stale-ref cleanup, including tests) — one PR.
7. **Item 11** (loader abstraction) — refactor PR, optional.

Items 13 and 14 are external and parallel.

## Items NOT included (intentionally)

- **Routing changes.** All routes in `src/router.ts` work and are correct.
- **Page-level behavior changes.** All pages render correctly under SPA.
- **Styling work.** The site looks correct in headless renders.
- **Component refactors.** `UnicodeBlockGrid.vue`'s three-mode API is clean.
- **Data model changes.** `FormulaData`, `UnicodeBlock`, `FontContext` types
  are sound.
