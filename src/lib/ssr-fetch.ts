// SSR-aware fetch for assets in /public/.
//
// During SSG (node), fetch('/foo.json') fails because there's no server.
// Read the file directly from disk instead. On the client, use normal fetch.
//
// `import.meta.env` is statically replaced by vite at build time. In plain
// Node (tests, scripts) it is undefined — guard with optional chaining so
// this module is importable outside vite. Tests inject their own fetcher
// and never hit the fetchJson/fetchText paths.

const env = (import.meta as ImportMeta & { env?: { SSR?: boolean; BASE_URL?: string } }).env
const isSSR = env?.SSR === true

let cwd: string
function getCwd(): string {
  if (cwd) return cwd
  cwd = process.cwd()
  return cwd
}

export async function fetchJson<T>(path: string): Promise<T> {
  if (isSSR) {
    const { readFileSync } = await import('node:fs')
    const { resolve } = await import('node:path')
    const filePath = resolve(getCwd(), 'public', path.replace(/^\//, ''))
    const raw = readFileSync(filePath, 'utf8')
    return JSON.parse(raw) as T
  }
  const base = env?.BASE_URL ?? '/'
  const res = await fetch(`${base}${path.replace(/^\//, '')}`)
  if (!res.ok) throw new Error(`Failed to fetch ${path}: ${res.status}`)
  return (await res.json()) as T
}

export async function fetchText(path: string): Promise<string> {
  if (isSSR) {
    const { readFileSync } = await import('node:fs')
    const { resolve } = await import('node:path')
    const filePath = resolve(getCwd(), 'public', path.replace(/^\//, ''))
    return readFileSync(filePath, 'utf8')
  }
  const base = env?.BASE_URL ?? '/'
  const res = await fetch(`${base}${path.replace(/^\//, '')}`)
  if (!res.ok) throw new Error(`Failed to fetch ${path}: ${res.status}`)
  return await res.text()
}
