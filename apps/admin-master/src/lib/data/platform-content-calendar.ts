import "server-only";

import { createSupabaseServiceRoleClient } from "@autopainel/shared/lib/supabase/service-role";

import type { ContentCalendarItemRow } from "@/lib/data/platform-content-calendar-shared";

function isMissingCalendarTable(message: string): boolean {
  return (
    message.includes("platform_content_calendar_items") ||
    message.includes("Could not find the table")
  );
}

export async function fetchContentCalendarItems(): Promise<ContentCalendarItemRow[]> {
  let supabase;
  try {
    supabase = createSupabaseServiceRoleClient();
  } catch {
    return [];
  }

  const { data, error } = await supabase
    .from("platform_content_calendar_items")
    .select("id, scheduled_for, channel, title, objective, status, body_notes, created_at, updated_at")
    .order("scheduled_for", { ascending: true });

  if (error) {
    if (isMissingCalendarTable(error.message)) {
      return [];
    }
    return [];
  }

  return (data ?? []) as ContentCalendarItemRow[];
}

export async function fetchUpcomingContentCalendarItems(
  limit = 5,
): Promise<ContentCalendarItemRow[]> {
  const items = await fetchContentCalendarItems();
  const today = new Date().toISOString().slice(0, 10);
  return items
    .filter((item) => item.status !== "cancelled" && item.status !== "published")
    .filter((item) => item.scheduled_for >= today)
    .slice(0, limit);
}
