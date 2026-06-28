import type { NotificationCenterItem } from "../../components/notification-center";
import type { PlatformAdminNotificationKind } from "../../types/growth-operations";

export interface PlatformAdminNotificationDbRow {
  id: string;
  kind: PlatformAdminNotificationKind | string;
  title: string;
  body: string;
  payload: Record<string, unknown> | null;
  target_path: string | null;
  read_at: string | null;
  created_at: string;
}

export function mapPlatformAdminNotificationRow(
  row: PlatformAdminNotificationDbRow,
): NotificationCenterItem {
  return {
    id: `platform-admin-${row.id}`,
    title: row.title,
    subtitle: row.body,
    href: row.target_path ?? "/painel/notificacoes",
    createdAt: row.created_at,
    read: row.read_at != null,
  };
}
