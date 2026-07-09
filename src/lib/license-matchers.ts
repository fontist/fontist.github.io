// License matchers — named predicates for matching formula license
// strings to known license types.
//
// Previously these were inline closures inside LicenseMeta entries in
// license-data.ts. Extracting them:
//   - Makes each matcher independently testable.
//   - Makes the matching logic inspectable ("what does OFL match?").
//   - Keeps license-data.ts as pure data (facts), not data+behaviour.
//
// See architecture review candidate 06.

export type LicenseName = string | undefined

// ── Helpers ────────────────────────────────────────────────────

function matchesAny(name: LicenseName, patterns: string[]): boolean {
  if (!name) return false
  const lower = name.toLowerCase()
  return patterns.some(p => lower.includes(p.toLowerCase()))
}

function matchesPrefix(name: LicenseName, prefix: string): boolean {
  if (!name) return false
  return name.toLowerCase().startsWith(prefix.toLowerCase())
}

// ── Per-license matchers ──────────────────────────────────────

export const matchesOFL = (name: LicenseName) =>
  matchesAny(name, ['sil open font', 'ofl'])

export const matchesApache = (name: LicenseName) =>
  matchesAny(name, ['apache'])

export const matchesMIT = (name: LicenseName) =>
  matchesAny(name, ['mit'])

export const matchesBSD = (name: LicenseName) =>
  matchesAny(name, ['bsd'])

export const matchesUFL = (name: LicenseName) =>
  matchesAny(name, ['ubuntu-font', 'ufl'])

export const matchesIPA = (name: LicenseName) =>
  matchesAny(name, ['ipa'])

export const matchesBitstream = (name: LicenseName) =>
  matchesAny(name, ['bitstream'])

export const matchesGUST = (name: LicenseName) =>
  matchesAny(name, ['gust'])

export const matchesCC0 = (name: LicenseName) =>
  matchesAny(name, ['cc0'])

export const matchesCCBY = (name: LicenseName) =>
  matchesPrefix(name, 'CC BY')

export const matchesLGPL = (name: LicenseName) =>
  matchesAny(name, ['lgpl'])

export const matchesGPL = (name: LicenseName) => {
  if (!name) return false
  const ln = name.toLowerCase()
  return ln.includes('gpl') && !ln.includes('lgpl')
}

// ── Registry: slug → matcher ──────────────────────────────────

export const LICENSE_MATCHERS: Record<string, (name: LicenseName) => boolean> = {
  ofl:       matchesOFL,
  apache:    matchesApache,
  mit:       matchesMIT,
  bsd:       matchesBSD,
  ufl:       matchesUFL,
  ipa:       matchesIPA,
  bitstream: matchesBitstream,
  gust:      matchesGUST,
  cc0:       matchesCC0,
  'cc-by':   matchesCCBY,
  lgpl:      matchesLGPL,
  gpl:       matchesGPL,
}

export function licensesMatching(
  licenseName: LicenseName,
): string[] {
  return Object.entries(LICENSE_MATCHERS)
    .filter(([, match]) => match(licenseName))
    .map(([slug]) => slug)
}

export function primaryLicenseFor(
  licenseName: LicenseName,
): string | null {
  const matches = licensesMatching(licenseName)
  return matches.length > 0 ? matches[0] : null
}
