const GTM_ID_PATTERN = /^GTM-[A-Z0-9]+$/;

function normalizeGtmContainerId(value: string | null | undefined): string | null {
  const trimmed = value?.trim().toUpperCase() ?? "";
  if (!trimmed || !GTM_ID_PATTERN.test(trimmed)) {
    return null;
  }
  return trimmed;
}

/**
 * Resolves the GTM container ID for the current Next.js app.
 * Uses `NEXT_PUBLIC_GTM_ID` (shared default) with optional per-app override
 * via `NEXT_PUBLIC_GTM_ID_<SURFACE>` (e.g. `NEXT_PUBLIC_GTM_ID_MARKETING`).
 */
export function resolveGtmContainerId(
  appSurface?: string | null,
): string | null {
  if (appSurface) {
    const surfaceKey = appSurface
      .trim()
      .toUpperCase()
      .replace(/[^A-Z0-9]+/g, "_");
    const surfaceEnvName = `NEXT_PUBLIC_GTM_ID_${surfaceKey}`;
    const surfaceValue = normalizeGtmContainerId(
      process.env[surfaceEnvName as keyof NodeJS.ProcessEnv],
    );
    if (surfaceValue) {
      return surfaceValue;
    }
  }

  return normalizeGtmContainerId(process.env.NEXT_PUBLIC_GTM_ID);
}
