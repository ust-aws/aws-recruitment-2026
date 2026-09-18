const CONTROL_CHAR_RE = /[\u0000-\u0008\u000b\u000c\u000e-\u001f\u007f]/;

export function hasControlCharacters(value: string): boolean {
  return CONTROL_CHAR_RE.test(value);
}
