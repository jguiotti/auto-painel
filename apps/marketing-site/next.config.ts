import { createRequire } from "node:module";

import type { NextConfig } from "next";

const require = createRequire(import.meta.url);
require("../../scripts/inject-monorepo-env.cjs");

const nextConfig: NextConfig = {
  transpilePackages: ["@autopainel/shared"],
  async redirects() {
    return [
      {
        source: "/:path*",
        has: [{ type: "host", value: "www.autopainel.com.br" }],
        destination: "https://autopainel.com.br/:path*",
        permanent: true,
      },
    ];
  },
};

export default nextConfig;
