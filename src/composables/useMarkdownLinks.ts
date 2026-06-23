import { nextTick, onMounted, onUpdated, type Ref } from 'vue'
import { useRouter } from 'vue-router'

/**
 * Intercept clicks on <a> tags inside v-html rendered content
 * and route internal links through Vue Router (no full page reload).
 *
 * External links get target="_blank" + rel="noopener".
 */
export function useMarkdownLinks(containerRef: Ref<HTMLElement | null>) {
  const router = useRouter()

  function handleClick(e: MouseEvent) {
    const target = e.target as HTMLElement
    const anchor = target.closest('a')
    if (!anchor) return

    const href = anchor.getAttribute('href')
    if (!href) return

    // Skip hash-only links (anchors on same page)
    if (href.startsWith('#')) return

    // Resolve relative URLs against current location
    const resolved = (() => {
      try {
        return new URL(href, window.location.href)
      } catch {
        return null
      }
    })()
    if (!resolved) return

    // Only intercept same-origin links
    if (resolved.origin !== window.location.origin) {
      // External link — open in new tab
      anchor.setAttribute('target', '_blank')
      anchor.setAttribute('rel', 'noopener noreferrer')
      return
    }

    // Internal link — use Vue Router
    e.preventDefault()

    // Vue Router with base path (e.g. '/formulas/') will re-add the base
    // to any path we push. Strip it first to avoid double-prefixing.
    const base = import.meta.env.BASE_URL || '/'
    const baseWithoutSlash = base.endsWith('/') ? base.slice(0, -1) : base
    let path = resolved.pathname
    if (baseWithoutSlash && path.startsWith(baseWithoutSlash)) {
      path = path.slice(baseWithoutSlash.length)
    }
    path += resolved.search + resolved.hash
    router.push(path)
  }

  function attach() {
    const el = containerRef.value
    if (el) el.addEventListener('click', handleClick)
  }

  function detach() {
    const el = containerRef.value
    if (el) el.removeEventListener('click', handleClick)
  }

  onMounted(() => nextTick(attach))
  onUpdated(() => nextTick(() => {
    detach()
    attach()
  }))
}
