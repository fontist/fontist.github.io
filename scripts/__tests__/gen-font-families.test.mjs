import { describe, it } from 'node:test'
import assert from 'node:assert/strict'
import { buildFamilyIndex } from '../gen-font-families.mjs'

function mkFontEntry(slug, name, formulas, styleCount = 1) {
  return {
    slug,
    canonical_name: name,
    formulas,
    style_count: styleCount,
  }
}

function mkMeta(slug, formulaPath, redistributable = true) {
  return {
    slug,
    formula_path: formulaPath,
    redistributable,
    woff_file: `fonts/${slug}.woff`,
  }
}

// Produces metadata matching the new per-face archive shape — both
// woff_file and coverage_file point at namespaced paths.
function mkPerFaceMeta(slug, formulaPath, psName, namespace = 'google') {
  return {
    slug,
    formula_path: formulaPath,
    redistributable: true,
    woff_file: `woff/${namespace}/${slug}/${psName}.woff`,
    coverage_file: `coverage/${namespace}/${slug}/${psName}.json`,
  }
}

function mkFormula(slug, licenseName = 'OFL') {
  return { slug, licenseName }
}

describe('buildFamilyIndex', () => {
  it('groups a single-formula single-file family correctly', () => {
    const index = buildFamilyIndex({
      fonts: { fonts: [mkFontEntry('abeezee', 'ABeeZee', ['google/abeezee'])] },
      metadata: { fonts: [mkMeta('abeezee', 'Formulas/google/abeezee.yml')] },
      formulas: [mkFormula('google/abeezee', 'SIL Open Font License 1.1')],
    })

    assert.equal(index.total_families, 1)
    const fam = index.families[0]
    assert.equal(fam.slug, 'abeezee')
    assert.equal(fam.name, 'ABeeZee')
    assert.deepEqual(fam.formula_slugs, ['google/abeezee'])
    assert.equal(fam.redistributable, true)
    assert.equal(fam.license_name, 'SIL Open Font License 1.1')
    assert.equal(fam.files.length, 1)
    assert.equal(fam.files[0].slug, 'abeezee')
    assert.equal(fam.files[0].formula_slug, 'google/abeezee')
    assert.equal(fam.files[0].style, 'Regular')
    assert.equal(fam.files[0].path, 'fonts/abeezee.woff')
    assert.equal(fam.files[0].redistributable, true)
  })

  it('merges multiple formulas shipping the same family into one FontFamily', () => {
    const index = buildFamilyIndex({
      fonts: {
        fonts: [
          mkFontEntry(
            'abyssinica_sil',
            'Abyssinica SIL',
            ['google/abyssinica_sil', 'sil/abyssinica_sil'],
            4,
          ),
        ],
      },
      metadata: {
        fonts: [
          mkMeta('abyssinica_sil', 'Formulas/google/abyssinica_sil.yml', true),
          mkMeta('abyssinica_sil', 'Formulas/sil/abyssinica_sil.yml', false),
        ],
      },
      formulas: [
        mkFormula('google/abyssinica_sil', 'SIL Open Font License 1.1 (with RFN)'),
        mkFormula('sil/abyssinica_sil', 'SIL Open Font License 1.1'),
      ],
    })

    assert.equal(index.total_families, 1)
    const fam = index.families[0]
    assert.deepEqual(fam.formula_slugs, ['google/abyssinica_sil', 'sil/abyssinica_sil'])
    assert.equal(fam.files.length, 2)
    assert.equal(fam.redistributable, true)
    assert.equal(fam.license_name, 'SIL Open Font License 1.1 (with RFN)')
  })

  it('records placeholder file for proprietary formulas absent from metadata', () => {
    const index = buildFamilyIndex({
      fonts: { fonts: [mkFontEntry('proprietary', 'Proprietary Font', ['macos/proprietary'])] },
      metadata: { fonts: [] },
      formulas: [mkFormula('macos/proprietary', 'Apple System Font')],
    })

    const fam = index.families[0]
    assert.equal(fam.redistributable, false)
    assert.equal(fam.files.length, 1)
    assert.equal(fam.files[0].redistributable, false)
    assert.equal(fam.files[0].formula_slug, 'macos/proprietary')
  })

  it('derives style name from family-style slug prefix (e.g. roboto_bold → Bold)', () => {
    const index = buildFamilyIndex({
      fonts: { fonts: [mkFontEntry('roboto', 'Roboto', ['google/roboto'], 12)] },
      metadata: {
        fonts: [
          mkMeta('roboto', 'Formulas/google/roboto.yml'),
          mkMeta('roboto_black', 'Formulas/google/roboto.yml'),
          mkMeta('roboto_bold_italic', 'Formulas/google/roboto.yml'),
        ],
      },
      formulas: [mkFormula('google/roboto', 'Apache-2.0')],
    })

    const fam = index.families[0]
    const styles = fam.files.map(f => f.style).sort()
    assert.deepEqual(styles, ['Black', 'Bold Italic', 'Regular'])
  })

  it('filters out families with no providing formulas', () => {
    const index = buildFamilyIndex({
      fonts: {
        fonts: [
          mkFontEntry('orphan', 'Orphan', []),
          mkFontEntry('hasformula', 'HasFormula', ['google/hasformula']),
        ],
      },
      metadata: { fonts: [] },
      formulas: [mkFormula('google/hasformula')],
    })

    assert.equal(index.total_families, 1)
    assert.equal(index.families[0].slug, 'hasformula')
  })

  it('matches file metadata only to formulas in the matching namespace', () => {
    const index = buildFamilyIndex({
      fonts: {
        fonts: [
          mkFontEntry('shared', 'Shared', ['google/shared', 'sil/shared']),
        ],
      },
      metadata: {
        fonts: [
          mkMeta('shared', 'Formulas/google/shared.yml', true),
          mkMeta('shared', 'Formulas/sil/shared.yml', false),
        ],
      },
      formulas: [mkFormula('google/shared'), mkFormula('sil/shared')],
    })

    const fam = index.families[0]
    const googleFile = fam.files.find(f => f.formula_slug === 'google/shared')
    const silFile = fam.files.find(f => f.formula_slug === 'sil/shared')
    assert.equal(googleFile.redistributable, true)
    assert.equal(silFile.redistributable, false)
  })

  it('records generated_at timestamp in ISO format', () => {
    const index = buildFamilyIndex({
      fonts: { fonts: [] },
      metadata: { fonts: [] },
      formulas: [],
    })
    assert.equal(typeof index.generated_at, 'string')
    assert.ok(!isNaN(Date.parse(index.generated_at)))
  })

  it('threads coverage_file through to FontFamilyFile when metadata provides it', () => {
    const index = buildFamilyIndex({
      fonts: { fonts: [mkFontEntry('abel', 'Abel', ['google/abel'])] },
      metadata: {
        fonts: [mkPerFaceMeta('abel', 'Formulas/google/abel.yml', 'Abel-Regular')],
      },
      formulas: [mkFormula('google/abel')],
    })

    const file = index.families[0].files[0]
    assert.equal(file.coverage_file, 'coverage/google/abel/Abel-Regular.json')
    assert.equal(file.path, 'woff/google/abel/Abel-Regular.woff')
  })

  it('emits null for path and coverage_file when metadata omits them', () => {
    const index = buildFamilyIndex({
      fonts: { fonts: [mkFontEntry('orphan', 'Orphan', ['google/orphan'])] },
      metadata: {
        fonts: [{ slug: 'orphan', formula_path: 'Formulas/google/orphan.yml', redistributable: false }],
      },
      formulas: [mkFormula('google/orphan')],
    })

    const file = index.families[0].files[0]
    assert.equal(file.path, null)
    assert.equal(file.coverage_file, null)
    assert.equal(file.redistributable, false)
  })

  it('attributes faces to the EXACT formula, not just the provider', () => {
    // Padauk is provided by two same-provider formulas (sil/padauk and
    // sil/padauk_6.000). A face from padauk_6.000 must appear ONLY under
    // padauk_6.000 — matching by provider namespace alone would duplicate it
    // under sil/padauk too.
    const index = buildFamilyIndex({
      fonts: { fonts: [mkFontEntry('padauk', 'Padauk', ['sil/padauk', 'sil/padauk_6.000'])] },
      metadata: {
        fonts: [
          { slug: 'padauk', formula_path: 'Formulas/sil/padauk.yml', redistributable: true, version: '3.0' },
          { slug: 'padauk', formula_path: 'Formulas/sil/padauk_6.000.yml', redistributable: true, version: '6.000' },
        ],
      },
      formulas: [mkFormula('sil/padauk'), mkFormula('sil/padauk_6.000')],
    })

    const files = index.families[0].files
    assert.equal(files.length, 2, 'one file per formula, not four')
    const byFormula = Object.fromEntries(files.map(f => [f.formula_slug, f]))
    assert.equal(byFormula['sil/padauk'].version, '3.0')
    assert.equal(byFormula['sil/padauk_6.000'].version, '6.000')
  })

  it('collapses duplicate aggregate face entries for one formula', () => {
    // The aggregate can carry the same face twice for a formula; the index
    // must not emit two identical files (they would collide as Vue keys).
    const dup = { slug: 'padauk', formula_path: 'Formulas/sil/padauk.yml', redistributable: true, version: '3.0' }
    const index = buildFamilyIndex({
      fonts: { fonts: [mkFontEntry('padauk', 'Padauk', ['sil/padauk'])] },
      metadata: { fonts: [dup, { ...dup }] },
      formulas: [mkFormula('sil/padauk')],
    })

    assert.equal(index.families[0].files.length, 1, 'identical duplicate collapsed')
  })
})
