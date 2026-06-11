import "server-only";

/**
 * When true, Meta OAuth uses the platform app from env — dealers only click Conectar.
 * See packages/shared/docs/META_INTEGRATION_SIMPLIFIED.md
 */
export function isMetaPlatformConnectMode(): boolean {
  const explicit = process.env.META_PLATFORM_APP_ONLY?.trim().toLowerCase();
  if (explicit === "true" || explicit === "1") {
    return true;
  }
  return Boolean(process.env.META_APP_CLIENT_ID?.trim());
}

export function hasMetaPlatformAppConfigured(): boolean {
  return Boolean(
    process.env.META_APP_CLIENT_ID?.trim() && process.env.META_APP_CLIENT_SECRET?.trim(),
  );
}
