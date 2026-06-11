import "server-only";

/**
 * Triggers the classifieds sync worker Edge Function (service role).
 * Failures are logged but do not block the user-facing action.
 */
export async function dispatchClassifiedsSyncWorker(limit = 5): Promise<void> {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL?.trim();
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY?.trim();

  if (!supabaseUrl || !serviceRoleKey) {
    return;
  }

  const url = `${supabaseUrl.replace(/\/$/, "")}/functions/v1/classifieds-sync-worker`;

  try {
    await fetch(url, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${serviceRoleKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ limit }),
      cache: "no-store",
    });
  } catch {
    // Worker will be picked up on next manual/cron invocation.
  }
}
