import { loadBlockCharacters } from '../lib/unicode/data/loader'

export function useUnicodeBlock() {
  async function fetchBlock(blockName: string) {
    const chars = await loadBlockCharacters(blockName)
    if (!chars.length) return null
    return { chars }
  }

  return { fetchBlock }
}
