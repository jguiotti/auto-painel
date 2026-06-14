import type { BrazilianAddressFields } from "@autopainel/shared/types";

export function formatBrazilianAddressLine(
  address: BrazilianAddressFields | null | undefined,
): string | null {
  if (!address) {
    return null;
  }

  const streetLine = [address.street, address.number].filter(Boolean).join(", ");
  const cityLine = [address.district, address.city, address.state]
    .filter(Boolean)
    .join(" — ");
  const postal = address.postal_code?.trim();

  const parts = [streetLine, cityLine, postal ? `CEP ${postal}` : null, address.complement]
    .map((part) => part?.trim())
    .filter((part): part is string => Boolean(part));

  return parts.length > 0 ? parts.join(" · ") : null;
}

export function buildGoogleMapsEmbedUrl(addressLine: string): string {
  const query = encodeURIComponent(addressLine);
  return `https://maps.google.com/maps?q=${query}&t=&z=15&ie=UTF8&iwloc=&output=embed`;
}

export function hasStructuredAddress(address: BrazilianAddressFields | null | undefined): boolean {
  if (!address) {
    return false;
  }

  return Boolean(
    address.street?.trim() ||
      address.city?.trim() ||
      address.district?.trim() ||
      address.postal_code?.trim(),
  );
}
