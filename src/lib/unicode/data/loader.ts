import type { UnicodeBlock, UnicodeCharacter, PlaneKey, UnicodePlane } from '../types'
import { PLANES, planeForCodepoint, blockDisplayName, scriptGroup, hexCp, safeChar } from '../constants'
import { fetchJson } from '../../ssr-fetch'

const blockCache = new Map<string, UnicodeBlock>()
let allBlocks: UnicodeBlock[] | null = null

export async function loadAllBlocks(): Promise<UnicodeBlock[]> {
  if (allBlocks) return allBlocks

  const raw = await fetchJson<{ start: number; end: number; name: string; unicode_version?: string }[]>('unicode-blocks.json')

  allBlocks = raw.map(b => ({
    name: b.name,
    start: b.start,
    end: b.end,
    range: hexCp(b.start) + '–' + hexCp(b.end),
    plane: planeForCodepoint(b.start),
    displayName: blockDisplayName(b.name),
    scriptGroup: scriptGroup(b.name),
    unicodeVersion: b.unicode_version || '1.1',
    characters: [],
    assignedCount: 0,
  }))

  return allBlocks
}

export async function loadBlockCharacters(blockName: string): Promise<UnicodeCharacter[]> {
  const slug = blockName.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '')

  try {
    const data = await fetchJson<{ chars?: any[] }>(`unicode/blocks/${slug}.json`)
    return (data.chars || []).map((c: any) => ({
      ...c,
      cp: c.cp,
      hex: hexCp(c.cp),
      char: safeChar(c.cp),
      name: c.n || '',
      category: c.c || '',
      script: c.s || '',
    }))
  } catch {
    return []
  }
}

export async function loadBlock(blockName: string): Promise<UnicodeBlock | null> {
  if (blockCache.has(blockName)) return blockCache.get(blockName)!

  const blocks = await loadAllBlocks()
  const block = blocks.find(b => b.name === blockName || b.displayName === blockName)
  if (!block) return null

  const chars = await loadBlockCharacters(block.name)
  const enriched = { ...block, characters: chars, assignedCount: chars.length }
  blockCache.set(blockName, enriched)
  return enriched
}

export function getPlanes(blocks: UnicodeBlock[]): UnicodePlane[] {
  return PLANES.map(p => ({
    ...p,
    blocks: blocks.filter(b => b.plane === p.key),
  }))
}

export function getBlocksByPlane(blocks: UnicodeBlock[], key: PlaneKey): UnicodeBlock[] {
  return blocks.filter(b => b.plane === key)
}

export function getBlocksByScriptGroup(blocks: UnicodeBlock[]): { group: string; blocks: UnicodeBlock[] }[] {
  const groups: Record<string, UnicodeBlock[]> = {}
  for (const b of blocks) {
    const g = b.scriptGroup
    if (!groups[g]) groups[g] = []
    groups[g].push(b)
  }
  return Object.entries(groups).map(([group, blks]) => ({ group, blocks: blks }))
}
