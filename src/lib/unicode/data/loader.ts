import type { UnicodeBlock, UnicodeCharacter, PlaneKey, UnicodePlane } from '../types.ts'
import type { CodepointDetail } from '../../types/domain.ts'
import { PLANES, planeForCodepoint, blockDisplayName, scriptGroup, hexCp, safeChar, blockSlug, canonicalCodepointHex } from '../constants.ts'
import { fetchJson } from '../../ssr-fetch.ts'
import { createLazyJsonLoader, createKeyedJsonLoader, type JsonFetcher } from '../../loader-factory.ts'

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

// Map a raw block-feed character (UCD wire shape) to the semantic
// UnicodeCharacter shape exposed to consumers. Defaults follow the UCD
// conventions: combining class 0, no bidi override, not mirrored, no
// case mapping, no decomposition.
export function mapRawCharacter(raw: RawBlockCharacter): UnicodeCharacter {
  return {
    cp: raw.cp,
    hex: hexCp(raw.cp),
    char: safeChar(raw.cp),
    name: raw.n || '',
    category: raw.c || '',
    script: raw.s || '',
    combiningClass: raw.cc ?? 0,
    bidiClass: raw.bc ?? null,
    mirrored: raw.mir ?? false,
    simpleUppercase: raw.up ?? null,
    simpleLowercase: raw.lo ?? null,
    simpleTitlecase: raw.ti ?? null,
    decomposition: raw.dm ?? null,
  }
}

interface RawBlockIndexEntry {
  start: number
  end: number
  name: string
  unicode_version?: string
}

const allBlocksLoader = createLazyJsonLoader<UnicodeBlock[]>(
  'unicode-blocks.json',
  async (path) => {
    const raw = await fetchJson<RawBlockIndexEntry[]>(path)
    return raw.map(b => ({
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
  },
)

export function loadAllBlocks(): Promise<UnicodeBlock[]> {
  return allBlocksLoader.load()
}

export function clearAllBlocksCache(): void {
  allBlocksLoader.clear()
}

const blockCache = new Map<string, UnicodeBlock>()

// Keyed cache for raw per-block JSON files (unicode/blocks/{slug}.json).
// Previously fetchJson was called on every loadBlockCharacters invocation.
const rawBlockLoader = createKeyedJsonLoader<RawBlockFile>(
  (blockName: string) => `unicode/blocks/${blockSlug(blockName)}.json`,
)

export async function loadBlockCharacters(blockName: string): Promise<UnicodeCharacter[]> {
  const data = await rawBlockLoader.load(blockName)
  return (data?.chars || []).map(mapRawCharacter)
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

// ---------- Per-codepoint detail loader ----------
// Returns the typed CodepointDetail JSON for a codepoint reference in any
// reasonable form (number, bare hex, U+XXXX). The canonical hex helper
// (`canonicalCodepointHex` in constants.ts) is the single source of truth
// for "what file does this codepoint live in".

const codepointDetailLoader = createKeyedJsonLoader<CodepointDetail>(
  (key) => `codepoints/${canonicalCodepointHex(key)}.json`,
)

export type CodepointDetailFetcher = JsonFetcher<CodepointDetail>

export function loadCodepointDetail(
  hex: number | string,
  fetcher?: CodepointDetailFetcher,
): Promise<CodepointDetail | null> {
  return codepointDetailLoader.load(canonicalCodepointHex(hex), fetcher)
}

export function clearCodepointDetailCache(): void {
  codepointDetailLoader.clear()
}
