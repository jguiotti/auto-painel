import "server-only";

export async function dispatchSocialPublishWorker(limit = 5): Promise<void> {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL?.trim();
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY?.trim();

  if (!supabaseUrl || !serviceRoleKey) {
    return;
  }

  const url = `${supabaseUrl.replace(/\/$/, "")}/functions/v1/social-publish-worker`;

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
    // Worker can be retried manually or via cron.
  }
}
