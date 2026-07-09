import { fetchText } from '../ssr-fetch.ts'
import type { Frontmatter, ParsedMarkdown } from '../types/domain'
import { parseFrontmatter } from './frontmatter.ts'
import { createKeyedJsonLoader, type JsonFetcher } from '../loader-factory.ts'

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

// Single cache for parsed markdown. Previously no cache — every page
// re-fetched + re-parsed on every call. Now goes through createKeyedJsonLoader
// with a text+parse fetcher, so repeated loads of the same path are free.
const parsedLoader = createKeyedJsonLoader<ParsedMarkdown>(
  (path) => path,
  (async (path: string) => {
    const raw = await fetchText(path)
    const parsed = parseFrontmatter(raw)
    return { ...parsed, body: stripVitePressComponents(parsed.body) }
  }) as JsonFetcher<ParsedMarkdown>,
)

export async function loadParsedMarkdown(path: string): Promise<ParsedMarkdown | null> {
  return parsedLoader.load(path)
}

export function clearMarkdownCache(): void {
  parsedLoader.clear()
}
