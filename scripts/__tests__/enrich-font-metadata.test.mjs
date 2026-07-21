import { test } from 'node:test'
import assert from 'node:assert/strict'
import { buildIndexesFromManifest } from '../enrich-font-metadata.mjs'

test('woff: flat layout woff/{source}/{slug}.woff', () => {
  const { woffIndex } = buildIndexesFromManifest(['woff/google/carlito.woff'])
  assert.equal(woffIndex.get('carlito'), 'woff/google/carlito.woff')
})

test('woff: nested layout woff/{source}/{slug}/{PSName}.woff keys on slug', () => {
  const { woffIndex } = buildIndexesFromManifest([
    'woff/google/carlito/Carlito-Regular.woff',
  ])
  assert.equal(woffIndex.get('carlito'), 'woff/google/carlito/Carlito-Regular.woff')
})

test('woff: first match per slug wins', () => {
  const { woffIndex } = buildIndexesFromManifest([
    'woff/google/carlito/Carlito-Regular.woff',
    'woff/google/carlito/Carlito-Bold.woff',
  ])
  assert.equal(woffIndex.get('carlito'), 'woff/google/carlito/Carlito-Regular.woff')
})

test('coverage: every recorded path is a real .json, never a directory', () => {
  const { coverageIndex } = buildIndexesFromManifest([
    'coverage/abel.json', // legacy flat (2)
    'coverage/google/carlito.json', // per-family (3)
    'coverage/google/inter/Inter-Bold.json', // per-face (4)
    'coverage/google/deep/x/y/Face.json', // deeper per-face (6)
  ])
  assert.equal(coverageIndex.get('abel'), 'coverage/abel.json')
  assert.equal(coverageIndex.get('carlito'), 'coverage/google/carlito.json')
  assert.equal(coverageIndex.get('inter'), 'coverage/google/inter/Inter-Bold.json')
  assert.equal(coverageIndex.get('deep'), 'coverage/google/deep/x/y/Face.json')
  for (const p of coverageIndex.values()) {
    assert.ok(p.endsWith('.json'), `${p} must be a .json file, not a directory`)
  }
})

test('indexes only .woff / .json entries; ignores raw/ and directory lines', () => {
  const { woffIndex, coverageIndex } = buildIndexesFromManifest([
    'raw/google/carlito/Carlito.ttf', // not .woff
    'coverage/google/carlito/blocks', // directory line, no .json extension
    'fonts.json', // registry, not under coverage/ or woff/
  ])
  assert.equal(woffIndex.has('carlito'), false) // raw/ .ttf is never indexed
  assert.equal(coverageIndex.has('carlito'), false) // a bare 'blocks' dir is not indexed
  assert.equal(coverageIndex.has('blocks'), false)
})

// This function does NOT filter woff/macos/ — that stripping lives in
// fetch-data.sh's manifest step. So a macos woff reaching here IS indexed;
// the licensing boundary is upstream, not in this pure function.
test('does not itself strip woff/macos/ (that is fetch-data.sh\'s job)', () => {
  const { woffIndex } = buildIndexesFromManifest(['woff/macos/proprietary.woff'])
  assert.equal(woffIndex.get('proprietary'), 'woff/macos/proprietary.woff')
})

test('empty manifest yields empty indexes (caller then fails hard)', () => {
  const { woffIndex, coverageIndex } = buildIndexesFromManifest([])
  assert.equal(woffIndex.size, 0)
  assert.equal(coverageIndex.size, 0)
})
