import type { Frontmatter, ParsedMarkdown } from '../types/domain'

export function parseFrontmatter(text: string): ParsedMarkdown {
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

function parseYamlFrontmatter(fmText: string): Frontmatter {
  const fm: Frontmatter = {}
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
      (fm as Record<string, string>)[key] = val
    }
    i++
  }
  return fm
}

function parseAuthors(lines: string[], startIndex: number): string[] {
  const arr: string[] = []
  for (let j = startIndex + 1; j < lines.length && /^\s*-\s+/.test(lines[j]); j++) {
    const am = lines[j].match(/^\s*-\s+(.*)$/)
    if (am) arr.push(stripQuotes(am[1].trim()))
  }
  return arr
}

function stripQuotes(v: string): string {
  if (v.length >= 2 && v.startsWith('"') && v.endsWith('"')) return v.slice(1, -1)
  return v
}
