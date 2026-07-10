#!/usr/bin/env node
// Renames every public/codepoints/*.json to its canonical name.
// Canonical = codepoint.toString(16).toLowerCase().padStart(4, '0') + '.json'
//
// The codepoint is read from the JSON's `codepoint` field (authoritative);
// falls back to parsing the filename if the field is missing.
//
// Idempotent: re-running reports 0 renamed.
// Non-destructive: renames only, never deletes.

import { readdir, readFile, rename } from 'node:fs/promises'
import { join } from 'node:path'

const DIR = new URL('../public/codepoints/', import.meta.url).pathname

const files = await readdir(DIR)
let renamed = 0
let alreadyCanonical = 0
let uncertain = 0

for (const file of files) {
  if (!file.endsWith('.json')) continue
  const from = join(DIR, file)
  let cp
  try {
    const data = JSON.parse(await readFile(from, 'utf8'))
    cp = data.codepoint
  } catch {
    const m = file.match(/^([0-9a-fA-F]+)\.json$/)
    if (!m) { uncertain++; continue }
    cp = parseInt(m[1], 16)
  }
  if (typeof cp !== 'number' || !Number.isFinite(cp)) { uncertain++; continue }
  const canonical = `${cp.toString(16).toLowerCase().padStart(4, '0')}.json`
  if (file === canonical) { alreadyCanonical++; continue }
  const to = join(DIR, canonical)
  await rename(from, to)
  renamed++
  console.log(`${file} -> ${canonical}`)
}

console.log(`\nRenamed: ${renamed}, already canonical: ${alreadyCanonical}, uncertain: ${uncertain}`)
