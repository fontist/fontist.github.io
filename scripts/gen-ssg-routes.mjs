#!/usr/bin/env node
// Deprecated — split into purpose-specific generators in this directory:
//   - gen-blog-index.mjs    (content/blog/index.json)
//   - gen-guide-index.mjs   (content/guide/index.json)
//   - gen-routes.mjs        (ssg-routes.json)
//   - gen-sitemap.mjs       (sitemap.xml, runs AFTER vite-ssg build)
//
// This file remains as a back-compat entry point: it calls the three
// pre-build scripts in the same order the old monolith did. The post-build
// sitemap step has moved to package.json's `build` script (it needs to
// run after vite-ssg emits dist/).

import { execSync } from 'node:child_process'
import { resolve, dirname } from 'node:path'
import { fileURLToPath } from 'node:url'

const here = dirname(fileURLToPath(import.meta.url))
const run = (script) => execSync(`node ${resolve(here, script)}`, { stdio: 'inherit' })

run('gen-blog-index.mjs')
run('gen-guide-index.mjs')
run('gen-routes.mjs')
