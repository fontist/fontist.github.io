# 05 — Verify + commit

Phase E of [README.md](README.md).

## Verification checklist

### Tests

```bash
npm test
```

Expected:
- All existing tests pass (143 — byFormula tests kept, since the lookup is still needed by `FormulaPage.vue`).
- New `filesBySlug` tests pass.
- Target: 147 total (143 + 4 new filesBySlug cases).

### Build

```bash
npm run build:no-fetch
```

Expected:
- SSG build finishes cleanly.
- Console shows:
  - `fonts: emitted N unique file slugs` (N ≈ 5,963).
  - `ssg-routes: wrote M routes` (M ≈ 24,000 — same range as before, since family + font routes together ≈ old /fonts/* routes count).

### Route inventory

```bash
python3 -c "
import json
r = json.load(open('public/ssg-routes.json'))
print(f'total: {len(r)}')
print(f'/formulas (index): {\"/formulas\" in r}')
print(f'/formulas/* detail: {sum(1 for x in r if x.startswith(\"/formulas/\"))}')
print(f'/families (index): {\"/families\" in r}')
print(f'/families/* (non-unicode): {sum(1 for x in r if x.startswith(\"/families/\") and not x.endswith(\"/unicode\"))}')
print(f'/families/*/unicode: {sum(1 for x in r if x.startswith(\"/families/\") and x.endswith(\"/unicode\"))}')
print(f'/fonts/* (non-unicode): {sum(1 for x in r if x.startswith(\"/fonts/\") and not x.endswith(\"/unicode\"))}')
print(f'/fonts/*/unicode: {sum(1 for x in r if x.startswith(\"/fonts/\") and x.endswith(\"/unicode\"))}')
print(f'any /browse, /formula/, /font/: {any(x in r or x.startswith((\"/browse\", \"/formula/\", \"/font/\")) for x in r)}')
"
```

Expected:
- `/formulas` index: True
- `/formulas/*`: ~4,283
- `/families` index: True
- `/families/*`: ~5,963
- `/families/*/unicode`: ~5,963
- `/fonts/*`: ~5,963
- `/fonts/*/unicode`: ~5,963
- No `/browse`, `/formula/`, `/font/`.

### Dev server smoke test

```bash
npm run dev
```

Spot-check:
- `http://localhost:5173/families` — index renders.
- `http://localhost:5173/families/abeezee` — family page with specimen.
- `http://localhost:5173/fonts/abeezee` — font page with specimen + provenance.
- `http://localhost:5173/fonts/abeezee?formula=google/abeezee` — explicit formula.
- `http://localhost:5173/fonts/abyssinica_sil` — shows 3 formulas in switcher.
- `http://localhost:5173/font/google/abeezee` — 404 (legacy gone).

## Commits

Suggested logical groups. Each commit on `feat/vite-ssg-migration` branch.

### Commit 1: Phase A (drop /font/* redirects)
```
refactor(router): drop /font/* legacy redirect routes

The /font/:slug routes were architecturally broken — they accepted
formula slugs (e.g. "google/abeezee") in a "font" path while font
assets are keyed by family slug. The redirect added in 12677da papered
over this with a runtime slug lookup, but a clean break is wanted:
no back-compat redirects for retired URLs.

Drop the three /font/* redirect routes and their fontRedirect /
fontUnicodeRedirect helpers from router.ts.

byFormula / findFamilyByFormula stay — they were introduced as the
redirect's helper but are also a legitimate cross-entity lookup
(formula slug -> first family) that other pages still need.
```

### Commit 2: Phase B (rename families)
```
refactor(urls): rename /fonts → /families for family index + detail

The /fonts route served a family-level index (one entry per named
family like "Roboto" or "Abyssinica SIL"), but the path token "fonts"
is now reserved for individual style-level pages (Phase C).

Rename across the stack: router.ts, FamiliesPage.vue (renamed from
FontsPage.vue via git mv), DefaultLayout nav, FontFamilyPage +
FontFamilyUnicodePage canonical + nav, domain.ts comment,
gen-ssg-routes.mjs static routes + emission + priority.
```

### Commit 3: Phase C (font routes + components + helpers)
```
feat(fonts): per-style /fonts/:fontSlug routes with multi-formula provenance

Add the missing third entity in the formula/family/font separation:
the individual font style. A "font" here is one style/file within a
family (e.g. roboto_bold, abeezee) — not a family and not a formula.

Routes:
- /fonts/:fontSlug         → FontStylePage
- /fonts/:fontSlug/unicode → FontStyleUnicodePage

Each route renders ALL (family, file) pairs that ship the requested
file slug. Different formulas can serve the same style with different
woff2 files and different unicode coverage; the page surfaces every
provider and lets the user switch via ?formula=<formulaSlug>.

Adds FamilyFileEntry + filesBySlug() to FamilyLookup and
findFilesBySlug() to the loader.
```

### Commit 4: Phase D (SSG + FormulaBrowser + broken link fixes)
```
refactor(urls): retarget stale /font/ links + emit /fonts/* in SSG

Phase A dropped the /font/* redirect routes; this commit updates every
link that depended on them.

- FormulaBrowser.vue: formula list items → /formulas/<slug>.
- ComparePage.vue: per-column links → /fonts/<col.slug> and
  /fonts/<col.slug>/unicode (Phase C per-style routes).
- FormulaPage.vue: "View Font Specimen" → "View Family", gated on
  findFamilyByFormula(slug) returning a family. Links to
  /families/<family.slug>.
- gen-ssg-routes.mjs: emit /fonts/<slug> + /fonts/<slug>/unicode per
  unique file slug. Sitemap priority ladder updated.

Route inventory: /families/* 11,927 /fonts/* 11,926 /formulas/* 4,284
/unicode/* 357 /font/* /formula/* /browse 0.
```

### Commit 5: docs
```
docs(separate): add TODO.separate plan for formula/family/font URL separation

5-phase plan that split the formula/family/font URL space:
- /formulas/*    (formula index + detail)
- /families/*    (family index + detail + family/unicode)
- /fonts/*       (per-style font page + font/unicode, multi-formula)

Drops /font/* legacy redirects with no back-compat.
```

## Rules followed

- No AI attribution in any commit.
- No commits on main; all on `feat/vite-ssg-migration`.
- No tags pushed.
- Files I didn't create (FontPage.vue, FontUnicodePage.vue, FontBlockPage.vue, BrowsePage.vue, FormulaPage.vue) left in place even if unrouted.
- Files I created in this session (FontsPage.vue → renamed to FamiliesPage.vue via git mv) — rename preserves history.
