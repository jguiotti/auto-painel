import { createRequire } from "node:module";

import type { NextConfig } from "next";

import { getSupabaseStorageImageRemotePatterns } from "@autopainel/shared/lib/next/supabase-storage-image-remote-patterns";

const require = createRequire(import.meta.url);
require("../../scripts/inject-monorepo-env.cjs");

const nextConfig: NextConfig = {
  transpilePackages: ["@autopainel/shared"],
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "images.unsplash.com",
        pathname: "/**",
      },
      ...getSupabaseStorageImageRemotePatterns(process.env.NEXT_PUBLIC_SUPABASE_URL),
    ],
  },
};

export default nextConfig;
