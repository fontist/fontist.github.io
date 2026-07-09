import { describe, it } from 'node:test'
import assert from 'node:assert/strict'
import {
  blockDisplayName,
  scriptGroup,
  hexCp,
  safeChar,
  categoryName,
  featureInfo,
  blockSlug,
  PLANES,
  planeForCodepoint,
  blockScriptFamily,
  isCjkBlock,
  scriptFamilyLabel,
  canonicalCodepointHex,
} from '../constants.ts'

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
    assert.equal(blockDisplayName('CJK Unified Ideographs Extension A'), 'Extended CJK Characters')
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
    assert.equal(scriptGroup('CJK Unified Ideographs'), 'CJK')
    assert.equal(scriptGroup('Hiragana'), 'CJK')
    assert.equal(scriptGroup('Katakana'), 'CJK')
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

describe('blockScriptFamily', () => {
  it('classifies core Latin blocks', () => {
    assert.equal(blockScriptFamily('Basic Latin'), 'latin')
    assert.equal(blockScriptFamily('Latin Extended-A'), 'latin')
    assert.equal(blockScriptFamily('IPA Extensions'), 'latin')
  })
  it('classifies CJK blocks including Kangxi, Yi, Phags-pa', () => {
    assert.equal(blockScriptFamily('CJK Unified Ideographs'), 'cjk')
    assert.equal(blockScriptFamily('Hiragana'), 'cjk')
    assert.equal(blockScriptFamily('Katakana'), 'cjk')
    assert.equal(blockScriptFamily('Hangul Syllables'), 'cjk')
    assert.equal(blockScriptFamily('Bopomofo'), 'cjk')
    assert.equal(blockScriptFamily('Kangxi Radicals'), 'cjk')
    assert.equal(blockScriptFamily('Yi Syllables'), 'cjk')
    assert.equal(blockScriptFamily('Phags-pa'), 'cjk')
  })
  it('classifies middle-eastern blocks consistently', () => {
    assert.equal(blockScriptFamily('Arabic'), 'middle-eastern')
    assert.equal(blockScriptFamily('Hebrew'), 'middle-eastern')
    assert.equal(blockScriptFamily('Syriac'), 'middle-eastern')
    assert.equal(blockScriptFamily('Thaana'), 'middle-eastern')
    assert.equal(blockScriptFamily('Samaritan'), 'middle-eastern')
    assert.equal(blockScriptFamily('Mandaic'), 'middle-eastern')
  })
  it('classifies Indic blocks consistently', () => {
    assert.equal(blockScriptFamily('Devanagari'), 'south-se-asian')
    assert.equal(blockScriptFamily('Bengali'), 'south-se-asian')
    assert.equal(blockScriptFamily('Gurmukhi'), 'south-se-asian')
    assert.equal(blockScriptFamily('Telugu'), 'south-se-asian')
    assert.equal(blockScriptFamily('Malayalam'), 'south-se-asian')
    assert.equal(blockScriptFamily('Thai'), 'south-se-asian')
    assert.equal(blockScriptFamily('Myanmar'), 'south-se-asian')
  })
  it('classifies private-use and technical blocks', () => {
    assert.equal(blockScriptFamily('Private Use Area'), 'private-use')
    assert.equal(blockScriptFamily('Variation Selectors'), 'technical')
    assert.equal(blockScriptFamily('Box Drawing'), 'technical')
  })
  it('returns "other" for unknown blocks', () => {
    assert.equal(blockScriptFamily('Some Unknown Block'), 'other')
  })
})

describe('isCjkBlock', () => {
  it('returns true for the blocks that FontUnicodeBrowser previously missed', () => {
    assert.equal(isCjkBlock('Kangxi Radicals'), true)
    assert.equal(isCjkBlock('Yi Syllables'), true)
    assert.equal(isCjkBlock('Yi Radicals'), true)
    assert.equal(isCjkBlock('Phags-pa'), true)
  })
  it('returns true for core CJK blocks', () => {
    assert.equal(isCjkBlock('CJK Unified Ideographs'), true)
    assert.equal(isCjkBlock('Hiragana'), true)
    assert.equal(isCjkBlock('Katakana'), true)
    assert.equal(isCjkBlock('Hangul Jamo'), true)
    assert.equal(isCjkBlock('Bopomofo'), true)
  })
  it('returns false for non-CJK blocks', () => {
    assert.equal(isCjkBlock('Basic Latin'), false)
    assert.equal(isCjkBlock('Arabic'), false)
    assert.equal(isCjkBlock('Emoticons'), false)
  })
  it('matches case-insensitively', () => {
    assert.equal(isCjkBlock('cjk unified ideographs'), true)
    assert.equal(isCjkBlock('HIRAGANA'), true)
  })
})

describe('scriptFamilyLabel', () => {
  it('maps every ScriptFamily to its display label', () => {
    assert.equal(scriptFamilyLabel('latin'), 'Latin')
    assert.equal(scriptFamilyLabel('cjk'), 'CJK')
    assert.equal(scriptFamilyLabel('middle-eastern'), 'Middle Eastern')
    assert.equal(scriptFamilyLabel('south-se-asian'), 'South & SE Asian')
    assert.equal(scriptFamilyLabel('other'), 'Other')
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

describe('canonicalCodepointHex', () => {
  it('lowercases and zero-pads bare hex to 4 digits', () => {
    assert.equal(canonicalCodepointHex('20ac'), '20ac')
    assert.equal(canonicalCodepointHex('20AC'), '20ac')
    assert.equal(canonicalCodepointHex('20'), '0020')
    assert.equal(canonicalCodepointHex('1f600'), '1f600')
  })
  it('strips the U+ prefix (case-insensitive)', () => {
    assert.equal(canonicalCodepointHex('U+20AC'), '20ac')
    assert.equal(canonicalCodepointHex('u+20ac'), '20ac')
    assert.equal(canonicalCodepointHex('U+41'), '0041')
  })
  it('accepts a numeric codepoint', () => {
    assert.equal(canonicalCodepointHex(0x20), '0020')
    assert.equal(canonicalCodepointHex(0x1F600), '1f600')
    assert.equal(canonicalCodepointHex(0), '0000')
  })
  it('does not truncate supplementary-plane hex (5+ digits)', () => {
    assert.equal(canonicalCodepointHex(0x20000), '20000')
    assert.equal(canonicalCodepointHex('U+20000'), '20000')
  })
  it('does not validate input — out-of-range and non-hex pass through with zero-padding only', () => {
    assert.equal(canonicalCodepointHex(0x110000), '110000')
    assert.equal(canonicalCodepointHex('zzz'), '0zzz')
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
