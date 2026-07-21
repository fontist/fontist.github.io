#!/usr/bin/env bash
# Fetch pre-built data artifacts needed for `vite-ssg build`.
#
# Mirrors the CI workflow in .github/workflows/build.yml so local builds
# see the same data prod sees. Run before `npm run build` if generated
# data is missing or stale.
#
# Sources:
#   - fontist/fontist-archive-public → coverage/, woff/{slug}/{PSName}.woff,
#                                      fonts.json, font-metadata.json,
#                                      details/{slug}.json
#   - fontist/formulas        → formulas-data.json, stats.json
#
# Options:
#   --force       Re-fetch even if files are present
#   --with-yaml   Also clone the formulas repo (4,283 YAML files) into
#                 vendor/formulas/ for raw-formula access. Off by default
#                 because the clone is ~50 MB and the site doesn't currently
#                 read raw YAML.
#   --with-unicode  Fetch unicode data (block-feed + codepoints + universal
#                   glyph set) from fontist/fontist-archive-public. Off by
#                   default; use when archive-public publishes the data and
#                   you want to skip `npm run gen-unicode`.

set -euo pipefail

# Overridable (like ARCHIVE_REF) so a local/staging build can target a local
# clone or a fork instead of the canonical remote:
#   ARCHIVE_REPO=/path/to/fontist-archive-public ARCHIVE_REF=main npm run build
ARCHIVE_REPO="${ARCHIVE_REPO:-https://github.com/fontist/fontist-archive-public.git}"
# Which ref of the archive to build against. Defaults to the published branch;
# override to build against a branch that has data before it reaches main:
#   ARCHIVE_REF=data/initial-sync npm run build
ARCHIVE_REF="${ARCHIVE_REF:-main}"
FORMULAS_RAW="https://raw.githubusercontent.com/fontist/formulas/main/docs/public"
FORMULAS_REPO="https://github.com/fontist/formulas.git"
UNICODE_REPO="${UNICODE_REPO:-https://github.com/fontist/fontist-archive-public.git}"
UNICODE_REF="${UNICODE_REF:-main}"

ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
PUBLIC="$ROOT/public"
VENDOR="$ROOT/vendor"

FORCE=0
WITH_YAML=0
WITH_UNICODE=0
while [[ $# -gt 0 ]]; do
  case "$1" in
    --force)        FORCE=1; shift ;;
    --with-yaml)    WITH_YAML=1; shift ;;
    --with-unicode) WITH_UNICODE=1; shift ;;
    -h|--help)
      sed -n '2,30p' "$0"
      exit 0
      ;;
    *) echo "Unknown option: $1" >&2; exit 1 ;;
  esac
done

log() { printf '\033[1;34mfetch:\033[0m %s\n' "$*"; }

# ---------------------------------------------------------------------------
# 1. fontist-archive: manifest + registries (bulk assets stay on the CDN)
# ---------------------------------------------------------------------------
# coverage/ (1.1 GB) and woff/ (1.0 GB) are NOT copied into public/. Together
# with details/ they exceed the 1 GB GitHub Pages published-site limit, so the
# site loads them at runtime from jsDelivr instead. See ARCHIVE_CDN_TEMPLATE.
#
# What the build actually needs from the archive is the *list* of available
# files (to populate woff_file / coverage_file in font-metadata.json) plus the
# two small registry JSONs. A --no-checkout, blob:none clone gives us the tree
# without downloading a single font, and `git ls-tree` turns it into a manifest.
#
# The CDN URL is pinned to the archive commit SHA rather than @main: jsDelivr
# caches branch refs for hours, so @main would serve stale fonts after a sync.
ARCHIVE_CDN_TEMPLATE="https://cdn.jsdelivr.net/gh/fontist/fontist-archive-public@%s"

# Rewrites .env so PUBLIC_ARCHIVE_CDN_BASE always matches the archive SHA the
# rest of public/ was built from. .env is gitignored and therefore routinely
# absent on a fresh checkout; without this the skip path below would leave the
# CDN base empty and every archive URL would resolve site-relative and 404.
write_env() {
  local base="$1"
  local env_file="$ROOT/.env"
  if [[ -f "$env_file" ]]; then
    grep -v '^PUBLIC_ARCHIVE_CDN_BASE=' "$env_file" > "$env_file.tmp" || true
    mv "$env_file.tmp" "$env_file"
  fi
  echo "PUBLIC_ARCHIVE_CDN_BASE=$base" >> "$env_file"
}

if [[ -f "$PUBLIC/fonts.json" && -d "$VENDOR/metadata" \
   && -f "$VENDOR/archive-manifest.txt" && -f "$PUBLIC/archive-ref.json" \
   && $FORCE -eq 0 ]]; then
  log "archive manifest present, skipping (use --force to refetch)"
  # Re-derive the CDN base from the ref we already fetched.
  CACHED_BASE="$(sed -n 's/.*"cdn_base"[[:space:]]*:[[:space:]]*"\([^"]*\)".*/\1/p' "$PUBLIC/archive-ref.json")"
  if [[ -z "$CACHED_BASE" ]]; then
    echo "error: archive-ref.json has no cdn_base — re-run with --force" >&2
    exit 1
  fi
  write_env "$CACHED_BASE"
  log "archive pinned → $CACHED_BASE"
else
  log "fetching fontist-archive manifest (no blobs)…"
  rm -rf "$VENDOR/archive-public"
  mkdir -p "$VENDOR"
  git clone --depth 1 --filter=blob:none --no-checkout \
    --branch "$ARCHIVE_REF" "$ARCHIVE_REPO" "$VENDOR/archive-public"

  # The CDN serves archive-public, so the pinned SHA must always come from
  # there even when the metadata below is read from somewhere else.
  ARCHIVE_SHA="$(git -C "$VENDOR/archive-public" rev-parse HEAD)"

  # ---------------------------------------------------------------------
  # Build-time metadata source
  # ---------------------------------------------------------------------
  # The registries and the file manifest are only read during the build; nothing
  # ships them to a browser. But their woff_file / coverage_file paths must match
  # what the CDN actually serves, and the CDN is pinned to archive-public's SHA.
  #
  # So PREFER archive-public: reading metadata from the same commit the CDN is
  # pinned to guarantees every referenced path exists on the CDN. Reading from
  # private HEAD instead would drift — private can be ahead of public's last
  # sync, so metadata would reference woff paths not yet published → 404s.
  #
  # Fall back to private (ARCHIVE_META_PATH, a token-authenticated checkout
  # provided by CI) ONLY during bootstrap, before the first sync has published
  # font-metadata.json + woff/ to archive-public. That path is warned because
  # specimens 404 until the sync lands regardless of where metadata comes from.
  META_PATH="${ARCHIVE_META_PATH:-}"
  # Accept a relative path (CI passes "vendor/archive-private") by resolving it
  # against the repo root rather than whatever the caller's cwd happens to be.
  if [[ -n "$META_PATH" && "$META_PATH" != /* ]]; then
    META_PATH="$ROOT/$META_PATH"
  fi

  # archive-public is "populated" once its HEAD tree carries the family registry
  # (fonts.json) and the per-style metadata/ tree — the two things the build
  # reads (checked without fetching blobs).
  public_tree="$(git -C "$VENDOR/archive-public" ls-tree HEAD --name-only)"
  if grep -qx 'fonts.json' <<<"$public_tree" && grep -qx 'metadata' <<<"$public_tree"; then
    META_SRC="$VENDOR/archive-public"
    META_LABEL="fontist-archive-public@${ARCHIVE_SHA:0:8} (SHA-consistent with CDN)"
  elif [[ -n "$META_PATH" && -d "$META_PATH/.git" ]]; then
    META_SRC="$META_PATH"
    META_LABEL="fontist-archive-private (BOOTSTRAP — CDN has no woff/ yet)"
    echo "::warning::archive-public@${ARCHIVE_SHA:0:8} has no metadata/ + fonts.json yet; reading build metadata from private. Specimens will 404 until the sync publishes to archive-public." >&2
  else
    echo "error: archive-public@${ARCHIVE_SHA:0:8} is not populated and no ARCHIVE_META_PATH fallback is available" >&2
    exit 1
  fi
  log "metadata source: $META_LABEL"

  # Filenames only — no blob is fetched for coverage/ or woff/.
  # Written under vendor/ rather than public/: it is build-time input for
  # gen-font-families.mjs (which verifies each face's coverage_file/woff_file
  # against it), and at ~7 MB there is no reason to publish it.
  #
  # woff/macos/ is stripped to match bin/sync-from-private: macOS faces are
  # proprietary and never get published, so listing them here would generate
  # specimen URLs that can only ever 404.
  git -C "$META_SRC" ls-tree -r HEAD --name-only \
    | grep -v '^woff/macos/' \
    > "$VENDOR/archive-manifest.txt"

  log "manifest: $(wc -l < "$VENDOR/archive-manifest.txt" | tr -d ' ') paths"

  # Per-style face metadata → vendor/metadata/. gen-font-families reads these
  # (one file per face: metadata/{formula_slug}/{PSName}.json) as the source of
  # truth for version/style and the coverage_file/woff_file paths it verifies
  # against the manifest above. blob:none makes this one batched blob fetch.
  log "checking out metadata/ (per-style face files)"
  rm -rf "$VENDOR/metadata"
  if git -C "$META_SRC" checkout HEAD -- metadata 2>/dev/null && [ -d "$META_SRC/metadata" ]; then
    cp -r "$META_SRC/metadata" "$VENDOR/metadata"
    log "metadata: $(find "$VENDOR/metadata" -name '*.json' | wc -l | tr -d ' ') per-style files"
  else
    echo "error: metadata/ missing from $META_LABEL" >&2
    echo "  hint: run the archive-private build (finalize job writes metadata/)" >&2
    echo "        then the archive-public sync, or point ARCHIVE_META_PATH at a" >&2
    echo "        fontist-archive-private checkout that has metadata/." >&2
    exit 1
  fi

  # Fetch the one registry blob gen-font-families still needs (fonts.json —
  # the canonical-name → formulas index). font-metadata.json (the aggregate) is
  # no longer consumed: per-style files replaced it.
  log "reading fonts.json"
  if git -C "$META_SRC" checkout HEAD -- fonts.json 2>/dev/null; then
    cp "$META_SRC/fonts.json" "$PUBLIC/fonts.json"
  else
    echo "error: fonts.json missing from $META_LABEL" >&2
    echo "  hint: archive-public does not publish it yet — set ARCHIVE_META_PATH" >&2
    echo "        to a fontist-archive-private checkout, or run the sync first." >&2
    exit 1
  fi

  ARCHIVE_CDN_BASE="$(printf "$ARCHIVE_CDN_TEMPLATE" "$ARCHIVE_SHA")"

  # Consumed by the site at runtime to build absolute asset URLs.
  printf '{\n  "repo": "fontist/fontist-archive-public",\n  "sha": "%s",\n  "cdn_base": "%s"\n}\n' \
    "$ARCHIVE_SHA" "$ARCHIVE_CDN_BASE" \
    > "$PUBLIC/archive-ref.json"

  # Vite/Astro exposes PUBLIC_* to client code via import.meta.env, which is
  # how src/lib/archive-url.ts finds the CDN.
  write_env "$ARCHIVE_CDN_BASE"

  log "archive pinned @ ${ARCHIVE_SHA:0:8} → $ARCHIVE_CDN_BASE"
fi

# ---------------------------------------------------------------------------
# 2. formulas-data.json + stats.json — generated from the formulas repo (v5)
# ---------------------------------------------------------------------------
# Older versions of this script tried to curl pre-built JSON from
# raw.githubusercontent.com/fontist/formulas/main/docs/public/. That file
# is no longer published upstream — the formulas repo's `main` branch is
# gone, only `v5` exists, and `v5` requires running `node generate.js` to
# produce the JSON. So clone v5 shallowly, run the generator, and copy
# the output files into public/.
generate_formulas_json() {
  if [[ -f "$PUBLIC/formulas-data.json" && $FORCE -eq 0 ]]; then
    log "formulas-data.json present, skipping (use --force to regenerate)"
    return
  fi
  local tmp
  tmp="$(mktemp -d)"
  trap 'rm -rf "$tmp"' RETURN
  log "cloning fontist/formulas v5 (shallow)…"
  git clone --depth 1 --branch v5 "$FORMULAS_REPO" "$tmp/formulas"
  log "installing formulas/docs deps + running generate.js…"
  (cd "$tmp/formulas/docs" && npm install --silent --no-audit --no-fund && node generate.js)
  cp "$tmp/formulas/docs/public/formulas-data.json" "$PUBLIC/formulas-data.json"
  [[ -f "$tmp/formulas/docs/public/stats.json" ]] \
    && cp "$tmp/formulas/docs/public/stats.json" "$PUBLIC/stats.json" \
    || true
  log "generated formulas-data.json ($(wc -c < "$PUBLIC/formulas-data.json" | tr -d ' ') bytes)"
}
generate_formulas_json

# ---------------------------------------------------------------------------
# 3. Optional: full formulas repo (raw YAML)
# ---------------------------------------------------------------------------
if [[ $WITH_YAML -eq 1 ]]; then
  if [[ -d "$VENDOR/formulas" && $FORCE -eq 0 ]]; then
    log "vendor/formulas present, skipping (use --force to refetch)"
  else
    log "cloning formulas repo (shallow) → vendor/formulas/ (--with-yaml)"
    mkdir -p "$VENDOR"
    rm -rf "$VENDOR/formulas"
    git clone --depth 1 "$FORMULAS_REPO" "$VENDOR/formulas"
  fi
fi

# ---------------------------------------------------------------------------
# 4. Optional: unicode data from fontist-archive-public
# ---------------------------------------------------------------------------
# Replaces `npm run gen-unicode` for prod builds. The archive owns the
# canonical UCD-derived data; we just copy it. See REQ R1.
if [[ $WITH_UNICODE -eq 1 ]]; then
  if [[ -z "${TMP:-}" ]]; then
    TMP="$(mktemp -d)"
    trap 'rm -rf "$TMP"' EXIT
  fi

  log "cloning fontist-archive-public (shallow, $UNICODE_REF) for unicode/"
  rm -rf "$TMP/archive-public"
  git clone --depth 1 --branch "$UNICODE_REF" "$UNICODE_REPO" "$TMP/archive-public" 2>/dev/null

  SRC="$TMP/archive-public/unicode"

  log "copying unicode/block-feed/ (optional)"
  if [[ -d "$SRC/block-feed" ]]; then
    mkdir -p "$PUBLIC/unicode/blocks"
    [[ -f "$SRC/block-feed/unicode-blocks.json" ]] \
      && cp "$SRC/block-feed/unicode-blocks.json" "$PUBLIC/unicode-blocks.json"
    [[ -f "$SRC/block-feed/unicode-version.json" ]] \
      && cp "$SRC/block-feed/unicode-version.json" "$PUBLIC/unicode-version.json"
    if [[ -d "$SRC/block-feed/blocks" ]]; then
      cp -r "$SRC/block-feed/blocks/." "$PUBLIC/unicode/blocks/"
    fi
  else
    printf '  (no unicode/block-feed/ on archive-public — run npm run gen-unicode)\n'
  fi

  log "copying unicode/codepoints/ (sample only; full set via release tarball)"
  if [[ -d "$SRC/codepoints" ]]; then
    mkdir -p "$PUBLIC/codepoints"
    cp -r "$SRC/codepoints/." "$PUBLIC/codepoints/"
  fi

  log "copying unicode/universal-glyph-set/ (optional)"
  if [[ -d "$SRC/universal-glyph-set" ]]; then
    mkdir -p "$PUBLIC/unicode/glyphs"
    if [[ -d "$SRC/universal-glyph-set/glyphs" ]]; then
      cp -r "$SRC/universal-glyph-set/glyphs/." "$PUBLIC/unicode/glyphs/"
    fi
    [[ -f "$SRC/universal-glyph-set/manifest.json" ]] \
      && cp "$SRC/universal-glyph-set/manifest.json" "$PUBLIC/unicode/manifest.json"
  fi
fi

# ---------------------------------------------------------------------------
# Summary
# ---------------------------------------------------------------------------
log "done. Data present in public/:"
for f in formulas-data.json stats.json fonts.json font-metadata.json; do
  if [[ -f "$PUBLIC/$f" ]]; then
    sz=$(wc -c < "$PUBLIC/$f" | tr -d ' ')
    printf '  %-25s %s bytes\n' "$f" "$sz"
  fi
done
# coverage/, details/ and woff/ are intentionally absent from public/ — they
# are served from the CDN. Report what the manifest says the archive holds, so
# an empty archive is visible here rather than surfacing as site-wide 404s.
if [[ -f "$VENDOR/archive-manifest.txt" ]]; then
  count_cov=$(grep -c '^coverage/' "$VENDOR/archive-manifest.txt" || true)
  count_details=$(grep -c '^details/.*\.json$' "$VENDOR/archive-manifest.txt" || true)
  count_woff=$(grep -c '^woff/.*\.woff$' "$VENDOR/archive-manifest.txt" || true)
  printf '\n  archive (served from CDN, not bundled):\n'
  printf '  %-25s %s files\n' "coverage/" "$count_cov"
  printf '  %-25s %s files\n' "details/" "$count_details"
  printf '  %-25s %s woff files\n' "woff/" "$count_woff"

  if [[ "$count_woff" -eq 0 ]]; then
    echo "error: archive publishes no woff files — every specimen would 404" >&2
    exit 1
  fi
fi
if [[ $WITH_YAML -eq 1 ]]; then
  count_yaml=$(find "$VENDOR/formulas/Formulas" -name '*.yaml' 2>/dev/null | wc -l | tr -d ' ')
  printf '  %-25s %s YAML formulas\n' "vendor/formulas/" "$count_yaml"
fi
if [[ $WITH_UNICODE -eq 1 ]]; then
  count_blocks=$(find "$PUBLIC/unicode/blocks" -name '*.json' 2>/dev/null | wc -l | tr -d ' ')
  count_codepoints=$(find "$PUBLIC/codepoints" -name '*.json' 2>/dev/null | wc -l | tr -d ' ')
  printf '  %-25s %s block files\n' "unicode/blocks/" "$count_blocks"
  printf '  %-25s %s codepoint files\n' "codepoints/" "$count_codepoints"
fi
