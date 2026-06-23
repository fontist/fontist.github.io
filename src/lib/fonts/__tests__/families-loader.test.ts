import { describe, it } from 'node:test'
import assert from 'node:assert/strict'
import { buildFamilyLookup } from '../family-lookup.ts'
import type { FontFamilyIndex } from '../../../types/domain.ts'

function mkFamily(slug: string, fileSlugs: string[] = []): FontFamilyIndex['families'][number] {
  return {
    slug,
    name: slug,
    formula_slugs: [`google/${slug}`],
    style_count: fileSlugs.length || 1,
    redistributable: true,
    license_name: 'OFL',
    files: fileSlugs.map(s => ({
      slug: s,
      formula_slug: `google/${slug}`,
      style: 'Regular',
      path: `fonts/${s}.woff2`,
      redistributable: true,
    })),
  }
}

describe('buildFamilyLookup', () => {
  it('resolves family by slug', () => {
    const index: FontFamilyIndex = {
      generated_at: '',
      total_families: 2,
      families: [mkFamily('abeezee', ['abeezee']), mkFamily('abel', ['abel'])],
    }
    const lookup = buildFamilyLookup(index)

    assert.equal(lookup.bySlug('abeezee')?.name, 'abeezee')
    assert.equal(lookup.bySlug('abel')?.name, 'abel')
  })

  it('returns null for unknown family slug', () => {
    const lookup = buildFamilyLookup({ generated_at: '', total_families: 0, families: [] })
    assert.equal(lookup.bySlug('nope'), null)
  })

  it('resolves family by file slug (reverse lookup)', () => {
    const index: FontFamilyIndex = {
      generated_at: '',
      total_families: 1,
      families: [mkFamily('roboto', ['roboto', 'roboto_bold', 'roboto_italic'])],
    }
    const lookup = buildFamilyLookup(index)

    assert.equal(lookup.byFile('roboto_bold')?.slug, 'roboto')
    assert.equal(lookup.byFile('roboto_italic')?.slug, 'roboto')
  })

  it('uses the first family when multiple families share a file slug', () => {
    const fam1 = mkFamily('first', ['shared'])
    const fam2 = mkFamily('second', ['shared'])
    const index: FontFamilyIndex = {
      generated_at: '',
      total_families: 2,
      families: [fam1, fam2],
    }
    const lookup = buildFamilyLookup(index)

    assert.equal(lookup.byFile('shared')?.slug, 'first')
  })

  it('returns null for unknown file slug', () => {
    const lookup = buildFamilyLookup({ generated_at: '', total_families: 0, families: [] })
    assert.equal(lookup.byFile('nope'), null)
  })

  it('handles a family with zero files', () => {
    const index: FontFamilyIndex = {
      generated_at: '',
      total_families: 1,
      families: [mkFamily('nofiles', [])],
    }
    const lookup = buildFamilyLookup(index)

    assert.equal(lookup.bySlug('nofiles')?.slug, 'nofiles')
    assert.equal(lookup.byFile('nofiles'), null)
  })
})
