import { describe, it } from 'node:test'
import assert from 'node:assert/strict'
import { charRoute } from '../constants.ts'

describe('charRoute', () => {
  describe('number input', () => {
    it('zero-pads to 4 lowercase hex digits', () => {
      assert.equal(charRoute(0x20), '/unicode/char/0020')
      assert.equal(charRoute(0x41), '/unicode/char/0041')
    })

    it('lowercases multi-digit hex', () => {
      assert.equal(charRoute(0x20AC), '/unicode/char/20ac')
    })

    it('preserves 5+ digit natural width without trimming', () => {
      assert.equal(charRoute(0x1F600), '/unicode/char/1f600')
      assert.equal(charRoute(0x20000), '/unicode/char/20000')
    })

    it('accepts zero as the minimum valid codepoint', () => {
      assert.equal(charRoute(0), '/unicode/char/0000')
    })

    it('accepts 0x10FFFF as the maximum valid codepoint', () => {
      assert.equal(charRoute(0x10FFFF), '/unicode/char/10ffff')
    })
  })

  describe('bare hex string input', () => {
    it('lowercases and zero-pads', () => {
      assert.equal(charRoute('20ac'), '/unicode/char/20ac')
      assert.equal(charRoute('20AC'), '/unicode/char/20ac')
      assert.equal(charRoute('0020'), '/unicode/char/0020')
      assert.equal(charRoute('20'), '/unicode/char/0020')
    })
  })

  describe('U+XXXX form', () => {
    it('strips the U+ prefix and lowercases', () => {
      assert.equal(charRoute('U+20AC'), '/unicode/char/20ac')
      assert.equal(charRoute('U+20ac'), '/unicode/char/20ac')
      assert.equal(charRoute('u+20ac'), '/unicode/char/20ac')
    })

    it('zero-pads short refs after stripping the prefix', () => {
      assert.equal(charRoute('U+41'), '/unicode/char/0041')
    })
  })

  describe('invalid input throws RangeError', () => {
    it('rejects non-hex strings', () => {
      assert.throws(() => charRoute('xyz'), RangeError)
      assert.throws(() => charRoute('U+xyz'), RangeError)
    })

    it('rejects negative numbers', () => {
      assert.throws(() => charRoute(-1), RangeError)
    })

    it('rejects codepoints above the Unicode maximum (0x10FFFF)', () => {
      assert.throws(() => charRoute(0x110000), RangeError)
    })

    it('error message echoes the malformed input for debugging', () => {
      assert.throws(
        () => charRoute('xyz'),
        /"xyz"/,
      )
    })
  })
})
