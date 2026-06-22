import type { MetadataRoute } from "next";

import { LEGAL_SITE_URL } from "@/lib/legal/constants";

const ROUTES = [
  { path: "", changeFrequency: "weekly" as const, priority: 1 },
  { path: "/funcionalidades", changeFrequency: "monthly" as const, priority: 0.9 },
  { path: "/planos", changeFrequency: "monthly" as const, priority: 0.9 },
  { path: "/perguntas-frequentes", changeFrequency: "monthly" as const, priority: 0.85 },
  { path: "/adesao-trial", changeFrequency: "weekly" as const, priority: 0.95 },
  { path: "/termo-adesao-trial", changeFrequency: "yearly" as const, priority: 0.4 },
  { path: "/politica-de-privacidade", changeFrequency: "yearly" as const, priority: 0.3 },
  { path: "/termos-de-uso", changeFrequency: "yearly" as const, priority: 0.3 },
  { path: "/exclusao-de-dados", changeFrequency: "yearly" as const, priority: 0.3 },
  { path: "/politica-de-cookies", changeFrequency: "yearly" as const, priority: 0.3 },
];

export default function sitemap(): MetadataRoute.Sitemap {
  const lastModified = new Date();

  return ROUTES.map(({ path, changeFrequency, priority }) => ({
    url: `${LEGAL_SITE_URL}${path}`,
    lastModified,
    changeFrequency,
    priority,
  }));
}
