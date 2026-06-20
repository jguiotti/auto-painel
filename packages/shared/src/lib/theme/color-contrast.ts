/** Relative luminance (WCAG) for #RRGGBB hex colors. */
function relativeLuminance(hex: string): number | null {
  const normalized = hex.trim();
  if (!/^#[0-9A-Fa-f]{6}$/.test(normalized)) {
    return null;
  }

  const channels = [1, 2, 3].map((index) =>
    Number.parseInt(normalized.slice(index * 2 - 1, index * 2 + 1), 16) / 255,
  );

  const linear = channels.map((channel) =>
    channel <= 0.03928 ? channel / 12.92 : ((channel + 0.055) / 1.055) ** 2.4,
  );

  return 0.2126 * linear[0]! + 0.7152 * linear[1]! + 0.0722 * linear[2]!;
}

/** Picks dark or light text for readable contrast on a solid brand color. */
export function pickReadableForegroundColor(
  backgroundHex: string,
  options?: { light?: string; dark?: string },
): string {
  const light = options?.light ?? "#ffffff";
  const dark = options?.dark ?? "#171717";
  const luminance = relativeLuminance(backgroundHex);
  if (luminance === null) {
    return light;
  }
  return luminance > 0.45 ? dark : light;
}
