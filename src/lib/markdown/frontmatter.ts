// TypeScript-wrapper around frontmatter.mjs (source of truth). The runtime
// imports from this .ts file; build scripts import directly from the .mjs.
// Both paths use the same parser implementation — no duplication.

export {
  parseFrontmatter,
  frontmatterGetter,
  titleFromHeading,
} from './frontmatter.mjs'
export type { ParsedFrontmatter } from './frontmatter.mjs'

import type { Frontmatter, ParsedMarkdown } from '../types/domain'

// Re-shape the parsed frontmatter into the legacy Frontmatter type so
// existing callers don't have to update their type signatures.
export function parseFrontmatterTyped(text: string): ParsedMarkdown {
  const raw = parseFrontmatter(text)
  return { raw: raw.raw, frontmatter: raw.frontmatter as unknown as Frontmatter, body: raw.body }
}
