// Small utility to sanitize and normalize text before saving to the DB.
// - trims and normalizes Unicode (NFC)
// - attempts to heuristically fix common latin1->utf8 mojibake
// - replaces a handful of common mojibake sequences
// - strips control characters (except newline/tab) and collapses repeated whitespace

export function tryFixLatin1ToUtf8(s) {
  try {
    // Interpret the incoming JS string as latin1 bytes and re-decode as utf8
    const decoded = Buffer.from(s, 'latin1').toString('utf8')
    // If decoded contains more non-ascii characters than original it's likely an improvement
    const origNonAscii = (s.match(/[^\x00-\x7F]/g) || []).length
    const decNonAscii = (decoded.match(/[^\x00-\x7F]/g) || []).length
    if (decNonAscii > origNonAscii) return decoded
  } catch (e) {
    // ignore and fall back to original
  }
  return s
}

export function cleanText(input) {
  if (input === null || typeof input === 'undefined') return null
  let s = String(input)
  // trim
  s = s.trim()
  if (!s) return null

  // First, try a simple latin1->utf8 heuristic fix for common mojibake
  s = tryFixLatin1ToUtf8(s)

  // Unicode normalize form C
  if (typeof s.normalize === 'function') {
    try { s = s.normalize('NFC') } catch (e) { /* ignore */ }
  }

  // Common mojibake replacements seen from bad encodings (not exhaustive)
  const replacements = {
    'ÔÇÖ': '’',
    'â€™': '’',
    'â€“': '–',
    'â€”': '—',
  'â€œ': '“',
  'â€': '”',
    'Ã©': 'é',
    'Ã¨': 'è',
    'Ãª': 'ê',
    'Ã¢': 'â',
    'ÃÀ': 'À',
    'Ã ': 'à',
    'Â©': '©',
    '\uFFFD': '', // replacement char
  }
  for (const [k, v] of Object.entries(replacements)) {
    s = s.split(k).join(v)
  }

  // Remove control chars except newline, carriage return and tab
  s = s.replace(/[\x00-\x08\x0B\x0C\x0E-\x1F\x7F]+/g, ' ')

  // Collapse multiple whitespace into single space
  s = s.replace(/\s{2,}/g, ' ')

  // Final trim
  s = s.trim()
  return s || null
}

export default cleanText
