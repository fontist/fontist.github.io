import { describe, it, beforeEach } from 'node:test'
import assert from 'node:assert/strict'
import { findFormulaDetails, clearDetailsCache } from '../details-loader.ts'
import type { FormulaDetails } from '../../../types/domain.ts'

function mkDetails(slug: string, name: string = slug): FormulaDetails {
  return {
    slug,
    name,
    redistributable: true,
    fonts: [],
  }
}

describe('findFormulaDetails', () => {
  beforeEach(() => clearDetailsCache())

  it('returns parsed details when fetcher succeeds', async () => {
    const stub = async () => mkDetails('google/aclonica', 'aclonica')
    const result = await findFormulaDetails('google/aclonica', stub)
    assert.equal(result?.name, 'aclonica')
    assert.equal(result?.slug, 'google/aclonica')
  })

  it('returns null when fetcher throws (missing file)', async () => {
    const failing = async () => {
      throw new Error('ENOENT')
    }
    const result = await findFormulaDetails('google/missing', failing)
    assert.equal(result, null)
  })

  it('caches results — second call does not re-fetch', async () => {
    let calls = 0
    const counter = async () => {
      calls++
      return mkDetails('cached', 'cached')
    }
    await findFormulaDetails('cached', counter)
    await findFormulaDetails('cached', counter)
    assert.equal(calls, 1)
  })

  it('caches null on miss — second call does not re-fetch', async () => {
    let calls = 0
    const counter = async () => {
      calls++
      throw new Error('still missing')
    }
    await findFormulaDetails('missing-once', counter)
    await findFormulaDetails('missing-once', counter)
    assert.equal(calls, 1)
  })
})
