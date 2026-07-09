// Post-build smoke test: scans dist/ for regression markers that indicate
// a page shipped empty due to data loading moving into onMounted, a path
// mismatch in fetchCoverage, or a missing prop thread.
//
// SKIPS automatically when dist/ doesn't exist (e.g. fresh clone, or
// `npm test` run before `npm run build`). In CI, run after the build
// step to catch SSG regressions that pure-function tests miss.
//
// See TODO.archives/19 (the bugs this would have caught) and
// TODO.archives/20 (rationale).

import { existsSync, readFileSync, readdirSync, statSync } from 'node:fs'
import { join } from 'node:path'
import { describe, it } from 'node:test'
import assert from 'node:assert/strict'

const DIST = 'dist'
const ROUTER_TS = 'src/router.ts'
const SKIP = !existsSync(DIST) || !statSync(DIST).isDirectory()

// Each marker is a string that should NEVER appear in a successfully
// rendered page. Add new markers here as new failure modes are found.
const REGRESSION_MARKERS = [
  // FontSpecimen didn't render its section (fontReady gate bug, plan 19.2)
  '<main class="fsp-body"><!--',
  // FontUnicodeBrowser stuck on initial state (plan 19.2)
  'Loading Unicode coverage',
  // FamiliesPage data never loaded (plan 19.3)
  '>0 families</span>',
  // FormulaBrowser data never loaded (plan 19.3)
  '>0 formulas</span>',
  // License facet never populated (FamiliesPage regression)
  'All Licenses (0)',
]

function* walkHtml(dir) {
  for (const entry of readdirSync(dir, { withFileTypes: true })) {
    const path = join(dir, entry.name)
    if (entry.isDirectory()) {
      yield* walkHtml(path)
    } else if (entry.name.endsWith('.html')) {
      yield path
    }
  }
}

describe('SSG smoke (requires dist/ from `npm run build`)', { skip: SKIP && 'dist/ not built — run npm run build first' }, () => {
  it('no built HTML page contains any regression marker', () => {
    const violations = []
    let scanned = 0
    for (const path of walkHtml(DIST)) {
      scanned++
      const html = readFileSync(path, 'utf8')
      for (const marker of REGRESSION_MARKERS) {
        if (html.includes(marker)) {
          violations.push({ path, marker })
        }
      }
    }
    assert.ok(scanned > 0, 'no .html files under dist/ — build must have failed silently')
    if (violations.length > 0) {
      const sample = violations.slice(0, 5).map(v => `  ${v.path}: contains ${JSON.stringify(v.marker)}`).join('\n')
      assert.fail(`SSG regression markers found in ${violations.length} page(s).\n${sample}`)
    }
  })

  it('every static route in src/router.ts has a built dist/<route>/index.html', { skip: !existsSync(ROUTER_TS) }, () => {
    // Would have caught plan 21.1 — /licenses and /guide were declared in
    // router.ts but missing from gen-ssg-routes.mjs's STATIC_ROUTES.
    const routerSrc = readFileSync(ROUTER_TS, 'utf8')
    const staticPaths = [...routerSrc.matchAll(/path:\s*'([^':*]+)'/g)].map(m => m[1])
    const missing = []
    for (const p of staticPaths) {
      const built = p === '/' ? 'dist/index.html' : `dist${p}/index.html`
      if (!existsSync(built)) missing.push({ route: p, expected: built })
    }
    if (missing.length > 0) {
      const sample = missing.slice(0, 10).map(m => `  ${m.route} (expected ${m.expected})`).join('\n')
      assert.fail(`SSG missing index.html for ${missing.length} static route(s).\n${sample}`)
    }
  })
})
