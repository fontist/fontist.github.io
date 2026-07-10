// Frontmatter parser — source of truth, used by both runtime (.ts via re-export)
// and build scripts (.mjs via direct import).
//
// Strips a leading YAML-ish frontmatter block (---\n...\n---\n) and parses
// the most common shapes we use: title/description/date strings and an
// `authors:` list. Not a general YAML parser — we control the input shape.

export function parseFrontmatter(text) {
  if (!text.startsWith('---\n')) {
    return { raw: text, frontmatter: {}, body: text }
  }
  const end = text.indexOf('\n---\n', 3)
  if (end === -1) {
    return { raw: text, frontmatter: {}, body: text }
  }
  const fmText = text.slice(4, end)
  const body = text.slice(end + 5)
  return { raw: text, frontmatter: parseYamlFrontmatter(fmText), body }
}

function parseYamlFrontmatter(fmText) {
  const fm = {}
  const lines = fmText.split('\n')
  let i = 0
  while (i < lines.length) {
    const line = lines[i]
    const m = line.match(/^([a-zA-Z_]+):\s*(.*)$/)
    if (!m) { i++; continue }
    const key = m[1]
    const val = stripQuotes(m[2].trim())
    if (key === 'authors') {
      fm.authors = parseAuthors(lines, i)
    } else if (key === 'title' || key === 'description' || key === 'date') {
      fm[key] = val
    }
    i++
  }
  return fm
}

function parseAuthors(lines, startIndex) {
  const arr = []
  for (let j = startIndex + 1; j < lines.length && /^\s*-\s+/.test(lines[j]); j++) {
    const am = lines[j].match(/^\s*-\s+(.*)$/)
    if (am) arr.push(stripQuotes(am[1].trim()))
  }
  return arr
}

function stripQuotes(v) {
  if (v.length >= 2 && v.startsWith('"') && v.endsWith('"')) return v.slice(1, -1)
  return v
}

/**
 * Convenience: return a get(key) function over a frontmatter block.
 * Used by build scripts that only need scalar values (not the authors list).
 * Returns '' for missing keys.
 */
export function frontmatterGetter(text) {
  const fm = text.startsWith('---\n')
    ? text.slice(4, text.indexOf('\n---\n', 4))
    : ''
  return (key) => {
    const m = fm.match(new RegExp(`^${key}:\\s*(.+)$`, 'm'))
    if (!m) return ''
    let v = m[1].trim()
    if (v.startsWith('"') && v.endsWith('"')) v = v.slice(1, -1)
    return v
  }
}

/** Best-effort title fallback: first H1 in the body, or the given fallback. */
export function titleFromHeading(text, fallback) {
  const m = text.match(/^#\s+(.+)$/m)
  return m ? m[1].trim() : fallback
}
