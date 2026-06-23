const PLANES = [
  { key: "bmp", name: "Basic Multilingual Plane", shortName: "BMP", range: "U+0000–U+FFFF", start: 0, end: 65535 },
  { key: "smp", name: "Supplementary Multilingual Plane", shortName: "SMP", range: "U+10000–U+1FFFF", start: 65536, end: 131071 },
  { key: "sip", name: "Supplementary Ideographic Plane", shortName: "SIP", range: "U+20000–U+2FFFF", start: 131072, end: 196607 },
  { key: "tip", name: "Tertiary Ideographic Plane", shortName: "TIP", range: "U+30000–U+3FFFF", start: 196608, end: 262143 },
  { key: "ssp", name: "Special-purpose Plane", shortName: "SSP", range: "U+E0000–U+EFFFF", start: 917504, end: 983039 },
  { key: "pua-a", name: "Supplementary Private Use Area-A", shortName: "PUA-A", range: "U+F0000–U+FFFFF", start: 983040, end: 1048575 },
  { key: "pua-b", name: "Supplementary Private Use Area-B", shortName: "PUA-B", range: "U+100000–U+10FFFF", start: 1048576, end: 1114111 }
];
function planeForCodepoint(cp) {
  for (const p of PLANES) {
    if (cp >= p.start && cp <= p.end) return p.key;
  }
  return "bmp";
}
const CATEGORY_NAMES = {
  Lu: "Uppercase Letter",
  Ll: "Lowercase Letter",
  Lt: "Titlecase Letter",
  Lm: "Modifier Letter",
  Lo: "Other Letter",
  Mn: "Nonspacing Mark",
  Mc: "Spacing Mark",
  Me: "Enclosing Mark",
  Nd: "Decimal Number",
  Nl: "Letter Number",
  No: "Other Number",
  Pc: "Connector Punctuation",
  Pd: "Dash Punctuation",
  Ps: "Open Punctuation",
  Pe: "Close Punctuation",
  Pi: "Initial Punctuation",
  Pf: "Final Punctuation",
  Po: "Other Punctuation",
  Sm: "Math Symbol",
  Sc: "Currency Symbol",
  Sk: "Modifier Symbol",
  So: "Other Symbol",
  Zs: "Space Separator",
  Zl: "Line Separator",
  Zp: "Paragraph Separator",
  Cc: "Control",
  Cf: "Format",
  Cs: "Surrogate",
  Co: "Private Use",
  Cn: "Unassigned"
};
function categoryName(code) {
  return CATEGORY_NAMES[code] || code;
}
const BLOCK_DISPLAY_NAMES = {
  "Basic Latin": "English & Basic Latin",
  "Latin-1 Supplement": "Accented Latin",
  "Latin Extended-A": "Extended Latin A",
  "Latin Extended-B": "Extended Latin B",
  "Latin Extended Additional": "Additional Latin",
  "IPA Extensions": "Phonetic Symbols",
  "Spacing Modifier Letters": "Modifier Letters",
  "Combining Diacritical Marks": "Combining Marks",
  "Greek and Coptic": "Greek",
  "Cyrillic": "Cyrillic",
  "Cyrillic Supplement": "Extended Cyrillic",
  "Arabic": "Arabic",
  "Hebrew": "Hebrew",
  "Devanagari": "Devanagari (Hindi)",
  "Bengali": "Bengali",
  "Thai": "Thai",
  "Lao": "Lao",
  "Tibetan": "Tibetan",
  "Myanmar": "Myanmar (Burmese)",
  "Georgian": "Georgian",
  "Hangul Jamo": "Korean Jamo",
  "Hangul Syllables": "Korean",
  "CJK Unified Ideographs": "Chinese Characters",
  "CJK Unified Ideographs Extension A": "Extended CJK Characters",
  "Hiragana": "Japanese Hiragana",
  "Katakana": "Japanese Katakana",
  "Bopomofo": "Bopomofo (Chinese Phonetic)",
  "Private Use Area": "Custom Glyphs",
  "Miscellaneous Symbols and Pictographs": "Emoji & Pictographs",
  "Emoticons": "Emoji Faces",
  "Supplemental Symbols and Pictographs": "More Emoji",
  "Transport and Map Symbols": "Transport Emoji"
};
function blockDisplayName(name) {
  if (BLOCK_DISPLAY_NAMES[name]) return BLOCK_DISPLAY_NAMES[name];
  if (/CJK|Unified Ideograph/i.test(name)) return "Chinese Characters";
  if (/Emoji|Pictograph|Emoticon|Transport|Alchemy/i.test(name)) return "Emoji";
  if (/Math|Arrow|Geometric|Dingbat|Symbol/i.test(name)) return "Symbols & Math";
  if (/Currency/i.test(name)) return "Currency";
  return name;
}
function scriptGroup(blockName) {
  if (/Latin|IPA|Spacing Modifier|Combining Diacritic/i.test(blockName)) return "Latin";
  if (/Cyrillic/i.test(blockName)) return "Cyrillic";
  if (/Greek|Coptic/i.test(blockName)) return "Greek";
  if (/Arabic|Hebrew|Syriac|Thaana|Samaritan|Mandaic/i.test(blockName)) return "Middle Eastern";
  if (/Devanagari|Bengali|Gurmukhi|Gujarati|Oriya|Tamil|Telugu|Kannada|Malayalam|Sinhala|Thai|Lao|Tibetan|Myanmar/i.test(blockName)) return "South & SE Asian";
  if (/CJK|Hiragana|Katakana|Hangul|Bopomofo|Kangxi|Yi|Phags-pa/i.test(blockName)) return "CJK";
  if (/Ethiopic|Cherokee|Canadian Aboriginal|Ogham|Runic|Tagalog|Hanunoo|Buhid|Tagbanwa|Khmer|Mongolian|Limbu|Tai Le|New Tai Lue|Buginese|Tai Tham|Tai Viet|Avestan|Egyptian Hieroglyphs|Anatolian|Bamum|Modifier Tone|Latin Extended/i.test(blockName)) return "Other Scripts";
  if (/Emoji|Pictograph|Emoticon|Transport|Alchemy/i.test(blockName)) return "Emoji";
  if (/Math|Arrow|Geometric|Dingbat|Symbol|Currency|Number|Subscript|Superscript/i.test(blockName)) return "Symbols & Math";
  if (/Private Use/i.test(blockName)) return "Private Use";
  if (/Specials|Variation Selector|Tags|Control Pictures|Block Elements|Box Drawing/i.test(blockName)) return "Technical";
  return "Other";
}
function hexCp(cp) {
  return "U+" + cp.toString(16).toUpperCase().padStart(4, "0");
}
function safeChar(cp) {
  try {
    return String.fromCodePoint(cp);
  } catch {
    return "";
  }
}
const FEATURE_INFO = {
  liga: { name: "Standard Ligatures", example: "fi → ﬁ", desc: "Combines letter pairs for smoother reading" },
  calt: { name: "Contextual Alternates", example: "Adapts to neighbors", desc: "Letterforms change based on surrounding characters" },
  dlig: { name: "Discretionary Ligatures", example: "st → ﬆ", desc: "Optional stylistic letter combinations" },
  tnum: { name: "Tabular Figures", example: "111 222 333", desc: "Monospace-width numbers for data tables" },
  onum: { name: "Old-Style Figures", example: "123456", desc: "Lowercase-height figures for body text" },
  lnum: { name: "Lining Figures", example: "123456", desc: "Cap-height figures for headlines" },
  smcp: { name: "Small Caps", example: "hello → ʜᴇʟʟᴏ", desc: "Uppercase at lowercase height" },
  c2sc: { name: "Caps to Small Caps", example: "HELLO → ʜᴇʟʟᴏ", desc: "Uppercase to small caps" },
  zero: { name: "Slashed Zero", example: "0 → Ø", desc: "Distinguish zero from letter O" },
  frac: { name: "Fractions", example: "1/2 → ½", desc: "Automatic fraction conversion" },
  sups: { name: "Superscript", example: "x²", desc: "Raised characters for math and footnotes" },
  subs: { name: "Subscript", example: "x₂", desc: "Lowered characters for chemistry" },
  ordn: { name: "Ordinals", example: "1st 2nd", desc: "Automatic ordinal suffixes" },
  kern: { name: "Kerning", example: "AV → AV", desc: "Adjusts spacing between letter pairs" },
  ss01: { name: "Stylistic Set 1", example: "Alt a", desc: "Alternative letterform design" },
  ss02: { name: "Stylistic Set 2", example: "Alt g", desc: "Alternative letterform design" },
  ss03: { name: "Stylistic Set 3", example: "Alt design", desc: "Alternative letterform design" },
  cv01: { name: "Alternate a", example: "a", desc: "Alternative lowercase a" },
  cv02: { name: "Alternate g", example: "g", desc: "Alternative lowercase g" }
};
function featureInfo(tag) {
  return FEATURE_INFO[tag] || { name: tag, example: "", desc: "OpenType feature" };
}
function blockSlug(blockName) {
  return blockName.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");
}
const CONTROL_ABBREVS = {
  0: "NUL",
  1: "SOH",
  2: "STX",
  3: "ETX",
  4: "EOT",
  5: "ENQ",
  6: "ACK",
  7: "BEL",
  8: "BS",
  9: "HT",
  10: "LF",
  11: "VT",
  12: "FF",
  13: "CR",
  14: "SO",
  15: "SI",
  16: "DLE",
  17: "DC1",
  18: "DC2",
  19: "DC3",
  20: "DC4",
  21: "NAK",
  22: "SYN",
  23: "ETB",
  24: "CAN",
  25: "EM",
  26: "SUB",
  27: "ESC",
  28: "FS",
  29: "GS",
  30: "RS",
  31: "US",
  127: "DEL",
  128: "PAD",
  129: "HOP",
  130: "BPH",
  131: "NBH",
  132: "IND",
  133: "NEL",
  134: "SSA",
  135: "ESA",
  136: "HTS",
  137: "HTJ",
  138: "VTS",
  139: "PLD",
  140: "PLU",
  141: "RI",
  142: "SS2",
  143: "SS3",
  144: "DCS",
  145: "PU1",
  146: "PU2",
  147: "STS",
  148: "CCH",
  149: "MW",
  150: "SPA",
  151: "EPA",
  152: "SOS",
  153: "SGCI",
  154: "SCI",
  155: "CSI",
  156: "ST",
  157: "OSC",
  158: "PM",
  159: "APC"
};
const CONTROL_NAMES = {
  0: "Null",
  1: "Start of Heading",
  2: "Start of Text",
  3: "End of Text",
  4: "End of Transmission",
  5: "Enquiry",
  6: "Acknowledge",
  7: "Bell",
  8: "Backspace",
  9: "Character Tabulation",
  10: "Line Feed",
  11: "Line Tabulation",
  12: "Form Feed",
  13: "Carriage Return",
  14: "Locking-Shift One",
  15: "Locking-Shift Zero",
  16: "Data Link Escape",
  17: "Device Control One",
  18: "Device Control Two",
  19: "Device Control Three",
  20: "Device Control Four",
  21: "Negative Acknowledge",
  22: "Synchronous Idle",
  23: "End of Transmission Block",
  24: "Cancel",
  25: "End of Medium",
  26: "Substitute",
  27: "Escape",
  28: "Information Separator Four",
  29: "Information Separator Three",
  30: "Information Separator Two",
  31: "Information Separator One",
  127: "Delete",
  128: "Padding Character",
  129: "High Octet Preset",
  130: "Break Permitted Here",
  131: "No Break Here",
  132: "Index",
  133: "Next Line",
  134: "Start of Selected Area",
  135: "End of Selected Area",
  136: "Character Tabulation Set",
  137: "Character Tabulation with Justification",
  138: "Line Tabulation Set",
  139: "Partial Line Forward",
  140: "Partial Line Backward",
  141: "Reverse Index",
  142: "Single Shift Two",
  143: "Single Shift Three",
  144: "Device Control String",
  145: "Private Use One",
  146: "Private Use Two",
  147: "Set Transmit State",
  148: "Cancel Character",
  149: "Message Waiting",
  150: "Start of Guarded Area",
  151: "End of Guarded Area",
  152: "Start of String",
  153: "Single Graphic Character Introducer",
  154: "Single Character Introducer",
  155: "Control Sequence Introducer",
  156: "String Terminator",
  157: "Operating System Command",
  158: "Privacy Message",
  159: "Application Program Command"
};
function isControlChar(category, cp) {
  return category === "Cc" || cp >= 0 && cp <= 31 || cp === 127 || cp >= 128 && cp <= 159;
}
function controlAbbrev(cp) {
  return CONTROL_ABBREVS[cp] ?? null;
}
function controlName(cp) {
  return CONTROL_NAMES[cp] ?? null;
}
const C_ESCAPES = {
  0: "\\0",
  7: "\\a",
  8: "\\b",
  9: "\\t",
  10: "\\n",
  11: "\\v",
  12: "\\f",
  13: "\\r",
  27: "\\e",
  34: '\\"',
  39: "\\'",
  92: "\\\\"
};
function cEscape(cp) {
  return C_ESCAPES[cp] ?? null;
}
const DOTTED_CIRCLE = 9676;
function isCombiningMark(category) {
  return category === "Mn" || category === "Mc" || category === "Me";
}
function displayChar(cp, category) {
  if (isCombiningMark(category)) {
    return safeChar(DOTTED_CIRCLE) + safeChar(cp);
  }
  return safeChar(cp);
}
const COMBINING_CLASS_NAMES = {
  0: "Not Reordered",
  1: "Overlay",
  7: "Nukta",
  8: "Kana Voicing",
  9: "Virama",
  10: "PS Begin",
  11: "PS End",
  12: "PS Separate",
  13: "PS Precede",
  14: "PS Follow",
  15: "PS Superimpose",
  16: "PS Visual Order Left",
  19: "PS Visual Order Right",
  20: "PS Touch",
  21: "PS Below",
  22: "PS Above",
  23: "PS Below Right",
  24: "PS Above Right",
  25: "PS Below Left",
  26: "PS Above Left",
  27: "PS Double Below",
  28: "PS Double Above",
  29: "PS Iota Subscript",
  200: "Attached Below Left",
  202: "Attached Below",
  204: "Attached Below Right",
  208: "Attached Left",
  210: "Attached Right",
  212: "Attached Above Left",
  214: "Attached Above",
  216: "Attached Above Right",
  218: "Below Left",
  220: "Below",
  222: "Below Right",
  224: "Left",
  226: "Right",
  228: "Above Left",
  230: "Above",
  232: "Above Right",
  233: "Double Below",
  234: "Double Above",
  240: "IOTA Subscript"
};
function combiningClassName(cc) {
  const n = typeof cc === "string" ? parseInt(cc, 10) : cc;
  return COMBINING_CLASS_NAMES[n] || `Class ${n}`;
}
const SCRIPT_NAMES = {
  Zinh: "Inherited",
  Zyyy: "Common",
  Zsym: "Symbols",
  Zmth: "Mathematical",
  Latn: "Latin",
  Cyrl: "Cyrillic",
  Grek: "Greek",
  Arab: "Arabic",
  Hebr: "Hebrew",
  Syrc: "Syriac",
  Thaa: "Thaana",
  Deva: "Devanagari",
  Beng: "Bengali",
  Gurm: "Gurmukhi",
  Gujr: "Gujarati",
  Orya: "Oriya",
  Taml: "Tamil",
  Telu: "Telugu",
  Knda: "Kannada",
  Mlym: "Malayalam",
  Sinh: "Sinhala",
  Thai: "Thai",
  Laoo: "Lao",
  Tibt: "Tibetan",
  Mymr: "Myanmar",
  Georg: "Georgian",
  Hang: "Hangul",
  Hira: "Hiragana",
  Kana: "Katakana",
  Hani: "Han (Chinese)",
  Cans: "Canadian Aboriginal",
  Ethi: "Ethiopic",
  Cher: "Cherokee",
  Ogam: "Ogham",
  Runr: "Runic",
  Khmr: "Khmer",
  Mong: "Mongolian",
  Bopo: "Bopomofo",
  Yiii: "Yi",
  Tglg: "Tagalog",
  Hano: "Hanunoo",
  Buhd: "Buhid",
  Tagb: "Tagbanwa",
  Limb: "Limbu",
  Tale: "Tai Le",
  Linb: "Linear B",
  Ugar: "Ugaritic",
  Shaw: "Shavian",
  Osma: "Osmanya",
  Cprt: "Cypriot",
  Brah: "Brahmi",
  Khar: "Kharoshthi",
  Phag: "Phags-pa",
  Phnx: "Phoenician",
  Nkoo: "N'Ko",
  Vaii: "Vai",
  Sora: "Sora Sompeng",
  Chrs: "Chorasmian",
  Diak: "Dives Akuru",
  Dogr: "Dogra",
  Elym: "Elymaic",
  Gong: "Gunjala Gondi",
  Gonm: "Masaram Gondi",
  Gran: "Grantha",
  Gujr: "Gujarati",
  Hluw: "Anatolian Hieroglyphs",
  Hmng: "Pahawh Hmong",
  Hmnp: "Nyiakeng Puachue Hmong",
  Hung: "Old Hungarian",
  Kali: "Kayah Li",
  Khoj: "Khojki",
  Kits: "Khitan Small Script",
  Kthi: "Kaithi",
  Lana: "Lanna",
  Lepc: "Lepcha",
  Lina: "Linear A",
  Lyci: "Lycian",
  Lydi: "Lydian",
  Mahj: "Mahajani",
  Makr: "Makasar",
  Mand: "Mandaic",
  Mani: "Manichaean",
  Marc: "Marchen",
  Medf: "Medefaidrin",
  Mend: "Mende Kikakui",
  Merc: "Meroitic Cursive",
  Mero: "Meroitic Hieroglyphs",
  Miao: "Pollard",
  Modi: "Modi",
  Mult: "Multani",
  Mroo: "Mro",
  Nand: "Nandinagari",
  Newa: "Newa",
  Nshu: "Nushu",
  Ogam: "Ogham",
  Olck: "Ol Chiki",
  Orkh: "Old Turkic",
  Orya: "Oriya",
  Osge: "Osage",
  Palm: "Palmyrene",
  Pauc: "Pau Cin Hau",
  Perm: "Old Permic",
  Plrd: "Pollard",
  Rjng: "Rejang",
  Rohg: "Hanifi Rohingya",
  Saur: "Saurashtra",
  Sgnw: "SignWriting",
  Shar: "Sharada",
  Sidd: "Siddham",
  Sind: "Khudawadi",
  Sinh: "Sinhala",
  Sogd: "Sogdian",
  Sogo: "Old Sogdian",
  Sora: "Sora Sompeng",
  Sund: "Sundanese",
  Sylo: "Syloti Nagri",
  Tagb: "Tagbanwa",
  Takr: "Takri",
  Talu: "New Tai Lue",
  Taml: "Tamil",
  Tang: "Tangut",
  Tavt: "Tai Viet",
  Tglg: "Tagalog",
  Tfng: "Tifinagh",
  Tglg: "Tagalog",
  Tirh: "Tirhuta",
  Tnsa: "Tangsa",
  Tutg: "Tulu Tigalari",
  Vith: "Vithkuqi",
  Wara: "Warang Citi",
  Wcho: "Wancho",
  Xpeo: "Old Persian",
  Xsux: "Cuneiform",
  Yezi: "Yezidi",
  Zanb: "Zanabazar Square"
};
const NAME_TO_CODE = Object.entries(SCRIPT_NAMES).reduce(
  (acc, [code, name]) => {
    acc[name] = code;
    return acc;
  },
  {}
);
function scriptDisplayName(scriptOrCode) {
  if (SCRIPT_NAMES[scriptOrCode]) {
    const name = SCRIPT_NAMES[scriptOrCode];
    return `Code for ${name.toLowerCase()} script (${scriptOrCode})`;
  }
  const code = NAME_TO_CODE[scriptOrCode];
  if (code) {
    return `Code for ${scriptOrCode.toLowerCase()} script (${code})`;
  }
  return scriptOrCode;
}
export {
  PLANES as P,
  blockSlug as a,
  blockDisplayName as b,
  controlAbbrev as c,
  controlName as d,
  cEscape as e,
  featureInfo as f,
  displayChar as g,
  hexCp as h,
  isControlChar as i,
  categoryName as j,
  scriptDisplayName as k,
  combiningClassName as l,
  safeChar as m,
  planeForCodepoint as p,
  scriptGroup as s
};
