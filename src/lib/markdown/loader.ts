import { fetchText } from '../ssr-fetch'
import type { Frontmatter, ParsedMarkdown } from '../types/domain'
import { parseFrontmatter } from './frontmatter'

export type { Frontmatter, ParsedMarkdown }
export { parseFrontmatter }

function stripVitePressComponents(body: string): string {
  return body.replace(/<[A-Z][A-Za-z]+\s*\/>/g, '')
}

export async function loadMarkdown(path: string): Promise<string | null> {
  try {
    return await fetchText(path)
  } catch {
    return null
  }
}

export async function loadParsedMarkdown(path: string): Promise<ParsedMarkdown | null> {
  const raw = await loadMarkdown(path)
  if (raw == null) return null
  const parsed = parseFrontmatter(raw)
  return { ...parsed, body: stripVitePressComponents(parsed.body) }
}
