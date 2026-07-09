import { describe, it } from 'node:test'
import assert from 'node:assert/strict'
import { mapRawCharacter } from '../data/loader.ts'

describe('mapRawCharacter', () => {
  it('maps every raw field to its semantic name', () => {
    const c = mapRawCharacter({
      cp: 0x0041,
      n: 'LATIN CAPITAL LETTER A',
      c: 'Lu',
      s: 'Latn',
      cc: 0,
      bc: 'L',
      mir: false,
      up: undefined,
      lo: '0061',
      ti: undefined,
      dm: undefined,
    })
    assert.equal(c.cp, 0x0041)
    assert.equal(c.hex, 'U+0041')
    assert.equal(c.char, 'A')
    assert.equal(c.name, 'LATIN CAPITAL LETTER A')
    assert.equal(c.category, 'Lu')
    assert.equal(c.script, 'Latn')
    assert.equal(c.combiningClass, 0)
    assert.equal(c.bidiClass, 'L')
    assert.equal(c.mirrored, false)
    assert.equal(c.simpleUppercase, null)
    assert.equal(c.simpleLowercase, '0061')
    assert.equal(c.simpleTitlecase, null)
    assert.equal(c.decomposition, null)
  })

  it('applies UCD defaults when raw fields are missing', () => {
    const c = mapRawCharacter({ cp: 0x0020 })
    assert.equal(c.cp, 0x0020)
    assert.equal(c.hex, 'U+0020')
    assert.equal(c.char, ' ')
    assert.equal(c.name, '')
    assert.equal(c.category, '')
    assert.equal(c.script, '')
    assert.equal(c.combiningClass, 0)
    assert.equal(c.bidiClass, null)
    assert.equal(c.mirrored, false)
    assert.equal(c.simpleUppercase, null)
    assert.equal(c.simpleLowercase, null)
    assert.equal(c.simpleTitlecase, null)
    assert.equal(c.decomposition, null)
  })

  it('preserves explicit case mappings and decomposition', () => {
    const c = mapRawCharacter({
      cp: 0x0061,
      n: 'LATIN SMALL LETTER A',
      c: 'Ll',
      s: 'Latn',
      cc: 0,
      bc: 'L',
      mir: false,
      up: '0041',
      lo: undefined,
      ti: undefined,
      dm: undefined,
    })
    assert.equal(c.simpleUppercase, '0041')
    assert.equal(c.simpleLowercase, null)
  })

  it('preserves a combining diacritic mark with non-zero combining class', () => {
    const c = mapRawCharacter({
      cp: 0x0301,
      n: 'COMBINING ACUTE ACCENT',
      c: 'Mn',
      s: 'Zinh',
      cc: 230,
      bc: 'NSM',
      mir: false,
    })
    assert.equal(c.combiningClass, 230)
    assert.equal(c.bidiClass, 'NSM')
    assert.equal(c.mirrored, false)
  })

  it('preserves the mirrored flag for characters like ")"', () => {
    const c = mapRawCharacter({
      cp: 0x0029,
      n: 'RIGHT PARENTHESIS',
      c: 'Pe',
      s: 'Zyyy',
      cc: 0,
      bc: 'ON',
      mir: true,
    })
    assert.equal(c.mirrored, true)
  })

  it('preserves a compatibility decomposition string', () => {
    const c = mapRawCharacter({
      cp: 0xFB01,
      n: 'LATIN SMALL LIGATURE FI',
      c: 'Ll',
      s: 'Latn',
      cc: 0,
      bc: 'L',
      mir: false,
      dm: '<compat> 0066 0069',
    })
    assert.equal(c.decomposition, '<compat> 0066 0069')
  })
})
