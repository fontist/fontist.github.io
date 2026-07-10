#!/usr/bin/env node
// Reads public/content/licenses/*.yml and generates:
//   public/content/licenses/index.json  — array of all license metadata (for the index page)
//
// The YAML files are the source of truth for license data (permissions,
// matchers, siblings, examples, blurb). The markdown files (*.md) remain
// the source of truth for the prose body on each license detail page.
//
// This script runs as part of `npm run build` (see package.json).

import { readFileSync, readdirSync, writeFileSync } from 'node:fs'
import { resolve, dirname } from 'node:path'
import { fileURLToPath } from 'node:url'
import { createRequire } from 'node:module'
const require = createRequire(import.meta.url)
const yaml = require('js-yaml')

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..')
const licensesDir = resolve(root, 'public/content/licenses')

const files = readdirSync(licensesDir)
  .filter(f => f.endsWith('.yml') && f !== 'index.yml')
  .sort()

const licenses = []
for (const file of files) {
  const raw = readFileSync(resolve(licensesDir, file), 'utf8')
  const data = yaml.load(raw)
  licenses.push(data)
}

// Sort by category then name for a stable order on the index page
const CATEGORY_ORDER = { permissive: 0, 'public-domain': 1, copyleft: 2, special: 3 }
licenses.sort((a, b) => {
  const ca = CATEGORY_ORDER[a.category] ?? 99
  const cb = CATEGORY_ORDER[b.category] ?? 99
  if (ca !== cb) return ca - cb
  return a.name.localeCompare(b.name)
})

const outPath = resolve(licensesDir, 'index.json')
writeFileSync(outPath, JSON.stringify(licenses, null, 2))
console.log(`licenses: wrote ${licenses.length} entries to ${outPath}`)
