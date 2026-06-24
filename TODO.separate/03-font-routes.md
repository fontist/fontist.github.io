# 03 — Add /fonts/:fontSlug routes (individual font = style)

Phase C of [README.md](README.md). New URLs and pages for individual fonts (styles).

## Data shape

Each `FontFamilyFile` in `family.files[]`:
```ts
{
  slug: string         // e.g. "abeezee", "roboto_bold_italic" — style-scoped within family
  formula_slug: string // e.g. "google/abeezee", "sil_2.300/abyssinica_sil"
  style: string        // "Regular", "Bold Italic", ...
  path: string         // "fonts/abeezee.woff2"
  redistributable: boolean
}
```

Two formulas shipping the same style produce two file entries with the SAME `slug` but different `formula_slug`. Today's upstream data usually shares the same `path` across formulas (so the same woff2 + coverage), but the data model is ready for divergence.

## Routes

| Path | Component | Notes |
|---|---|---|
| `/fonts/:fontSlug` | `FontStylePage.vue` (new) | All formulas providing this style; `?formula=` switches. |
| `/fonts/:fontSlug/unicode` | `FontStyleUnicodePage.vue` (new) | Coverage for the selected formula. |

`fontSlug` matches `FontFamilyFile.slug` directly. No formula segment in the path — formula is a query param when needed.

## Loader additions

### `src/lib/fonts/family-lookup.ts`

Add to `FamilyLookup`:
```ts
filesBySlug(fileSlug: string): { family: FontFamily; file: FontFamilyFile }[]
```

Returns every `(family, file)` tuple where `file.slug === fileSlug`. In the common case this is one entry; for styles shipped by multiple formulas it's several.

Implementation: extend `buildFamilyLookup` to also build a `byFileSlugMulti: Map<string, { family, file }[]>`. Reuses the same iteration.

### `src/lib/fonts/families-loader.ts`

Add:
```ts
export async function findFilesBySlug(
  fileSlug: string
): Promise<{ family: FontFamily; file: FontFamilyFile }[]>
```

Wraps `loadFontFamilies()` + `lookup.filesBySlug(fileSlug)`.

## Default selection (when no `?formula=`)

When `?formula=` is absent:
1. Filter to redistributable entries (if any).
2. Among those (or all, if none redistributable), take the first by family order in the index.
3. That's the "default" formula version shown.

This is deterministic and prefers freely-redistributable content.

## `?formula=` switching

When `?formula=<formulaSlug>` is present:
1. Find the entry in `filesBySlug(fontSlug)` with `file.formula_slug === formulaSlug`.
2. If not found, fall through to default + show a small "requested formula not available" notice.
3. Update `?formula=` on switch (no full navigation; use `router.replace` with new query).

## Page content

### `FontStylePage.vue`

- Top-level await `findFilesBySlug(route.params.fontSlug)`.
- 404 via NotFound component if empty.
- Header: style name (`Bold Italic`), family name with link to `/families/<familySlug>`.
- Specimen via `FontSpecimen.vue` with `file.path` and `file.redistributable`.
- Provenance sidebar: list of all formulas providing this style. Each entry links to `/formulas/<formulaSlug>`. Highlight the active one.
- Formula switcher UI (chips if >1 formula provides this style).
- Link to `/fonts/<fontSlug>/unicode` ("View Unicode coverage →").
- `useHead`: title = `"<Family> <Style> — Fontist"`, og:title, canonical `https://www.fontist.org/fonts/<fontSlug>`.

### `FontStyleUnicodePage.vue`

- Same data loading + default selection logic.
- Renders `FontUnicodeBrowser.vue` with the selected file's slug + path.
- Back-link to `/fonts/<fontSlug>`.
- `useHead`: title = `"<Family> <Style> — Unicode coverage — Fontist"`.

## Tests

### `src/lib/fonts/__tests__/families-loader.test.ts`

Add cases for `filesBySlug`:
- Returns single entry for unique slug.
- Returns multiple entries when multiple formulas ship the same slug.
- Returns empty array for unknown slug.
- Default selection prefers redistributable entries.

## Verification

- All new + existing tests pass.
- `npm run build:no-fetch` succeeds.
- Sample font page: `/fonts/abeezee` renders with specimen + provenance.
- Sample multi-formula page: `/fonts/abyssinica_sil` shows all three formulas in the switcher.
