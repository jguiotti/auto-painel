/**
 * Builds a Google Fonts CSS2 URL for one or more family names stored in dealerships.theme_config.
 * Uses latin/latin-ext for Brazilian storefront copy.
 */

const WEIGHTS = "wght@300;400;500;600;700";

export function buildGoogleFontsStylesheetHref(
  familyNames: string[],
): string | null {
  const unique = [...new Set(familyNames.map((f) => f.trim()).filter(Boolean))];
  if (unique.length === 0) {
    return null;
  }
  const query = unique
    .map((family) => {
      const token = encodeURIComponent(family).replace(/%20/g, "+");
      return `family=${token}:${WEIGHTS}`;
    })
    .join("&");
  return `https://fonts.googleapis.com/css2?${query}&subset=latin,latin-ext&display=swap`;
}
