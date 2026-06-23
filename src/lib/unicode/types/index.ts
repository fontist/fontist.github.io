export interface UnicodeCharacter {
  cp: number
  hex: string
  name: string
  category: string
  script: string
  char: string
}

export interface UnicodeBlock {
  name: string
  start: number
  end: number
  range: string
  plane: PlaneKey
  displayName: string
  scriptGroup: string
  characters: UnicodeCharacter[]
  assignedCount: number
}

export interface UnicodePlane {
  key: PlaneKey
  name: string
  shortName: string
  range: string
  start: number
  end: number
  blocks: UnicodeBlock[]
}

export type PlaneKey = 'bmp' | 'smp' | 'sip' | 'tip' | 'ssp' | 'pua-a' | 'pua-b'

export type CoverageStatus = 'full' | 'partial' | 'none'

export interface BlockCoverage {
  block: UnicodeBlock
  status: CoverageStatus
  supportedCount: number
  totalCount: number
  percentage: number
  missingCodepoints: number[]
}

export type GridMode = 'standalone' | 'per-font' | 'multi-font'
