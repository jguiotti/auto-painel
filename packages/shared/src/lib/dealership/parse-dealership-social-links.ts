import type { DealershipContentConfig } from "../../types/dealership-config";

export type DealershipSocialNetwork = "instagram" | "facebook" | "website";

export interface DealershipSocialLinkItem {
  network: DealershipSocialNetwork;
  href: string;
}

const SOCIAL_NETWORK_ORDER: DealershipSocialNetwork[] = [
  "instagram",
  "facebook",
  "website",
];

function readSocialHref(
  links: Record<string, unknown>,
  network: DealershipSocialNetwork,
): string | null {
  const raw = links[network];
  if (typeof raw !== "string") {
    return null;
  }
  const href = raw.trim();
  return href.length > 0 ? href : null;
}

export function parseDealershipSocialLinks(
  contentConfig: DealershipContentConfig | Record<string, unknown> | null | undefined,
): DealershipSocialLinkItem[] {
  if (!contentConfig || typeof contentConfig !== "object" || Array.isArray(contentConfig)) {
    return [];
  }

  const rawLinks = (contentConfig as DealershipContentConfig).social_links;
  if (!rawLinks || typeof rawLinks !== "object" || Array.isArray(rawLinks)) {
    return [];
  }

  const links = rawLinks as Record<string, unknown>;
  const items: DealershipSocialLinkItem[] = [];

  for (const network of SOCIAL_NETWORK_ORDER) {
    const href = readSocialHref(links, network);
    if (href) {
      items.push({ network, href });
    }
  }

  return items;
}
