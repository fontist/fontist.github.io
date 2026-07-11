import { nextTick, onMounted, onUpdated, type Ref } from 'vue'

/**
 * Intercept clicks on <a> tags inside v-html rendered content
 * and route internal links through plain navigation (full page load
 * in the static-site world — Astro pages are pre-rendered HTML, so
 * navigation is a simple location change).
 *
 * External links get target="_blank" + rel="noopener".
 */
export function useMarkdownLinks(containerRef: Ref<HTMLElement | null>) {
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

    // Internal link — let the browser navigate normally (full page load).
    // In the Astro static-site world, every page is pre-rendered HTML,
    // so a full navigation is fast and correct. No SPA routing needed.
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
