import { test } from 'node:test'
import assert from 'node:assert/strict'
import { readFileSync, readdirSync, existsSync } from 'node:fs'
import { resolve, dirname } from 'node:path'
import { fileURLToPath } from 'node:url'

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..', '..')
const pub = resolve(root, 'public')

type VersionManifest = { version: string; charCount: number; blockCount: number; generatedAt: string }
type BlockEntry = { start: number; end: number; name: string; unicode_version: string }
type BlockFile = {
  name: string
  range: string
  start: number
  end: number
  chars: Array<{
    cp: number
    n: string
    c: string
    s: string
    bc: string
    cc?: string
    mir?: true
    dm?: string
    up?: string
    lo?: string
    ti?: string
  }>
}

function readJson<T>(path: string): T {
  return JSON.parse(readFileSync(path, 'utf8'))
}

function blockSlug(name: string): string {
  return name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '')
}

test('unicode-version.json: shape matches generator contract', () => {
  const m = readJson<VersionManifest>(resolve(pub, 'unicode-version.json'))
  assert.match(m.version, /^\d+\.\d+\.\d+$/, 'version is X.Y.Z')
  assert.equal(typeof m.charCount, 'number')
  assert.equal(typeof m.blockCount, 'number')
  assert.match(m.generatedAt, /^\d{4}-\d{2}-\d{2}T/, 'generatedAt is ISO 8601')
  assert.ok(m.charCount > 100_000, 'charCount is plausible for modern Unicode')
})

test('unicode-version.json: currently targets Unicode 17.0.0', () => {
  const m = readJson<VersionManifest>(resolve(pub, 'unicode-version.json'))
  assert.equal(m.version, '17.0.0')
  assert.equal(m.blockCount, 346)
  assert.equal(m.charCount, 159866)
})

test('unicode-blocks.json: every entry has start<end and a name', () => {
  const blocks = readJson<BlockEntry[]>(resolve(pub, 'unicode-blocks.json'))
  assert.equal(blocks.length, 346)
  for (const b of blocks) {
    assert.ok(b.start < b.end, `${b.name}: start ${b.start} < end ${b.end}`)
    assert.ok(b.name.length > 0)
    assert.ok(b.unicode_version, `${b.name} has unicode_version`)
  }
})

test('unicode-blocks.json: blocks are sorted ascending by start', () => {
  const blocks = readJson<BlockEntry[]>(resolve(pub, 'unicode-blocks.json'))
  for (let i = 1; i < blocks.length; i++) {
    assert.ok(blocks[i - 1].start < blocks[i].start, `block ${i} is ordered`)
  }
})

test('block files: every non-PUA, non-empty block has a slug file', () => {
  const blocks = readJson<BlockEntry[]>(resolve(pub, 'unicode-blocks.json'))
  const blocksDir = resolve(pub, 'unicode/blocks')
  const written = readdirSync(blocksDir).filter((f) => f.endsWith('.json'))
  for (const b of blocks) {
    if (/Private Use Area/.test(b.name)) continue
    const slug = blockSlug(b.name)
    const expected = `${slug}.json`
    if (!written.includes(expected)) {
      const path = resolve(blocksDir, expected)
      assert.ok(
        !existsSync(resolve(blocksDir, expected)),
        `${expected} should not exist (block must be entirely Cn/Cs/Co — e.g. surrogates)`,
      )
    }
  }
})

test('block files: PUA blocks have no committed file', () => {
  const blocks = readJson<BlockEntry[]>(resolve(pub, 'unicode-blocks.json'))
  const blocksDir = resolve(pub, 'unicode/blocks')
  for (const b of blocks) {
    if (!/Private Use Area/.test(b.name)) continue
    const slug = blockSlug(b.name)
    const path = resolve(blocksDir, `${slug}.json`)
    assert.ok(!existsSync(path), `PUA block ${slug}.json should be skipped`)
  }
})

test('basic-latin.json: 128 chars, A has expected fields', () => {
  const basic = readJson<BlockFile>(resolve(pub, 'unicode/blocks/basic-latin.json'))
  assert.equal(basic.name, 'Basic Latin')
  assert.equal(basic.start, 0)
  assert.equal(basic.end, 0x7F)
  assert.equal(basic.range, 'U+0000-U+007F')
  assert.equal(basic.chars.length, 128, 'all 128 BMP-Latin chars present (incl. Cc controls)')

  const a = basic.chars.find((c) => c.cp === 0x41)
  assert.ok(a)
  assert.deepEqual(a, {
    cp: 0x41,
    n: 'LATIN CAPITAL LETTER A',
    c: 'Lu',
    s: 'Latn',
    bc: 'L',
    lo: '0061',
  })
})

test('basic-latin.json: NUL is gc=Cc with <control> name and no dm/up/lo fields', () => {
  const basic = readJson<BlockFile>(resolve(pub, 'unicode/blocks/basic-latin.json'))
  const nul = basic.chars.find((c) => c.cp === 0)
  assert.ok(nul)
  assert.equal(nul.c, 'Cc')
  assert.equal(nul.n, '<control>')
  assert.equal('dm' in nul, false, '"#" dm sentinel must normalize away')
  assert.equal('up' in nul, false)
  assert.equal('lo' in nul, false)
})

test('char count consistency: sum of block file chars matches manifest', () => {
  const manifest = readJson<VersionManifest>(resolve(pub, 'unicode-version.json'))
  const blocksDir = resolve(pub, 'unicode/blocks')
  const files = readdirSync(blocksDir).filter((f) => f.endsWith('.json'))
  let total = 0
  for (const f of files) {
    const bf = readJson<BlockFile>(resolve(blocksDir, f))
    total += bf.chars.length
  }
  assert.equal(total, manifest.charCount, `sum of ${files.length} block files matches manifest`)
})

test('block file schema: every char has required fields and valid types', () => {
  const blocksDir = resolve(pub, 'unicode/blocks')
  const files = readdirSync(blocksDir).filter((f) => f.endsWith('.json'))
  const sample = ['basic-latin.json', 'greek-and-coptic.json', 'arabic.json', 'cjk-unified-ideographs.json', 'emoticons.json']
  for (const f of sample) {
    const path = resolve(blocksDir, f)
    if (!existsSync(path)) continue
    const bf = readJson<BlockFile>(path)
    for (const c of bf.chars) {
      assert.equal(typeof c.cp, 'number', `${f}: cp is number`)
      assert.equal(typeof c.n, 'string', `${f}: n is string`)
      assert.equal(typeof c.c, 'string', `${f}: c is string`)
      assert.equal(typeof c.s, 'string', `${f}: s is string`)
      assert.equal(typeof c.bc, 'string', `${f}: bc is string`)
      assert.ok(!['Cs', 'Co', 'Cn'].includes(c.c), `${f}: cp ${c.cp} excluded category ${c.c} leaked through`)
    }
  }
})

test('property indexes: aggregate counts sum to manifest charCount', () => {
  const manifest = readJson<VersionManifest>(resolve(pub, 'unicode-version.json'))
  const byCat = readJson<Record<string, number>>(resolve(pub, 'unicode/indexes/by-category.json'))
  const sum = Object.values(byCat).reduce((a, b) => a + b, 0)
  assert.equal(sum, manifest.charCount, 'by-category.json sum matches')
})

test('property indexes: detail directories match aggregate key sets', () => {
  const indexesDir = resolve(pub, 'unicode/indexes')
  const pairs: Array<[string, string]> = [
    ['scripts', 'by-script.json'],
    ['category', 'by-category.json'],
    ['bidiclass', 'by-bidi.json'],
    ['combining', 'by-combining.json'],
  ]
  for (const [sub, aggFile] of pairs) {
    const dir = resolve(indexesDir, sub)
    assert.ok(existsSync(dir), `${sub}/ detail dir exists`)
    const agg = readJson<Record<string, number>>(resolve(indexesDir, aggFile))
    const detailFiles = new Set(
      readdirSync(dir).filter((f) => f.endsWith('.json')).sort(),
    )
    assert.equal(
      detailFiles.size,
      Object.keys(agg).length,
      `${sub}/ detail file count matches ${aggFile} key count`,
    )
  }
})

test('property indexes: every script-code file exists and matches runtime fetch path', () => {
  const byScript = readJson<Record<string, number>>(resolve(pub, 'unicode/indexes/by-script.json'))
  const scriptsDir = resolve(pub, 'unicode/indexes/scripts')
  const coreScripts = ['Latn', 'Grek', 'Cyrl', 'Hani', 'Hang', 'Arab', 'Hebr', 'Hira', 'Kana']
  for (const code of coreScripts) {
    assert.ok(byScript[code], `${code} is in by-script.json`)
    const path = resolve(scriptsDir, `${code}.json`)
    assert.ok(existsSync(path), `${code}.json exists (matches PropertyDetailPage fetch path)`)
  }
})
