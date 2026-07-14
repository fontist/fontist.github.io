import type { FormulaData } from '../types/domain'

export function getLicenseGroup(f: FormulaData | null): string {
  if (!f) return 'unknown'
  if (f.licenseCategory === 'open_source') {
    if (f.licenseType === 'ofl') return 'ofl'
    if (f.licenseType === 'apache') return 'apache'
    if (f.licenseType === 'mit') return 'mit'
    if (f.licenseType === 'cc0') return 'cc0'
    return 'other_open'
  }
  if (f.licenseCategory === 'freely_distributable') return 'freely_dist'
  if (f.licenseCategory === 'platform_restricted') return 'platform'
  if (f.licenseCategory === 'bundled_software') return 'bundled'
  return 'unknown'
}

const LICENSE_ICONS: Record<string, { file: string; alt: string }> = {
  ofl: { file: 'ofl.svg', alt: 'OFL' },
  apache: { file: 'apache.svg', alt: 'Apache' },
  mit: { file: 'mit.svg', alt: 'MIT' },
  cc0: { file: 'cc0.svg', alt: 'CC0' },
  open: { file: 'open.svg', alt: 'Open Source' },
  free: { file: 'freely-distributed.svg', alt: 'Freely Distributable' },
  platform: { file: 'platform-tied.svg', alt: 'Platform Tied' },
  bundled: { file: 'bundled.svg', alt: 'Bundled Software' },
  unknown: { file: 'unknown.svg', alt: 'Unknown' },
}

const SOURCE_ICONS: Record<string, { file: string; alt: string }> = {
  google: { file: 'google.svg', alt: 'Google Fonts' },
  sil: { file: 'sil.svg', alt: 'SIL International' },
  apple: { file: 'apple.svg', alt: 'Apple' },
  fontist: { file: 'fontist.svg', alt: 'Expert Curated' },
}

export function licenseIconPath(icon: string): { src: string; alt: string } | null {
  const iconData = LICENSE_ICONS[icon]
  if (!iconData) return null
  const basePath = import.meta.env.BASE_URL || '/'
  return { src: `${basePath}licenses/${iconData.file}`, alt: iconData.alt }
}

export function sourceIconPath(icon: string): { src: string; alt: string } | null {
  const iconData = SOURCE_ICONS[icon]
  if (!iconData) return null
  const basePath = import.meta.env.BASE_URL || '/'
  return { src: `${basePath}sources/${iconData.file}`, alt: iconData.alt }
}

export function licenseIconForFormula(f: FormulaData | null): { src: string; alt: string } {
  const basePath = import.meta.env.BASE_URL || '/'
  if (!f) return { src: `${basePath}licenses/unknown.svg`, alt: 'Unknown' }
  if (f.licenseType === 'macos') return { src: `${basePath}licenses/platform-tied.svg`, alt: 'Platform Tied' }
  if (f.licenseType === 'ms_office' || f.licenseType === 'ms_web_fonts') return { src: `${basePath}licenses/microsoft.svg`, alt: 'Microsoft' }
  const group = getLicenseGroup(f)
  const icon = LICENSE_ICONS[group] || LICENSE_ICONS.unknown
  return { src: `${basePath}licenses/${icon.file}`, alt: icon.alt }
}

export function sourceIconForFormula(f: FormulaData | null): { src: string; alt: string } {
  const basePath = import.meta.env.BASE_URL || '/'
  if (!f) return { src: `${basePath}sources/fontist.svg`, alt: 'Expert Curated' }
  const icon = SOURCE_ICONS[f.sourceType] || SOURCE_ICONS.fontist
  return { src: `${basePath}sources/${icon.file}`, alt: icon.alt }
}
