---
title: GitHub Actions Integration
description: Use Fontist in your CI/CD pipelines with the official setup-fontist action for automated font installation.
---

# GitHub Actions Integration

Fontist provides an official GitHub Action for seamless CI/CD integration. The [`fontist/setup-fontist`](https://github.com/fontist/setup-fontist) action installs Fontist and makes fonts available in your workflow.

## Quick Start

Add this step to your workflow to install Fontist:

```yaml
- name: Setup Fontist
  uses: fontist/setup-fontist@v1
```

Then install the fonts you need:

```yaml
- name: Install fonts
  run: fontist install "Roboto"
```

## Complete Example

Here's a full workflow that generates a PDF with proper fonts:

```yaml
name: Generate PDF

on: [push]

jobs:
  build:
    runs-on: ubuntu-latest

    steps:
      - uses: actions/checkout@v4

      - name: Setup Fontist
        uses: fontist/setup-fontist@v1

      - name: Install required fonts
        run: |
          fontist install "Roboto"
          fontist install "Source Sans Pro"

      - name: Generate document
        run: |
          # Your PDF generation command here
          # Fonts are now available to the system
          pandoc document.md -o document.pdf
```

## Action Features

The `setup-fontist` action:

- **Installs Fontist** on the runner (Ubuntu, macOS, Windows)
- **Caches fonts** between runs for faster subsequent builds
- **Works with all GitHub-hosted runners**
- **Supports all Fontist commands** after setup

## Supported Runners

| Runner | Support |
|--------|---------|
| `ubuntu-latest` | Full support |
| `macos-latest` | Full support |
| `windows-latest` | Full support |
| Self-hosted runners | Supported (Ruby required) |

## Advanced Usage

### Installing Multiple Fonts

Install multiple fonts in a single step:

```yaml
- name: Install fonts
  run: |
    fontist install "Roboto"
    fontist install "Open Sans"
    fontist install "Source Sans Pro"
    fontist install "Lato"
```

### Accepting Licenses

For fonts requiring license acceptance:

```yaml
- name: Install fonts with license acceptance
  run: fontist install --accept-all-licenses "Calibri"
```

### Using Fontist Formulas

Install fonts from specific formulas:

```yaml
- name: Install from formula
  run: fontist install --formula "google/roboto"
```

### Caching

The action automatically caches Fontist installations. You can also manually cache:

```yaml
- name: Cache Fontist fonts
  uses: actions/cache@v4
  with:
    path: ~/.fontist
    key: fontist-${{ runner.os }}-${{ hashFiles('**/fontist-manifest.yml') }}
```

## Why Use This Action?

| Benefit | Description |
|---------|-------------|
| **Reproducibility** | Same fonts across all CI runs |
| **Speed** | Cached installations are near-instant |
| **Simplicity** | One step to get Fontist ready |
| **Reliability** | Official action maintained by the Fontist team |

## Real-World Examples

### Metanorma Document Generation

```yaml
name: Generate Metanorma Documents

on: [push]

jobs:
  build:
    runs-on: ubuntu-latest

    steps:
      - uses: actions/checkout@v4

      - name: Setup Fontist
        uses: fontist/setup-fontist@v1

      - name: Install required fonts
        run: fontist install "Source Sans Pro" --accept-all-licenses

      - name: Build documents
        run: bundle exec metanorma document.adoc
```

### Asciidoctor PDF

```yaml
name: Build PDF with Asciidoctor

on: [push]

jobs:
  build:
    runs-on: ubuntu-latest

    steps:
      - uses: actions/checkout@v4

      - name: Setup Ruby
        uses: ruby/setup-ruby@v1
        with:
          ruby-version: '3.2'

      - name: Setup Fontist
        uses: fontist/setup-fontist@v1

      - name: Install fonts
        run: fontist install "Noto Serif"

      - name: Build PDF
        run: bundle exec asciidoctor-pdf document.adoc
```

## Troubleshooting

### Font Not Found

If you get "Font not found" errors:

1. Check if the font is available: `fontist list "FontName"`
2. Search for the font: `fontist list --all | grep -i "fontname"`
3. Install from formula: `fontist install --formula "formula-name"`

### License Acceptance

Some fonts require license acceptance. Use `--accept-all-licenses`:

```yaml
- run: fontist install --accept-all-licenses "FontName"
```

### Platform-Specific Fonts

Some fonts are platform-specific. Check availability:

```yaml
- name: Install platform fonts
  run: |
    if [ "$RUNNER_OS" == "macOS" ]; then
      fontist install "San Francisco"
    fi
```

## More Information

- **Action Repository**: [github.com/fontist/setup-fontist](https://github.com/fontist/setup-fontist)
- **Fontist Documentation**: [fontist.org/fontist](https://www.fontist.org/fontist/)
- **Fontist Formulas**: [fontist.org/formulas](https://www.fontist.org/formulas/)
