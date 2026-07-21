// Navigation helpers for the Vue islands. This is a plain-<a> codebase with no
// vue-router, so an in-app "navigation" is a full reload of the current URL
// with a changed query param.

// Set (or replace) one query param on the current URL and reload. Using
// `window.location.href` as the base preserves every other param — callers do
// not have to remember to re-plumb `view`, etc.
export function setQueryParamAndReload(name: string, value: string): void {
  const url = new URL(window.location.href)
  url.searchParams.set(name, value)
  window.location.assign(url.toString())
}
