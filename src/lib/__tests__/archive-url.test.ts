import { describe, it } from 'node:test'
import assert from 'node:assert/strict'
import { isArchivePath, joinArchiveUrl } from '../archive-url.ts'

describe('isArchivePath', () => {
  it('is true for archive-owned prefixes', () => {
    assert.equal(isArchivePath('coverage/google/abel/Abel-Regular.json'), true)
    assert.equal(isArchivePath('woff/google/abel/Abel-Regular.woff'), true)
    assert.equal(isArchivePath('details/google/abel.json'), true)
  })

  it('strips a leading slash before matching', () => {
    assert.equal(isArchivePath('/woff/google/abel.woff'), true)
    assert.equal(isArchivePath('/coverage/x.json'), true)
  })

  it('is false for site-local paths and near-miss prefixes', () => {
    assert.equal(isArchivePath('font-metadata.json'), false)
    assert.equal(isArchivePath('fonts/google/abel.woff'), false) // legacy fonts/, not woff/
    assert.equal(isArchivePath('coverage-heatmap.js'), false) // prefix needs the slash
    assert.equal(isArchivePath('woffle/x'), false)
  })
})

describe('joinArchiveUrl', () => {
  const base = 'https://cdn.jsdelivr.net/gh/fontist/fontist-archive-public@abc123'

  it('joins base and path with exactly one slash', () => {
    assert.equal(
      joinArchiveUrl(base, 'woff/google/abel/Abel-Regular.woff'),
      `${base}/woff/google/abel/Abel-Regular.woff`,
    )
  })

  it('strips a leading slash on the path (no double slash)', () => {
    assert.equal(joinArchiveUrl(base, '/coverage/x.json'), `${base}/coverage/x.json`)
  })

  it('normalizes a trailing-slash base — no double slash', () => {
    // Pass an ACTUAL trailing-slash base so this exercises the guard.
    assert.equal(joinArchiveUrl(`${base}/`, '/woff/x.woff'), `${base}/woff/x.woff`)
    assert.equal(joinArchiveUrl(`${base}///`, 'woff/x.woff'), `${base}/woff/x.woff`)
  })

  it('falls back to a site-relative path when base is empty', () => {
    assert.equal(joinArchiveUrl('', 'coverage/x.json'), '/coverage/x.json')
    assert.equal(joinArchiveUrl('', '/woff/x.woff'), '/woff/x.woff')
  })
})
