// Pure helpers for Unihan variant values. Lives outside Vue so it can be
// tested without a component test harness.

import { safeChar } from './constants.ts'

export function isCodepointRef(val: string): boolean {
  return /^U\+[0-9A-Fa-f]+$/.test(val)
}

export function parseCodepointRef(val: string): number {
  return parseInt(val.replace(/^U\+/i, ''), 16)
}

export function isSelfReference(val: string, selfCp: number): boolean {
  if (!isCodepointRef(val)) return false
  return parseCodepointRef(val) === selfCp
}

export function glyphOf(val: string): string {
  if (!isCodepointRef(val)) return ''
  return safeChar(parseCodepointRef(val))
}
