# 10 — End-to-end local validation

## Why

Prove the new pipeline works before any PRs. Walk one formula through the
entire chain locally:

```
formulas YAML
   ↓ bin/build (archive-private)
coverage/google/abeezee/ABeeZee-Regular.json
coverage/google/abeezee/ABeeZee-Regular/index.json
woff/google/abeezee/ABeeZee-Regular.woff
details/google/abeezee.json
fonts.json, font-metadata.json (registry)
   ↓ bin/sync-from-private
archive-public/{coverage,woff,details,fonts.json,...}
   ↓ scripts/fetch-data.sh
fontist.org/public/{coverage,details,fonts,...}
   ↓ npm run build:no-fetch
rendered FormulaPage + FontBlockPage
```

## Procedure

### Step 1 — Build one formula in archive-private

```bash
cd ../fontist-archive-private
UCODE_PATH=../ucode FONTISAN_PATH=../fontisan \
  ruby bin/build --formula-dir ../formulas/Formulas \
                 --source google --limit 1 --verbose
```

Expected outputs (relative to archive-private root):
- `coverage/google/abeezee/ABeeZee-Regular.json` (aggregated)
- `coverage/google/abeezee/ABeeZee-Regular/index.json` (ucode native)
- `coverage/google/abeezee/ABeeZee-Regular/blocks/*.json`
- `woff/google/abeezee/ABeeZee-Regular.woff`
- `details/google/abeezee.json`
- `fonts.json` (registry)
- `font-metadata.json` (registry)

### Step 2 — Sync to archive-public locally

```bash
cd ../fontist-archive-public
git clone --depth 1 file://$(realpath ../fontist-archive-private) /tmp/private
chmod +x bin/sync-from-private
./bin/sync-from-private /tmp/private
```

Expected: `coverage/google/abeezee/...`, `woff/google/abeezee/...`,
`details/google/abeezee.json`, `fonts.json`, `font-metadata.json` all
present in archive-public.

### Step 3 — Fetch into fontist.org

```bash
cd ../fontist.org
# Edit scripts/fetch-data.sh temporarily to clone from local file path:
#   ARCHIVE_REPO="file:///Users/mulgogi/src/fontist/fontist-archive-public"
./scripts/fetch-data.sh
```

Expected: `public/coverage/google/abeezee/...`, `public/fonts/*.woff`,
`public/details/google/abeezee.json`, etc.

### Step 4 — Build fontist.org

```bash
npm run build:no-fetch
```

Expected: `dist/` populated, no errors.

### Step 5 — Smoke-test pages

Run `npm run preview` and visit:

- `http://localhost:4173/formulas/google/abeezee` — formula detail renders
- `http://localhost:4173/fonts/google/abeezee/ABeeZee-Regular` — specimen renders
- `http://localhost:4173/unicode/block/basic-latin` — block page works
- `http://localhost:4173/coverage/google/abeezee` — coverage stats render

## Pass criteria

- [ ] bin/build produces ALL expected outputs for 1 formula
- [ ] bin/sync-from-private copies ALL expected data
- [ ] fontist.org fetch-data.sh succeeds
- [ ] fontist.org npm run build:no-fetch succeeds
- [ ] All 4 smoke-test pages render correctly
- [ ] No `.yaml` coverage files
- [ ] No `.woff2` files sourced from archive (noto/ fallbacks unaffected)

## Failure handling

If a step fails:
1. Capture the error output
2. Identify which plan's acceptance criterion is unmet
3. File as a follow-up under TODO.archives/ — don't fix in this validation step

## Out of scope

- Full archive build (4,283 formulas) — CI handles this
- Real GitHub dispatch chain — plan 09 covers
- Production cutover — happens after this validation passes repeatedly
