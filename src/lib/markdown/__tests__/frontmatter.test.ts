import { test } from 'node:test'
import assert from 'node:assert/strict'
import { parseFrontmatter } from '../frontmatter.ts'

test('parses well-formed frontmatter and body', () => {
  const text = `---
title: Hello World
description: A test doc
date: 2026-06-23
---

# Body

Content here.`
  const r = parseFrontmatter(text)
  assert.equal(r.frontmatter.title, 'Hello World')
  assert.equal(r.frontmatter.description, 'A test doc')
  assert.equal(r.frontmatter.date, '2026-06-23')
  assert.match(r.body, /# Body/)
  assert.equal(r.raw, text)
})

test('returns empty frontmatter when text has no leading ---', () => {
  const text = 'just body, no frontmatter'
  const r = parseFrontmatter(text)
  assert.deepEqual(r.frontmatter, {})
  assert.equal(r.body, text)
})

test('returns empty frontmatter when closing --- is missing', () => {
  const text = '---\ntitle: dangling\n\nbody'
  const r = parseFrontmatter(text)
  assert.deepEqual(r.frontmatter, {})
  assert.equal(r.body, text)
})

test('handles empty frontmatter block', () => {
  const text = '---\n---\nbody'
  const r = parseFrontmatter(text)
  assert.deepEqual(r.frontmatter, {})
  assert.equal(r.body, 'body')
})

test('handles empty body after frontmatter', () => {
  const text = '---\ntitle: only frontmatter\n---\n'
  const r = parseFrontmatter(text)
  assert.equal(r.frontmatter.title, 'only frontmatter')
  assert.equal(r.body, '')
})

test('strips surrounding double quotes from values', () => {
  const text = '---\ntitle: "Has spaces"\ndescription: "quoted: with colon"\n---\nbody'
  const r = parseFrontmatter(text)
  assert.equal(r.frontmatter.title, 'Has spaces')
  assert.equal(r.frontmatter.description, 'quoted: with colon')
})

test('does not strip single quotes', () => {
  const text = '---\ntitle: \'not stripped\'\n---\nbody'
  const r = parseFrontmatter(text)
  assert.equal(r.frontmatter.title, "'not stripped'")
})

test('parses authors list', () => {
  const text = `---
title: Post
authors:
  - Alice
  - Bob
---

body`
  const r = parseFrontmatter(text)
  assert.deepEqual(r.frontmatter.authors, ['Alice', 'Bob'])
})

test('strips quotes around author entries', () => {
  const text = `---
authors:
  - "Alice Smith"
  - "Bob Jones"
---

body`
  const r = parseFrontmatter(text)
  assert.deepEqual(r.frontmatter.authors, ['Alice Smith', 'Bob Jones'])
})

test('handles code fence containing --- in body', () => {
  const text = '---\ntitle: Test\n---\n\n```\n---\nnot a delimiter\n```\n'
  const r = parseFrontmatter(text)
  assert.equal(r.frontmatter.title, 'Test')
  assert.match(r.body, /---\nnot a delimiter/)
})

test('ignores unknown frontmatter keys', () => {
  const text = '---\ntitle: Hello\ncustom_field: value\nscore: 42\n---\nbody'
  const r = parseFrontmatter(text)
  assert.equal(r.frontmatter.title, 'Hello')
  assert.equal('custom_field' in r.frontmatter, false)
})

test('ignores malformed lines in frontmatter', () => {
  const text = '---\nmalformed line\ntitle: Valid\n---\nbody'
  const r = parseFrontmatter(text)
  assert.equal(r.frontmatter.title, 'Valid')
})
