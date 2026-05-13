const DEALERSHIP_UUID_RE =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

/** UUID v1–v8 shape check — middleware guard only; authorization lives in server code. */
export function looksLikeDealershipUuid(value: string | null | undefined): boolean {
  if (!value) {
    return false;
  }
  return DEALERSHIP_UUID_RE.test(value.trim());
}
