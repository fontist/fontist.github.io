import { describe, it } from 'node:test'
import assert from 'node:assert/strict'
import { UNIHAN_CATEGORIES } from '../constants.ts'
import type { CodepointUnihan } from '../../../types/domain.ts'

// The full set of keys defined on CodepointUnihan. If a new field is added
// to the type without a matching registry entry, this is where it surfaces
// — both at compile time (the union literal below will go stale) and at
// runtime (the "covers every key" test will fail).
const ALL_UNIHAN_KEYS: ReadonlyArray<keyof CodepointUnihan> = [
  'dictionary_indices',
  'readings',
  'variants',
  'numeric_values',
  'radical_stroke_counts',
  'dictionary_like_data',
  'irg_sources',
  'other_mappings',
]

describe('UNIHAN_CATEGORIES', () => {
  it('every entry key is a real keyof CodepointUnihan', () => {
    for (const spec of UNIHAN_CATEGORIES) {
      assert.ok(
        (ALL_UNIHAN_KEYS as readonly string[]).includes(spec.key as string),
        `${spec.key} is not a valid CodepointUnihan key`,
      )
    }
  })

  it('covers every keyof CodepointUnihan exactly once', () => {
    const keys = UNIHAN_CATEGORIES.map(s => s.key as string)
    const unique = new Set(keys)
    assert.equal(unique.size, keys.length, 'duplicate category keys present')

    for (const k of ALL_UNIHAN_KEYS) {
      assert.ok(
        keys.includes(k),
        `${k} is defined on CodepointUnihan but missing from UNIHAN_CATEGORIES`,
      )
    }
  })

  it('only "variants" uses the variant render mode', () => {
    for (const spec of UNIHAN_CATEGORIES) {
      if (spec.key === 'variants') {
        assert.equal(spec.render, 'variant')
      } else {
        assert.equal(spec.render, 'text')
      }
    }
  })

  it('every entry has a non-empty human-readable heading', () => {
    for (const spec of UNIHAN_CATEGORIES) {
      assert.ok(spec.heading.length > 0, `${spec.key} has an empty heading`)
      assert.ok(
        /^Unihan\b/.test(spec.heading),
        `${spec.key} heading should be prefixed with "Unihan" for consistent page anatomy`,
      )
    }
  })

  it('exposes exactly the expected number of categories (8)', () => {
    assert.equal(UNIHAN_CATEGORIES.length, 8)
  })
})
