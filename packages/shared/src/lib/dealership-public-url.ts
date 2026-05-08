export interface BuildDealershipPublicVehicleUrlInput {
  customDomain: string | null;
  dealershipSlug: string;
  platformRootDomain: string | null;
  requestOrigin: string | null;
  publicSlug: string;
}

function normalizeDomain(value: string | null): string | null {
  if (!value) {
    return null;
  }

  const trimmed = value.trim().toLowerCase();
  if (!trimmed) {
    return null;
  }

  return trimmed.replace(/^https?:\/\//, "").replace(/\/+$/, "");
}

function normalizeOrigin(value: string | null): string | null {
  if (!value) {
    return null;
  }

  try {
    const url = new URL(value);
    return url.origin;
  } catch {
    return null;
  }
}

export function buildDealershipPublicVehicleUrl(
  input: BuildDealershipPublicVehicleUrlInput,
): string {
  const customDomain = normalizeDomain(input.customDomain);
  const platformRootDomain = normalizeDomain(input.platformRootDomain);
  const requestOrigin = normalizeOrigin(input.requestOrigin);

  let baseOrigin: string;
  if (customDomain) {
    baseOrigin = `https://${customDomain}`;
  } else if (platformRootDomain) {
    baseOrigin = `https://${input.dealershipSlug}.${platformRootDomain}`;
  } else if (requestOrigin) {
    baseOrigin = requestOrigin;
  } else {
    baseOrigin = "http://localhost:3001";
  }

  const normalizedBase = baseOrigin.replace(/\/+$/, "");
  const encodedSlug = encodeURIComponent(input.publicSlug);
  return `${normalizedBase}/veiculo/${encodedSlug}`;
}
