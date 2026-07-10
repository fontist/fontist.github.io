// Blog index ordering test: gen-ssg-routes.mjs must write
// public/content/blog/index.json with posts in newest-first order, so
// the homepage "Recent dispatches" list (which uses `.slice(0, 3)`) and
// any other consumer see the most recent posts first.

import { existsSync, readFileSync } from 'node:fs'
import { describe, it } from 'node:test'
import assert from 'node:assert/strict'

const INDEX = 'public/content/blog/index.json'
const SKIP = !existsSync(INDEX)

describe('blog index — sort order', () => {
  it('is sorted newest-first by date', { skip: SKIP }, () => {
    const posts = JSON.parse(readFileSync(INDEX, 'utf8'))
    assert.ok(posts.length > 0, 'blog index must contain at least one post')
    for (let i = 1; i < posts.length; i++) {
      const prev = posts[i - 1].date || ''
      const cur = posts[i].date || ''
      assert.ok(
        prev >= cur,
        `blog index not sorted newest-first: ${prev} (index ${i - 1}) should be >= ${cur} (index ${i})`,
      )
    }
  })

  it('first 3 entries are the three most recent posts', { skip: SKIP }, () => {
    const posts = JSON.parse(readFileSync(INDEX, 'utf8'))
    const top3 = posts.slice(0, 3)
    const dates = top3.map((p) => p.date).filter(Boolean)
    const sorted = [...dates].sort().reverse()
    assert.deepEqual(dates, sorted, 'first 3 posts should be the three newest')
  })
})
