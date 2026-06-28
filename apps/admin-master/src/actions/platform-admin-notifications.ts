"use server";

import { revalidatePath } from "next/cache";

import {
  mapPlatformAdminNotificationRow,
  type PlatformAdminNotificationDbRow,
} from "@autopainel/shared/lib/growth-operations/map-platform-admin-notification";
import type { NotificationCenterItem } from "@autopainel/shared/ui";

import { requireAdminSession } from "@/lib/auth/require-admin";
import { createSupabaseServerClient } from "@/lib/supabase/server";

export async function listPlatformAdminNotificationsAction(options?: {
  unreadOnly?: boolean;
  limit?: number;
  offset?: number;
}): Promise<NotificationCenterItem[]> {
  await requireAdminSession();
  const supabase = await createSupabaseServerClient();

  const { data, error } = await supabase.rpc("list_platform_admin_notifications", {
    p_unread_only: options?.unreadOnly ?? false,
    p_limit: options?.limit ?? 50,
    p_offset: options?.offset ?? 0,
  });

  if (error || !data) {
    return [];
  }

  return (data as PlatformAdminNotificationDbRow[]).map((row) =>
    mapPlatformAdminNotificationRow(row),
  );
}

export async function markPlatformAdminNotificationReadAction(
  notificationId: string,
): Promise<{ error?: string }> {
  await requireAdminSession();
  const supabase = await createSupabaseServerClient();
  const id = notificationId.replace(/^platform-admin-/, "");

  const { error } = await supabase.rpc("mark_platform_admin_notification_read", {
    p_notification_id: id,
  });

  if (error) {
    return { error: "Não foi possível marcar como lida." };
  }

  revalidatePath("/painel/notificacoes");
  return {};
}

export async function markAllPlatformAdminNotificationsReadAction(): Promise<{
  error?: string;
  count?: number;
}> {
  await requireAdminSession();
  const supabase = await createSupabaseServerClient();

  const { data, error } = await supabase.rpc("mark_all_platform_admin_notifications_read");

  if (error) {
    return { error: "Não foi possível marcar todas como lidas." };
  }

  revalidatePath("/painel/notificacoes");
  return { count: typeof data === "number" ? data : 0 };
}

export async function deletePlatformAdminNotificationAction(
  notificationId: string,
): Promise<{ error?: string }> {
  await requireAdminSession();
  const supabase = await createSupabaseServerClient();
  const id = notificationId.replace(/^platform-admin-/, "");

  const { error } = await supabase.rpc("delete_platform_admin_notification", {
    p_notification_id: id,
  });

  if (error) {
    return { error: "Não foi possível excluir a notificação." };
  }

  revalidatePath("/painel/notificacoes");
  return {};
}
