import type { UnicodeBlock, UnicodeCharacter, PlaneKey, UnicodePlane } from '../types.ts'
import { PLANES, planeForCodepoint, blockDisplayName, scriptGroup, hexCp, safeChar, blockSlug } from '../constants.ts'
import { fetchJson } from '../../ssr-fetch'

interface RawBlockCharacter {
  cp: number
  n?: string
  c?: string
  s?: string
  cc?: number
  bc?: string
  mir?: boolean
  up?: string
  lo?: string
  ti?: string
  dm?: string
}

interface RawBlockFile {
  chars?: RawBlockCharacter[]
}

const blockCache = new Map<string, UnicodeBlock>()
let allBlocks: UnicodeBlock[] | null = null

interface RawBlockIndexEntry {
  start: number
  end: number
  name: string
  unicode_version?: string
}

export async function loadAllBlocks(): Promise<UnicodeBlock[]> {
  if (allBlocks) return allBlocks

  const raw = await fetchJson<RawBlockIndexEntry[]>('unicode-blocks.json')

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
  const slug = blockSlug(blockName)

  try {
    const data = await fetchJson<RawBlockFile>(`unicode/blocks/${slug}.json`)
    return (data.chars || []).map(c => ({
      cp: c.cp,
      hex: hexCp(c.cp),
      char: safeChar(c.cp),
      name: c.n || '',
      category: c.c || '',
      script: c.s || '',
      c: c.c,
      s: c.s,
      cc: c.cc,
      bc: c.bc,
      mir: c.mir,
      up: c.up,
      lo: c.lo,
      ti: c.ti,
      dm: c.dm,
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
