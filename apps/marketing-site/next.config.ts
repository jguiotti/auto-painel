import { createRequire } from "node:module";

import type { NextConfig } from "next";

const require = createRequire(import.meta.url);
require("../../scripts/inject-monorepo-env.cjs");

const nextConfig: NextConfig = {
  transpilePackages: ["@autopainel/shared"],
};

export default nextConfig;
