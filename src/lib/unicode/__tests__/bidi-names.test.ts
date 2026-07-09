import { describe, it } from 'node:test'
import assert from 'node:assert/strict'
import { bidiClassName } from '../constants.ts'

describe('bidiClassName', () => {
  it('resolves the strong types to their display names', () => {
    assert.equal(bidiClassName('L'), 'Left-to-Right')
    assert.equal(bidiClassName('R'), 'Right-to-Left')
    assert.equal(bidiClassName('AL'), 'Right-to-Left Arabic')
  })

  it('resolves the weak types to their display names', () => {
    assert.equal(bidiClassName('EN'), 'European Number')
    assert.equal(bidiClassName('ES'), 'European Separator')
    assert.equal(bidiClassName('ET'), 'European Terminator')
    assert.equal(bidiClassName('AN'), 'Arabic Number')
    assert.equal(bidiClassName('CS'), 'Common Separator')
  })

  it('resolves the neutral types to their display names', () => {
    assert.equal(bidiClassName('NSM'), 'Nonspacing Mark')
    assert.equal(bidiClassName('BN'), 'Boundary Neutral')
    assert.equal(bidiClassName('B'), 'Paragraph Separator')
    assert.equal(bidiClassName('S'), 'Segment Separator')
    assert.equal(bidiClassName('WS'), 'Whitespace')
    assert.equal(bidiClassName('ON'), 'Other Neutral')
  })

  it('resolves the explicit formatting codes', () => {
    assert.equal(bidiClassName('LRE'), 'L-to-R Embedding')
    assert.equal(bidiClassName('LRO'), 'L-to-R Override')
    assert.equal(bidiClassName('RLE'), 'R-to-L Embedding')
    assert.equal(bidiClassName('RLO'), 'R-to-L Override')
    assert.equal(bidiClassName('PDF'), 'Pop Directional Format')
  })

  it('resolves the isolates introduced in Unicode 6.3', () => {
    assert.equal(bidiClassName('LRI'), 'L-to-R Isolate')
    assert.equal(bidiClassName('RLI'), 'R-to-L Isolate')
    assert.equal(bidiClassName('FSI'), 'First Strong Isolate')
    assert.equal(bidiClassName('PDI'), 'Pop Directional Isolate')
  })

  it('passes unknown codes through unchanged', () => {
    assert.equal(bidiClassName('XX'), 'XX')
    assert.equal(bidiClassName(''), '')
  })
})
