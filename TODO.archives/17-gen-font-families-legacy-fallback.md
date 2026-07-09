# 17 — gen-font-families.mjs: legacy `fonts/${slug}.woff` fallback

## Why

`scripts/gen-font-families.mjs:53` and `:63` fall back to the legacy
flat `fonts/{slug}.woff` path when `woff_file` is missing from a
font-metadata entry. This couples fontist.org to the deprecated
archive-public `fonts/` directory (see plan 16).

```js
// scripts/gen-font-families.mjs:53
path: m.woff_file || `fonts/${m.slug}.woff`,

// scripts/gen-font-families.mjs:63
path: `fonts/${entry.slug}.woff`,
```

## Why `woff_file` is sometimes missing

Per `fontist-archive-private/lib/fontist_archive_private/registry_builder.rb`,
the field is omitted via `.compact` when:
- The formula is non-redistributable (no WOFF ever generated).
- The WOFF file doesn't exist on disk in archive-private (formula not
  processed yet, or ucode/fontisan failure).

In both cases the fallback path `fonts/{slug}.woff` is wrong:
- Non-redistributable formulas have no WOFF anywhere — the path 404s.
- Unprocessed formulas have no WOFF yet — same.

The Vue specimen component looks up `path` and falls back to "no
specimen available" rendering when the request fails. So the wrong
fallback path is harmless in practice (the 404 is caught and the page
renders without a specimen), but it's misleading: a reviewer reading
the data thinks there's a WOFF file at that path.

## Recommended fix (NOT YET IMPLEMENTED)

Drop the fallback. When `woff_file` is missing, emit `path: null` and
let the consumer component decide how to render (it already handles
missing specimens).

```js
// files_for_family_entry, metadata-found branch:
out.push({
  slug: m.slug,
  formula_slug: formulaSlug,
  style: ...,
  path: m.woff_file || null,           // ← was: `fonts/${m.slug}.woff`
  redistributable: !!m.redistributable,
})

// placeholder branch (no metadata matched):
out.push({
  slug: entry.slug,
  formula_slug: formulaSlug,
  style: 'Regular',
  path: null,                          // ← was: `fonts/${entry.slug}.woff`
  redistributable: false,
})
```

Plus a type update: `FontFamilyIndex['files'][number]['path']` becomes
`string | null`.

## Why this is documented, not implemented

Two reasons:

1. **`coverage-architecture.md` and plan 16 reference `fonts/`.** The
   cleanup is sequenced: retire the legacy directory first (plan 16),
   then remove the fallback here. Doing them in the other order risks
   a transient where fontist.org points at a directory the archive
   has removed.

2. **Behavioral change is observable.** `path: null` vs `path: 'fonts/...'`
   changes the JSON shape that fontist.org commits to `public/font-families.json`.
   Consumers (Vue components, tests) need to handle `null`. Survey those
   first; this is a follow-up.

## Acceptance

- [ ] Plan 16 (legacy `fonts/` cleanup) is implemented first.
- [ ] Survey Vue components that read `file.path` — confirm `null` is
      handled (most already do, since the specimen image's `onError`
      handler suppresses broken images).
- [ ] Update `src/lib/types/domain.ts` FontFamilyFile to allow `path: string | null`.
- [ ] Drop the two fallbacks in `gen-font-families.mjs`.
- [ ] Update `scripts/__tests__/gen-font-families.test.mjs` fixtures
      (the existing fixture uses `fonts/${slug}.woff`).

## Out of scope

- Removing the `redistributable: false` placeholder entry entirely
  (would change `files.length` semantics — separate decision).
