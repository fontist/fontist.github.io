import { test } from 'node:test'
import assert from 'node:assert/strict'
import {
  hexCp,
  planeForCodepoint,
  blockDisplayName,
  blockSlug,
} from '../constants.ts'

test('hexCp: zero-pads to 4 digits for BMP with U+ prefix', () => {
  assert.equal(hexCp(0x0041), 'U+0041')
  assert.equal(hexCp(0x0000), 'U+0000')
  assert.equal(hexCp(0xFFFF), 'U+FFFF')
})

test('hexCp: zero-pads to 5+ digits for supplementary planes', () => {
  assert.equal(hexCp(0x10000), 'U+10000')
  assert.equal(hexCp(0x1F600), 'U+1F600')
  assert.equal(hexCp(0x10FFFF), 'U+10FFFF')
})

test('hexCp: uppercase hex', () => {
  assert.match(hexCp(0xABCD), /^U\+[0-9A-F]+$/)
})

test('planeForCodepoint: BMP', () => {
  assert.equal(planeForCodepoint(0x0000), 'bmp')
  assert.equal(planeForCodepoint(0x0041), 'bmp')
  assert.equal(planeForCodepoint(0xFFFF), 'bmp')
})

test('planeForCodepoint: SMP', () => {
  assert.equal(planeForCodepoint(0x10000), 'smp')
  assert.equal(planeForCodepoint(0x1F600), 'smp')
  assert.equal(planeForCodepoint(0x1FFFF), 'smp')
})

test('planeForCodepoint: SIP', () => {
  assert.equal(planeForCodepoint(0x20000), 'sip')
  assert.equal(planeForCodepoint(0x2FFFF), 'sip')
})

test('planeForCodepoint: SSP', () => {
  assert.equal(planeForCodepoint(0xE0000), 'ssp')
  assert.equal(planeForCodepoint(0xEFFFF), 'ssp')
})

test('planeForCodepoint: PUA-A', () => {
  assert.equal(planeForCodepoint(0xF0000), 'pua-a')
  assert.equal(planeForCodepoint(0xFFFFF), 'pua-a')
})

test('planeForCodepoint: PUA-B', () => {
  assert.equal(planeForCodepoint(0x100000), 'pua-b')
  assert.equal(planeForCodepoint(0x10FFFF), 'pua-b')
})

test('blockDisplayName: known names come from the map', () => {
  assert.equal(blockDisplayName('Basic Latin'), 'English & Basic Latin')
  assert.equal(blockDisplayName('Greek and Coptic'), 'Greek')
  assert.equal(blockDisplayName('CJK Unified Ideographs Extension A'), 'Extended CJK Characters')
})

test('blockDisplayName: unknown names fall through to regex matches', () => {
  assert.equal(blockDisplayName('CJK Unified Ideographs Extension Z'), 'Chinese Characters')
  assert.equal(blockDisplayName('Emoji Supplemental Pictographs'), 'Emoji')
})

test('blockDisplayName: truly unknown passes through', () => {
  assert.equal(blockDisplayName('A Brand New Block'), 'A Brand New Block')
})

test('blockSlug: lowercases simple names', () => {
  assert.equal(blockSlug('Basic Latin'), 'basic-latin')
})

test('blockSlug: collapses non-alphanumeric runs', () => {
  assert.equal(blockSlug('CJK Unified Ideographs Extension A'), 'cjk-unified-ideographs-extension-a')
  assert.equal(blockSlug('Letterlike Symbols (Misc)'), 'letterlike-symbols-misc')
  assert.equal(blockSlug('Latin-1 Supplement'), 'latin-1-supplement')
})

test('blockSlug: strips leading/trailing dashes', () => {
  assert.equal(blockSlug('--Weird--'), 'weird')
  assert.equal(blockSlug('  Spaced  '), 'spaced')
})

test('blockSlug: handles punctuation and ampersand', () => {
  assert.equal(blockSlug('Currency & Symbols'), 'currency-symbols')
})
