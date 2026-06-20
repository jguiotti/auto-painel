import type { RemotePattern } from "next/dist/shared/lib/image-config";

/**
 * Remote patterns for next/image — Supabase Storage public buckets (any project ref).
 * Includes local stack (127.0.0.1:54321) for optional Docker dev.
 */
export function getSupabaseStorageImageRemotePatterns(
  supabaseUrl?: string | null,
): RemotePattern[] {
  const patterns: RemotePattern[] = [
    {
      protocol: "https",
      hostname: "**.supabase.co",
      pathname: "/storage/v1/object/public/**",
    },
    {
      protocol: "http",
      hostname: "127.0.0.1",
      port: "54321",
      pathname: "/storage/v1/object/public/**",
    },
  ];

  if (supabaseUrl) {
    try {
      const hostname = new URL(supabaseUrl).hostname;
      const alreadyCovered =
        hostname.endsWith(".supabase.co") || hostname === "127.0.0.1";
      if (!alreadyCovered) {
        patterns.push({
          protocol: "https",
          hostname,
          pathname: "/storage/v1/object/public/**",
        });
      }
    } catch {
      // Ignore invalid URL at config time.
    }
  }

  return patterns;
}
