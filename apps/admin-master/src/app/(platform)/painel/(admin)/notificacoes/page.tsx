import { listPlatformAdminNotificationsAction } from "@/actions/platform-admin-notifications";
import { AdminNotificationsInboxClient } from "@/components/admin-notifications-inbox-client";

export default async function AdminNotificationsPage() {
  const items = await listPlatformAdminNotificationsAction({ limit: 100 });

  return <AdminNotificationsInboxClient items={items} />;
}
