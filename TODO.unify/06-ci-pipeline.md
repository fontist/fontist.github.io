# 06 — CI Data Pipeline: formulas → fontist-archive → fontist.org

## Pipeline Overview
```
[formulas push/merge to main]
    ↓ workflow: test.yml (existing)
    ↓ validates YAML, runs tests
    ↓ on success:
    ↓
    ↓ workflow_dispatch trigger
    ↓
[fontist-archive repo_dispatch]
    ↓ workflow: rebuild.yml
    ↓ runs generate_font_metadata.rb for changed formulas
    ↓ commits updated coverage/*.json + fonts/*.woff2
    ↓ pushes to main
    ↓
    ↓ on push to main:
    ↓
[fontist.github.io repository_dispatch]
    ↓ workflow: build.yml
    ↓ fetches latest data from fontist-archive
    ↓ builds vite-ssg site
    ↓ deploys to GitHub Pages
```

## Phase 1: formulas → fontist-archive trigger

### `formulas/.github/workflows/trigger-archive.yml`
```yaml
name: Trigger archive rebuild
on:
  push:
    branches: [main]
    paths: ['Formulas/**']
jobs:
  trigger:
    runs-on: ubuntu-latest
    steps:
      - run: |
          curl -X POST \
            -H "Authorization: token ${{ secrets.PAT }}" \
            -H "Accept: application/vnd.github.v3+json" \
            https://api.github.com/repos/fontist/fontist-archive/dispatches \
            -d '{"event_type":"rebuild","client_payload":{"sha":"${{ github.sha }}"}}'
```

## Phase 2: fontist-archive rebuild

### `fontist-archive/.github/workflows/rebuild.yml`
```yaml
name: Rebuild archive
on:
  repository_dispatch:
    types: [rebuild]
  workflow_dispatch:
  schedule:
    - cron: '0 6 * * 1'  # Weekly Monday 6AM UTC

jobs:
  rebuild:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
        with: { token: ${{ secrets.PAT }} }

      - uses: ruby/setup-ruby@v1
        with: { ruby-version: '3.3', bundler-cache: true }

      - uses: actions/setup-python@v5
        with: { python-version: '3.12' }
      - run: pip install fonttools

      - uses: actions/checkout@v4
        with: { repository: fontist/formulas, path: formulas }

      - name: Build coverage + specimens
        run: |
          ruby formulas/process/generate_font_metadata.rb \
            --directory formulas/Formulas \
            --output-dir . \
            --verbose

      - name: Build font registry
        run: ruby formulas/process/generate_font_registry.rb \
            --directory formulas/Formulas \
            --output fonts.json

      - name: Commit changes
        run: |
          git config user.name "Fontist Bot"
          git config user.email "bot@fontist.org"
          git add -A
          git diff --staged --quiet || git commit -m "Auto-rebuild from formulas@${{ github.event.client_payload.sha }}"
          git push

      - name: Trigger website rebuild
        run: |
          curl -X POST \
            -H "Authorization: token ${{ secrets.PAT }}" \
            -H "Accept: application/vnd.github.v3+json" \
            https://api.github.com/repos/fontist/fontist.github.io/dispatches \
            -d '{"event_type":"rebuild"}'
```

## Phase 3: fontist.org build + deploy

### `fontist.github.io/.github/workflows/build.yml`
```yaml
name: Build and deploy
on:
  push:
    branches: [main]
  repository_dispatch:
    types: [rebuild]
  workflow_dispatch:

jobs:
  build:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4

      - uses: actions/setup-node@v4
        with: { node-version: '20', cache: 'npm' }

      - name: Fetch data from fontist-archive
        run: |
          git clone --depth 1 https://github.com/fontist/fontist-archive.git /tmp/archive
          cp -r /tmp/archive/coverage public/
          cp /tmp/archive/fonts/*.woff2 public/fonts/ 2>/dev/null || true
          cp /tmp/archive/fonts.json public/
          cp /tmp/archive/font-metadata.json public/

      - name: Fetch formulas data
        run: |
          curl -sL https://raw.githubusercontent.com/fontist/formulas/main/docs/public/formulas-data.json \
            > public/formulas-data.json || true

      - run: npm ci
      - run: npm run build
      - uses: actions/upload-pages-artifact@v3
        with: { path: dist }

  deploy:
    needs: build
    runs-on: ubuntu-latest
    permissions: { pages: write, id-token: write }
    environment:
      name: github-pages
      url: ${{ steps.deployment.outputs.page_url }}
    steps:
      - id: deployment
        uses: actions/deploy-pages@v4
```

## Security
- Use a dedicated GitHub App or fine-grained PAT for cross-repo triggers
- Store PAT as `secrets.PAT` in each repo
- The PAT needs `contents: write` for fontist-archive, `actions: write` for dispatching

## Incremental Builds (future optimization)
For 4,283 formulas, a full rebuild takes hours. Optimization:
- Only process formulas that changed since last build
- Store a `last-built-sha.txt` in fontist-archive
- Compare against formulas HEAD and process only diffs
- Fall back to full rebuild weekly or on manual trigger
