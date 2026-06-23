import { fetchText } from '../ssr-fetch'

export async function loadMarkdown(path: string): Promise<string | null> {
  try {
    return await fetchText(path)
  } catch {
    return null
  }
}
