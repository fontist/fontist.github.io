import type { PlaneKey, UnicodeBlock } from '../types'
import type { CodepointUnihan } from '../../types/domain'

export const PLANES: { key: PlaneKey; name: string; shortName: string; range: string; start: number; end: number }[] = [
  { key: 'bmp', name: 'Basic Multilingual Plane', shortName: 'BMP', range: 'U+0000–U+FFFF', start: 0x0000, end: 0xFFFF },
  { key: 'smp', name: 'Supplementary Multilingual Plane', shortName: 'SMP', range: 'U+10000–U+1FFFF', start: 0x10000, end: 0x1FFFF },
  { key: 'sip', name: 'Supplementary Ideographic Plane', shortName: 'SIP', range: 'U+20000–U+2FFFF', start: 0x20000, end: 0x2FFFF },
  { key: 'tip', name: 'Tertiary Ideographic Plane', shortName: 'TIP', range: 'U+30000–U+3FFFF', start: 0x30000, end: 0x3FFFF },
  { key: 'ssp', name: 'Special-purpose Plane', shortName: 'SSP', range: 'U+E0000–U+EFFFF', start: 0xE0000, end: 0xEFFFF },
  { key: 'pua-a', name: 'Supplementary Private Use Area-A', shortName: 'PUA-A', range: 'U+F0000–U+FFFFF', start: 0xF0000, end: 0xFFFFF },
  { key: 'pua-b', name: 'Supplementary Private Use Area-B', shortName: 'PUA-B', range: 'U+100000–U+10FFFF', start: 0x100000, end: 0x10FFFF },
]

export function planeForCodepoint(cp: number): PlaneKey {
  for (const p of PLANES) {
    if (cp >= p.start && cp <= p.end) return p.key
  }
  return 'bmp'
}

const CATEGORY_NAMES: Record<string, string> = {
  Lu: 'Uppercase Letter', Ll: 'Lowercase Letter', Lt: 'Titlecase Letter',
  Lm: 'Modifier Letter', Lo: 'Other Letter',
  Mn: 'Nonspacing Mark', Mc: 'Spacing Mark', Me: 'Enclosing Mark',
  Nd: 'Decimal Number', Nl: 'Letter Number', No: 'Other Number',
  Pc: 'Connector Punctuation', Pd: 'Dash Punctuation', Ps: 'Open Punctuation',
  Pe: 'Close Punctuation', Pi: 'Initial Punctuation', Pf: 'Final Punctuation',
  Po: 'Other Punctuation',
  Sm: 'Math Symbol', Sc: 'Currency Symbol', Sk: 'Modifier Symbol', So: 'Other Symbol',
  Zs: 'Space Separator', Zl: 'Line Separator', Zp: 'Paragraph Separator',
  Cc: 'Control', Cf: 'Format', Cs: 'Surrogate', Co: 'Private Use', Cn: 'Unassigned',
}

export function categoryName(code: string): string {
  return CATEGORY_NAMES[code] || code
}

const BLOCK_DISPLAY_NAMES: Record<string, string> = {
  'Basic Latin': 'English & Basic Latin',
  'Latin-1 Supplement': 'Accented Latin',
  'Latin Extended-A': 'Extended Latin A',
  'Latin Extended-B': 'Extended Latin B',
  'Latin Extended Additional': 'Additional Latin',
  'IPA Extensions': 'Phonetic Symbols',
  'Spacing Modifier Letters': 'Modifier Letters',
  'Combining Diacritical Marks': 'Combining Marks',
  'Greek and Coptic': 'Greek',
  'Cyrillic': 'Cyrillic',
  'Cyrillic Supplement': 'Extended Cyrillic',
  'Arabic': 'Arabic',
  'Hebrew': 'Hebrew',
  'Devanagari': 'Devanagari (Hindi)',
  'Bengali': 'Bengali',
  'Thai': 'Thai',
  'Lao': 'Lao',
  'Tibetan': 'Tibetan',
  'Myanmar': 'Myanmar (Burmese)',
  'Georgian': 'Georgian',
  'Hangul Jamo': 'Korean Jamo',
  'Hangul Syllables': 'Korean',
  'CJK Unified Ideographs': 'Chinese Characters',
  'CJK Unified Ideographs Extension A': 'Extended CJK Characters',
  'Hiragana': 'Japanese Hiragana',
  'Katakana': 'Japanese Katakana',
  'Bopomofo': 'Bopomofo (Chinese Phonetic)',
  'Private Use Area': 'Custom Glyphs',
  'Miscellaneous Symbols and Pictographs': 'Emoji & Pictographs',
  'Emoticons': 'Emoji Faces',
  'Supplemental Symbols and Pictographs': 'More Emoji',
  'Transport and Map Symbols': 'Transport Emoji',
}

export function blockDisplayName(name: string): string {
  if (BLOCK_DISPLAY_NAMES[name]) return BLOCK_DISPLAY_NAMES[name]
  if (/CJK|Unified Ideograph/i.test(name)) return 'Chinese Characters'
  if (/Emoji|Pictograph|Emoticon|Transport|Alchemy/i.test(name)) return 'Emoji'
  if (/Math|Arrow|Geometric|Dingbat|Symbol/i.test(name)) return 'Symbols & Math'
  if (/Currency/i.test(name)) return 'Currency'
  return name
}

export type ScriptFamily =
  | 'latin'
  | 'cyrillic'
  | 'greek'
  | 'middle-eastern'
  | 'south-se-asian'
  | 'cjk'
  | 'other-scripts'
  | 'emoji'
  | 'symbols-math'
  | 'private-use'
  | 'technical'
  | 'other'

const SCRIPT_FAMILY_PATTERNS: Array<[ScriptFamily, RegExp]> = [
  ['latin', /Latin|IPA|Spacing Modifier|Combining Diacritic/i],
  ['cyrillic', /Cyrillic/i],
  ['greek', /Greek|Coptic/i],
  ['middle-eastern', /Arabic|Hebrew|Syriac|Thaana|Samaritan|Mandaic/i],
  ['south-se-asian', /Devanagari|Bengali|Gurmukhi|Gujarati|Oriya|Tamil|Telugu|Kannada|Malayalam|Sinhala|Thai|Lao|Tibetan|Myanmar/i],
  ['cjk', /CJK|Hiragana|Katakana|Hangul|Bopomofo|Kangxi|Yi|Phags-pa/i],
  ['other-scripts', /Ethiopic|Cherokee|Canadian Aboriginal|Ogham|Runic|Tagalog|Hanunoo|Buhid|Tagbanwa|Khmer|Mongolian|Limbu|Tai Le|New Tai Lue|Buginese|Tai Tham|Tai Viet|Avestan|Egyptian Hieroglyphs|Anatolian|Bamum|Modifier Tone|Latin Extended/i],
  ['emoji', /Emoji|Pictograph|Emoticon|Transport|Alchemy/i],
  ['symbols-math', /Math|Arrow|Geometric|Dingbat|Symbol|Currency|Number|Subscript|Superscript/i],
  ['private-use', /Private Use/i],
  ['technical', /Specials|Variation Selector|Tags|Control Pictures|Block Elements|Box Drawing/i],
]

const SCRIPT_FAMILY_LABELS: Record<ScriptFamily, string> = {
  'latin': 'Latin',
  'cyrillic': 'Cyrillic',
  'greek': 'Greek',
  'middle-eastern': 'Middle Eastern',
  'south-se-asian': 'South & SE Asian',
  'cjk': 'CJK',
  'other-scripts': 'Other Scripts',
  'emoji': 'Emoji',
  'symbols-math': 'Symbols & Math',
  'private-use': 'Private Use',
  'technical': 'Technical',
  'other': 'Other',
}

export function blockScriptFamily(blockName: string): ScriptFamily {
  for (const [family, pattern] of SCRIPT_FAMILY_PATTERNS) {
    if (pattern.test(blockName)) return family
  }
  return 'other'
}

export function isCjkBlock(blockName: string): boolean {
  return blockScriptFamily(blockName) === 'cjk'
}

export function scriptFamilyLabel(family: ScriptFamily): string {
  return SCRIPT_FAMILY_LABELS[family]
}

export function scriptGroup(blockName: string): string {
  return scriptFamilyLabel(blockScriptFamily(blockName))
}

export function hexCp(cp: number): string {
  return 'U+' + cp.toString(16).toUpperCase().padStart(4, '0')
}

/**
 * Canonical codepoint hex: lowercase, zero-padded to 4 digits.
 *
 * Single source of truth for "what hex string identifies this codepoint
 * on disk and in URLs". Used by `charRoute`
 * (route segment), `loadCodepointDetail` (filename lookup), and any
 * future consumer that needs to address a codepoint file.
 *
 * Accepts a number, a bare hex string, or a U+XXXX string. Does NOT
 * validate the input — boundary validation lives at the call site
 * (e.g. `charRoute` throws RangeError on out-of-range input).
 */
export function canonicalCodepointHex(input: number | string): string {
  const stripped = typeof input === 'number'
    ? input.toString(16)
    : input.replace(/^U\+/i, '')
  return stripped.toLowerCase().padStart(4, '0')
}

/**
 * Build the /unicode/char/{hex} route for any reasonable codepoint reference.
 *
 * Accepts a number (the codepoint integer), a bare hex string ("20ac",
 * "20AC", "0020"), or a U+XXXX string ("U+20AC"). The route segment is
 * always lowercase, zero-padded to at least 4 hex digits — matching the
 * canonical codepoint filename rule.
 *
 * Throws RangeError on invalid input rather than returning a fallback,
 * so malformed upstream data (e.g. a Unihan field with a bad codepoint)
 * surfaces loudly instead of silently producing a broken link.
 */
export function charRoute(input: number | string): string {
  const cp = typeof input === 'number'
    ? input
    : parseInt(input.replace(/^U\+/i, ''), 16)
  if (!Number.isFinite(cp) || cp < 0 || cp > 0x10FFFF) {
    throw new RangeError(`Invalid codepoint reference: ${JSON.stringify(input)}`)
  }
  return `/unicode/char/${canonicalCodepointHex(cp)}`
}

const BIDI_CLASS_NAMES: Record<string, string> = {
  L: 'Left-to-Right',
  R: 'Right-to-Left',
  AL: 'Right-to-Left Arabic',
  EN: 'European Number',
  ES: 'European Separator',
  ET: 'European Terminator',
  AN: 'Arabic Number',
  CS: 'Common Separator',
  NSM: 'Nonspacing Mark',
  BN: 'Boundary Neutral',
  B: 'Paragraph Separator',
  S: 'Segment Separator',
  WS: 'Whitespace',
  ON: 'Other Neutral',
  LRE: 'L-to-R Embedding',
  LRO: 'L-to-R Override',
  RLE: 'R-to-L Embedding',
  RLO: 'R-to-L Override',
  PDF: 'Pop Directional Format',
  LRI: 'L-to-R Isolate',
  RLI: 'R-to-L Isolate',
  FSI: 'First Strong Isolate',
  PDI: 'Pop Directional Isolate',
}

export function bidiClassName(code: string): string {
  return BIDI_CLASS_NAMES[code] || code
}

export function safeChar(cp: number): string {
  try { return String.fromCodePoint(cp) } catch { return '' }
}

export const FEATURE_INFO: Record<string, { name: string; example: string; desc: string }> = {
  liga: { name: 'Standard Ligatures', example: 'fi → ﬁ', desc: 'Combines letter pairs for smoother reading' },
  calt: { name: 'Contextual Alternates', example: 'Adapts to neighbors', desc: 'Letterforms change based on surrounding characters' },
  dlig: { name: 'Discretionary Ligatures', example: 'st → ﬆ', desc: 'Optional stylistic letter combinations' },
  tnum: { name: 'Tabular Figures', example: '111 222 333', desc: 'Monospace-width numbers for data tables' },
  onum: { name: 'Old-Style Figures', example: '123456', desc: 'Lowercase-height figures for body text' },
  lnum: { name: 'Lining Figures', example: '123456', desc: 'Cap-height figures for headlines' },
  smcp: { name: 'Small Caps', example: 'hello → ʜᴇʟʟᴏ', desc: 'Uppercase at lowercase height' },
  c2sc: { name: 'Caps to Small Caps', example: 'HELLO → ʜᴇʟʟᴏ', desc: 'Uppercase to small caps' },
  zero: { name: 'Slashed Zero', example: '0 → Ø', desc: 'Distinguish zero from letter O' },
  frac: { name: 'Fractions', example: '1/2 → ½', desc: 'Automatic fraction conversion' },
  sups: { name: 'Superscript', example: 'x²', desc: 'Raised characters for math and footnotes' },
  subs: { name: 'Subscript', example: 'x₂', desc: 'Lowered characters for chemistry' },
  ordn: { name: 'Ordinals', example: '1st 2nd', desc: 'Automatic ordinal suffixes' },
  kern: { name: 'Kerning', example: 'AV → AV', desc: 'Adjusts spacing between letter pairs' },
  ss01: { name: 'Stylistic Set 1', example: 'Alt a', desc: 'Alternative letterform design' },
  ss02: { name: 'Stylistic Set 2', example: 'Alt g', desc: 'Alternative letterform design' },
  ss03: { name: 'Stylistic Set 3', example: 'Alt design', desc: 'Alternative letterform design' },
  cv01: { name: 'Alternate a', example: 'a', desc: 'Alternative lowercase a' },
  cv02: { name: 'Alternate g', example: 'g', desc: 'Alternative lowercase g' },
}

export function featureInfo(tag: string) {
  return FEATURE_INFO[tag] || { name: tag, example: '', desc: 'OpenType feature' }
}

export function blockSlug(blockName: string): string {
  return blockName.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '')
}

// ---------- Unihan category registry ----------
// Single source of truth for which Unihan categories the char page renders
// and how each one displays. The `key` is `keyof CodepointUnihan`, so adding
// a new field to the type without adding a matching entry here is a
// compile error.

export type UnihanRenderMode = 'text' | 'variant'

export interface UnihanCategorySpec {
  key: keyof CodepointUnihan
  heading: string
  render: UnihanRenderMode
}

export const UNIHAN_CATEGORIES: readonly UnihanCategorySpec[] = [
  { key: 'dictionary_indices',     heading: 'Unihan Dictionary Indices',     render: 'text' },
  { key: 'readings',               heading: 'Unihan Readings',                render: 'text' },
  { key: 'variants',               heading: 'Unihan Variants',                render: 'variant' },
  { key: 'numeric_values',         heading: 'Unihan Numeric Values',          render: 'text' },
  { key: 'radical_stroke_counts',  heading: 'Unihan Radical-Stroke Counts',   render: 'text' },
  { key: 'dictionary_like_data',   heading: 'Unihan Dictionary-Like Data',    render: 'text' },
  { key: 'irg_sources',            heading: 'Unihan IRG Sources',             render: 'text' },
  { key: 'other_mappings',         heading: 'Unihan Other Mappings',          render: 'text' },
]

const CONTROL_ABBREVS: Record<number, string> = {
  0x00: 'NUL', 0x01: 'SOH', 0x02: 'STX', 0x03: 'ETX',
  0x04: 'EOT', 0x05: 'ENQ', 0x06: 'ACK', 0x07: 'BEL',
  0x08: 'BS',  0x09: 'HT',  0x0A: 'LF',  0x0B: 'VT',
  0x0C: 'FF',  0x0D: 'CR',  0x0E: 'SO',  0x0F: 'SI',
  0x10: 'DLE', 0x11: 'DC1', 0x12: 'DC2', 0x13: 'DC3',
  0x14: 'DC4', 0x15: 'NAK', 0x16: 'SYN', 0x17: 'ETB',
  0x18: 'CAN', 0x19: 'EM',  0x1A: 'SUB', 0x1B: 'ESC',
  0x1C: 'FS',  0x1D: 'GS',  0x1E: 'RS',  0x1F: 'US',
  0x7F: 'DEL',
  0x80: 'PAD', 0x81: 'HOP', 0x82: 'BPH', 0x83: 'NBH',
  0x84: 'IND', 0x85: 'NEL', 0x86: 'SSA', 0x87: 'ESA',
  0x88: 'HTS', 0x89: 'HTJ', 0x8A: 'VTS', 0x8B: 'PLD',
  0x8C: 'PLU', 0x8D: 'RI',  0x8E: 'SS2', 0x8F: 'SS3',
  0x90: 'DCS', 0x91: 'PU1', 0x92: 'PU2', 0x93: 'STS',
  0x94: 'CCH', 0x95: 'MW',  0x96: 'SPA', 0x97: 'EPA',
  0x98: 'SOS', 0x99: 'SGCI',0x9A: 'SCI', 0x9B: 'CSI',
  0x9C: 'ST',  0x9D: 'OSC', 0x9E: 'PM',  0x9F: 'APC',
}

const CONTROL_NAMES: Record<number, string> = {
  0x00: 'Null', 0x01: 'Start of Heading', 0x02: 'Start of Text',
  0x03: 'End of Text', 0x04: 'End of Transmission', 0x05: 'Enquiry',
  0x06: 'Acknowledge', 0x07: 'Bell', 0x08: 'Backspace',
  0x09: 'Character Tabulation', 0x0A: 'Line Feed', 0x0B: 'Line Tabulation',
  0x0C: 'Form Feed', 0x0D: 'Carriage Return', 0x0E: 'Locking-Shift One',
  0x0F: 'Locking-Shift Zero', 0x10: 'Data Link Escape',
  0x11: 'Device Control One', 0x12: 'Device Control Two',
  0x13: 'Device Control Three', 0x14: 'Device Control Four',
  0x15: 'Negative Acknowledge', 0x16: 'Synchronous Idle',
  0x17: 'End of Transmission Block', 0x18: 'Cancel', 0x19: 'End of Medium',
  0x1A: 'Substitute', 0x1B: 'Escape',
  0x1C: 'Information Separator Four', 0x1D: 'Information Separator Three',
  0x1E: 'Information Separator Two', 0x1F: 'Information Separator One',
  0x7F: 'Delete',
  0x80: 'Padding Character', 0x81: 'High Octet Preset',
  0x82: 'Break Permitted Here', 0x83: 'No Break Here',
  0x84: 'Index', 0x85: 'Next Line',
  0x86: 'Start of Selected Area', 0x87: 'End of Selected Area',
  0x88: 'Character Tabulation Set', 0x89: 'Character Tabulation with Justification',
  0x8A: 'Line Tabulation Set', 0x8B: 'Partial Line Forward',
  0x8C: 'Partial Line Backward', 0x8D: 'Reverse Index',
  0x8E: 'Single Shift Two', 0x8F: 'Single Shift Three',
  0x90: 'Device Control String', 0x91: 'Private Use One',
  0x92: 'Private Use Two', 0x93: 'Set Transmit State',
  0x94: 'Cancel Character', 0x95: 'Message Waiting',
  0x96: 'Start of Guarded Area', 0x97: 'End of Guarded Area',
  0x98: 'Start of String', 0x99: 'Single Graphic Character Introducer',
  0x9A: 'Single Character Introducer', 0x9B: 'Control Sequence Introducer',
  0x9C: 'String Terminator', 0x9D: 'Operating System Command',
  0x9E: 'Privacy Message', 0x9F: 'Application Program Command',
}

export function isControlChar(category: string, cp: number): boolean {
  return category === 'Cc' || (cp >= 0x00 && cp <= 0x1F) || cp === 0x7F || (cp >= 0x80 && cp <= 0x9F)
}

export function controlAbbrev(cp: number): string | null {
  return CONTROL_ABBREVS[cp] ?? null
}

export function controlName(cp: number): string | null {
  return CONTROL_NAMES[cp] ?? null
}

const C_ESCAPES: Record<number, string> = {
  0x00: '\\0', 0x07: '\\a', 0x08: '\\b', 0x09: '\\t',
  0x0A: '\\n', 0x0B: '\\v', 0x0C: '\\f', 0x0D: '\\r',
  0x1B: '\\e', 0x22: '\\"', 0x27: "\\'", 0x5C: '\\\\',
}

export function cEscape(cp: number): string | null {
  return C_ESCAPES[cp] ?? null
}

const DOTTED_CIRCLE = 0x25CC

export function isCombiningMark(category: string): boolean {
  return category === 'Mn' || category === 'Mc' || category === 'Me'
}

export function displayChar(cp: number, category: string): string {
  if (isCombiningMark(category)) {
    return safeChar(DOTTED_CIRCLE) + safeChar(cp)
  }
  return safeChar(cp)
}

const COMBINING_CLASS_NAMES: Record<number, string> = {
  0: 'Not Reordered', 1: 'Overlay', 7: 'Nukta', 8: 'Kana Voicing',
  9: 'Virama', 10: 'PS Begin', 11: 'PS End', 12: 'PS Separate',
  13: 'PS Precede', 14: 'PS Follow', 15: 'PS Superimpose',
  16: 'PS Visual Order Left', 19: 'PS Visual Order Right',
  20: 'PS Touch', 21: 'PS Below', 22: 'PS Above',
  23: 'PS Below Right', 24: 'PS Above Right',
  25: 'PS Below Left', 26: 'PS Above Left',
  27: 'PS Double Below', 28: 'PS Double Above',
  29: 'PS Iota Subscript',
  200: 'Attached Below Left', 202: 'Attached Below',
  204: 'Attached Below Right', 208: 'Attached Left',
  210: 'Attached Right', 212: 'Attached Above Left',
  214: 'Attached Above', 216: 'Attached Above Right',
  218: 'Below Left', 220: 'Below', 222: 'Below Right',
  224: 'Left', 226: 'Right', 228: 'Above Left',
  230: 'Above', 232: 'Above Right',
  233: 'Double Below', 234: 'Double Above',
  240: 'IOTA Subscript',
}

export function combiningClassName(cc: number | string): string {
  const n = typeof cc === 'string' ? parseInt(cc, 10) : cc
  return COMBINING_CLASS_NAMES[n] || `Class ${n}`
}

const SCRIPT_NAMES: Record<string, string> = {
  Zinh: 'Inherited', Zyyy: 'Common', Zsym: 'Symbols', Zmth: 'Mathematical',
  Latn: 'Latin', Cyrl: 'Cyrillic', Grek: 'Greek', Arab: 'Arabic',
  Hebr: 'Hebrew', Syrc: 'Syriac', Thaa: 'Thaana', Deva: 'Devanagari',
  Beng: 'Bengali', Gurm: 'Gurmukhi', Gujr: 'Gujarati', Orya: 'Oriya',
  Taml: 'Tamil', Telu: 'Telugu', Knda: 'Kannada', Mlym: 'Malayalam',
  Sinh: 'Sinhala', Thai: 'Thai', Laoo: 'Lao', Tibt: 'Tibetan',
  Mymr: 'Myanmar', Georg: 'Georgian', Hang: 'Hangul',
  Hira: 'Hiragana', Kana: 'Katakana', Hani: 'Han (Chinese)',
  Cans: 'Canadian Aboriginal', Ethi: 'Ethiopic', Cher: 'Cherokee',
  Ogam: 'Ogham', Runr: 'Runic', Khmr: 'Khmer', Mong: 'Mongolian',
  Bopo: 'Bopomofo', Yiii: 'Yi', Tglg: 'Tagalog', Hano: 'Hanunoo',
  Buhd: 'Buhid', Tagb: 'Tagbanwa', Limb: 'Limbu', Tale: 'Tai Le',
  Linb: 'Linear B', Ugar: 'Ugaritic', Shaw: 'Shavian', Osma: 'Osmanya',
  Cprt: 'Cypriot', Brah: 'Brahmi', Khar: 'Kharoshthi',
  Phag: 'Phags-pa', Phnx: 'Phoenician', Nkoo: 'N\'Ko',
  Vaii: 'Vai', Sora: 'Sora Sompeng', Chrs: 'Chorasmian',
  Diak: 'Dives Akuru', Dogr: 'Dogra', Elym: 'Elymaic', Gong: 'Gunjala Gondi',
  Gonm: 'Masaram Gondi', Gran: 'Grantha',
  Hluw: 'Anatolian Hieroglyphs', Hmng: 'Pahawh Hmong', Hmnp: 'Nyiakeng Puachue Hmong',
  Hung: 'Old Hungarian', Kali: 'Kayah Li', Khoj: 'Khojki',
  Kits: 'Khitan Small Script', Kthi: 'Kaithi', Lana: 'Lanna',
  Lepc: 'Lepcha', Lina: 'Linear A', Lyci: 'Lycian', Lydi: 'Lydian',
  Mahj: 'Mahajani', Makr: 'Makasar', Mand: 'Mandaic', Mani: 'Manichaean',
  Marc: 'Marchen', Medf: 'Medefaidrin', Mend: 'Mende Kikakui',
  Merc: 'Meroitic Cursive', Mero: 'Meroitic Hieroglyphs',
  Miao: 'Pollard', Modi: 'Modi', Mult: 'Multani', Mroo: 'Mro',
  Nand: 'Nandinagari', Newa: 'Newa', Nshu: 'Nushu',
  Olck: 'Ol Chiki', Orkh: 'Old Turkic',
  Osge: 'Osage', Palm: 'Palmyrene', Pauc: 'Pau Cin Hau', Perm: 'Old Permic',
  Plrd: 'Pollard', Rjng: 'Rejang', Rohg: 'Hanifi Rohingya',
  Saur: 'Saurashtra', Sgnw: 'SignWriting', Shar: 'Sharada',
  Sidd: 'Siddham', Sind: 'Khudawadi', Sogd: 'Sogdian',
  Sogo: 'Old Sogdian', Sund: 'Sundanese',
  Sylo: 'Syloti Nagri', Takr: 'Takri', Talu: 'New Tai Lue',
  Tang: 'Tangut', Tavt: 'Tai Viet',
  Tfng: 'Tifinagh', Tirh: 'Tirhuta',
  Tnsa: 'Tangsa', Tutg: 'Tulu Tigalari', Vith: 'Vithkuqi',
  Wara: 'Warang Citi', Wcho: 'Wancho', Xpeo: 'Old Persian',
  Xsux: 'Cuneiform', Yezi: 'Yezidi', Zanb: 'Zanabazar Square',
}

export function scriptName(code: string): string {
  return SCRIPT_NAMES[code] || code
}

const NAME_TO_CODE: Record<string, string> = Object.entries(SCRIPT_NAMES).reduce(
  (acc, [code, name]) => { acc[name] = code; return acc },
  {} as Record<string, string>
)

export function scriptDisplayName(scriptOrCode: string): string {
  if (SCRIPT_NAMES[scriptOrCode]) {
    const name = SCRIPT_NAMES[scriptOrCode]
    return `Code for ${name.toLowerCase()} script (${scriptOrCode})`
  }
  const code = NAME_TO_CODE[scriptOrCode]
  if (code) {
    return `Code for ${scriptOrCode.toLowerCase()} script (${code})`
  }
  return scriptOrCode
}
