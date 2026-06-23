// SSR-aware fetch for assets in /public/.
//
// During SSG (node), fetch('/foo.json') fails because there's no server.
// Read the file directly from disk instead. On the client, use normal fetch.

const isSSR = import.meta.env.SSR

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
  const base = import.meta.env.BASE_URL || '/'
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
  const base = import.meta.env.BASE_URL || '/'
  const res = await fetch(`${base}${path.replace(/^\//, '')}`)
  if (!res.ok) throw new Error(`Failed to fetch ${path}: ${res.status}`)
  return await res.text()
}
