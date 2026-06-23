#!/usr/bin/env bash
# Fetch pre-built data artifacts needed for `vite-ssg build`.
#
# Mirrors the CI workflow in .github/workflows/build.yml so local builds
# see the same data prod sees. Run before `npm run build` if generated
# data is missing or stale.
#
# Sources:
#   - fontist/fontist-archive → coverage/, fonts/*.woff2, fonts.json,
#                               font-metadata.json
#   - fontist/formulas        → formulas-data.json, stats.json
#
# Options:
#   --force       Re-fetch even if files are present
#   --with-yaml   Also clone the formulas repo (4,283 YAML files) into
#                 vendor/formulas/ for raw-formula access. Off by default
#                 because the clone is ~50 MB and the site doesn't currently
#                 read raw YAML.

set -euo pipefail

ARCHIVE_REPO="https://github.com/fontist/fontist-archive.git"
FORMULAS_RAW="https://raw.githubusercontent.com/fontist/formulas/main/docs/public"
FORMULAS_REPO="https://github.com/fontist/formulas.git"

ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
PUBLIC="$ROOT/public"
VENDOR="$ROOT/vendor"

FORCE=0
WITH_YAML=0
while [[ $# -gt 0 ]]; do
  case "$1" in
    --force)    FORCE=1; shift ;;
    --with-yaml) WITH_YAML=1; shift ;;
    -h|--help)
      sed -n '2,20p' "$0"
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

  log "copying fonts/*.woff2 (optional)"
  mkdir -p "$PUBLIC/fonts/noto"
  if [[ -d "$TMP/archive/fonts" ]]; then
    # Copy woff2 specimens but DO NOT overwrite committed noto/ fallbacks
    find "$TMP/archive/fonts" -maxdepth 1 -name '*.woff2' -exec cp {} "$PUBLIC/fonts/" \;
  else
    printf '  (no fonts/ on upstream archive — specimens will 404)\n'
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
# 2. formulas-data.json + stats.json (curl from raw.githubusercontent.com)
# ---------------------------------------------------------------------------
fetch_formulas_json() {
  local name="$1"
  local out="$PUBLIC/$name"
  if [[ -f "$out" && $FORCE -eq 0 ]]; then
    log "$name present, skipping"
  elif curl -fsSL "$FORMULAS_RAW/$name" -o "$out"; then
    log "fetched $name"
  elif [[ -f "$out" ]]; then
    log "WARNING: upstream $name unavailable, keeping local copy"
  else
    echo "Failed to fetch $name from $FORMULAS_RAW/$name and no local copy exists." >&2
    echo "Run scripts/generate-formulas-data.mjs against a formulas repo clone" >&2
    echo "(or copy the file from a previous build) to populate it." >&2
    exit 1
  fi
}
fetch_formulas_json formulas-data.json

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
# Summary
# ---------------------------------------------------------------------------
log "done. Data present in public/:"
for f in formulas-data.json stats.json fonts.json font-metadata.json; do
  if [[ -f "$PUBLIC/$f" ]]; then
    sz=$(wc -c < "$PUBLIC/$f" | tr -d ' ')
    printf '  %-25s %s bytes\n' "$f" "$sz"
  fi
done
count_cov=$(ls "$PUBLIC/coverage" 2>/dev/null | wc -l | tr -d ' ')
count_fonts=$(find "$PUBLIC/fonts" -maxdepth 1 -name '*.woff2' 2>/dev/null | wc -l | tr -d ' ')
printf '  %-25s %s files\n' "coverage/" "$count_cov"
printf '  %-25s %s woff2 files\n' "fonts/" "$count_fonts"
if [[ $WITH_YAML -eq 1 ]]; then
  count_yaml=$(find "$VENDOR/formulas/Formulas" -name '*.yaml' 2>/dev/null | wc -l | tr -d ' ')
  printf '  %-25s %s YAML formulas\n' "vendor/formulas/" "$count_yaml"
fi
