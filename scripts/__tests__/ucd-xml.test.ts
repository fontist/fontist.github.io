import { test } from 'node:test'
import assert from 'node:assert/strict'
import {
  parseUcdXml,
  mapChar,
  groupCharsByBlock,
  buildIndexes,
  stableStringify,
} from '../lib/ucd-xml.ts'

// Sample XML uses real UCD XML attribute names: first-cp/last-cp for blocks,
// Bidi_M (not mir), `#` as the "no value" sentinel for dm/suc/slc/stc.
const SAMPLE_XML = `<?xml version="1.0" ?>
<ucd>
  <description>mock UCD sample for tests</description>
  <blocks>
    <block first-cp="0000" last-cp="007F" name="Basic Latin" />
    <block first-cp="0080" last-cp="00FF" name="Latin-1 Supplement" />
    <block first-cp="0100" last-cp="017F" name="Latin Extended-A" />
    <block first-cp="0300" last-cp="036F" name="Combining Diacritical Marks" />
    <block first-cp="E000" last-cp="F8FF" name="Private Use Area" />
  </blocks>
  <description>characters below</description>
  <char cp="0000" na="" na1="NULL" gc="Cc" ccc="0" bc="BN" Bidi_M="N" dm="#" suc="#" slc="#" stc="#" sc="Zyyy" />
  <char cp="0020" na="SPACE" gc="Zs" ccc="0" bc="WS" Bidi_M="N" dm="#" suc="#" slc="#" stc="#" sc="Zyyy" />
  <char cp="0041" na="LATIN CAPITAL LETTER A" gc="Lu" ccc="0" bc="L" Bidi_M="N" dm="#" suc="#" slc="0061" stc="#" sc="Latn" />
  <char cp="0061" na="LATIN SMALL LETTER A" gc="Ll" ccc="0" bc="L" Bidi_M="N" dm="#" suc="0041" slc="#" stc="0041" sc="Latn" />
  <char cp="0028" na="LEFT PARENTHESIS" gc="Ps" ccc="0" bc="ON" Bidi_M="Y" dm="#" suc="#" slc="#" stc="#" sc="Zyyy" />
  <char cp="0300" na="COMBINING GRAVE ACCENT" gc="Mn" ccc="230" bc="NSM" Bidi_M="N" dm="#" suc="#" slc="#" stc="#" sc="Zinh" />
  <char cp="00A0" na="NO-BREAK SPACE" gc="Zs" ccc="0" bc="CS" Bidi_M="N" dm="&lt;noBreak&gt; 0020" suc="#" slc="#" stc="#" sc="Zyyy" />
  <char cp="0100" na="LATIN CAPITAL LETTER A WITH MACRON" gc="Lu" ccc="0" bc="L" Bidi_M="N" dm="0041 0304" suc="#" slc="0101" stc="#" sc="Latn" />
  <char cp="D800" na="" gc="Cs" ccc="0" bc="L" Bidi_M="N" dm="#" suc="#" slc="#" stc="#" sc="Zyyy" />
  <char cp="FFFF" na="" gc="Cn" ccc="0" bc="BN" Bidi_M="N" dm="#" suc="#" slc="#" stc="#" sc="Zyyy" />
</ucd>
`

test('parseUcdXml: extracts <block> records using first-cp/last-cp', () => {
  const { blocks } = parseUcdXml(SAMPLE_XML)
  assert.equal(blocks.length, 5)
  assert.deepEqual(blocks[0], { start: 0, end: 127, name: 'Basic Latin' })
  assert.deepEqual(blocks[4], { start: 0xE000, end: 0xF8FF, name: 'Private Use Area' })
})

test('parseUcdXml: parses single <char cp=...> entries', () => {
  const { chars } = parseUcdXml(SAMPLE_XML)
  const a = chars.find((c) => c.cp === 0x41)
  assert.ok(a)
  assert.equal(a!.na, 'LATIN CAPITAL LETTER A')
  assert.equal(a!.gc, 'Lu')
  assert.equal(a!.sc, 'Latn')
  assert.equal(a!.bc, 'L')
  assert.equal(a!.suc, undefined, '"#" sentinel normalizes to undefined')
  assert.equal(a!.slc, '0061')
})

test('parseUcdXml: Bidi_M maps to bidiMirrored boolean', () => {
  const { chars } = parseUcdXml(SAMPLE_XML)
  const paren = chars.find((c) => c.cp === 0x28)!
  const space = chars.find((c) => c.cp === 0x20)!
  assert.equal(paren.bidiMirrored, true)
  assert.equal(space.bidiMirrored, false)
})

test('parseUcdXml: dm "#" sentinel becomes undefined', () => {
  const { chars } = parseUcdXml(SAMPLE_XML)
  const a = chars.find((c) => c.cp === 0x41)!
  assert.equal(a.dm, undefined, '"#" dm should normalize away')
  const nbsp = chars.find((c) => c.cp === 0xA0)!
  assert.equal(nbsp.dm, '<noBreak> 0020', 'real dm preserved')
})

test('parseUcdXml: sorts blocks and chars ascending', () => {
  const unsorted = `<?xml version="1.0"?><ucd>
    <blocks>
      <block first-cp="0100" last-cp="017F" name="Latin Extended-A" />
      <block first-cp="0000" last-cp="007F" name="Basic Latin" />
    </blocks>
    <char cp="0061" na="b" gc="Ll" bc="L" sc="Latn" />
    <char cp="0041" na="a" gc="Lu" bc="L" sc="Latn" />
  </ucd>`
  const { blocks, chars } = parseUcdXml(unsorted)
  assert.equal(blocks[0].name, 'Basic Latin')
  assert.equal(blocks[1].name, 'Latin Extended-A')
  assert.equal(chars[0].cp, 0x41)
  assert.equal(chars[1].cp, 0x61)
})

test('parseUcdXml: ignores content inside <description>', () => {
  const xml = `<?xml version="1.0"?><ucd>
    <description>this looks like a &lt;char cp="0041" /&gt; but is inside description</description>
    <blocks></blocks>
    <char cp="0041" na="real" gc="Lu" bc="L" sc="Latn" />
  </ucd>`
  const { chars } = parseUcdXml(xml)
  assert.equal(chars.length, 1)
  assert.equal(chars[0].na, 'real')
})

test('parseUcdXml: accepts legacy first/last attrs as fallback', () => {
  const xml = `<?xml version="1.0"?><ucd>
    <blocks>
      <block first="0100" last="017F" name="Latin Extended-A" />
    </blocks>
    <char cp="0100" na="X" gc="Lu" bc="L" sc="Latn" />
  </ucd>`
  const { blocks } = parseUcdXml(xml)
  assert.equal(blocks[0].start, 0x100)
  assert.equal(blocks[0].end, 0x17F)
})

test('mapChar: excludes Cn, Cs, Co categories', () => {
  const { chars } = parseUcdXml(SAMPLE_XML)
  const cn = chars.find((c) => c.cp === 0xFFFF)!
  const cs = chars.find((c) => c.cp === 0xD800)!
  assert.equal(mapChar(cn), null)
  assert.equal(mapChar(cs), null)
})

test('mapChar: control chars get name "<control>"', () => {
  const { chars } = parseUcdXml(SAMPLE_XML)
  const nul = chars.find((c) => c.cp === 0)!
  const rec = mapChar(nul)
  assert.ok(rec)
  assert.equal(rec.n, '<control>')
})

test('mapChar: includes basic fields for LATIN CAPITAL LETTER A', () => {
  const { chars } = parseUcdXml(SAMPLE_XML)
  const a = chars.find((c) => c.cp === 0x41)!
  const rec = mapChar(a)
  assert.deepEqual(rec, {
    cp: 0x41,
    n: 'LATIN CAPITAL LETTER A',
    c: 'Lu',
    s: 'Latn',
    bc: 'L',
    lo: '0061',
  })
})

test('mapChar: omits suc/slc/stc when equal to cp or "#"', () => {
  const { chars } = parseUcdXml(SAMPLE_XML)
  const a = chars.find((c) => c.cp === 0x41)!
  const rec = mapChar(a)
  assert.ok(rec)
  assert.equal('up' in rec, false, 'suc was "#" → undefined → no up field')
  assert.equal('ti' in rec, false, 'stc was "#" → undefined → no ti field')
  assert.equal(rec.lo, '0061', 'slc=0061 differs from cp → keep lo')
})

test('mapChar: omits mir when false', () => {
  const { chars } = parseUcdXml(SAMPLE_XML)
  const space = chars.find((c) => c.cp === 0x20)!
  const rec = mapChar(space)
  assert.ok(rec)
  assert.equal('mir' in rec, false)
})

test('mapChar: sets mir=true when Bidi_M=Y', () => {
  const { chars } = parseUcdXml(SAMPLE_XML)
  const paren = chars.find((c) => c.cp === 0x28)!
  const rec = mapChar(paren)
  assert.ok(rec)
  assert.equal(rec.mir, true)
})

test('mapChar: omits cc when 0, includes when non-zero', () => {
  const { chars } = parseUcdXml(SAMPLE_XML)
  const grave = chars.find((c) => c.cp === 0x300)!
  const rec = mapChar(grave)
  assert.ok(rec)
  assert.equal(rec.cc, '230')
})

test('mapChar: preserves dm with <tag> prefix', () => {
  const { chars } = parseUcdXml(SAMPLE_XML)
  const nbsp = chars.find((c) => c.cp === 0xA0)!
  const rec = mapChar(nbsp)
  assert.ok(rec)
  assert.equal(rec.dm, '<noBreak> 0020')
})

test('mapChar: preserves canonical dm without tag', () => {
  const { chars } = parseUcdXml(SAMPLE_XML)
  const macron = chars.find((c) => c.cp === 0x100)!
  const rec = mapChar(macron)
  assert.ok(rec)
  assert.equal(rec.dm, '0041 0304')
  assert.equal(rec.lo, '0101')
})

test('groupCharsByBlock: emits one BlockFile per non-empty block', () => {
  const { chars, blocks } = parseUcdXml(SAMPLE_XML)
  const records = chars.map(mapChar).filter((c): c is NonNullable<typeof c> => c !== null)
  const files = groupCharsByBlock(records, blocks)
  const names = files.map((f) => f.name)
  assert.ok(names.includes('Basic Latin'))
  assert.ok(names.includes('Latin-1 Supplement'))
  assert.ok(names.includes('Latin Extended-A'))
  assert.ok(names.includes('Combining Diacritical Marks'))
  assert.ok(!names.includes('Private Use Area'), 'PUA must be skipped')
})

test('groupCharsByBlock: format block range string', () => {
  const { chars, blocks } = parseUcdXml(SAMPLE_XML)
  const records = chars.map(mapChar).filter((c): c is NonNullable<typeof c> => c !== null)
  const files = groupCharsByBlock(records, blocks)
  const basic = files.find((f) => f.name === 'Basic Latin')!
  assert.equal(basic.range, 'U+0000-U+007F')
  assert.equal(basic.start, 0)
  assert.equal(basic.end, 127)
})

test('groupCharsByBlock: char count matches mapChar output for block', () => {
  const { chars, blocks } = parseUcdXml(SAMPLE_XML)
  const records = chars.map(mapChar).filter((c): c is NonNullable<typeof c> => c !== null)
  const files = groupCharsByBlock(records, blocks)
  const basic = files.find((f) => f.name === 'Basic Latin')!
  // NUL (Cc) + SPACE + ( + A + a = 5 (no other Cc in sample for 0..127)
  assert.equal(basic.chars.length, 5)
})

test('buildIndexes: counts chars per property value', () => {
  const { chars, blocks } = parseUcdXml(SAMPLE_XML)
  const idx = buildIndexes(chars, blocks)
  assert.equal(idx.byCategory.Lu, 2, 'A (0041) and Ā (0100)')
  assert.equal(idx.byCategory.Ll, 1, 'a (0061)')
  assert.equal(idx.byCategory.Mn, 1, 'COMBINING GRAVE')
  assert.equal(idx.byCategory.Ps, 1, 'LEFT PARENTHESIS')
  assert.equal(idx.byCategory.Cc, 1, 'NUL')
})

test('buildIndexes: per-property detail lists chars with block name in b', () => {
  const { chars, blocks } = parseUcdXml(SAMPLE_XML)
  const idx = buildIndexes(chars, blocks)
  const lu = idx.perCategory.get('Lu')!
  assert.equal(lu.property, 'Lu')
  assert.equal(lu.count, 2)
  assert.equal(lu.characters[0].cp, 0x41)
  assert.equal(lu.characters[0].b, 'Basic Latin')
  assert.equal(lu.characters[1].cp, 0x100)
  assert.equal(lu.characters[1].b, 'Latin Extended-A')
})

test('buildIndexes: byScript aggregates per-script counts', () => {
  const { chars, blocks } = parseUcdXml(SAMPLE_XML)
  const idx = buildIndexes(chars, blocks)
  assert.equal(idx.byScript.Latn, 3)
  assert.equal(idx.byScript.Zinh, 1)
  assert.equal(idx.byScript.Zyyy, 4, 'NUL, SPACE, (, NBSP')
})

test('buildIndexes: byCombining records ccc values as decimal strings', () => {
  const { chars, blocks } = parseUcdXml(SAMPLE_XML)
  const idx = buildIndexes(chars, blocks)
  assert.ok(idx.byCombining['0'] > 0, 'most chars have ccc=0')
  assert.equal(idx.byCombining['230'], 1, 'COMBINING GRAVE has ccc=230')
})

test('buildIndexes: PUA chars never appear in any index', () => {
  const { chars, blocks } = parseUcdXml(SAMPLE_XML)
  const idx = buildIndexes(chars, blocks)
  for (const d of idx.perCategory.values()) {
    for (const c of d.characters) {
      assert.notEqual(c.b, 'Private Use Area')
    }
  }
})

test('stableStringify: deterministic key order across insertion orders', () => {
  const a = { z: 1, a: 2, m: 3 }
  const b = { a: 2, m: 3, z: 1 }
  assert.equal(stableStringify(a), stableStringify(b))
  assert.equal(stableStringify(a), '{"a":2,"m":3,"z":1}')
})

test('stableStringify: handles nested objects and arrays', () => {
  const data = { outer: { z: 'last', a: 'first' }, list: [{ b: 2, a: 1 }] }
  const s = stableStringify(data)
  assert.equal(s, '{"list":[{"a":1,"b":2}],"outer":{"a":"first","z":"last"}}')
})
