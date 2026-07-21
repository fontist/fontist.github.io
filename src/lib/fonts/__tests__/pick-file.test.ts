import { describe, it } from 'node:test'
import assert from 'node:assert/strict'
import { pickFileWithData } from '../pick-file.ts'
import type { FontFamilyFile } from '../../types/domain'

function file(over: Partial<FontFamilyFile>): FontFamilyFile {
  return {
    slug: 'carlito',
    formula_slug: 'google/carlito',
    style: 'Regular',
    path: null,
    coverage_file: null,
    redistributable: false,
    ...over,
  }
}

describe('pickFileWithData', () => {
  it('prefers a record with a coverage_file over an empty one', () => {
    const empty = file({ formula_slug: 'carlito' }) // manual, no assets
    const withCov = file({ coverage_file: 'coverage/google/carlito/Carlito-Regular.json' })
    assert.equal(pickFileWithData([empty, withCov]), withCov)
  })

  it('prefers a record with a woff path over an empty one', () => {
    const empty = file({})
    const withWoff = file({ path: 'woff/google/carlito/Carlito-Regular.woff' })
    assert.equal(pickFileWithData([empty, withWoff]), withWoff)
  })

  it('keeps the first when no candidate has data', () => {
    const a = file({ style: 'Regular' })
    const b = file({ style: 'Bold' })
    assert.equal(pickFileWithData([a, b]), a)
  })

  it('returns undefined for an empty list', () => {
    assert.equal(pickFileWithData([]), undefined)
  })
})
