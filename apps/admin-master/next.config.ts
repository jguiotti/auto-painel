import { createRequire } from "node:module";

import type { NextConfig } from "next";

const require = createRequire(import.meta.url);
require("../../scripts/inject-monorepo-env.cjs");

const nextConfig: NextConfig = {
  transpilePackages: ["@autopainel/shared"],
  experimental: {
    serverActions: {
      /** PDFs até 25 MB em `dealership-operator-billing` */
      bodySizeLimit: "30mb",
    },
  },
  async redirects() {
    return [
      {
        source: "/dashboard",
        destination: "/painel/dashboard",
        permanent: false,
      },
      {
        source: "/dashboard/:path*",
        destination: "/painel/dashboard/:path*",
        permanent: false,
      },
      {
        source: "/concessionarias",
        destination: "/painel/concessionarias",
        permanent: false,
      },
      {
        source: "/concessionarias/:path*",
        destination: "/painel/concessionarias/:path*",
        permanent: false,
      },
      {
        source: "/financeiro",
        destination: "/painel/financeiro",
        permanent: false,
      },
      {
        source: "/financeiro/:path*",
        destination: "/painel/financeiro/:path*",
        permanent: false,
      },
      {
        source: "/documentacao",
        destination: "/painel/documentacao",
        permanent: false,
      },
      {
        source: "/documentacao/:path*",
        destination: "/painel/documentacao/:path*",
        permanent: false,
      },
    ];
  },
};

export default nextConfig;
