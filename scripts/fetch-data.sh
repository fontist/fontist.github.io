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

ARCHIVE_REPO="https://github.com/fontist/fontist-archive-public.git"
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
# 1. fontist-archive: coverage, woff2 specimens, registry, metadata
# ---------------------------------------------------------------------------
if [[ -f "$PUBLIC/fonts.json" && -f "$PUBLIC/font-metadata.json" \
   && -d "$PUBLIC/coverage" && -d "$PUBLIC/fonts" && $FORCE -eq 0 ]]; then
  log "archive data present, skipping (use --force to refetch)"
else
  log "cloning fontist-archive (shallow)…"
  TMP="$(mktemp -d)"
  trap 'rm -rf "$TMP"' EXIT
  git clone --depth 1 "$ARCHIVE_REPO" "$TMP/archive"

  # Mirrors .github/workflows/build.yml: each artifact is optional and may
  # be absent from origin/main while the upstream rebuild is in flight.
  # '|| true' keeps this script idempotent across partial archive states.
  log "copying coverage/ (optional)"
  mkdir -p "$PUBLIC/coverage"
  if [[ -d "$TMP/archive/coverage" ]]; then
    cp -r "$TMP/archive/coverage/." "$PUBLIC/coverage/"
  else
    printf '  (no coverage/ on upstream archive — site degrades gracefully)\n'
  fi

  log "copying details/ (optional)"
  mkdir -p "$PUBLIC/details"
  if [[ -d "$TMP/archive/details" ]]; then
    cp -r "$TMP/archive/details/." "$PUBLIC/details/"
  else
    printf '  (no details/ on upstream archive — formula pages degrade to summary)\n'
  fi

  log "copying woff/ (preserving woff/{slug}/{PSName}.woff structure)"
  mkdir -p "$PUBLIC/fonts/noto"
  if [[ -d "$TMP/archive/woff" ]]; then
    # Nested woff/{slug}/{PSName}.woff preserved as-is so that
    # font-metadata.json's woff_file URLs (e.g. "woff/google/abel/Abel-Regular.woff")
    # resolve verbatim under public/. NOTO fallbacks under public/fonts/noto/
    # are committed separately and not touched here.
    mkdir -p "$PUBLIC/woff"
    cp -r "$TMP/archive/woff/." "$PUBLIC/woff/"
  else
    printf '  (no woff/ on upstream archive — specimens will 404)\n'
  fi

  log "copying fonts.json, font-metadata.json"
  [[ -f "$TMP/archive/fonts.json" ]] \
    && cp "$TMP/archive/fonts.json" "$PUBLIC/fonts.json" \
    || printf '  (no fonts.json on upstream archive)\n'
  [[ -f "$TMP/archive/font-metadata.json" ]] \
    && cp "$TMP/archive/font-metadata.json" "$PUBLIC/font-metadata.json" \
    || printf '  (no font-metadata.json on upstream archive)\n'
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
count_cov=$(find "$PUBLIC/coverage" -maxdepth 1 -type f 2>/dev/null | wc -l | tr -d ' ' || true)
count_details=$(find "$PUBLIC/details" -name '*.json' 2>/dev/null | wc -l | tr -d ' ' || true)
count_woff=$(find "$PUBLIC/woff" -name '*.woff' 2>/dev/null | wc -l | tr -d ' ' || true)
printf '  %-25s %s files\n' "coverage/" "$count_cov"
printf '  %-25s %s files\n' "details/" "$count_details"
printf '  %-25s %s woff files\n' "woff/" "$count_woff"
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
