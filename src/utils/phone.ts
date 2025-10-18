export function normalizeSenegalPhone(input: string | undefined | null): string {
  if (!input) return ''
  let s = input.trim()
  // remove spaces, dashes, parentheses
  s = s.replace(/[\s\-()]/g, '')
  // convert leading 00 to +
  if (s.startsWith('00')) s = '+' + s.slice(2)
  // if starts with 0 and not international, assume local Senegal number and prefix +221
  if (/^0\d{7,8}$/.test(s)) {
    s = '+221' + s.slice(1)
  }
  // if it's exactly 8 digits (common local format like 77xxxxxxx), prefix +221
  if (/^\d{8}$/.test(s)) s = '+221' + s
  // ensure it starts with +
  if (!s.startsWith('+') && /^\d+$/.test(s)) s = '+' + s
  return s
}
