import { describe, it } from 'node:test'
import assert from 'node:assert/strict'
import { blockDisplayName, scriptGroup, hexCp, safeChar, categoryName, featureInfo, blockSlug, PLANES, planeForCodepoint } from '../constants.ts'

describe('blockDisplayName', () => {
  it('maps known blocks to human-friendly names', () => {
    assert.equal(blockDisplayName('Basic Latin'), 'English & Basic Latin')
    assert.equal(blockDisplayName('Latin-1 Supplement'), 'Accented Latin')
    assert.equal(blockDisplayName('Miscellaneous Symbols and Pictographs'), 'Emoji & Pictographs')
    assert.equal(blockDisplayName('Greek and Coptic'), 'Greek')
    assert.equal(blockDisplayName('Cyrillic'), 'Cyrillic')
  })
  it('passes through unknown block names unchanged', () => {
    assert.equal(blockDisplayName('Some Unknown Block'), 'Some Unknown Block')
  })
  it('maps CJK-related blocks', () => {
    assert.equal(blockDisplayName('CJK Unified Ideographs Extension A'), 'CJK Extension A')
    assert.equal(blockDisplayName('Hiragana'), 'Japanese Hiragana')
    assert.equal(blockDisplayName('Hangul Syllables'), 'Korean')
  })
})

describe('scriptGroup', () => {
  it('groups Latin blocks', () => {
    assert.equal(scriptGroup('Basic Latin'), 'Latin')
    assert.equal(scriptGroup('Latin Extended-A'), 'Latin')
    assert.equal(scriptGroup('IPA Extensions'), 'Latin')
    assert.equal(scriptGroup('Combining Diacritical Marks'), 'Latin')
  })
  it('groups CJK blocks', () => {
    assert.equal(scriptGroup('CJK Unified Ideographs'), 'CJK (Chinese/Japanese/Korean)')
    assert.equal(scriptGroup('Hiragana'), 'CJK (Chinese/Japanese/Korean)')
    assert.equal(scriptGroup('Katakana'), 'CJK (Chinese/Japanese/Korean)')
  })
  it('groups Emoji blocks', () => {
    assert.equal(scriptGroup('Emoticons'), 'Emoji')
    assert.equal(scriptGroup('Transport and Map Symbols'), 'Emoji')
  })
  it('groups Middle Eastern blocks', () => {
    assert.equal(scriptGroup('Arabic'), 'Middle Eastern')
    assert.equal(scriptGroup('Hebrew'), 'Middle Eastern')
  })
})

describe('hexCp', () => {
  it('formats 4-digit codepoints', () => {
    assert.equal(hexCp(0x0041), 'U+0041')
    assert.equal(hexCp(0x0020), 'U+0020')
  })
  it('formats 5+ digit codepoints', () => {
    assert.equal(hexCp(0x1F600), 'U+1F600')
    assert.equal(hexCp(0x20000), 'U+20000')
  })
  it('formats zero', () => {
    assert.equal(hexCp(0), 'U+0000')
  })
})

describe('safeChar', () => {
  it('returns the character for valid codepoints', () => {
    assert.equal(safeChar(0x0041), 'A')
    assert.equal(safeChar(0x0061), 'a')
    assert.equal(safeChar(0x0030), '0')
  })
  it('returns emoji characters', () => {
    assert.equal(safeChar(0x1F600), '😀')
  })
  it('returns empty string for invalid codepoints', () => {
    assert.equal(safeChar(0x110000), '')
  })
})

describe('categoryName', () => {
  it('maps category codes to human names', () => {
    assert.equal(categoryName('Lu'), 'Uppercase Letter')
    assert.equal(categoryName('Ll'), 'Lowercase Letter')
    assert.equal(categoryName('Nd'), 'Decimal Number')
    assert.equal(categoryName('Sc'), 'Currency Symbol')
    assert.equal(categoryName('Cc'), 'Control')
  })
  it('passes through unknown categories', () => {
    assert.equal(categoryName('XX'), 'XX')
  })
})

describe('featureInfo', () => {
  it('returns info for known features', () => {
    const liga = featureInfo('liga')
    assert.equal(liga.name, 'Standard Ligatures')
    assert.ok(liga.desc.length > 0)
  })
  it('returns tag as name for unknown features', () => {
    const unknown = featureInfo('xxxx')
    assert.equal(unknown.name, 'xxxx')
    assert.equal(unknown.desc, 'OpenType feature')
  })
})

describe('blockSlug', () => {
  it('converts block names to URL slugs', () => {
    assert.equal(blockSlug('Basic Latin'), 'basic-latin')
    assert.equal(blockSlug('CJK Unified Ideographs'), 'cjk-unified-ideographs')
    assert.equal(blockSlug('Miscellaneous Symbols and Pictographs'), 'miscellaneous-symbols-and-pictographs')
  })
  it('handles special characters', () => {
    assert.equal(blockSlug('Latin-1 Supplement'), 'latin-1-supplement')
  })
})

describe('PLANES', () => {
  it('has exactly 7 planes', () => {
    assert.equal(PLANES.length, 7)
  })
  it('includes all expected plane keys', () => {
    const keys = PLANES.map(p => p.key)
    assert.ok(keys.includes('bmp'))
    assert.ok(keys.includes('smp'))
    assert.ok(keys.includes('sip'))
    assert.ok(keys.includes('pua-a'))
    assert.ok(keys.includes('pua-b'))
  })
  it('each plane has start < end', () => {
    for (const p of PLANES) {
      assert.ok(p.start < p.end, `${p.key}: start ${p.start} should be < end ${p.end}`)
    }
  })
})

describe('planeForCodepoint', () => {
  it('assigns BMP codepoints correctly', () => {
    assert.equal(planeForCodepoint(0x0000), 'bmp')
    assert.equal(planeForCodepoint(0x0041), 'bmp')
    assert.equal(planeForCodepoint(0xFFFF), 'bmp')
  })
  it('assigns SMP codepoints correctly', () => {
    assert.equal(planeForCodepoint(0x10000), 'smp')
    assert.equal(planeForCodepoint(0x1F600), 'smp')
    assert.equal(planeForCodepoint(0x1FFFF), 'smp')
  })
  it('assigns SIP codepoints correctly', () => {
    assert.equal(planeForCodepoint(0x20000), 'sip')
    assert.equal(planeForCodepoint(0x2FFFF), 'sip')
  })
})
