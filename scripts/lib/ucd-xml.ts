// Pure-logic UCD XML parser. No I/O. Imported by scripts/gen-unicode-data.mjs
// and tested directly. See TODO.unify/12-ucd-xml-pipeline.md for the spec.

export interface UcdBlock {
  start: number
  end: number
  name: string
}

export interface UcdChar {
  cp: number
  na: string
  na1?: string
  gc: string
  sc: string
  bc: string
  ccc: string
  bidiMirrored: boolean
  dm?: string
  suc?: string
  slc?: string
  stc?: string
}

export interface CharRecord {
  cp: number
  n: string
  c: string
  s: string
  bc: string
  cc?: string
  mir?: true
  dm?: string
  up?: string
  lo?: string
  ti?: string
}

export interface BlockFile {
  name: string
  range: string
  start: number
  end: number
  chars: CharRecord[]
}

export interface IndexCharEntry {
  cp: number
  n: string
  b: string
}

export interface PropertyDetail {
  property: string
  count: number
  characters: IndexCharEntry[]
}

export interface UcdIndexes {
  byScript: Record<string, number>
  byCategory: Record<string, number>
  byBidi: Record<string, number>
  byCombining: Record<string, number>
  perScript: Map<string, PropertyDetail>
  perCategory: Map<string, PropertyDetail>
  perBidi: Map<string, PropertyDetail>
  perCombining: Map<string, PropertyDetail>
}

// Tags we never emit. Surrogates (gc=Cs) are not valid scalar values;
// Private-Use (gc=Co) chars come from PUA blocks we skip wholesale; Cn
// (unassigned) has no name and no useful data.
const EXCLUDED_CATEGORIES = new Set(['Cs', 'Co', 'Cn'])

// PUA blocks have no standardized assignments; skip them entirely.
function isPuaBlock(name: string): boolean {
  return /Private Use Area/.test(name)
}

const ATTR_RE = /([\w-]+)="([^"]*)"/g

function parseAttrs(line: string): Record<string, string> {
  const attrs: Record<string, string> = {}
  ATTR_RE.lastIndex = 0
  let m: RegExpExecArray | null
  while ((m = ATTR_RE.exec(line)) !== null) {
    attrs[m[1]] = decodeEntities(m[2])
  }
  return attrs
}

function decodeEntities(s: string): string {
  return s
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&apos;/g, "'")
    .replace(/&amp;/g, '&')
}

function hexToInt(hex: string): number {
  return parseInt(hex, 16)
}

// UCD XML uses `#` as a sentinel meaning "not applicable" / "self-mapping"
// for `dm`, `suc`, `slc`, `stc`. Normalize to undefined.
function cleanRef(value: string | undefined): string | undefined {
  if (!value || value === '#') return undefined
  return value
}

// Control characters (gc=Cc) carry an empty `na` in UCD XML; the conventional
// name is `<control>`. Other chars use `na` (or `na1` for v1.0-only names).
function resolveName(c: UcdChar): string {
  if (c.gc === 'Cc') return '<control>'
  return c.na || c.na1 || ''
}

export function parseUcdXml(text: string): { blocks: UcdBlock[]; chars: UcdChar[] } {
  const blocks: UcdBlock[] = []
  const chars: UcdChar[] = []
  let inBlocks = false
  let inDescription = false

  const lines = text.split('\n')
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i]

    const opensDesc = line.includes('<description')
    const closesDesc = line.includes('</description>')
    if (opensDesc && closesDesc) continue
    if (opensDesc) { inDescription = true; continue }
    if (closesDesc) { inDescription = false; continue }
    if (inDescription) continue

    const opensBlocks = line.includes('<blocks')
    const closesBlocks = line.includes('</blocks>')
    if (opensBlocks && closesBlocks) { inBlocks = false; continue }
    if (opensBlocks) { inBlocks = true; continue }
    if (closesBlocks) { inBlocks = false; continue }

    if (inBlocks && line.includes('<block')) {
      const a = parseAttrs(line)
      const first = a['first-cp'] ?? a.first
      const last = a['last-cp'] ?? a.last
      if (first && last && a.name) {
        blocks.push({
          start: hexToInt(first),
          end: hexToInt(last),
          name: a.name,
        })
      }
      continue
    }

    if (line.includes('<char')) {
      const a = parseAttrs(line)
      let first: number
      let last: number
      if (a.cp !== undefined) {
        first = hexToInt(a.cp)
        last = first
      } else if (a['first-cp'] !== undefined && a['last-cp'] !== undefined) {
        first = hexToInt(a['first-cp'])
        last = hexToInt(a['last-cp'])
      } else if (a.first !== undefined && a.last !== undefined) {
        first = hexToInt(a.first)
        last = hexToInt(a.last)
      } else {
        continue
      }

      const bidiMirrored = a.Bidi_M === 'Y' || a.mir === 'Y'

      for (let cp = first; cp <= last; cp++) {
        chars.push({
          cp,
          na: a.na ?? '',
          na1: a.na1 || undefined,
          gc: a.gc ?? '',
          sc: a.sc ?? '',
          bc: a.bc ?? '',
          ccc: a.ccc ?? '0',
          bidiMirrored,
          dm: cleanRef(a.dm),
          suc: cleanRef(a.suc),
          slc: cleanRef(a.slc),
          stc: cleanRef(a.stc),
        })
      }
    }
  }

  blocks.sort((a, b) => a.start - b.start)
  chars.sort((a, b) => a.cp - b.cp)
  return { blocks, chars }
}

// Apply field omission rules. See spec §"Field mapping".
export function mapChar(c: UcdChar): CharRecord | null {
  if (EXCLUDED_CATEGORIES.has(c.gc)) return null

  const cpHex = c.cp.toString(16).toUpperCase().padStart(4, '0')

  const rec: CharRecord = {
    cp: c.cp,
    n: resolveName(c),
    c: c.gc,
    s: c.sc,
    bc: c.bc,
  }

  if (c.ccc && c.ccc !== '0') rec.cc = c.ccc
  if (c.bidiMirrored) rec.mir = true
  if (c.dm) rec.dm = c.dm

  if (c.suc && c.suc !== cpHex) rec.up = c.suc
  if (c.slc && c.slc !== cpHex) rec.lo = c.slc
  if (c.stc && c.stc !== cpHex) rec.ti = c.stc

  return rec
}

// Build per-block files. Chars with no containing block (shouldn't happen in
// valid UCD; defensive) are skipped. PUA blocks are dropped.
export function groupCharsByBlock(
  chars: CharRecord[],
  blocks: UcdBlock[],
): BlockFile[] {
  const sortedBlocks = [...blocks].sort((a, b) => a.start - b.start)
  const out: BlockFile[] = []

  for (const block of sortedBlocks) {
    if (isPuaBlock(block.name)) continue
    const inBlock = chars.filter((c) => c.cp >= block.start && c.cp <= block.end)
    if (inBlock.length === 0) continue
    out.push({
      name: block.name,
      range: `U+${block.start.toString(16).toUpperCase().padStart(4, '0')}-U+${block.end.toString(16).toUpperCase().padStart(4, '0')}`,
      start: block.start,
      end: block.end,
      chars: inBlock,
    })
  }

  return out
}

function ensureDetail(map: Map<string, PropertyDetail>, key: string): PropertyDetail {
  let d = map.get(key)
  if (!d) {
    d = { property: key, count: 0, characters: [] }
    map.set(key, d)
  }
  return d
}

function incrCount(map: Record<string, number>, key: string): void {
  map[key] = (map[key] ?? 0) + 1
}

export function buildIndexes(
  rawChars: UcdChar[],
  blocks: UcdBlock[],
): UcdIndexes {
  const sortedBlocks = [...blocks].sort((a, b) => a.start - b.start)
  const blockFor: Record<number, string> = {}
  for (const b of sortedBlocks) {
    if (isPuaBlock(b.name)) continue
    for (let cp = b.start; cp <= b.end; cp++) blockFor[cp] = b.name
  }

  const byScript: Record<string, number> = {}
  const byCategory: Record<string, number> = {}
  const byBidi: Record<string, number> = {}
  const byCombining: Record<string, number> = {}
  const perScript = new Map<string, PropertyDetail>()
  const perCategory = new Map<string, PropertyDetail>()
  const perBidi = new Map<string, PropertyDetail>()
  const perCombining = new Map<string, PropertyDetail>()

  for (const c of rawChars) {
    if (EXCLUDED_CATEGORIES.has(c.gc)) continue

    const blockName = blockFor[c.cp] ?? ''
    if (!blockName) continue

    const entry: IndexCharEntry = { cp: c.cp, n: c.na || c.na1 || '', b: blockName }

    incrCount(byScript, c.sc)
    incrCount(byCategory, c.gc)
    incrCount(byBidi, c.bc)
    incrCount(byCombining, c.ccc)

    ensureDetail(perScript, c.sc).characters.push(entry)
    ensureDetail(perCategory, c.gc).characters.push(entry)
    ensureDetail(perBidi, c.bc).characters.push(entry)
    ensureDetail(perCombining, c.ccc).characters.push(entry)
  }

  for (const m of [perScript, perCategory, perBidi, perCombining]) {
    for (const d of m.values()) {
      d.characters.sort((a, b) => a.cp - b.cp)
      d.count = d.characters.length
    }
  }

  return { byScript, byCategory, byBidi, byCombining, perScript, perCategory, perBidi, perCombining }
}

// JSON.stringify with sorted keys. Idempotent across runs regardless of
// insertion order.
export function stableStringify(value: unknown): string {
  return JSON.stringify(sortKeys(value))
}

function sortKeys(value: unknown): unknown {
  if (Array.isArray(value)) return value.map(sortKeys)
  if (value && typeof value === 'object') {
    const sorted: Record<string, unknown> = {}
    for (const k of Object.keys(value as Record<string, unknown>).sort()) {
      sorted[k] = sortKeys((value as Record<string, unknown>)[k])
    }
    return sorted
  }
  return value
}
