import { describe, it } from 'node:test'
import assert from 'node:assert/strict'
import {
  isCodepointRef,
  parseCodepointRef,
  isSelfReference,
  glyphOf,
} from '../unihan.ts'

describe('isCodepointRef', () => {
  it('matches the canonical U+XXXX form', () => {
    assert.equal(isCodepointRef('U+20AC'), true)
    assert.equal(isCodepointRef('U+0041'), true)
  })

  it('matches lowercase hex digits after the U+ prefix', () => {
    assert.equal(isCodepointRef('U+20ac'), true)
    assert.equal(isCodepointRef('U+0041'), true)
  })

  it('rejects a lowercase u prefix (UDC/Unihan wire format uses uppercase U)', () => {
    assert.equal(isCodepointRef('u+20AC'), false)
  })

  it('matches supplementary plane codepoints', () => {
    assert.equal(isCodepointRef('U+1F600'), true)
    assert.equal(isCodepointRef('U+20000'), true)
  })

  it('rejects bare hex without the U+ prefix', () => {
    assert.equal(isCodepointRef('0020'), false)
    assert.equal(isCodepointRef('20AC'), false)
  })

  it('rejects non-codepoint values like decomposition tags', () => {
    assert.equal(isCodepointRef('<compat>'), false)
    assert.equal(isCodepointRef('<super>'), false)
    assert.equal(isCodepointRef('0066 0069'), false)
    assert.equal(isCodepointRef(''), false)
  })
})

describe('parseCodepointRef', () => {
  it('parses canonical U+XXXX form to the integer codepoint', () => {
    assert.equal(parseCodepointRef('U+20AC'), 0x20AC)
    assert.equal(parseCodepointRef('U+0041'), 0x41)
  })

  it('parses supplementary plane codepoints', () => {
    assert.equal(parseCodepointRef('U+1F600'), 0x1F600)
  })

  it('is case-insensitive on both prefix and hex digits', () => {
    assert.equal(parseCodepointRef('u+20ac'), 0x20AC)
    assert.equal(parseCodepointRef('U+20ac'), 0x20AC)
  })
})

describe('isSelfReference', () => {
  it('returns true when the codepoint ref resolves to selfCp', () => {
    assert.equal(isSelfReference('U+20AC', 0x20AC), true)
    assert.equal(isSelfReference('U+20ac', 0x20AC), true)
  })

  it('returns false for a different codepoint', () => {
    assert.equal(isSelfReference('U+20AB', 0x20AC), false)
  })

  it('returns false for non-ref values without throwing', () => {
    assert.equal(isSelfReference('<compat>', 0x20AC), false)
    assert.equal(isSelfReference('0061', 0x61), false)
  })

  it('matches supplementary plane self references', () => {
    assert.equal(isSelfReference('U+1F600', 0x1F600), true)
  })
})

describe('glyphOf', () => {
  it('returns the rendered character for a codepoint ref', () => {
    assert.equal(glyphOf('U+0041'), 'A')
    assert.equal(glyphOf('U+0061'), 'a')
    assert.equal(glyphOf('U+0030'), '0')
  })

  it('returns the rendered character for emoji codepoints', () => {
    assert.equal(glyphOf('U+1F600'), '😀')
  })

  it('returns empty string for non-ref values', () => {
    assert.equal(glyphOf('<compat>'), '')
    assert.equal(glyphOf('0061'), '')
    assert.equal(glyphOf(''), '')
  })
})
