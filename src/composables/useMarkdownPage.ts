// useMarkdownPage — the single seam for "render a markdown page".
//
// Hides the four-step wiring that was duplicated across BlogPostPage,
// AboutPage, GuideTopicPage, LicenseDetailPage, and FormulaPage:
//   1. loadParsedMarkdown(path) → { body, frontmatter }
//   2. marked(body) → html
//   3. useMarkdownLinks(contentRef) — SPA-nav interception
//   4. ref + watch + await lifecycle
//
// Variations are options, not separate copies:
//   - `candidates()` — fallback paths when the primary doesn't exist
//   - `watchSource` — re-fetch when a route param changes
//   - `notFoundOnMiss` — return notFound=true instead of erroring
//
// Pages must `await ready` at the top of <script setup> for SSG to
// capture the rendered content. The composable handles the lifecycle;
// the page just consumes the returned refs.

import { ref, watch, type Ref } from 'vue'
import { marked } from 'marked'
import { loadParsedMarkdown, type Frontmatter } from '../lib/markdown/loader'
import { useMarkdownLinks } from './useMarkdownLinks'

export interface UseMarkdownPageOptions {
  /** Build a list of candidate paths to try in order. Default: just the primary path. */
  candidates?: (source: string) => string[]
  /** Ref or getter to watch; the page re-fetches when this changes. */
  watchSource?: Ref<string> | (() => string)
  /** If true (default), set notFound=true when no candidate resolves. */
  notFoundOnMiss?: boolean
}

export interface MarkdownPageResult {
  html: Ref<string>
  frontmatter: Ref<Frontmatter>
  loading: Ref<boolean>
  notFound: Ref<boolean>
  /** Attach to the v-html container so SPA nav interception works. */
  contentRef: Ref<HTMLElement | null>
  /** Imperative reload, in case the page needs to force a re-fetch. */
  reload: () => Promise<void>
  /** Resolves when the initial load completes. Await this in <script setup>. */
  ready: Promise<void>
}

const DEFAULT_CANDIDATES = (source: string) => [source]

export function useMarkdownPage(
  primaryPath: string | (() => string),
  options: UseMarkdownPageOptions = {},
): MarkdownPageResult {
  const html = ref('')
  const frontmatter = ref<Frontmatter>({})
  const loading = ref(true)
  const notFound = ref(false)
  const contentRef = ref<HTMLElement | null>(null)

  const notFoundOnMiss = options.notFoundOnMiss ?? true
  const buildCandidates = options.candidates ?? DEFAULT_CANDIDATES

  useMarkdownLinks(contentRef)

  let reload: () => Promise<void>
  let resolveReady: () => void
  const ready = new Promise<void>(r => { resolveReady = r })

  reload = async () => {
    loading.value = true
    notFound.value = false
    const source = typeof primaryPath === 'function' ? primaryPath() : primaryPath
    const paths = buildCandidates(source)
    let parsed: { body: string; frontmatter: Frontmatter } | null = null
    for (const p of paths) {
      parsed = await loadParsedMarkdown(p)
      if (parsed) break
    }
    if (parsed) {
      html.value = await marked(parsed.body)
      frontmatter.value = parsed.frontmatter
    } else {
      html.value = ''
      frontmatter.value = {}
      if (notFoundOnMiss) notFound.value = true
    }
    loading.value = false
    resolveReady()
  }

  if (options.watchSource) {
    const source = options.watchSource
    if (typeof source === 'function') {
      watch(source, () => { reload() })
    } else {
      watch(source, () => { reload() })
    }
  }

  // Kick off the initial load. Pages await `ready` for SSG.
  reload()

  return { html, frontmatter, loading, notFound, contentRef, reload, ready }
}
