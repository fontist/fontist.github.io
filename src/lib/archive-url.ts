// Resolves fontist-archive-public asset paths to absolute CDN URLs.
//
// coverage/ (1.1 GB) and woff/ (1.0 GB) are not shipped with the site: they
// exceed the 1 GB GitHub Pages published-site limit. They live in
// fontist/fontist-archive-public and are served from jsDelivr at runtime.
// Only the small index JSONs (fonts.json, font-metadata.json,
// formulas-data.json, stats.json) are served from Pages.
//
// PUBLIC_ARCHIVE_CDN_BASE is written into .env by scripts/fetch-data.sh and
// is pinned to the archive commit SHA, so the URL is immutable and safe to
// cache forever. jsDelivr caches branch refs for hours, which would otherwise
// serve stale specimens after a sync.
//
// With no CDN base configured (local dev against a full archive checkout),
// paths stay site-relative so an existing public/ copy still works.

const env = (import.meta as ImportMeta & { env?: Record<string, string | undefined> }).env

const CDN_BASE = (env?.PUBLIC_ARCHIVE_CDN_BASE ?? '').replace(/\/+$/, '')

// Path prefixes owned by the archive rather than by public/.
const ARCHIVE_PREFIXES = ['coverage/', 'woff/', 'details/']

export function isArchivePath(path: string): boolean {
  const clean = path.replace(/^\/+/, '')
  return ARCHIVE_PREFIXES.some((prefix) => clean.startsWith(prefix))
}

// Pure join, split out so it is unit-testable without the module-load CDN_BASE.
// Normalizes a trailing slash on `base` and a leading slash on `path` so the
// result always has exactly one separator, whatever the caller passes. Empty
// base → site-relative.
export function joinArchiveUrl(base: string, path: string): string {
  const cleanBase = base.replace(/\/+$/, '')
  const clean = path.replace(/^\/+/, '')
  if (!cleanBase) return `/${clean}`
  return `${cleanBase}/${clean}`
}

export function archiveUrl(path: string): string {
  return joinArchiveUrl(CDN_BASE, path)
}

export function archiveCdnBase(): string {
  return CDN_BASE
}
