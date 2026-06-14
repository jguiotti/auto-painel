import type { MetadataRoute } from "next";

import { LEGAL_SITE_URL } from "@/lib/legal/constants";

export default function robots(): MetadataRoute.Robots {
  return {
    rules: {
      userAgent: "*",
      allow: "/",
      disallow: ["/api/"],
    },
    sitemap: `${LEGAL_SITE_URL}/sitemap.xml`,
    host: LEGAL_SITE_URL,
  };
}
